/**
 * Together AI Provider - FREE credits on signup
 * Sign up at https://api.together.xyz
 * Models: Llama 3.3, Mistral, Qwen, etc.
 */

import { BaseProvider, LLMRequest, LLMResponse } from './base-provider';

export class TogetherProvider extends BaseProvider {
  name = 'together';
  displayName = 'Together AI (FREE Credits)';
  models = [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'Qwen/Qwen2.5-72B-Instruct-Turbo',
  ];

  private apiKey: string;
  private baseUrl = 'https://api.together.xyz/v1/chat/completions';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.TOGETHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Together] No API key provided. Set TOGETHER_API_KEY env var.');
    }
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2048,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Together API error: ${response.status} ${error}`);
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
      console.error('[Together] Error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export function createTogetherProvider(apiKey?: string): TogetherProvider {
  return new TogetherProvider(apiKey);
}
