/**
 * Base LLM Provider Interface
 * All providers must implement this interface
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
}

export abstract class BaseProvider {
  abstract name: string;
  abstract displayName: string;
  abstract models: string[];
  
  abstract chat(request: LLMRequest): Promise<LLMResponse>;
  abstract isAvailable(): Promise<boolean>;
  
  protected async handleRateLimit(providerName: string): Promise<void> {
    // Simple rate limiting - can be enhanced with Redis/DB later
    console.log(`[${providerName}] Rate limit check`);
  }
}
