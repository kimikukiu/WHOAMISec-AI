import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();

    if (!config.telegram_token) {
      return NextResponse.json(
        { error: 'Telegram token not configured' },
        { status: 400 }
      );
    }

    const url = `https://api.telegram.org/bot${config.telegram_token}/getUpdates?limit=20&allowed_updates=["message"]`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: data.description || 'Unknown error' },
        { status: 502 }
      );
    }

    const messages = (data.result || []).map((update: any) => {
      const msg = update.message || {};
      return {
        update_id: update.update_id,
        message_id: msg.message_id,
        date: msg.date ? new Date(msg.date * 1000).toISOString() : null,
        from: {
          id: msg.from?.id,
          name: msg.from?.first_name
            ? `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`
            : 'Unknown',
          username: msg.from?.username || null,
        },
        chat: {
          id: msg.chat?.id,
          type: msg.chat?.type,
          title: msg.chat?.title || null,
        },
        text: msg.text || msg.caption || null,
        has_photo: !!(msg.photo && msg.photo.length > 0),
        has_document: !!msg.document,
      };
    });

    // Return in reverse chronological order
    messages.reverse();

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
