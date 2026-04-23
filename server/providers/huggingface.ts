/**
 * HuggingFace Inference API Provider - FREE tier
 * Sign up at https://huggingface.co
 * Free: 10,000 requests/month
 * Models: Thousands of open models
 */

import { BaseProvider, LLMRequest, LLMResponse } from './base-provider';

export class HuggingFaceProvider extends BaseProvider {
  name = 'huggingface';
  displayName = 'HuggingFace (FREE 10k/month)';
  models = [
    'meta-llama/Llama-3.3-70B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/Phi-3-medium-4k-instruct',
    'Qwen/Qwen2.5-72B-Instruct',
  ];

  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[HuggingFace] No API key provided. Set HUGGINGFACE_API_KEY env var.');
    }
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || 'meta-llama/Llama-3.3-70B-Instruct';
    const url = `${this.baseUrl}/${model}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: request.messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          parameters: {
            temperature: request.temperature || 0.7,
            max_new_tokens: request.maxTokens || 2048,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';

      return {
        text: text || '',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: model,
        provider: this.name,
      };
    } catch (error) {
      console.error('[HuggingFace] Error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export function createHuggingFaceProvider(apiKey?: string): HuggingFaceProvider {
  return new HuggingFaceProvider(apiKey);
}
