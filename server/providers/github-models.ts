/**
 * GitHub Models API Provider
 * FREE LLM using GitHub's hosted models
 * Uses your GitHub token as API key
 * Models: Phi-3, Llama 3, Mistral, and more
 */

import { BaseProvider, LLMRequest, LLMResponse, LLMMessage } from './base-provider';

export interface GitHubModelsConfig {
  token: string;
  apiUrl?: string;
  model?: string;
}

export class GitHubModelsProvider extends BaseProvider {
  name = 'github-models';
  displayName = 'GitHub Models (FREE)';
  models = [
    'microsoft/Phi-3-mini-4k-instruct',
    'microsoft/Phi-3-medium-4k-instruct',
    'meta/Meta-Llama-3-8B-Instruct',
    'meta/Meta-Llama-3-70B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'google/gemma-2-9b-it',
  ];

  private token: string;
  private apiUrl: string;

  constructor(config: GitHubModelsConfig) {
    super();
    this.token = config.token;
    this.apiUrl = config.apiUrl || 'https://models.github.ai/inference';
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          model: request.model || 'microsoft/Phi-3-mini-4k-instruct',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2048,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub Models API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: request.model || 'unknown',
        provider: this.name,
      };
    } catch (error) {
      console.error('[GitHub Models] Error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.token;
  }
}

/**
 * Create GitHub Models provider from environment or database
 */
export function createGitHubModelsProvider(token?: string): GitHubModelsProvider {
  const apiToken = token || process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY || '';
  if (!apiToken) {
    console.warn('[GitHub Models] No token provided. Set GITHUB_TOKEN or GITHUB_API_KEY env var.');
  }
  return new GitHubModelsProvider({ token: apiToken });
}
