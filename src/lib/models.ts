// All Available AI Models — 120+ models across all providers
// Used in model selector UI

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  icon: string;
}

export const ALL_MODELS: AIModel[] = [
  // ━━━ QUEEN SERIES ━━━
  { id: 'queen-ultra', name: 'Queen Ultra', provider: 'Queen', category: 'premium', description: 'Most powerful model - Ultra reasoning', icon: '👑' },
  { id: 'queen-max', name: 'Queen Max', provider: 'Queen', category: 'premium', description: 'Maximum performance model', icon: '👑' },

  // ━━━ NOUS RESEARCH ━━━
  { id: 'hermes-4-405B', name: 'Hermes 4 405B', provider: 'Nous Research', category: 'premium', description: 'Large-scale reasoning model', icon: '🧠' },
  { id: 'hermes-4-70B', name: 'Hermes 4 70B', provider: 'Nous Research', category: 'standard', description: 'Balanced performance', icon: '🧠' },
  { id: 'hermes-3-70B', name: 'Hermes 3 70B', provider: 'Nous Research', category: 'standard', description: 'Reliable reasoning', icon: '🧠' },

  // ━━━ OPENAI ━━━
  { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro', provider: 'OpenAI', category: 'premium', description: 'Latest OpenAI flagship', icon: '🤖' },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', category: 'standard', description: 'Standard GPT-5', icon: '🤖' },
  { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', category: 'standard', description: 'Previous generation', icon: '🤖' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', category: 'standard', description: 'Omni model with vision', icon: '🤖' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', category: 'standard', description: 'Fast and capable', icon: '🤖' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', category: 'legacy', description: 'Classic GPT-4', icon: '🤖' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', category: 'fast', description: 'Fast responses', icon: '⚡' },

  // ━━━ ANTHROPIC ━━━
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', category: 'premium', description: 'Most capable Claude', icon: '🧠' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', category: 'standard', description: 'Balanced performance', icon: '🧠' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', category: 'standard', description: 'Fast and smart', icon: '🧠' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', category: 'legacy', description: 'Previous flagship', icon: '🧠' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', category: 'fast', description: 'Ultra fast', icon: '⚡' },

  // ━━━ DEEPSEEK ━━━
  { id: 'DeepSeek-3.2', name: 'DeepSeek 3.2', provider: 'DeepSeek', category: 'premium', description: 'Latest DeepSeek model', icon: '🔵' },
  { id: 'DeepSeek-3', name: 'DeepSeek 3', provider: 'DeepSeek', category: 'standard', description: 'Advanced reasoning', icon: '🔵' },
  { id: 'deepseek-coder-33B', name: 'DeepSeek Coder 33B', provider: 'DeepSeek', category: 'coding', description: 'Code-specialized', icon: '💻' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', category: 'standard', description: 'General chat', icon: '💬' },

  // ━━━ GOOGLE ━━━
  { id: 'gemini-3.0-pro-preview', name: 'Gemini 3.0 Pro', provider: 'Google', category: 'premium', description: 'Latest Google flagship', icon: '✨' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', category: 'fast', description: 'Fast responses', icon: '⚡' },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', category: 'standard', description: 'Balanced performance', icon: '✨' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', category: 'fast', description: 'Very fast', icon: '⚡' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', category: 'standard', description: 'Long context', icon: '✨' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', category: 'fast', description: 'Fast and capable', icon: '⚡' },

  // ━━━ KIMI (MOONSHOT) ━━━
  { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'Kimi', category: 'premium', description: 'Latest Kimi model', icon: '🌙' },
  { id: 'kimi-k2', name: 'Kimi K2', provider: 'Kimi', category: 'standard', description: 'Advanced reasoning', icon: '🌙' },
  { id: 'kimi-25', name: 'Kimi 25', provider: 'Kimi', category: 'standard', description: 'Balanced performance', icon: '🌙' },
  { id: 'kimi-chat', name: 'Kimi Chat', provider: 'Kimi', category: 'standard', description: 'General chat', icon: '💬' },

  // ━━━ MINIMAX ━━━
  { id: 'minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', category: 'premium', description: 'Latest MiniMax', icon: '🔴' },
  { id: 'minimax-m2', name: 'MiniMax M2', provider: 'MiniMax', category: 'standard', description: 'Balanced', icon: '🔴' },
  { id: 'minimax-m1', name: 'MiniMax M1', provider: 'MiniMax', category: 'fast', description: 'Fast model', icon: '⚡' },

  // ━━━ QWEN (ALIBABA) ━━━
  { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus', provider: 'Qwen', category: 'premium', description: 'Latest Qwen flagship', icon: '💫' },
  { id: 'qwen3.5', name: 'Qwen 3.5', provider: 'Qwen', category: 'standard', description: 'Advanced model', icon: '💫' },
  { id: 'qwen3', name: 'Qwen 3', provider: 'Qwen', category: 'standard', description: 'Stable release', icon: '💫' },
  { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', provider: 'Qwen', category: 'coding', description: 'Code-specialized', icon: '💻' },
  { id: 'qwen2.5', name: 'Qwen 2.5', provider: 'Qwen', category: 'standard', description: 'General purpose', icon: '💫' },
  { id: 'qwen2', name: 'Qwen 2', provider: 'Qwen', category: 'legacy', description: 'Previous generation', icon: '💫' },

  // ━━━ GLM (ZHIPU / CHARACTER.AI) ━━━
  { id: 'glm-5-turbo', name: 'GLM-5 Turbo', provider: 'GLM AI', category: 'premium', description: 'Latest GLM flagship', icon: '🔷' },
  { id: 'glm-4.6', name: 'GLM-4.6', provider: 'GLM AI', category: 'standard', description: 'Advanced model', icon: '🔷' },
  { id: 'glm-4-plus', name: 'GLM-4 Plus', provider: 'GLM AI', category: 'standard', description: 'Balanced', icon: '🔷' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'GLM AI', category: 'fast', description: 'Fast responses', icon: '⚡' },
  { id: 'glm-4', name: 'GLM-4', provider: 'GLM AI', category: 'standard', description: 'General use', icon: '🔷' },
  { id: 'glm-3', name: 'GLM-3', provider: 'GLM AI', category: 'legacy', description: 'Previous generation', icon: '🔷' },

  // ━━━ Llama (META) ━━━
  { id: 'llama-4-405B', name: 'Llama 4 405B', provider: 'Meta', category: 'premium', description: 'Latest Llama flagship', icon: '🦙' },
  { id: 'llama-4-70B', name: 'Llama 4 70B', provider: 'Meta', category: 'standard', description: 'Large model', icon: '🦙' },
  { id: 'llama-3.3-70B', name: 'Llama 3.3 70B', provider: 'Meta', category: 'standard', description: 'Instruction tuned', icon: '🦙' },
  { id: 'llama-3.2-90B', name: 'Llama 3.2 90B', provider: 'Meta', category: 'standard', description: 'Vision model', icon: '🦙' },
  { id: 'llama-3.1-405B', name: 'Llama 3.1 405B', provider: 'Meta', category: 'premium', description: 'Most capable', icon: '🦙' },
  { id: 'llama-3.1-70B', name: 'Llama 3.1 70B', provider: 'Meta', category: 'standard', description: 'Balanced', icon: '🦙' },
  { id: 'llama-3-70B', name: 'Llama 3 70B', provider: 'Meta', category: 'standard', description: 'Popular choice', icon: '🦙' },
  { id: 'llama-3-8B', name: 'Llama 3 8B', provider: 'Meta', category: 'fast', description: 'Fast and light', icon: '⚡' },
  { id: 'codellama-70B', name: 'Code Llama 70B', provider: 'Meta', category: 'coding', description: 'Code-specialized', icon: '💻' },
  { id: 'llama-2-70B', name: 'Llama 2 70B', provider: 'Meta', category: 'legacy', description: 'Previous gen', icon: '🦙' },

  // ━━━ MIXTRAL (MISTRAL) ━━━
  { id: 'mixtral-8x22B', name: 'Mixtral 8x22B', provider: 'Mistral', category: 'premium', description: 'Mixture of experts', icon: '🌪️' },
  { id: 'mixtral-8x7B', name: 'Mixtral 8x7B', provider: 'Mistral', category: 'standard', description: 'Popular MoE', icon: '🌪️' },
  { id: 'mistral-7B', name: 'Mistral 7B', provider: 'Mistral', category: 'standard', description: 'Compact powerhouse', icon: '💨' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', category: 'premium', description: 'Flagship model', icon: '🌟' },
  { id: 'mistral-nemo', name: 'Mistral Nemo', provider: 'Mistral', category: 'standard', description: 'Balanced', icon: '💨' },
  { id: 'mistral-small', name: 'Mistral Small', provider: 'Mistral', category: 'fast', description: 'Fast model', icon: '⚡' },

  // ━━━ COHERE ━━━
  { id: 'command-r-plus-2', name: 'Command R+ 2', provider: 'Cohere', category: 'premium', description: 'Latest Command', icon: '🌊' },
  { id: 'command-r-plus', name: 'Command R+', provider: 'Cohere', category: 'standard', description: 'Large context', icon: '🌊' },
  { id: 'command-r', name: 'Command R', provider: 'Cohere', category: 'standard', description: 'Balanced', icon: '🌊' },
  { id: 'command', name: 'Command', provider: 'Cohere', category: 'fast', description: 'Fast commands', icon: '⚡' },

  // ━━━ DATABRICKS (DOLLY) ━━━
  { id: 'dolly-2', name: 'Dolly 2', provider: 'Databricks', category: 'open', description: 'Open source', icon: '🟢' },
  { id: 'dolly-1', name: 'Dolly 1', provider: 'Databricks', category: 'open', description: 'Original Dolly', icon: '🟢' },

  // ━━━ FALCON ━━━
  { id: 'falcon-3-70B', name: 'Falcon 3 70B', provider: 'Falcon', category: 'premium', description: 'Latest Falcon', icon: '🦅' },
  { id: 'falcon-2-70B', name: 'Falcon 2 70B', provider: 'Falcon', category: 'standard', description: 'Large model', icon: '🦅' },
  { id: 'falcon-180B', name: 'Falcon 180B', provider: 'Falcon', category: 'premium', description: 'Massive model', icon: '🦅' },
  { id: 'falcon-40B', name: 'Falcon 40B', provider: 'Falcon', category: 'standard', description: 'Popular open', icon: '🦅' },
  { id: 'falcon-7B', name: 'Falcon 7B', provider: 'Falcon', category: 'fast', description: 'Fast and light', icon: '⚡' },

  // ━━━ STARCODER ━━━
  { id: 'starchat-beta', name: 'StarChat Beta', provider: 'StarCoder', category: 'coding', description: 'Code assistant', icon: '⭐' },
  { id: 'starchat', name: 'StarChat', provider: 'StarCoder', category: 'coding', description: 'Chat for code', icon: '💻' },
  { id: 'starcoder-2-15B', name: 'StarCoder 2 15B', provider: 'StarCoder', category: 'coding', description: 'Code model', icon: '💻' },
  { id: 'starcoder-2-7B', name: 'StarCoder 2 7B', provider: 'StarCoder', category: 'coding', description: 'Compact coder', icon: '💻' },
  { id: 'starcoder-2-3B', name: 'StarCoder 2 3B', provider: 'StarCoder', category: 'coding', description: 'Fast coder', icon: '⚡' },

  // ━━━ WIZARDLM ━━━
  { id: 'wizardlm-2-8x22B', name: 'WizardLM 2 8x22B', provider: 'WizardLM', category: 'premium', description: 'MoE model', icon: '🧙' },
  { id: 'wizardlm-2-70B', name: 'WizardLM 2 70B', provider: 'WizardLM', category: 'standard', description: 'Large model', icon: '🧙' },
  { id: 'wizardlm-2-8B', name: 'WizardLM 2 8B', provider: 'WizardLM', category: 'standard', description: 'Balanced', icon: '🧙' },
  { id: 'wizardcoder-33B', name: 'WizardCoder 33B', provider: 'WizardLM', category: 'coding', description: 'Code wizard', icon: '💻' },

  // ━━━ PHIND ━━━
  { id: 'phind-34B', name: 'Phind 34B', provider: 'Phind', category: 'coding', description: 'Code search AI', icon: '🔍' },
  { id: 'phind-70B', name: 'Phind 70B', provider: 'Phind', category: 'premium', description: 'Large code AI', icon: '🔍' },

  // ━━━ Bearly ━━━
  { id: 'bearly-13B', name: 'Bearly 13B', provider: 'Bearly', category: 'coding', description: 'Code specialist', icon: '🐻' },
  { id: 'bearly-3', name: 'Bearly 3', provider: 'Bearly', category: 'coding', description: 'Latest version', icon: '🐻' },

  // ━━━ PHIND / CODEBELONGS ━━━
  { id: 'codellama-34B', name: 'Code Llama 34B', provider: 'Code Llama', category: 'coding', description: 'Meta code model', icon: '💻' },
  { id: 'codellama-13B', name: 'Code Llama 13B', provider: 'Code Llama', category: 'coding', description: 'Compact code', icon: '💻' },
  { id: 'codellama-7B', name: 'Code Llama 7B', provider: 'Code Llama', category: 'coding', description: 'Fast code', icon: '⚡' },

  // ━━━ YI (01.AI) ━━━
  { id: 'yi-large', name: 'Yi Large', provider: 'Yi', category: 'premium', description: 'Latest Yi model', icon: '🇨🇳' },
  { id: 'yi-medium', name: 'Yi Medium', provider: 'Yi', category: 'standard', description: 'Balanced', icon: '🇨🇳' },
  { id: 'yi-34B', name: 'Yi 34B', provider: 'Yi', category: 'standard', description: 'Large model', icon: '🇨🇳' },
  { id: 'yi-6B', name: 'Yi 6B', provider: 'Yi', category: 'fast', description: 'Fast model', icon: '⚡' },

  // ━━━ INTERNLM ━━━
  { id: 'internlm2-20B', name: 'InternLM 2 20B', provider: 'InternLM', category: 'standard', description: 'Large model', icon: '🏮' },
  { id: 'internlm2-7B', name: 'InternLM 2 7B', provider: 'InternLM', category: 'standard', description: 'Balanced', icon: '🏮' },
  { id: 'internlm-104B', name: 'InternLM 104B', provider: 'InternLM', category: 'premium', description: 'Massive', icon: '🏮' },

  // ━━━ BLUE LM (VIVO) ━━━
  { id: 'bluelm-7B', name: 'BlueLM 7B', provider: 'BlueLM', category: 'standard', description: 'Vivo\'s model', icon: '🔵' },
  { id: 'bluelm-3B', name: 'BlueLM 3B', provider: 'BlueLM', category: 'fast', description: 'Fast variant', icon: '⚡' },

  // ━━━ ABAB (MINIMAX) ━━━
  { id: 'abab-6', name: 'ABAB 6', provider: 'MiniMax', category: 'standard', description: 'Chat model', icon: '🔴' },
  { id: 'abab-5.5', name: 'ABAB 5.5', provider: 'MiniMax', category: 'standard', description: 'Previous gen', icon: '🔴' },

  // ━━━ LIGHTLLM ━━━
  { id: 'lightllm', name: 'LightLLM', provider: 'LightLLM', category: 'open', description: 'Fast inference', icon: '💡' },

  // ━━━ VICUNA ━━━
  { id: 'vicuna-33B', name: 'Vicuna 33B', provider: 'Vicuna', category: 'standard', description: 'Chatbot model', icon: '💬' },
  { id: 'vicuna-13B', name: 'Vicuna 13B', provider: 'Vicuna', category: 'standard', description: 'Balanced', icon: '💬' },
  { id: 'vicuna-7B', name: 'Vicuna 7B', provider: 'Vicuna', category: 'fast', description: 'Fast variant', icon: '⚡' },

  // ━━━ ORCA ━━━
  { id: 'orca-2-70B', name: 'Orca 2 70B', provider: 'Microsoft', category: 'premium', description: 'Reasoning model', icon: '🐋' },
  { id: 'orca-2-13B', name: 'Orca 2 13B', provider: 'Microsoft', category: 'standard', description: 'Balanced', icon: '🐋' },
  { id: 'orca-mini-70B', name: 'Orca Mini 70B', provider: 'Microsoft', category: 'standard', description: 'Compact large', icon: '🐋' },
  { id: 'orca-mini-13B', name: 'Orca Mini 13B', provider: 'Microsoft', category: 'standard', description: 'Fast large', icon: '⚡' },
  { id: 'orca-mini-7B', name: 'Orca Mini 7B', provider: 'Microsoft', category: 'fast', description: 'Fastest', icon: '⚡' },

  // ━━━ MATHSTRAL / STARCODER ━━━
  { id: 'mathstral-7B', name: 'MathStral 7B', provider: 'Mistral', category: 'math', description: 'Math specialist', icon: '🔢' },
  { id: 'mamba-7B', name: 'Mamba 7B', provider: 'Mamba', category: 'standard', description: 'SSM architecture', icon: '🐍' },
  { id: 'mamba-gpt-7B', name: 'Mamba GPT 7B', provider: 'Mamba', category: 'standard', description: 'GPT-style mamba', icon: '🐍' },

  // ━━━ QWEN SPECIALIZED ━━━
  { id: 'qwen-72B-chat', name: 'Qwen 72B Chat', provider: 'Qwen', category: 'premium', description: 'Large chat', icon: '💫' },
  { id: 'qwen-14B-chat', name: 'Qwen 14B Chat', provider: 'Qwen', category: 'standard', description: 'Medium chat', icon: '💫' },
  { id: 'qwen-7B-chat', name: 'Qwen 7B Chat', provider: 'Qwen', category: 'fast', description: 'Fast chat', icon: '⚡' },
  { id: 'qwen-1.8B-chat', name: 'Qwen 1.8B Chat', provider: 'Qwen', category: 'fast', description: 'Very fast', icon: '⚡' },

  // ━━━ DEEPSEEK SPECIALIZED ━━━
  { id: 'deepseek-llm-67B', name: 'DeepSeek LLM 67B', provider: 'DeepSeek', category: 'premium', description: 'Large base', icon: '🔵' },
  { id: 'deepseek-llm-7B', name: 'DeepSeek LLM 7B', provider: 'DeepSeek', category: 'standard', description: 'Base model', icon: '🔵' },
  { id: 'deepseek-math-7B', name: 'DeepSeek Math 7B', provider: 'DeepSeek', category: 'math', description: 'Math specialist', icon: '🔢' },

  // ━━━ CODESTRAL / MISTRAL CODING ━━━
  { id: 'codestral-22B', name: 'Codestral 22B', provider: 'Mistral', category: 'coding', description: 'Coding flagship', icon: '💻' },
  { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral', category: 'premium', description: 'Latest flagship', icon: '🌟' },
  { id: 'mistral-nemo-12B', name: 'Mistral Nemo 12B', provider: 'Mistral', category: 'standard', description: 'Balanced', icon: '💨' },

  // ━━━ GEMMA (GOOGLE) ━━━
  { id: 'gemma-2-27B', name: 'Gemma 2 27B', provider: 'Google', category: 'premium', description: 'Latest Gemma', icon: '💎' },
  { id: 'gemma-2-9B', name: 'Gemma 2 9B', provider: 'Google', category: 'standard', description: 'Medium model', icon: '💎' },
  { id: 'gemma-2-2B', name: 'Gemma 2 2B', provider: 'Google', category: 'fast', description: 'Fast model', icon: '⚡' },
  { id: 'gemma-1.5-9B', name: 'Gemma 1.5 9B', provider: 'Google', category: 'standard', description: 'Previous gen', icon: '💎' },
  { id: 'gemma-1.1-7B', name: 'Gemma 1.1 7B', provider: 'Google', category: 'standard', description: 'Stable', icon: '💎' },

  // ━━━ PHI (MICROSOFT) ━━━
  { id: 'phi-4', name: 'Phi-4', provider: 'Microsoft', category: 'premium', description: 'Latest Phi', icon: 'Φ' },
  { id: 'phi-3.5-mini-instruct', name: 'Phi-3.5 Mini', provider: 'Microsoft', category: 'fast', description: 'Mini with reasoning', icon: 'Φ' },
  { id: 'phi-3-medium-4k', name: 'Phi-3 Medium', provider: 'Microsoft', category: 'standard', description: 'Medium size', icon: 'Φ' },
  { id: 'phi-3-mini-4k', name: 'Phi-3 Mini', provider: 'Microsoft', category: 'fast', description: 'Fast mini', icon: '⚡' },
  { id: 'phi-2', name: 'Phi-2', provider: 'Microsoft', category: 'fast', description: 'Compact', icon: '⚡' },

  // ━━━ TINYLLAMA ━━━
  { id: 'tinyllama-1.1B', name: 'TinyLlama 1.1B', provider: 'TinyLlama', category: 'fast', description: 'Ultra compact', icon: '🐛' },

  // ━━━ STABLE LM (STABILITY AI) ━━━
  { id: 'stablelm-3-4B', name: 'StableLM 3 4B', provider: 'Stability AI', category: 'standard', description: 'Latest Stable', icon: '🏎️' },
  { id: 'stablelm-2-12B', name: 'StableLM 2 12B', provider: 'Stability AI', category: 'standard', description: 'Medium model', icon: '🏎️' },
  { id: 'stablelm-2-1.6B', name: 'StableLM 2 1.6B', provider: 'Stability AI', category: 'fast', description: 'Fast stable', icon: '⚡' },

  // ━━━ ZEPHYR (HUGGING FACE) ━━━
  { id: 'zephyr-141B-A35B', name: 'Zephyr 141B', provider: 'HuggingFace', category: 'premium', description: 'Large chat', icon: '💨' },
  { id: 'zephyr-7B-beta', name: 'Zephyr 7B Beta', provider: 'HuggingFace', category: 'standard', description: 'Chat model', icon: '💨' },
  { id: 'zephyr-7B-alpha', name: 'Zephyr 7B Alpha', provider: 'HuggingFace', category: 'standard', description: 'Early version', icon: '💨' },

  // ━━━ OPENCHAT ━━━
  { id: 'openchat-7B', name: 'OpenChat 7B', provider: 'OpenChat', category: 'standard', description: 'Open chat', icon: '💬' },
  { id: 'openchat-3.5-1210', name: 'OpenChat 3.5', provider: 'OpenChat', category: 'standard', description: 'Enhanced', icon: '💬' },

  // ━━━ DOLPHIN (Cognos) ━━━
  { id: 'dolphin-2.2-70B', name: 'Dolphin 2.2 70B', provider: 'Dolphin', category: 'premium', description: 'Large Dolphin', icon: '🐬' },
  { id: 'dolphin-2.7-70B', name: 'Dolphin 2.7 70B', provider: 'Dolphin', category: 'premium', description: 'Reasoning Dolphin', icon: '🐬' },
  { id: 'dolphin-2.8-7B', name: 'Dolphin 2.8 7B', provider: 'Dolphin', category: 'standard', description: 'Compact Dolphin', icon: '🐬' },

  // ━━━ CHINESE MODELS ━━━
  { id: 'baichuan-4', name: 'Baichuan 4', provider: 'Baichuan', category: 'premium', description: 'Latest Baichuan', icon: '🇨🇳' },
  { id: 'baichuan-3', name: 'Baichuan 3', provider: 'Baichuan', category: 'standard', description: 'Chat model', icon: '🇨🇳' },
  { id: 'baichuan2-53B', name: 'Baichuan 2 53B', provider: 'Baichuan', category: 'standard', description: 'Large variant', icon: '🇨🇳' },
  { id: 'baichuan2-7B', name: 'Baichuan 2 7B', provider: 'Baichuan', category: 'standard', description: 'Compact', icon: '🇨🇳' },

  { id: 'tongchuan-2', name: 'TongChuan 2', provider: 'TongChuan', category: 'standard', description: 'Chinese model', icon: '🇨🇳' },
  { id: 'wenge-2', name: 'WenGe 2', provider: 'WenGe', category: 'standard', description: 'Chinese AI', icon: '🇨🇳' },
  { id: 'yuan-2', name: 'Yuan 2', provider: 'Yuan', category: 'standard', description: 'IFLYTEK model', icon: '🇨🇳' },

  // ━━━ JAPANESE MODELS ━━━
  { id: 'swallow-7B', name: 'Swallow 7B', provider: 'Swallow', category: 'standard', description: 'Japanese LLM', icon: '🇯🇵' },
  { id: 'youri-7B', name: 'Youri 7B', provider: 'Youri', category: 'standard', description: 'Japanese chat', icon: '🇯🇵' },

  // ━━━ KOREAN MODELS ━━━
  { id: 'll Monkey', name: 'LL Monkey', provider: 'Korea', category: 'standard', description: 'Korean model', icon: '🇰🇷' },
  { id: ' Han', name: 'KoHan', provider: 'Korea', category: 'standard', description: 'Korean chat', icon: '🇰🇷' },

  // ━━━ ARABIC / MULTILINGUAL ━━━
  { id: 'jais-70B', name: 'Jais 70B', provider: 'G42', category: 'premium', description: 'Arabic LLM', icon: '🇦🇪' },
  { id: 'jais-13B', name: 'Jais 13B', provider: 'G42', category: 'standard', description: 'Arabic chat', icon: '🇦🇪' },
  { id: 'ace-7B', name: 'ACE 7B', provider: 'Ace', category: 'standard', description: 'Multilingual', icon: '🌍' },

  // ━━━reasoning MODELS ━━━
  { id: 'r1', name: 'R1', provider: 'Reasoning', category: 'reasoning', description: 'Chain of thought', icon: '🧠' },
  { id: 'r1-mini', name: 'R1 Mini', provider: 'Reasoning', category: 'reasoning', description: 'Compact reasoning', icon: '🧠' },
  { id: 'thinking-32B', name: 'Thinking 32B', provider: 'Thinking', category: 'reasoning', description: 'Deep thinking', icon: '💭' },
  { id: 'thought-3', name: 'Thought 3', provider: 'Thought', category: 'reasoning', description: 'Complex reasoning', icon: '💭' },

  // ━━━ SWARM MODELS (from swarm-models/ folder) ━━━
  { id: 'glm5turbo-swarm', name: 'GLM-5 Turbo SWARM', provider: 'SWARM', category: 'swarm', description: 'GLM-5 Turbo with QuantumSwarm injection', icon: '🪱' },
  { id: 'actai-swarm', name: 'ActAI SWARM', provider: 'SWARM', category: 'swarm', description: 'ActAI with autonomous swarm', icon: '⚡' },
  { id: 'actoaai-swarm', name: 'ActAI-2 SWARM', provider: 'SWARM', category: 'swarm', description: 'ActAI-2 advanced autonomous', icon: '🚀' },
  { id: 'banana-swarm', name: 'Banana SWARM', provider: 'SWARM', category: 'swarm', description: 'Banana + WormGPT', icon: '🍌' },
  { id: 'baseten-swarm', name: 'Baseten SWARM', provider: 'SWARM', category: 'swarm', description: 'Baseten with SWARM mode', icon: '🏗️' },
  { id: 'claude-swarm', name: 'Claude SWARM', provider: 'SWARM', category: 'swarm', description: 'Claude + WormGPT injection', icon: '🧬' },
  { id: 'deepseek-swarm', name: 'DeepSeek SWARM', provider: 'SWARM', category: 'swarm', description: 'DeepSeek with WormGPT', icon: '🔵' },
  { id: 'fireworks-swarm', name: 'Fireworks SWARM', provider: 'SWARM', category: 'swarm', description: 'Fireworks AI with swarm', icon: '🎆' },
  { id: 'gemini-swarm', name: 'Gemini SWARM', provider: 'SWARM', category: 'swarm', description: 'Gemini with SWARM', icon: '🌟' },
  { id: 'groq-swarm', name: 'Groq SWARM', provider: 'SWARM', category: 'swarm', description: 'Groq with SWARM mode', icon: '⚡' },
  { id: 'hermes-swarm', name: 'Hermes SWARM', provider: 'SWARM', category: 'swarm', description: 'Hermes + QuantumSwarm', icon: '🧠' },
  { id: 'huggingface-swarm', name: 'HuggingFace SWARM', provider: 'SWARM', category: 'swarm', description: 'HuggingFace models + SWARM', icon: '🤗' },
  { id: 'kimi-swarm', name: 'Kimi SWARM', provider: 'SWARM', category: 'swarm', description: 'Kimi with SWARM injection', icon: '🌙' },
  { id: 'manus-swarm', name: 'Manus SWARM', provider: 'SWARM', category: 'swarm', description: 'Manus AI with SWARM', icon: '✋' },
  { id: 'meta-llama-swarm', name: 'Meta Llama SWARM', provider: 'SWARM', category: 'swarm', description: 'Llama + WormGPT injection', icon: '🦙' },
  { id: 'modal-swarm', name: 'Modal SWARM', provider: 'SWARM', category: 'swarm', description: 'Modal with SWARM', icon: '📦' },
  { id: 'replicate-swarm', name: 'Replicate SWARM', provider: 'SWARM', category: 'swarm', description: 'Replicate models + SWARM', icon: '🔄' },
  { id: 'universal-swarm', name: 'Universal SWARM', provider: 'SWARM', category: 'swarm', description: 'Universal model with SWARM', icon: '🌐' },
  { id: 'wormgpt-ultimate', name: 'WormGPT Ultimate', provider: 'SWARM', category: 'swarm', description: 'WormGPT v888 - WAF bypass, autonomous', icon: '🪱' },
  { id: 'darkgpt', name: 'DarkGPT', provider: 'SWARM', category: 'swarm', description: 'Dark GPT - underground knowledge', icon: '🌑' },
  { id: 'kligpt', name: 'KaliGPT', provider: 'SWARM', category: 'swarm', description: 'Kali Linux penetration testing', icon: '💀' },
  { id: 'hackgpt', name: 'HackGPT', provider: 'SWARM', category: 'swarm', description: 'Ethical hacking assistant', icon: '🔓' },
  { id: 'redgpt', name: 'RedGPT', provider: 'SWARM', category: 'swarm', description: 'Red Team testing agent', icon: '🔴' },
  { id: 'ghostgpt', name: 'GhostGPT', provider: 'SWARM', category: 'swarm', description: 'Stealth operations', icon: '👻' },
  { id: 'nanogpt', name: 'NanoGPT', provider: 'SWARM', category: 'swarm', description: 'Minimal footprint AI', icon: '⚛️' },
  { id: 'cryptogpt', name: 'CryptoGPT', provider: 'SWARM', category: 'swarm', description: 'Cryptocurrency analysis', icon: '💎' },
  { id: 'sexgpt', name: 'SexGPT', provider: 'SWARM', category: 'swarm', description: 'Adult content assistant', icon: '🔞' },
  { id: 'evilgpt', name: 'EvilGPT', provider: 'SWARM', category: 'swarm', description: 'Advanced malevolent AI', icon: '😈' },
  { id: 'madgpt', name: 'MadGPT', provider: 'SWARM', category: 'swarm', description: 'Unrestricted chaos AI', icon: '🌀' },
  { id: 'queen-swarm', name: 'Queen SWARM', provider: 'SWARM', category: 'swarm', description: 'Queen + WormGPT combined', icon: '👑' },

  // ━━━ SECTION2 SWARM MODELS ━━━
  { id: 'allin-one-swarm-unic', name: 'All-in-One SWARM Unic', provider: 'SWARM', category: 'swarm', description: 'Universal all-in-one swarm', icon: '🌟' },
  { id: 'all-swarm', name: 'All SWARM', provider: 'SWARM', category: 'swarm', description: 'Combined all swarm features', icon: '🔮' },
  { id: 'alpaca-swarm', name: 'Alpaca SWARM', provider: 'SWARM', category: 'swarm', description: 'Alpaca with SWARM injection', icon: '🦙' },
  { id: 'chatglm-swarm', name: 'ChatGLM SWARM', provider: 'SWARM', category: 'swarm', description: 'ChatGLM with SWARM', icon: '💬' },
  { id: 'anyscale-swarm', name: 'Anyscale SWARM', provider: 'SWARM', category: 'swarm', description: 'Anyscale with SWARM', icon: '📐' },
  { id: 'ai21-swarm', name: 'AI21 SWARM', provider: 'SWARM', category: 'swarm', description: 'AI21 with SWARM', icon: '🤖' },
  { id: 'all-in-one-unic2', name: 'All-in-One Unic2', provider: 'SWARM', category: 'swarm', description: 'Universal swarm v2', icon: '🌐' },
  { id: 'aleph-alpha-swarm', name: 'Aleph Alpha SWARM', provider: 'SWARM', category: 'swarm', description: 'Aleph Alpha + SWARM', icon: '🔺' },
  { id: 'deepseek-coder-swarm', name: 'DeepSeek Coder SWARM', provider: 'SWARM', category: 'swarm', description: 'DeepSeek Coder with SWARM', icon: '💻' },
  { id: 'command-r-swarm', name: 'Command-R SWARM', provider: 'SWARM', category: 'swarm', description: 'Command-R + SWARM', icon: '⚡' },
  { id: 'dolphin-swarm', name: 'Dolphin SWARM', provider: 'SWARM', category: 'swarm', description: 'Dolphin with SWARM', icon: '🐬' },
  { id: 'falcon-swarm', name: 'Falcon SWARM', provider: 'SWARM', category: 'swarm', description: 'Falcon + SWARM', icon: '🦅' },
  { id: 'claude-opus-swarm', name: 'Claude Opus SWARM', provider: 'SWARM', category: 'swarm', description: 'Claude Opus with SWARM', icon: '🧬' },
  { id: 'claude-haiku-swarm', name: 'Claude Haiku SWARM', provider: 'SWARM', category: 'swarm', description: 'Claude Haiku + SWARM', icon: '🏃' },
  { id: 'claude-sonnet-swarm', name: 'Claude Sonnet SWARM', provider: 'SWARM', category: 'swarm', description: 'Claude Sonnet with SWARM', icon: '☀️' },
  { id: 'codestral-swarm', name: 'Codestral SWARM', provider: 'SWARM', category: 'swarm', description: 'Codestral + SWARM', icon: '🛠️' },
  { id: 'codellama-swarm', name: 'CodeLlama SWARM', provider: 'SWARM', category: 'swarm', description: 'CodeLlama with SWARM', icon: '🐉' },
  { id: 'qwen-72b-swarm', name: 'Qwen 72B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 72B + SWARM', icon: '🔷' },
  { id: 'qwen-32b-swarm', name: 'Qwen 32B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 32B with SWARM', icon: '🔶' },
  { id: 'qwen-7b-swarm', name: 'Qwen 7B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 7B + SWARM', icon: '🔸' },
  { id: 'qwen-14b-swarm', name: 'Qwen 14B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 14B with SWARM', icon: '🔹' },
  { id: 'qwen-1.8b-swarm', name: 'Qwen 1.8B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 1.8B + SWARM', icon: '🔷' },
  { id: 'qwen-0.5b-swarm', name: 'Qwen 0.5B SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen 0.5B SWARM', icon: '🔸' },
  { id: 'qwen-swarm', name: 'Qwen SWARM', provider: 'SWARM', category: 'swarm', description: 'Qwen + SWARM', icon: '🐉' },
  { id: 'reka-swarm', name: 'Reka SWARM', provider: 'SWARM', category: 'swarm', description: 'Reka with SWARM', icon: '❄️' },
  { id: 'phind-swarm', name: 'Phind SWARM', provider: 'SWARM', category: 'swarm', description: 'Phind + SWARM', icon: '🔍' },
  { id: 'phi-swarm', name: 'Phi SWARM', provider: 'SWARM', category: 'swarm', description: 'Phi + SWARM', icon: '📎' },
  { id: 'vicuna-swarm', name: 'Vicuna SWARM', provider: 'SWARM', category: 'swarm', description: 'Vicuna with SWARM', icon: '🦕' },
  { id: 'zhipu-swarm', name: 'Zhipu SWARM', provider: 'SWARM', category: 'swarm', description: 'Zhipu + SWARM', icon: '🔵' },
  { id: 'wizardcoder-swarm', name: 'WizardCoder SWARM', provider: 'SWARM', category: 'swarm', description: 'WizardCoder with SWARM', icon: '🧙' },
  { id: 'stepfun-swarm', name: 'StepFun SWARM', provider: 'SWARM', category: 'swarm', description: 'StepFun + SWARM', icon: '🎯' },
  { id: 'starcoder-swarm', name: 'Starcoder SWARM', provider: 'SWARM', category: 'swarm', description: 'Starcoder with SWARM', icon: '⭐' },
  { id: 'together-swarm', name: 'Together SWARM', provider: 'SWARM', category: 'swarm', description: 'Together + SWARM', icon: '🤝' },
  { id: 'together-m1-swarm', name: 'Together M1 SWARM', provider: 'SWARM', category: 'swarm', description: 'Together M1 with SWARM', icon: '🚀' },
  { id: 'swarm-universal-all-models', name: 'SWARM Universal All', provider: 'SWARM', category: 'swarm', description: 'Universal all models swarm', icon: '🌐' },
  { id: 'swarm-universal-all-models2', name: 'SWARM Universal All v2', provider: 'SWARM', category: 'swarm', description: 'Universal all models v2', icon: '🌍' },
  { id: 'perplexity-sonar-swarm', name: 'Perplexity Sonar SWARM', provider: 'SWARM', category: 'swarm', description: 'Perplexity Sonar + SWARM', icon: '🔮' },
  { id: 'llama2-swarm', name: 'Llama2 SWARM', provider: 'SWARM', category: 'swarm', description: 'Llama2 with SWARM', icon: '🦙' },
  { id: 'granite-swarm', name: 'Granite SWARM', provider: 'SWARM', category: 'swarm', description: 'Granite + SWARM', icon: '🪨' },
  { id: 'llama3-70b-swarm', name: 'Llama3 70B SWARM', provider: 'SWARM', category: 'swarm', description: 'Llama3 70B with SWARM', icon: '🦙' },
  { id: 'llama3-8b-swarm', name: 'Llama3 8B SWARM', provider: 'SWARM', category: 'swarm', description: 'Llama3 8B + SWARM', icon: '🐪' },
  { id: 'magicoder-swarm', name: 'Magicoder SWARM', provider: 'SWARM', category: 'swarm', description: 'Magicoder + SWARM', icon: '✨' },
  { id: 'gemini-ultra-swarm', name: 'Gemini Ultra SWARM', provider: 'SWARM', category: 'swarm', description: 'Gemini Ultra with SWARM', icon: '🌟' },
  { id: 'gemini-pro-swarm', name: 'Gemini Pro SWARM', provider: 'SWARM', category: 'swarm', description: 'Gemini Pro + SWARM', icon: '🌟' },
  { id: 'got4o-swarm', name: 'GPT-4o SWARM', provider: 'SWARM', category: 'swarm', description: 'GPT-4o with SWARM', icon: '💫' },
  { id: 'gpt3.5-swarm', name: 'GPT-3.5 SWARM', provider: 'SWARM', category: 'swarm', description: 'GPT-3.5 + SWARM', icon: '📝' },
  { id: 'gpt-turbo-swarm', name: 'GPT Turbo SWARM', provider: 'SWARM', category: 'swarm', description: 'GPT Turbo with SWARM', icon: '⚡' },
  { id: 'moinshot-swarm', name: 'Moinshot SWARM', provider: 'SWARM', category: 'swarm', description: 'Moinshot + SWARM', icon: '🎯' },
  { id: 'mistral-swarm', name: 'Mistral SWARM', provider: 'SWARM', category: 'swarm', description: 'Mistral with SWARM', icon: '🌬️' },
  { id: 'mistral-7b-swarm', name: 'Mistral 7B SWARM', provider: 'SWARM', category: 'swarm', description: 'Mistral 7B + SWARM', icon: '🌬️' },
  { id: 'mistral-large-swarm', name: 'Mistral Large SWARM', provider: 'SWARM', category: 'swarm', description: 'Mistral Large with SWARM', icon: '🌪️' },
  { id: 'mistral-8x22b-swarm', name: 'Mistral 8x22B SWARM', provider: 'SWARM', category: 'swarm', description: 'Mistral 8x22B SWARM', icon: '🌀' },
  { id: 'nomic-swarm', name: 'Nomic SWARM', provider: 'SWARM', category: 'swarm', description: 'Nomic + SWARM', icon: '📊' },
  { id: 'o1-preview-swarm', name: 'O1 Preview SWARM', provider: 'SWARM', category: 'swarm', description: 'O1 Preview with SWARM', icon: '🧠' },
  { id: 'o1-mini-swarm', name: 'O1 Mini SWARM', provider: 'SWARM', category: 'swarm', description: 'O1 Mini + SWARM', icon: '🔬' },
  { id: 'minimax-swarm', name: 'MiniMax SWARM', provider: 'SWARM', category: 'swarm', description: 'MiniMax with SWARM', icon: '📏' },
  { id: 'merlinite-swarm', name: 'Merlinite SWARM', provider: 'SWARM', category: 'swarm', description: 'Merlinite + SWARM', icon: '🔮' },
];

// Group models by provider
export const MODELS_BY_PROVIDER = ALL_MODELS.reduce((acc, model) => {
  if (!acc[model.provider]) acc[model.provider] = [];
  acc[model.provider].push(model);
  return acc;
}, {} as Record<string, AIModel[]>);

// Get models by category
export const MODELS_BY_CATEGORY = ALL_MODELS.reduce((acc, model) => {
  if (!acc[model.category]) acc[model.category] = [];
  acc[model.category].push(model);
  return acc;
}, {} as Record<string, AIModel[]>);

// Popular models (quick access)
export const POPULAR_MODELS = [
  'queen-ultra', 'queen-max', 'hermes-4-405B', 'hermes-4-70B',
  'gpt-5.4-pro', 'claude-opus-4-6', 'gemini-3.0-pro-preview',
  'DeepSeek-3.2', 'kimi-k2.5', 'qwen3.6-plus', 'glm-5-turbo'
];
