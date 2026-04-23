#!/usr/bin/env node
// ════════════════════════════════════════════════════════
// WHOAMISec-AI Telegram Bot Runner
// Uses the integrated Telegram bot from server/telegram-bot.ts
// ════════════════════════════════════════════════════════

import { WEHOOK_URL, TELEGRAM_TOKEN, ADMIN_CHAT_ID } from './src/lib/config';
import WHOAMISecAITelegramBot from './server/telegram-bot';

const token = TELEGRAM_TOKEN || '8248107818:AAGysZMySSGZp8VhOSL-fjB91p05cdU8MKA';
const adminChatId = ADMIN_CHAT_ID || '7966587808';

console.log('[Bot Runner] Starting WHOAMISec-AI Telegram Bot...');
console.log(`[Bot Runner] Admin Chat ID: ${adminChatId}`);

// Start the bot
try {
  const bot = new WHOAMISecAITelegramBot();
  bot.start();
  
  console.log('[Bot Runner] ✅ WHOAMISec-AI bot started successfully!');
  console.log('[Bot Runner] Polling for messages...');
} catch (error) {
  console.error('[Bot Runner] ❌ Failed to start bot:', error);
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Bot Runner] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Bot Runner] Terminating...');
  process.exit(0);
});
