#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Hermes Bot v4.0 - Standalone Runner (no Next.js needed)
// Polls Telegram, forwards to local webhook, auto-restarts
// ═══════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = join(__dirname, 'data', 'config.json');
const OFFSET_FILE = join(__dirname, 'data', 'poll_offset.json');

function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')); }
  catch { return {}; }
}

function getOffset() {
  try { return JSON.parse(readFileSync(OFFSET_FILE, 'utf-8')).offset || -1; }
  catch { return -1; }
}

function saveOffset(offset) {
  const dir = dirname(OFFSET_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OFFSET_FILE, JSON.stringify({ offset }), 'utf-8');
}

async function pollOnce(token) {
  const offset = getOffset();
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100&offset=${offset}&timeout=15&allowed_updates=["message","callback_query"]`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    const data = await res.json();
    if (!data.ok) return { processed: 0, total: 0 };

    const updates = data.result || [];
    let processed = 0;

    for (const update of updates) {
      try {
        const webhookRes = await fetch('http://localhost:3000/api/telegram/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        if (webhookRes.ok) processed++;
        else console.error(`[bot] Webhook returned ${webhookRes.status}`);
      } catch (e) {
        console.error(`[bot] Forward error: ${e.message}`);
      }
    }

    if (updates.length > 0) {
      const maxOffset = Math.max(...updates.map(u => u.update_id));
      saveOffset(maxOffset + 1);
      console.log(`[${new Date().toISOString().slice(11,19)}] ${processed}/${updates.length} updates processed`);
    }

    return { processed, total: updates.length };
  } catch (e) {
    if (e.name === 'TimeoutError') return { processed: 0, total: 0 };
    console.error(`[bot] Poll error: ${e.message}`);
    return { processed: 0, total: 0 };
  }
}

async function main() {
  const config = loadConfig();
  const token = config.telegram_token;

  if (!token) {
    console.error('[bot] ERROR: No telegram_token in config.json');
    process.exit(1);
  }

  // Delete webhook so getUpdates works
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
    console.log('[bot] Webhook deleted, using long-polling');
  } catch {}

  // Reset offset to catch pending messages
  saveOffset(-1);

  console.log(`[bot] Hermes Bot v4.0 starting...`);
  console.log(`[bot] Model: ${config.glm_model || 'glm-4-plus'}`);
  console.log(`[bot] API: z.ai SDK (AUTO)`);

  let consecutiveErrors = 0;

  while (true) {
    try {
      const result = await pollOnce(token);
      if (result.total > 0) consecutiveErrors = 0;
    } catch (e) {
      consecutiveErrors++;
      console.error(`[bot] Error: ${e.message}`);
      if (consecutiveErrors > 10) {
        console.log('[bot] Too many errors, waiting 30s...');
        await new Promise(r => setTimeout(r, 30000));
        consecutiveErrors = 0;
      }
    }
    // Small delay between polls
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(e => {
  console.error('[bot] Fatal:', e);
  process.exit(1);
});
