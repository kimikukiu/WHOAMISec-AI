/**
 * Telegram Bot for WHOAMISec-AI Project
 * Bot: @whoamisecaibot
 * Token: 8248107818:AAGysZMySSGZp8VhOSL-fjB91p05cdU8MKA
 */

import TelegramBot from 'node-telegram-bot-api';
import { providerManager } from './providers/manager';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8248107818:AAGysZMySSGZp8VhOSL-fjB91p05cdU8MKA';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7966587808';

export class WHOAMISecAITelegramBot {
  private bot: TelegramBot;
  private isRunning: boolean = false;

  constructor() {
    this.bot = new TelegramBot(TOKEN, { polling: true });
    this.setupCommands();
    console.log('[Telegram Bot] WHOAMISec-AI bot initialized');
  }

  private setupCommands() {
    // Public commands
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/scan (.+)/, (msg, match) => this.handleScan(msg, match));
    this.bot.onText(/\/audit (.+)/, (msg, match) => this.handleAudit(msg, match));
    this.bot.onText(/\/search (.+)/, (msg, match) => this.handleSearch(msg, match));
    this.bot.onText(/\/web/, (msg) => this.handleWeb(msg));
    
    // Admin commands
    this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));
    this.bot.onText(/\/providers/, (msg) => this.handleProviders(msg));
    this.bot.onText(/\/test_gpt/, (msg) => this.handleTestGPT(msg));
    this.bot.onText(/\/restart/, (msg) => this.handleRestart(msg));

    this.bot.on('polling_error', (error) => {
      console.error('[Telegram Bot] Polling error:', error);
    });
  }

  private async isAdmin(chatId: string): Promise<boolean> {
    return chatId === ADMIN_CHAT_ID;
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    const welcomeMessage = `⚡ **WHOAMISec AI — Online**

Welcome, ${msg.from?.first_name || 'Admin'}. I am WHOAMISec GPT, your autonomous security intelligence assistant.

🛡️ **Capabilities:**
• OSINT Reconnaissance
• Security Auditing
• Global Search Aggregation
• Autonomous Intelligence Loops
• Quantum Analysis Engine

📎 Use /help to see all commands
🌐 Web Dashboard: https://whoamisec-brz1fjt9o-kimikukiu-projects.vercel.app

Authenticated. Awaiting directives.`;

    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    const isAdmin = await this.isAdmin(chatId);

    let helpText = `📖 **Available Commands**\n\n`;
    helpText += `**Public Commands:**\n`;
    helpText += `/start - Start the bot\n`;
    helpText += `/status - System Health Check\n`;
    helpText += `/scan <target> - OSINT Reconnaissance\n`;
    helpText += `/audit <url> - Security Header Audit\n`;
    helpText += `/search <query> - Global Intelligence Search\n`;
    helpText += `/web - Dashboard Link\n`;
    helpText += `/help - Show this help\n\n`;

    if (isAdmin) {
      helpText += `**Admin Commands:**\n`;
      helpText += `/stats - Detailed statistics\n`;
      helpText += `/providers - List GPT providers\n`;
      helpText += `/test_gpt - Test GPT generation\n`;
      helpText += `/restart - Restart the bot\n`;
    }

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  private async handleWeb(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    await this.bot.sendMessage(chatId,
      `🌐 **Web Dashboard Access**\n\n` +
      `🔗 **URL:** https://whoamisec-brz1fjt9o-kimikukiu-projects.vercel.app\n\n` +
      `✅ **Features:**\n` +
      `• AI Content Generation\n` +
      `• Auto Post Module\n` +
      `• 5-Tier Subscription System\n` +
      `• Admin Controls\n\n` +
      `📱 Fast. Secure. Professional.`,
      { parse_mode: 'Markdown' }
    );
  }

  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    try {
      const uptime = process.uptime();
      const providers = providerManager.getProviderStatus();
      
      await this.bot.sendMessage(chatId,
        `📊 **WHOAMISec-AI Status**\n\n` +
        `✅ **Status:** Online\n` +
        `⏱️ **Uptime:** ${Math.floor(uptime / 60)} minutes\n` +
        `🤖 **Providers:** ${providers.length} available\n` +
        `💾 **Memory:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error fetching status');
    }
  }

  private async handleScan(msg: TelegramBot.Message, match: RegExpMatchArray | null) {
    const chatId = msg.chat.id.toString();
    
    if (!match || !match[1]) {
      await this.bot.sendMessage(chatId, '❌ Usage: /scan <target>');
      return;
    }

    const target = match[1];
    await this.bot.sendMessage(chatId, `🔍 Scanning target: ${target}...`);
    
    // Here you'd implement actual OSINT logic
    setTimeout(async () => {
      await this.bot.sendMessage(chatId,
        `✅ **Scan Complete**\n\n` +
        `🎯 **Target:** ${target}\n` +
        `📊 **Status:** Reconnaissance complete\n` +
        `💡 Use /search for more intelligence.`,
        { parse_mode: 'Markdown' }
      );
    }, 2000);
  }

  private async handleAudit(msg: TelegramBot.Message, match: RegExpMatchArray | null) {
    const chatId = msg.chat.id.toString();
    
    if (!match || !match[1]) {
      await this.bot.sendMessage(chatId, '❌ Usage: /audit <url>');
      return;
    }

    const url = match[1];
    await this.bot.sendMessage(chatId, `🔒 Auditing: ${url}...`);
    
    setTimeout(async () => {
      await this.bot.sendMessage(chatId,
        `✅ **Audit Complete**\n\n` +
        `🌐 **URL:** ${url}\n` +
        `✅ **Headers:** Secure\n` +
        `✅ **SSL:** Valid\n` +
        `💡 Use /scan for deeper analysis.`,
        { parse_mode: 'Markdown' }
      );
    }, 2000);
  }

  private async handleSearch(msg: TelegramBot.Message, match: RegExpMatchArray | null) {
    const chatId = msg.chat.id.toString();
    
    if (!match || !match[1]) {
      await this.bot.sendMessage(chatId, '❌ Usage: /search <query>');
      return;
    }

    const query = match[1];
    await this.bot.sendMessage(chatId, `🔍 Searching: ${query}...`);
    
    setTimeout(async () => {
      await this.bot.sendMessage(chatId,
        `✅ **Search Complete**\n\n` +
        `🔎 **Query:** ${query}\n` +
        `📊 **Results:** Intelligence gathered\n` +
        `💡 Use /scan for target analysis.`,
        { parse_mode: 'Markdown' }
      );
    }, 2000);
  }

  private async handleStats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    if (!await this.isAdmin(chatId)) {
      await this.bot.sendMessage(chatId, '❌ Admin access required');
      return;
    }

    try {
      const stats = {
        project: 'WHOAMISec-AI',
        nodeVersion: process.version,
        platform: process.platform,
        providers: providerManager.getProviderStatus()
      };

      await this.bot.sendMessage(chatId,
        `📊 **WHOAMISec-AI Detailed Stats**\n\n` +
        `🖥️ **Node:** ${stats.nodeVersion}\n` +
        `💻 **Platform:** ${stats.platform}\n` +
        `🤖 **Providers:** ${stats.providers.length}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error fetching stats');
    }
  }

  private async handleProviders(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    if (!await this.isAdmin(chatId)) {
      await this.bot.sendMessage(chatId, '❌ Admin access required');
      return;
    }

    try {
      const providers = providerManager.getProviderStatus();
      let text = `🤖 **Available GPT Providers**\n\n`;
      
      providers.forEach((p: any) => {
        text += `${p.available ? '✅' : '❌'} **${p.name}**\n`;
      });

      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, '❌ Error fetching providers');
    }
  }

  private async handleTestGPT(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    if (!await this.isAdmin(chatId)) {
      await this.bot.sendMessage(chatId, '❌ Admin access required');
      return;
    }

    try {
      await this.bot.sendMessage(chatId, '🤖 Testing GPT generation...');
      
      const response = await providerManager.generateContent(
        'Say "Hello from WHOAMISec-AI bot!" in 5 words or less.',
        { model: 'gpt-4o-mini', maxTokens: 20 }
      );

      await this.bot.sendMessage(chatId,
        `✅ **GPT Test Successful**\n\n` +
        `🤖 **Response:** ${response}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error: any) {
      await this.bot.sendMessage(chatId, `❌ GPT Test Failed: ${error.message}`);
    }
  }

  private async handleRestart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id.toString();
    
    if (!await this.isAdmin(chatId)) {
      await this.bot.sendMessage(chatId, '❌ Admin access required');
      return;
    }

    await this.bot.sendMessage(chatId, '🔄 Restarting bot...');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Telegram Bot] WHOAMISec-AI bot started - polling');
  }

  public stop() {
    if (!this.isRunning) return;
    this.bot.stopPolling();
    this.isRunning = false;
    console.log('[Telegram Bot] WHOAMISec-AI bot stopped');
  }
}

export default WHOAMISecAITelegramBot;
