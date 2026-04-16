import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const POLL_OFFSET_FILE = 'data/poll_offset.json';

function getPollOffset(): number {
  try {
    const path = join(process.cwd(), POLL_OFFSET_FILE);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8')).offset || -1;
    }
  } catch {}
  return -1;
}

function savePollOffset(offset: number) {
  writeFileSync(join(process.cwd(), POLL_OFFSET_FILE), JSON.stringify({ offset }), 'utf-8');
}

// ─── Auto-poll state ───
let autoPollRunning = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollOnce(token: string, longPoll = false): Promise<{ processed: number; errors: number; total: number }> {
  try {
    const offset = getPollOffset();
    const timeoutSec = longPoll ? 15 : 3;
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100&offset=${offset}&timeout=${timeoutSec}&allowed_updates=["message","callback_query"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), (timeoutSec + 5) * 1000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (!data.ok) return { processed: 0, errors: 0, total: 0 };

    const updates = data.result || [];
    let processed = 0;

    for (const update of updates) {
      try {
        await fetch('http://localhost:3000/api/telegram/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        processed++;
      } catch (e: any) {
        console.error('[poll] Forward error:', e.message);
      }
    }

    if (updates.length > 0) {
      const maxOffset = Math.max(...updates.map((u: any) => u.update_id));
      savePollOffset(maxOffset + 1);
      console.log(`[poll] Processed ${processed}/${updates.length} updates`);
    }

    return { processed, errors: 0, total: updates.length };
  } catch (e: any) {
    if (e.name === 'AbortError') return { processed: 0, errors: 0, total: 0 };
    console.error('[poll] Error:', e.message);
    return { processed: 0, errors: 1, total: 0 };
  }
}

// GET - check poll status
export async function GET() {
  return NextResponse.json({
    auto_polling: autoPollRunning,
    status: autoPollRunning ? 'running' : 'stopped',
    message: autoPollRunning
      ? 'Bot is auto-polling. Messages are processed within ~5s.'
      : 'POST to poll once, or POST with {"auto":true} to start auto-polling.',
  });
}

export async function POST(request: NextRequest) {
  const config = loadConfig();
  if (!config.telegram_token) {
    return NextResponse.json({ error: 'No token' }, { status: 400 });
  }
  const token = config.telegram_token;

  // Check if auto-poll request
  const body = await request.json().catch(() => ({}));

  if (body.auto === true || body.auto === 'start') {
    if (autoPollRunning) {
      return NextResponse.json({ status: 'already_running', message: 'Auto-poll already active.' });
    }

    // Delete webhook to enable getUpdates
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
      console.log('[poll] Webhook deleted, switching to long-polling');
    } catch {}

    autoPollRunning = true;

    // Immediate first poll
    const firstPoll = await pollOnce(token, true);

    // Start interval polling
    pollTimer = setInterval(async () => {
      if (!autoPollRunning) return;
      await pollOnce(token, true);
    }, 3000);

    console.log('[poll] AUTO-POLL STARTED - interval 3s');

    return NextResponse.json({
      status: 'started',
      auto_polling: true,
      first_poll: firstPoll,
      message: 'Auto-polling started! Bot responds within ~5s.',
    });
  }

  if (body.auto === 'stop' || body.auto === false) {
    autoPollRunning = false;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    console.log('[poll] AUTO-POLL STOPPED');
    return NextResponse.json({ status: 'stopped', auto_polling: false });
  }

  // Single poll (backward compatible)
  if (autoPollRunning) {
    return NextResponse.json({ status: 'auto_polling', message: 'Auto-poll is active.', processed: 0 });
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
  } catch {}

  const result = await pollOnce(token, false);
  return NextResponse.json({ success: true, ...result });
}
