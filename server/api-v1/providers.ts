/**
 * GET /api/v1/providers
 * List available providers and their status
 */

import express from 'express';
import { providerManager } from '../providers/manager';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const providers = await providerManager.getAvailableProviders();
    res.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error('[API v1 /providers] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
