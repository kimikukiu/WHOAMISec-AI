import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    const config = loadConfig();

    if (!config.telegram_token) {
      return NextResponse.json(
        { error: 'Telegram token not configured' },
        { status: 400 }
      );
    }

    // First, get the latest chat_id from getUpdates
    const updatesUrl = `https://api.telegram.org/bot${config.telegram_token}/getUpdates?limit=1&offset=-1`;
    const updatesRes = await fetch(updatesUrl);
    const updatesData = await updatesRes.json();

    if (!updatesRes.ok || !updatesData.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Telegram updates', details: updatesData.description || 'Unknown error' },
        { status: 502 }
      );
    }

    if (!updatesData.result || updatesData.result.length === 0) {
      return NextResponse.json(
        { error: 'No active chats found. Send a message to the bot first.' },
        { status: 400 }
      );
    }

    const lastUpdate = updatesData.result[0];
    const chatId = lastUpdate.message?.chat?.id;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Could not determine chat ID from updates' },
        { status: 400 }
      );
    }

    // Send the message
    const sendUrl = `https://api.telegram.org/bot${config.telegram_token}/sendMessage`;
    const sendRes = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: command,
        parse_mode: 'HTML',
      }),
    });
    const sendData = await sendRes.json();

    if (!sendRes.ok || !sendData.ok) {
      return NextResponse.json(
        { error: 'Failed to send message', details: sendData.description || 'Unknown error' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      chat_id: chatId,
      message_id: sendData.result?.message_id,
      text: command,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
