import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const config = loadConfig();

    if (!config.glm_api_key) {
      return NextResponse.json(
        { error: 'GLM API key not configured' },
        { status: 400 }
      );
    }

    const endpoint = config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
    const model = config.glm_model || 'glm-4.6';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.glm_api_key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are HERMES BOT v4.0, an advanced coding assistant. Provide clear, concise, and helpful responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'GLM API request failed',
          status: response.status,
          details: data.error?.message || data.message || 'Unknown error',
        },
        { status: 502 }
      );
    }

    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({
      success: true,
      response: reply,
      model: data.model || model,
      usage: data.usage || null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
