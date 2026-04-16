import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

const ALL_COMMANDS = [
  { command: 'start', description: '🤖 Meniu complet + comenzi' },
  { command: 'api', description: '🔗 Status API z.ai (auto)' },
  { command: 'status', description: '📊 Status complet bot' },
  { command: 'models', description: '🧠 Toate cele 19 modele' },
  { command: 'model', description: '🔄 Schimbă modelul AI' },
  { command: 'endpoint', description: '🌐 Schimbă endpoint API' },
  { command: 'analyze', description: '🔍 Analizează fișierele' },
  { command: 'code', description: '💻 Generează cod' },
  { command: 'opencode', description: '🔧 OpenCode AI agent' },
  { command: 'hermes', description: '🤖 Hermes Agent (self-improving)' },
  { command: 'files', description: '📂 Listează fișierele' },
  { command: 'setrepo', description: '📦 Setează repo GitHub' },
  { command: 'deploy', description: '🚀 Push pe GitHub' },
  { command: 'expo', description: '📱 Generează proiect Expo' },
  { command: 'languages', description: '🌍 13 limbi Loop Coder' },
  { command: 'patterns', description: '⚡ 6 tipuri de loop patterns' },
  { command: 'spark', description: '🎯 Spark prompts per limbă' },
  { command: 'tiers', description: '🏆 5 nivele Hermes tiers' },
  { command: 'curriculum', description: '📚 Curriculum complet 20 prompts' },
  { command: 'performance', description: '⚙️ Referință viteză loops' },
  { command: 'best_practices', description: '🎯 Bune practici curriculum' },
  { command: 'train', description: '🧬 Antrenare cu tier specific' },
  { command: 'train_prompt', description: '🧬 Antrenare neural agentică' },
  { command: 'redteam', description: '🔴 RED TEAM safety testing' },
  { command: 'loop', description: '🔄 Exercițiu loop per limbă' },
  { command: 'clear', description: '🧹 Resetează sesiunea' },
];

export async function POST(request: NextRequest) {
  try {
    const config = loadConfig();
    const token = config.telegram_token;

    if (!token) {
      return NextResponse.json(
        { error: 'Telegram token not configured.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const baseUrl = body.base_url || process.env.NEXT_PUBLIC_BASE_URL || '';

    if (!baseUrl) {
      // Polling mode - delete webhook, set commands
      const deleteUrl = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
      await fetch(deleteUrl);

      const commandsUrl = `https://api.telegram.org/bot${token}/setMyCommands`;
      const commandsRes = await fetch(commandsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: ALL_COMMANDS }),
      });

      return NextResponse.json({
        success: true,
        mode: 'polling',
        commands_set: (await commandsRes.json()).ok,
        message: `Bot setup complete! ${ALL_COMMANDS.length} commands registered. Polling mode active.`,
      });
    }

    // Webhook mode
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
    const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true&allowed_updates=["message","callback_query"]`;
    const webhookRes = await fetch(setWebhookUrl);
    const webhookData = await webhookRes.json();

    if (!webhookData.ok) {
      return NextResponse.json({ error: 'Failed to set webhook', details: webhookData.description }, { status: 502 });
    }

    const commandsUrl = `https://api.telegram.org/bot${token}/setMyCommands`;
    const commandsRes = await fetch(commandsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: ALL_COMMANDS }),
    });

    const descUrl = `https://api.telegram.org/bot${token}/setMyShortDescription`;
    await fetch(descUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🤖 Hermes Bot v4.0 - AI Coding Agent cu 19 modele, Loop Coder 13 limbi, RED TEAM testing. /start',
      }),
    });

    return NextResponse.json({
      success: true,
      mode: 'webhook',
      webhook_url: webhookUrl,
      commands_count: ALL_COMMANDS.length,
      message: `Bot activated! ${ALL_COMMANDS.length} commands. Webhook: ${webhookUrl}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = loadConfig();
    if (!config.telegram_token) {
      return NextResponse.json({ configured: false, message: 'No Telegram token set' });
    }
    const url = `https://api.telegram.org/bot${config.telegram_token}/getWebhookInfo`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json({ configured: true, webhook: data.result, commands_count: ALL_COMMANDS.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
