/**
 * POST /api/v1/llm/completion
 * Text completion endpoint
 */

import express from 'express';
import { providerManager } from '../providers/manager';
import { LLMRequest } from '../providers/base-provider';

const router = express.Router();

router.post('/completion', async (req, res) => {
  try {
    const {
      prompt,
      model,
      provider,
      temperature,
      maxTokens,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    const request: LLMRequest = {
      model: model || '',
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2048,
    };

    const response = await providerManager.chat(request, provider);

    res.json({
      success: true,
      text: response.text,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error('[API v1 /completion] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
