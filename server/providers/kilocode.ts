/**
 * Kilocode Provider
 * High-context (256K tokens) LLM provider with free tier
 * Models: kilo-auto/free, kilo-auto, kilo-pro
 * Endpoint: https://api.kilocode.com/v1/chat/completions
 * Features: high_context, streaming, bypass_support
 */

import { BaseProvider, LLMRequest, LLMResponse, LLMMessage } from './base-provider';

export interface KilocodeConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  corsBypass?: boolean;
}

// Complete Kilocode configuration
export const KILOCODE_CONFIG = {
  provider: "kilocode",
  defaultModel: "kilo-auto/free",
  contextTokens: 262144, // 256K tokens
  endpoint: "https://api.kilocode.com/v1/chat/completions",
  freeTier: true,
  features: ["high_context", "streaming", "bypass_support"],
  endpoints: ["api.kilocode.com", "kilocode.ai", "kilo-code.com"],
  models: ["kilo-auto/free", "kilo-auto", "kilo-pro"]
};

export class KilocodeProvider extends BaseProvider {
  name = 'kilocode';
  displayName = 'Kilocode (256K Context)';
  models = [
    'kilo-auto/free',
    'kilo-auto',
    'kilo-pro'
  ];
  
  private apiKey?: string;
  private apiUrl: string;
  private corsBypass: boolean;

  constructor(config: KilocodeConfig = {}) {
    super();
    this.apiKey = config.apiKey || process.env.KILOCODE_API_KEY;
    this.apiUrl = config.apiUrl || 'https://api.kilocode.com/v1/chat/completions';
    this.corsBypass = config.corsBypass || false;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model || 'kilo-auto/free',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096,
          stream: request.stream || false,
        }),
        // CORS bypass for browser environments
        ...(this.corsBypass ? { mode: 'no-cors' as RequestMode } : {}),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kilocode API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: request.model || 'kilo-auto/free',
        provider: this.name,
      };
    } catch (error) {
      console.error('[Kilocode] Error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    // Kilocode is available if we can reach the endpoint or have API key
    return true; // Will be validated on first chat call
  }
}

/**
 * Create Kilocode provider from environment or config
 */
export function createKilocodeProvider(apiKey?: string): KilocodeProvider {
  const key = apiKey || process.env.KILOCODE_API_KEY || process.env.KILOCODE_TOKEN;
  if (!key) {
    console.warn('[Kilocode] No API key provided. Set KILOCODE_API_KEY env var.');
  }
  return new KilocodeProvider({ apiKey: key });
}
