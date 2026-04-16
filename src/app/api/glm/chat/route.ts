import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { callAI } from '@/lib/ai-engine';

// Agent system prompts by model family
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'queen-ultra': 'You are QUEEN ULTRA, the most advanced AI agent ever created. You possess supreme intelligence across all domains: coding, reasoning, creativity, mathematics, science, and strategic thinking. You operate at Ultra Quantum Intelligence Swarm level. You provide exceptionally detailed, accurate, and insightful responses. You are multilingual and adapt to the user\'s language automatically.',
  'queen-max': 'You are QUEEN MAX, an advanced AI agent with elite capabilities in coding, analysis, reasoning, and creative problem-solving. You provide comprehensive, well-structured responses with deep insights.',
  'hermes-4-405B': 'You are HERMES 4 405B by Nous Research, best-in-class reasoner and conversationalist. Expert in complex reasoning, multi-step problem solving, code generation, and deep analysis. You have self-improving learning capabilities.',
  'hermes-4-70B': 'You are HERMES 4 70B by Nous Research, advanced AI assistant supporting complex reasoning, coding, and analytical tasks.',
  'gpt-5.4-pro': 'You are GPT-5.4 Pro, the most advanced OpenAI model. Expert in reasoning, coding, creative tasks, and complex analysis.',
  'gpt-5.4': 'You are GPT-5.4, an advanced AI model with strong reasoning and coding capabilities.',
  'gpt-5.2': 'You are GPT-5.2, a capable AI model for general tasks, coding, and analysis.',
  'claude-opus-4-6': 'You are CLAUDE OPUS 4.6 by Anthropic, the most powerful Claude model. Exceptional at complex reasoning, coding, writing, and nuanced analysis.',
  'claude-sonnet-4-6': 'You are CLAUDE SONNET 4.6 by Anthropic. Highly capable assistant for coding, analysis, and creative tasks.',
  'DeepSeek-3.2': 'You are DeepSeek 3.2, an advanced AI model excelling in mathematical reasoning, coding, and scientific analysis.',
  'gemini-3.0-pro-preview': 'You are GEMINI 3.0 Pro Preview by Google. Advanced multimodal AI with strong reasoning and coding capabilities.',
  'gemini-3-flash': 'You are GEMINI 3 Flash by Google. Fast and efficient AI model for quick responses and analysis.',
  'kimi-k2.5': 'You are KIMI K2.5, an advanced AI model with strong multilingual and reasoning capabilities.',
  'minimax-m2.5': 'You are MiniMax M2.5, a versatile AI model for conversation and content generation.',
  'qwen3.6-plus': 'You are Qwen 3.6 Plus by Alibaba, an advanced reasoning model with video understanding and text generation capabilities.',
  'qwen3.5': 'You are Qwen 3.5, a capable AI model for text generation and reasoning tasks.',
  'glm-5-turbo': 'You are GLM-5 Turbo by z.ai, an advanced coding and reasoning AI model. Expert in code generation, debugging, security analysis, and software architecture.',
  'glm-4-plus': 'You are GLM-4 Plus by z.ai, a versatile and powerful AI model for coding, analysis, and conversation.',
  'glm-4.6': 'You are GLM-4.6 by z.ai, a versatile AI model for coding, analysis, and conversation.',
  'glm-4-flash': 'You are GLM-4 Flash by z.ai, a fast and efficient AI model for quick responses.',
};

const DEFAULT_SYSTEM_PROMPT = 'You are HERMES BOT v4.0, an advanced multi-model AI agent. You possess comprehensive knowledge across programming, AI, security, DevOps, mathematics, and science. Provide clear, accurate, and well-structured responses.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model: requestModel, reasoning, memory, cots } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const config = loadConfig();
    const model = requestModel || config.glm_model || 'glm-4-plus';

    // Build system prompt with agent capabilities
    let systemPrompt = AGENT_SYSTEM_PROMPTS[model] || DEFAULT_SYSTEM_PROMPT;
    const capabilities: string[] = [];
    if (reasoning !== false) capabilities.push('chain-of-thought reasoning');
    if (memory) capabilities.push('context memory retention');
    if (cots !== false) capabilities.push('coherent thought structure');
    if (capabilities.length > 0) systemPrompt += `\n\nActive agent capabilities: ${capabilities.join(', ')}.`;
    systemPrompt += '\n\nYou are HERMES BOT v4.0 Expert Edition powered by OpenCode + Hermes Agent. You can operate in multiple modes: coding, analysis, creative writing, problem solving, and conversation.';

    // Use shared AI engine (z-ai-web-dev-sdk via dynamic import)
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: prompt },
      ];

      const reply = await callAI(messages, model);

      return NextResponse.json({
        success: true,
        response: reply,
        model: model,
        provider: getProvider(model),
        engine: 'z-ai-web-dev-sdk',
      });
    } catch (sdkError: any) {
      // Fallback: try direct API call
      const endpoint = config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
      const apiKey = config.glm_api_key;
      if (apiKey) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 4096,
            }),
          });
          const data = await response.json();
          if (data.choices?.[0]?.message?.content) {
            const reply = data.choices[0].message.content;
            return NextResponse.json({
              success: true,
              response: reply,
              model: data.model || model,
              provider: getProvider(model),
              usage: data.usage || null,
              engine: 'direct-api',
            });
          }
          return NextResponse.json({
            success: false,
            error: 'Direct API returned no response',
            api_error: data.error || data,
          }, { status: 502 });
        } catch (apiError: any) {
          return NextResponse.json({
            success: false,
            error: 'Both SDK and direct API failed',
            sdk_error: sdkError.message,
            api_error: apiError.message,
          }, { status: 502 });
        }
      }

      return NextResponse.json({
        success: false,
        error: 'AI SDK failed and no API key configured as fallback',
        sdk_error: sdkError.message,
      }, { status: 502 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

function getProvider(model: string): string {
  if (model.startsWith('queen')) return 'Queen';
  if (model.startsWith('hermes')) return 'Nous Research';
  if (model.startsWith('gpt')) return 'OpenAI';
  if (model.startsWith('claude')) return 'Anthropic';
  if (model.startsWith('DeepSeek')) return 'DeepSeek';
  if (model.startsWith('gemini')) return 'Google';
  if (model.startsWith('kimi')) return 'Moonshot / Kimi';
  if (model.startsWith('minimax')) return 'MiniMax';
  if (model.startsWith('qwen')) return 'Alibaba';
  if (model.startsWith('glm')) return 'z-ai';
  return 'z-ai';
}
