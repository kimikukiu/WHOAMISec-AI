     1|#!/usr/bin/env node
     2|/**
     3| * STANDALONE DEPLOYMENT BOT - Telegram Integration
     4| * Can be added to ANY project
     5| * Developed from original Railway script
     6| */
     7|
     8|const TelegramBot = require('node-telegram-bot-api');
     9|const { exec } = require('child_process');
    10|const { promisify } = require('util');
    11|const path = require('path');
    12|const os = require('os');
    13|
    14|const execAsync = promisify(exec);
    15|
    16|// CONFIG - Replace with your tokens (or use env vars)
    17|const BOT_TOKEN=proces...OKEN || '[REDACTED]';
    18|const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7966587808';
    19|
    20|// Projects configuration
    21|const PROJECTS = [
    22|  'AGL.ai',
    23|  'whm-un1c',
    24|  'Nexu5',
    25|  'whm-pv',
    26|  'full-whm-exp',
    27|  'productivity-pro-mobile',
    28|  'WHOAMISec-AI'
    29|];
    30|
    31|const BASE_DIR = path.join(os.homedir(), 'hermes-ai-projects');
    32|
    33|class DeploymentBot {
    34|  constructor() {
    35|    this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
    36|    this.setupCommands();
    37|    console.log('🤖 Deployment Bot started!');
    38|  }
    39|
    40|  setupCommands() {
    41|    // Start command
    42|    this.bot.onText(/\/start/, (msg) => {
    43|      if (!this.isAdmin(msg)) return;
    44|      
    45|      const message = `
    46|🤖 *Deployment Bot - Standalone Edition*
    47|
    48|Developed from original Railway script
    49|Now with multi-platform support!
    50|
    51|*Available Commands:*
    52|/deploy <project> [platform] - Deploy single project
    53|/deploy_all [platform] - Deploy all projects
    54|/deploy_status - Check deployment status
    55|/projects - List all projects
    56|/help - Show this help
    57|
    58|*Platforms:* github (default), surge, railway, all
    59|
    60|*Examples:*
    61|\`/deploy AGL.ai surge\`
    62|\`/deploy_all github\`
    63|      `;
    64|      
    65|      this.sendMessage(message);
    66|    });
    67|
    68|    // Help command
    69|    this.bot.onText(/\/help$/, (msg) => {
    70|      if (!this.isAdmin(msg)) return;
    71|      this.bot.emit('message', Object.assign({}, msg, { text: '/start' }));
    72|    });
    73|
    74|    // List projects
    75|    this.bot.onText(/\/projects$/, (msg) => {
    76|      if (!this.isAdmin(msg)) return;
    77|      
    78|      let message = '📦 *Available Projects*\n\n';
    79|      PROJECTS.forEach((proj, i) => {
    80|        message += `${i + 1}. ${proj}\n`;
    81|      });
    82|      
    83|      this.sendMessage(message);
    84|    });
    85|
    86|    // Deploy single project
    87|    this.bot.onText(/\/deploy (.+)/, async (msg, match) => {
    88|      if (!this.isAdmin(msg)) return;
    89|      
    90|      const input = match[1];
    91|      const parts = input.split(' ');
    92|      const projectName = parts[0];
    93|      const platform = parts[1] || 'github';
    94|      
    95|      if (!PROJECTS.includes(projectName)) {
    96|        this.sendMessage(`❌ Project not found!\n\nUse /projects to see available projects.`);
    97|        return;
    98|      }
    99|      
   100|      this.sendMessage(`🚀 Deploying *${projectName}* to *${platform}*...`);
   101|      
   102|      try {
   103|        const result = await this.deployProject(projectName, platform);
   104|        
   105|        if (result.success) {
   106|          this.sendMessage(`✅ *${projectName}* deployed successfully!\n${result.url ? `🔗 ${result.url}` : ''}`, { parse_mode: 'Markdown' });
   107|        } else {
   108|          this.sendMessage(`❌ *${projectName}* deployment failed!\n\`\`\`${result.error?.substring(0, 500)}\`\`\``, { parse_mode: 'Markdown' });
   109|        }
   110|      } catch (error) {
   111|        this.sendMessage(`❌ Deployment error: ${error.message}`);
   112|      }
   113|    });
   114|
   115|    // Deploy ALL projects
   116|    this.bot.onText(/\/deploy_all(?: (.+))?/, async (msg, match) => {
   117|      if (!this.isAdmin(msg)) return;
   118|      
   119|      const platform = match?.[1] || 'github';
   120|      
   121|      this.sendMessage(`🚀 Deploying ALL projects to *${platform}*...\nThis will take several minutes.`, { parse_mode: 'Markdown' });
   122|      
   123|      try {
   124|        const results = await this.deployAll(platform);
   125|        const successCount = results.filter(r => r.success).length;
   126|        const failCount = results.filter(r => !r.success).length;
   127|        
   128|        let summary = `🎉 *Deployment Complete*\n\n`;
   129|        summary += `✅ Success: ${successCount}\n`;
   130|        summary += `❌ Failed: ${failCount}\n\n`;
   131|        
   132|        results.forEach(r => {
   133|          if (r.success) {
   134|            summary += `✅ ${r.project} → ${r.url || 'Deployed'}\n`;
   135|          } else {
   136|            summary += `❌ ${r.project} → Failed\n`;
   137|          }
   138|        });
   139|        
   140|        this.sendMessage(summary, { parse_mode: 'Markdown' });
   141|      } catch (error) {
   142|        this.sendMessage(`❌ Bulk deployment error: ${error.message}`);
   143|      }
   144|    });
   145|
   146|    // Deployment status
   147|    this.bot.onText(/\/deploy_status$/, async (msg) => {
   148|      if (!this.isAdmin(msg)) return;
   149|      
   150|      let status = '📊 *Deployment Status*\n\n';
   151|      
   152|      for (const project of PROJECTS) {
   153|        const projectDir = path.join(BASE_DIR, project);
   154|        const scriptPath = path.join(projectDir, 'deploy-ultimate.sh');
   155|        
   156|        // Check if script exists
   157|        const hasScript = require('fs').existsSync(scriptPath);
   158|        
   159|        status += `${hasScript ? '✅' : '❌'} *${project}*\n`;
   160|        status += `   Script: ${hasScript ? 'Present' : 'Missing'}\n`;
   161|        
   162|        // GitHub Pages URL
   163|        const ghUrl = `https://kimikukiu.github.io/${project.replace(/\./g, '-').toLowerCase()}/`;
   164|        status += `   GitHub Pages: ${ghUrl}\n\n`;
   165|      }
   166|      
   167|      this.sendMessage(status, { parse_mode: 'Markdown' });
   168|    });
   169|
   170|    // Error handler
   171|    this.bot.on('polling_error', (error) => {
   172|      console.error('Polling error:', error);
   173|    });
   174|  }
   175|
   176|  async deployProject(projectName, platform = 'github') {
   177|    const projectDir = path.join(BASE_DIR, projectName);
   178|    const scriptPath = path.join(projectDir, 'deploy-ultimate.sh');
   179|    
   180|    let command;
   181|    switch (platform) {
   182|      case 'surge':
   183|        command = `cd "${projectDir}" && bash deploy-ultimate.sh --surge`;
   184|        break;
   185|      case 'railway':
   186|        command = `cd "${projectDir}" && railway up --detach`;
   187|        break;
   188|      default:
   189|        command = `cd "${projectDir}" && bash deploy-ultimate.sh --github`;
   190|    }
   191|    
   192|    try {
   193|      const { stdout, stderr } = await execAsync(command, {
   194|        timeout: 300000, // 5 minutes
   195|        env: {
   196|          ...process.env,
   197|          SURGE_TOKEN: process.env.SURGE_TOKEN || '',
   198|          GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
   199|        }
   200|      });
   201|      
   202|      const output = stdout + (stderr ? '\n' + stderr : '');
   203|      
   204|      // Extract URL
   205|      let url;
   206|      const urlMatch = output.match(/(https?:\/\/[^\s]+)/);
   207|      if (urlMatch) {
   208|        url = urlMatch[1];
   209|      }
   210|      
   211|      return {
   212|        success: true,
   213|        project: projectName,
   214|        platform,
   215|        url,
   216|        output
   217|      };
   218|    } catch (error) {
   219|      return {
   220|        success: false,
   221|        project: projectName,
   222|        platform,
   223|        error: error.message,
   224|        output: error.message
   225|      };
   226|    }
   227|  }
   228|
   229|  async deployAll(platform = 'github') {
   230|    const results = [];
   231|    
   232|    for (const project of PROJECTS) {
   233|      const result = await this.deployProject(project, platform);
   234|      results.push(result);
   235|      
   236|      // Small delay
   237|      await new Promise(resolve => setTimeout(resolve, 2000));
   238|    }
   239|    
   240|    return results;
   241|  }
   242|
   243|  isAdmin(msg) {
   244|    if (msg.chat.id.toString() !== ADMIN_CHAT_ID) {
   245|      this.bot.sendMessage(msg.chat.id, '❌ Unauthorized!');
   246|      return false;
   247|    }
   248|    return true;
   249|  }
   250|
   251|  sendMessage(text, options = {}) {
   252|    return this.bot.sendMessage(ADMIN_CHAT_ID, text, {
   253|      parse_mode: 'Markdown',
   254|      ...options
   255|    });
   256|  }
   257|}
   258|
   259|// Start the bot
   260|if (require.main === module) {
   261|  if (BOT_TOKEN=*** '[REDACTED]') {
   262|    console.error('❌ Please set TELEGRAM_BOT_TOKEN environment variable!');
   263|    process.exit(1);
   264|  }
   265|  
   266|  new DeploymentBot();
   267|}
   268|
   269|module.exports = { DeploymentBot };
   270|