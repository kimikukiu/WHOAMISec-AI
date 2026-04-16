import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const config = loadConfig();
    const token = config.telegram_token;

    if (!token) {
      return NextResponse.json(
        { error: 'Telegram token not configured. Set it in Settings first.' },
        { status: 400 }
      );
    }

    // Get the webhook URL from the request or construct it
    const body = await request.json().catch(() => ({}));
    const baseUrl = body.base_url || process.env.NEXT_PUBLIC_BASE_URL || '';
    
    if (!baseUrl) {
      // If no base URL provided, try to delete webhook (switch to getUpdates polling mode)
      const deleteUrl = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
      const deleteRes = await fetch(deleteUrl);
      const deleteData = await deleteRes.json();
      
      if (deleteData.ok) {
        // Set bot commands menu
        const commandsUrl = `https://api.telegram.org/bot${token}/setMyCommands`;
        await fetch(commandsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commands: [
              { command: 'start', description: '🤖 Pornește botul și arată meniul' },
              { command: 'api', description: '🔑 Setează cheia GLM API' },
              { command: 'status', description: '📊 Status configurare' },
              { command: 'analyze', description: '🔍 Analizează fișierele' },
              { command: 'code', description: '💻 Generează cod' },
              { command: 'opencode', description: '🔧 OpenCode AI agent' },
              { command: 'hermes', description: '🤖 Hermes Agent (self-improving)' },
              { command: 'files', description: '📂 Listează fișierele' },
              { command: 'clear', description: '🧹 Resetează sesiunea' },
              { command: 'models', description: '🧠 Toate modelele' },
              { command: 'model', description: '🔄 Schimbă modelul' },
              { command: 'endpoint', description: '🌐 Schimbă endpoint' },
              { command: 'setrepo', description: '📦 Setează repo GitHub' },
              { command: 'deploy', description: '🚀 Push pe GitHub' },
              { command: 'expo', description: '📱 Generează proiect Expo' },
              { command: 'p1', description: '🔄 Problemă P1 - FizzBuzz' },
              { command: 'p6', description: '🔄 Problemă P6 - Two Sum' },
              { command: 'p12', description: '🔄 Problemă P12 - Most Water' },
              { command: 'train_prompt', description: '🧬 Antrenare neural agentică' },
            ],
          }),
        });

        return NextResponse.json({
          success: true,
          mode: 'polling',
          message: 'Webhook removed, bot running in polling mode. Send /start to the bot.',
          note: 'For webhook mode, provide base_url in the request body when deployed.',
        });
      }
    }

    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;

    // 1. Set webhook
    const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true&allowed_updates=["message"]`;
    const webhookRes = await fetch(setWebhookUrl);
    const webhookData = await webhookRes.json();

    if (!webhookData.ok) {
      return NextResponse.json(
        { error: 'Failed to set webhook', details: webhookData.description },
        { status: 502 }
      );
    }

    // 2. Set bot commands menu
    const commandsUrl = `https://api.telegram.org/bot${token}/setMyCommands`;
    const commandsRes = await fetch(commandsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: '🤖 Pornește botul și arată meniul' },
          { command: 'api', description: '🔑 Setează cheia GLM API' },
          { command: 'status', description: '📊 Status configurare' },
          { command: 'analyze', description: '🔍 Analizează fișierele' },
          { command: 'code', description: '💻 Generează cod' },
          { command: 'opencode', description: '🔧 OpenCode AI agent' },
          { command: 'hermes', description: '🤖 Hermes Agent (self-improving)' },
          { command: 'files', description: '📂 Listează fișierele' },
          { command: 'clear', description: '🧹 Resetează sesiunea' },
          { command: 'models', description: '🧠 Toate modelele' },
          { command: 'model', description: '🔄 Schimbă modelul' },
          { command: 'endpoint', description: '🌐 Schimbă endpoint' },
          { command: 'setrepo', description: '📦 Setează repo GitHub' },
          { command: 'deploy', description: '🚀 Push pe GitHub' },
          { command: 'expo', description: '📱 Generează proiect Expo' },
          { command: 'p1', description: '🔄 Problemă P1 - FizzBuzz' },
          { command: 'p6', description: '🔄 Problemă P6 - Two Sum' },
          { command: 'p12', description: '🔄 Problemă P12 - Most Water' },
          { command: 'train_prompt', description: '🧬 Antrenare neural agentică' },
        ],
      }),
    });
    const commandsData = await commandsRes.json();

    // 3. Set bot description
    const descUrl = `https://api.telegram.org/bot${token}/setMyShortDescription`;
    await fetch(descUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🤖 Hermes Bot v4.0 - AI Coding Agent cu Queen + OpenCode + Hermes Agent. /start',
      }),
    });

    return NextResponse.json({
      success: true,
      mode: 'webhook',
      webhook_url: webhookUrl,
      webhook_set: webhookData.ok,
      commands_set: commandsData.ok,
      message: `Bot activated! Webhook set to ${webhookUrl}. Send /start to your bot on Telegram.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Check current webhook status
export async function GET() {
  try {
    const config = loadConfig();
    if (!config.telegram_token) {
      return NextResponse.json({ configured: false, message: 'No Telegram token set' });
    }

    const url = `https://api.telegram.org/bot${config.telegram_token}/getWebhookInfo`;
    const res = await fetch(url);
    const data = await res.json();

    return NextResponse.json({
      configured: true,
      webhook: data.result,
      token_set: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
