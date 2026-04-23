/**
 * Unified LLM Provider Manager
 * Manages multiple providers with fallback chain
 * Admin can enable/disable providers, set API keys, and monitor usage
 */

import { BaseProvider, LLMRequest, LLMResponse } from './base-provider';
import { GitHubModelsProvider, createGitHubModelsProvider } from './github-models';
import { GroqProvider, createGroqProvider } from './groq';
import { TogetherProvider, createTogetherProvider } from './together';
import { HuggingFaceProvider, createHuggingFaceProvider } from './huggingface';
import { KilocodeProvider, createKilocodeProvider } from './kilocode';

export interface ProviderStatus {
  name: string;
  displayName: string;
  enabled: boolean;
  available: boolean;
  models: string[];
  rateLimit?: {
    requestsPerMinute: number;
    remaining?: number;
  };
  usage?: {
    totalRequests: number;
    totalTokens: number;
    lastUsed?: Date;
  };
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  priority: number;
}

export class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();
  private usageStats: Map<string, { requests: number; tokens: number; lastUsed?: Date }> = new Map();

  constructor() {
    // Initialize with environment variables
    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    // 0. Kilocode (FREE - 256K context window!)
    try {
      const kilocodeProvider = createKilocodeProvider();
      this.registerProvider('kilocode', kilocodeProvider, {
        name: 'kilocode',
        enabled: true,
        priority: 0, // Highest priority (free + 256K context!)
      });
    } catch (error) {
      console.warn('[ProviderManager] Kilocode not available:', error);
    }

    // 1. GitHub Models (FREE - uses GitHub token)
    try {
      const githubProvider = createGitHubModelsProvider();
      this.registerProvider('github-models', githubProvider, {
        name: 'github-models',
        enabled: true,
        priority: 1, // Highest priority (free!)
      });
    } catch (error) {
      console.warn('[ProviderManager] GitHub Models not available:', error);
    }

    // 2. GitHub Code Search (FREE - no token needed for basic)
    try {
      const { GitHubCodeSearchProvider, createGitHubCodeSearchProvider } = require('./github-code-search');
      const searchProvider = createGitHubCodeSearchProvider();
      this.registerProvider('github-code-search', searchProvider, {
        name: 'github-code-search',
        enabled: true,
        priority: 2,
      });
    } catch (error) {
      console.warn('[ProviderManager] GitHub Code Search not available:', error);
    }

    // 3. Groq (FREE tier)
    if (process.env.GROQ_API_KEY) {
      const groqProvider = createGroqProvider();
      this.registerProvider('groq', groqProvider, {
        name: 'groq',
        enabled: true,
        priority: 3,
      });
    }

    // 4. Together AI (FREE credits)
    if (process.env.TOGETHER_API_KEY) {
      const togetherProvider = createTogetherProvider();
      this.registerProvider('together', togetherProvider, {
        name: 'together',
        enabled: true,
        priority: 4,
      });
    }

    // 5. HuggingFace (FREE 10k/month)
    if (process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY) {
      const hfProvider = createHuggingFaceProvider();
      this.registerProvider('huggingface', hfProvider, {
        name: 'huggingface',
        enabled: true,
        priority: 5,
      });
    }
  }

  registerProvider(name: string, provider: BaseProvider, config: ProviderConfig) {
    this.providers.set(name, provider);
    this.configs.set(name, config);
    if (!this.usageStats.has(name)) {
      this.usageStats.set(name, { requests: 0, tokens: 0 });
    }
  }

  async getAvailableProviders(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];
    
    const sortedConfigs = Array.from(this.configs.entries())
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [name, config] of sortedConfigs) {
      const provider = this.providers.get(name);
      if (!provider) continue;

      const available = await provider.isAvailable();
      const stats = this.usageStats.get(name);

      statuses.push({
        name: provider.name,
        displayName: provider.displayName,
        enabled: config.enabled,
        available: config.enabled && available,
        models: provider.models,
        usage: stats ? {
          totalRequests: stats.requests,
          totalTokens: stats.tokens,
          lastUsed: stats.lastUsed,
        } : undefined,
      });
    }

    return statuses;
  }

  async chat(request: LLMRequest, preferredProvider?: string): Promise<LLMResponse> {
    const sortedConfigs = Array.from(this.configs.entries())
      .sort((a, b) => a[1].priority - b[1].priority);

    // Try preferred provider first
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      const config = this.configs.get(preferredProvider);
      
      if (provider && config?.enabled && await provider.isAvailable()) {
        try {
          const response = await provider.chat(request);
          this.updateUsage(preferredProvider, response);
          return response;
        } catch (error) {
          console.error(`[ProviderManager] Preferred provider ${preferredProvider} failed:`, error);
        }
      }
    }

    // Fallback chain
    for (const [name, config] of sortedConfigs) {
      if (!config.enabled) continue;

      const provider = this.providers.get(name);
      if (!provider) continue;

      if (!await provider.isAvailable()) continue;

      try {
        console.log(`[ProviderManager] Using provider: ${name}`);
        const response = await provider.chat(request);
        this.updateUsage(name, response);
        return response;
      } catch (error) {
        console.error(`[ProviderManager] Provider ${name} failed, trying next:`, error);
      }
    }

    throw new Error('No available LLM providers. Please configure at least one provider.');
  }

  private updateUsage(providerName: string, response: LLMResponse) {
    const stats = this.usageStats.get(providerName) || { requests: 0, tokens: 0 };
    stats.requests += 1;
    stats.tokens += response.usage?.totalTokens || 0;
    stats.lastUsed = new Date();
    this.usageStats.set(providerName, stats);
  }

  updateProviderConfig(name: string, updates: Partial<ProviderConfig>) {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Provider ${name} not found`);
    }
    Object.assign(config, updates);
    this.configs.set(name, config);
  }

  getProviderConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }
}

// Singleton instance
export const providerManager = new ProviderManager();
