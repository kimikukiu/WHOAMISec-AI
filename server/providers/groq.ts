/**
 * Groq Provider - FREE high-speed LLM
 * Sign up at https://console.groq.com
 * Free tier: 60 requests/minute
 * Models: Llama 3.3 70B, Mixtral 8x7B, etc.
 */

import { BaseProvider, LLMRequest, LLMResponse } from './base-provider';

export class GroqProvider extends BaseProvider {
  name = 'groq';
  displayName = 'Groq (FREE - High Speed)';
  models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];

  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Groq] No API key provided. Set GROQ_API_KEY env var.');
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
          model: request.model || 'llama-3.3-70b-versatile',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2048,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} ${error}`);
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
      console.error('[Groq] Error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export function createGroqProvider(apiKey?: string): GroqProvider {
  return new GroqProvider(apiKey);
}
