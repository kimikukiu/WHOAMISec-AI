/**
 * POST /api/v1/llm/chat
 * Unified chat endpoint supporting all providers
 * Requires authentication (user or admin)
 */

import express from 'express';
import { providerManager } from '../providers/manager';
import { LLMRequest } from '../providers/base-provider';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      model,
      provider,
      temperature,
      maxTokens,
      conversationHistory,
    } = req.body;

    if (!message && !conversationHistory) {
      return res.status(400).json({ error: 'message or conversationHistory required' });
    }

    // Build messages array
    const messages = conversationHistory || [
      { role: 'user', content: message },
    ];

    const request: LLMRequest = {
      model: model || '',
      messages,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2048,
    };

    // Check user's subscription/token quota here
    // TODO: Implement token quota check

    const response = await providerManager.chat(request, provider);

    res.json({
      success: true,
      text: response.text,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error('[API v1 /chat] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
