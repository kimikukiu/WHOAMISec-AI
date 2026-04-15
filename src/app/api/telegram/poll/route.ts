import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const POLL_OFFSET_FILE = 'data/poll_offset.json';

function getPollOffset(): number {
  try {
    const path = join(process.cwd(), POLL_OFFSET_FILE);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8')).offset || 0;
    }
  } catch {}
  return 0;
}

function savePollOffset(offset: number) {
  writeFileSync(join(process.cwd(), POLL_OFFSET_FILE), JSON.stringify({ offset }), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const config = loadConfig();
    if (!config.telegram_token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 });
    }

    const token = config.telegram_token;
    const offset = getPollOffset();
    const baseUrl = request.headers.get('x-forwarded-host')
      ? `https://${request.headers.get('x-forwarded-host')}`
      : process.env.NEXT_PUBLIC_BASE_URL || '';

    // Get pending updates
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=10&offset=${offset}&timeout=0&allowed_updates=["message"]`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 502 });
    }

    const updates = data.result || [];
    let processed = 0;

    // Process each update by forwarding to our webhook handler
    for (const update of updates) {
      try {
        const webhookUrl = baseUrl
          ? `${baseUrl}/api/telegram/webhook`
          : `http://localhost:3000/api/telegram/webhook`;

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        processed++;
      } catch (e: any) {
        console.error('Failed to process update:', e.message);
      }
    }

    // Update offset
    if (updates.length > 0) {
      const maxOffset = Math.max(...updates.map((u: any) => u.update_id));
      savePollOffset(maxOffset + 1);
    }

    return NextResponse.json({
      success: true,
      processed,
      total: updates.length,
      offset: updates.length > 0 ? Math.max(...updates.map((u: any) => u.update_id)) + 1 : offset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
