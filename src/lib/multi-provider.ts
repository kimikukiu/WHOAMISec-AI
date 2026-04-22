import { loadConfig } from '@/lib/config';

const PROVIDERS = {
  'glm': {
    endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    apiKeyEnv: 'GLM_API_KEY',
    defaultModel: 'glm-5.1',
    models: ['glm-5.1', 'glm-5', 'glm-5-turbo', 'glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4', 'glm-4-plus', 'glm-4-flash']
  },
  'openai': {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    models: ['gpt-5.4-pro', 'gpt-5.4', 'gpt-5.2', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
  },
  'anthropic': {
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku']
  },
  'deepseek': {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-3.2', 'deepseek-3', 'deepseek-coder-33B', 'deepseek-chat']
  },
  'google': {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyEnv: 'GOOGLE_API_KEY',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-3.0-pro-preview', 'gemini-3-flash', 'gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  },
  'kimi': {
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    apiKeyEnv: 'KIMI_API_KEY',
    defaultModel: 'moonshot-v1-8k',
    models: ['kimi-k2.5', 'kimi-k2', 'kimi-k1.5', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  'swarm': {
    endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    apiKeyEnv: 'GLM_API_KEY',
    defaultModel: 'glm-5.1',
    models: [] // All SWARM models route here
  }
};

function detectProvider(modelId: string): { provider: string; mappedModel: string } {
  const modelLower = modelId.toLowerCase();

  // SWARM models
  if (modelLower.includes('swarm') || modelLower.includes('wormgpt') || modelLower.includes('redgpt') || modelLower.includes('darkgpt') || modelLower.includes('queen-swarm')) {
    return { provider: 'swarm', mappedModel: 'glm-5.1' };
  }

  // GLM models
  if (modelLower.startsWith('glm')) {
    return { provider: 'glm', mappedModel: modelId };
  }

  // OpenAI models
  if (modelLower.startsWith('gpt')) {
    return { provider: 'openai', mappedModel: modelId };
  }

  // Claude models
  if (modelLower.startsWith('claude')) {
    return { provider: 'anthropic', mappedModel: modelId };
  }

  // DeepSeek models
  if (modelLower.startsWith('deepseek') || modelLower.includes('deepseek')) {
    return { provider: 'deepseek', mappedModel: modelId };
  }

  // Google models
  if (modelLower.startsWith('gemini')) {
    return { provider: 'google', mappedModel: modelId };
  }

  // Kimi models
  if (modelLower.startsWith('kimi') || modelLower.startsWith('moonshot')) {
    return { provider: 'kimi', mappedModel: modelId };
  }

  // Default to GLM
  return { provider: 'glm', mappedModel: 'glm-5.1' };
}

function getApiKey(provider: string): string | null {
  const config = loadConfig();

  switch (provider) {
    case 'glm':
    case 'swarm':
      return config.glm_api_key || process.env.GLM_API_KEY || null;
    case 'openai':
      return process.env.OPENAI_API_KEY || null;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || null;
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY || null;
    case 'google':
      return process.env.GOOGLE_API_KEY || null;
    case 'kimi':
      return process.env.KIMI_API_KEY || null;
    default:
      return null;
  }
}

export async function multiProviderChat(messages: any[], modelId: string): Promise<string> {
  const { provider, mappedModel } = detectProvider(modelId);
  const config = PROVIDERS[provider as keyof typeof PROVIDERS];

  if (!config) {
    throw new Error(`Unknown provider for model: ${modelId}`);
  }

  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${provider}`);
  }

  // Build request based on provider
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let body: any = {
    model: mappedModel,
    messages,
    temperature: 0.7,
    max_tokens: 8192,
  };

  let endpoint = config.endpoint;

  switch (provider) {
    case 'glm':
    case 'swarm':
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['Accept-Language'] = 'en-US,en';
      break;

    case 'openai':
    case 'deepseek':
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;

    case 'anthropic':
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Content-Type'];
      body = {
        model: mappedModel,
        messages,
        max_tokens: 8192,
      };
      break;

    case 'google':
      headers['x-goog-api-key'] = apiKey;
      endpoint = `${config.endpoint}/${mappedModel}:generateContent?key=${apiKey}`;
      body = {
        contents: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      };
      break;

    case 'kimi':
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.toUpperCase()} API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Parse response based on provider
    switch (provider) {
      case 'glm':
      case 'swarm':
      case 'openai':
      case 'deepseek':
      case 'kimi':
        return data.choices?.[0]?.message?.content || '';

      case 'anthropic':
        return data.content?.[0]?.text || '';

      case 'google':
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      default:
        return JSON.stringify(data);
    }

  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`${provider.toUpperCase()} request timeout`);
    }
    throw error;
  }
}

export { detectProvider, getApiKey };
