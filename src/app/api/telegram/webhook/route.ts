import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const SESSIONS_DIR = join(process.cwd(), 'data', 'sessions');
const DATA_DIR = join(process.cwd(), 'data');
const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
const GENERATED_DIR = join(process.cwd(), 'generated_code');

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function getSessionPath(chatId: number) {
  ensureDir(SESSIONS_DIR);
  return join(SESSIONS_DIR, `${chatId}.json`);
}

function loadSession(chatId: number) {
  const path = getSessionPath(chatId);
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {}
  return { history: [], loop_level: 0, train_prompts: 0 };
}

function saveSession(chatId: number, session: any) {
  writeFileSync(getSessionPath(chatId), JSON.stringify(session, null, 2), 'utf-8');
}

function deleteSession(chatId: number) {
  const path = getSessionPath(chatId);
  try { if (existsSync(path)) { /* deleteSync not available, use writeFileSync */ writeFileSync(path, JSON.stringify({ history: [], loop_level: 0, train_prompts: 0 })); } } catch {}
}

async function sendTelegramMessage(token: string, chatId: number, text: string, parseMode: string = 'HTML') {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });
  return res.json();
}

async function sendTelegramMenu(token: string, chatId: number) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🤖 <b>Hermes Bot este pregătit.</b>\n\nComenzi principale:\n/api CHEIE - setează cheia GLM\n/status - status config\n/analyze [cerință] - analizează fișierele uploadate\n/code cerință - generează cod\n/files - listează fișierele\n/clear - resetează sesiunea\n/model - schimbă modelul GLM\n/endpoint - schimbă endpoint-ul GLM\n/setrepo URL - setează repo GitHub\n/deploy - push pe GitHub\n/expo - generează proiect Expo control panel\n/p1 ... /p12 - probleme loop\n/train_prompt - antrenare neural agentic autonomă\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține GLM API Key</a>',
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: {
        keyboard: [
          ['/status', '/files'],
          ['/code', '/analyze'],
          ['/model', '/endpoint'],
          ['/deploy', '/expo'],
          ['/p1', '/p6', '/p12'],
          ['/train_prompt', '/clear'],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }),
  });
}

async function callGLM(config: any, messages: { role: string; content: string }[]) {
  const endpoint = config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
  const model = config.glm_model || 'glm-4.6';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.glm_api_key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Eroare: niciun răspuns de la GLM.';
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════
// LOOP PROBLEMS DATA
// ═══════════════════════════════════════════════

const LOOP_PROBLEMS: Record<number, { title: string; description: string; difficulty: string; template: string; hint: string }> = {
  1: { title: 'FizzBuzz', description: 'Print numbers from 1 to 100. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for both print "FizzBuzz".', difficulty: 'beginner', template: 'for (let i = 1; i <= 100; i++) {\n  // Your code here\n}', hint: 'Use modulo operator (%)' },
  2: { title: 'Sum of First N Natural Numbers', description: 'Calculate the sum of all natural numbers from 1 to N.', difficulty: 'beginner', template: 'function sumToN(n) {\n  let sum = 0;\n  // ...\n  return sum;\n}', hint: 'Use a loop' },
  3: { title: 'Reverse a String', description: 'Reverse the given string without using built-in reverse methods.', difficulty: 'beginner', template: 'function reverseString(str) {\n  let reversed = "";\n  // ...\n  return reversed;\n}', hint: 'Iterate from the end' },
  4: { title: 'Palindrome Checker', description: 'Check if a string is a palindrome.', difficulty: 'beginner', template: 'function isPalindrome(str) {\n  // Return true or false\n}', hint: 'Compare from both ends' },
  5: { title: 'Fibonacci Sequence', description: 'Generate the first N numbers of the Fibonacci sequence.', difficulty: 'intermediate', template: 'function fibonacci(n) {\n  const seq = [0, 1];\n  // ...\n  return seq;\n}', hint: 'Each number = sum of two preceding' },
  6: { title: 'Two Sum', description: 'Given an array and target, find two numbers that add up to target.', difficulty: 'intermediate', template: 'function twoSum(nums, target) {\n  // Return indices\n}', hint: 'Use a hash map' },
  7: { title: 'Matrix Spiral Traversal', description: 'Traverse a 2D matrix in spiral order (clockwise).', difficulty: 'advanced', template: 'function spiralOrder(matrix) {\n  const result = [];\n  // ...\n  return result;\n}', hint: 'Track boundaries' },
  8: { title: 'Find All Duplicates in Array', description: 'Find all elements that appear twice. O(n) time, O(1) space.', difficulty: 'intermediate', template: 'function findDuplicates(nums) {\n  // ...\n}', hint: 'Use sign as marker' },
  9: { title: 'Count Prime Numbers', description: 'Count primes less than N using Sieve of Eratosthenes.', difficulty: 'intermediate', template: 'function countPrimes(n) {\n  // Use Sieve\n}', hint: 'Boolean array approach' },
  10: { title: 'Longest Increasing Subsequence', description: 'Find length of longest strictly increasing subsequence.', difficulty: 'advanced', template: 'function lengthOfLIS(nums) {\n  // Return length\n}', hint: 'Dynamic programming' },
  11: { title: 'Rotate Image (Matrix)', description: 'Rotate N×N matrix by 90 degrees clockwise in-place.', difficulty: 'advanced', template: 'function rotate(matrix) {\n  // Modify in-place\n}', hint: 'Transpose + reverse rows' },
  12: { title: 'Container With Most Water', description: 'Find two lines that form a container holding most water.', difficulty: 'intermediate', template: 'function maxArea(height) {\n  let maxWater = 0;\n  // ...\n  return maxWater;\n}', hint: 'Two pointers from ends' },
};

// ═══════════════════════════════════════════════
// WEBHOOK POST - Handle Telegram Updates
// ═══════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update.message || update.callback_query?.message;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || message.caption || '';
    const from = message.from || {};
    const userName = from.first_name || from.username || 'User';
    
    if (!text.startsWith('/')) {
      // Non-command message - use GLM for conversation
      const config = loadConfig();
      if (config.glm_api_key) {
        const session = loadSession(chatId);
        session.history.push({ role: 'user', content: text });
        // Keep last 20 messages
        if (session.history.length > 20) session.history = session.history.slice(-20);
        saveSession(chatId, session);

        const systemMsg = {
          role: 'system',
          content: `Ești HERMES BOT v4.0, un asistent avansat de coding. Ești inteligent, rapid și precis. Răspunde în română sau engleză în funcție de limba utilizatorului. Ești expert în: programare, AI, securitate, DevOps, deployment. Current model: ${config.glm_model || 'glm-4.6'}`,
        };
        const msgs = [systemMsg, ...session.history];
        
        try {
          const reply = await callGLM(config, msgs);
          session.history.push({ role: 'assistant', content: reply });
          if (session.history.length > 20) session.history = session.history.slice(-20);
          saveSession(chatId, session);

          // Truncate if too long for Telegram (4096 char limit)
          if (reply.length > 4000) {
            const chunks = reply.match(/[\s\S]{1,4000}/g) || [];
            for (const chunk of chunks) {
              await sendTelegramMessage(config.telegram_token, chatId, chunk, 'HTML');
            }
          } else {
            await sendTelegramMessage(config.telegram_token, chatId, reply, 'HTML');
          }
        } catch (e: any) {
          await sendTelegramMessage(config.telegram_token, chatId, `❌ Eroare GLM: ${e.message}`, 'HTML');
        }
      } else {
        await sendTelegramMessage(config.telegram_token, chatId, 
          '🤖 Hermes Bot este activ dar nu are cheie GLM setată.\n\nFolosește <b>/api CHEIE</b> pentru a seta cheia GLM.\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține GLM API Key de aici</a>',
          'HTML'
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Parse command
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    const config = loadConfig();

    if (!config.telegram_token) {
      return NextResponse.json({ ok: true });
    }

    const token = config.telegram_token;

    // ═══════════════════════════════════════════
    // COMMAND HANDLERS
    // ═══════════════════════════════════════════

    switch (cmd) {
      case '/start': {
        await sendTelegramMenu(token, chatId);
        const session = loadSession(chatId);
        session.history = [];
        saveSession(chatId, session);
        break;
      }

      case '/help': {
        await sendTelegramMenu(token, chatId);
        break;
      }

      case '/api': {
        if (!args) {
          await sendTelegramMessage(token, chatId,
            '📝 Folosire: <b>/api CHEIE_GLM</b>\n\nExemplu:\n<code>/api 1854dc5772b947b590674cea8879e6aa</code>\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține cheie de aici</a>',
            'HTML'
          );
        } else {
          config.glm_api_key = args.trim();
          saveConfig(config);
          await sendTelegramMessage(token, chatId,
            `✅ <b>Cheie GLM actualizată!</b>\n\nModel: <code>${config.glm_model || 'glm-4.6'}</code>\nEndpoint: <code>${(config.glm_endpoint || '').substring(0, 50)}...</code>\n\nBot-ul este gata de utilizare!`,
            'HTML'
          );
        }
        break;
      }

      case '/status': {
        const statusItems = [
          `🤖 <b>Hermes Bot v4.0 - Status</b>\n`,
          `🔑 GLM API: ${config.glm_api_key ? '✅ Configurat' : '❌ Nu e setat'}`,
          `🧠 Model: <code>${config.glm_model || 'glm-4.6'}</code>`,
          `🌐 Endpoint: <code>${(config.glm_endpoint || '').substring(0, 40)}...</code>`,
          `📱 Telegram: ${config.telegram_token ? '✅ Conectat' : '❌ Nu e setat'}`,
          `📦 GitHub: ${config.github_repo ? '✅ ' + config.github_repo.replace('https://github.com/', '') : '❌ Nu e setat'}`,
          `🔧 Auto-Repair: ${config.auto_repair !== 'false' ? '✅ ON' : '❌ OFF'}`,
          `👑 Expert Mode: ${config.expert_mode === 'true' ? '✅ ON' : '❌ OFF'}`,
        ];
        await sendTelegramMessage(token, chatId, statusItems.join('\n'), 'HTML');
        break;
      }

      case '/model': {
        if (!args) {
          await sendTelegramMessage(token, chatId,
            `📝 Model curent: <b>${config.glm_model || 'glm-4.6'}</b>\n\nModelli disponibile:\n<code>glm-4-flash</code> - Rapid, gratuit\n<code>glm-4-plus</code> - Performanță\n<code>glm-4.6</code> - Standard\n<code>glm-5-turbo</code> - Avansat\n\nFolosire: <b>/model glm-4-flash</b>`,
            'HTML'
          );
        } else {
          config.glm_model = args.trim();
          saveConfig(config);
          await sendTelegramMessage(token, chatId,
            `✅ Model schimbat în: <b>${config.glm_model}</b>`,
            'HTML'
          );
        }
        break;
      }

      case '/endpoint': {
        if (!args) {
          await sendTelegramMessage(token, chatId,
            `📝 Endpoint curent:\n<code>${config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions'}</code>\n\nFolosire: <b>/endpoint URL</b>`,
            'HTML'
          );
        } else {
          config.glm_endpoint = args.trim();
          saveConfig(config);
          await sendTelegramMessage(token, chatId,
            `✅ Endpoint schimbat în:\n<code>${config.glm_endpoint}</code>`,
            'HTML'
          );
        }
        break;
      }

      case '/setrepo': {
        if (!args) {
          await sendTelegramMessage(token, chatId,
            `📝 Repo curent: <code>${config.github_repo || 'Nu e setat'}</code>\n\nFolosire: <b>/setrepo https://github.com/user/repo</b>`,
            'HTML'
          );
        } else {
          config.github_repo = args.trim();
          saveConfig(config);
          await sendTelegramMessage(token, chatId,
            `✅ GitHub repo setat:\n<code>${config.github_repo}</code>`,
            'HTML'
          );
        }
        break;
      }

      case '/analyze': {
        if (!config.glm_api_key) {
          await sendTelegramMessage(token, chatId,
            '❌ Cheie GLM nu e setată. Folosește <b>/api CHEIE</b> pentru a seta.',
            'HTML'
          );
          break;
        }
        if (!args) {
          await sendTelegramMessage(token, chatId,
            '📝 Folosire: <b>/analyze [cerință]</b>\n\nExemplu: <code>/analyze Analizează securitatea codului</code>',
            'HTML'
          );
          break;
        }
        // Check for files
        ensureDir(DOWNLOADS_DIR);
        const dlFiles = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        if (dlFiles.length === 0) {
          await sendTelegramMessage(token, chatId,
            '📂 Nu există fișiere de analizat.\n\nÎncarcă fișiere prin dashboard sau bot și apoi folosește /analyze.',
            'HTML'
          );
          break;
        }
        const fileList = dlFiles.map(f => {
          try {
            const stat = statSync(join(DOWNLOADS_DIR, f));
            return `${f} (${(stat.size / 1024).toFixed(1)} KB)`;
          } catch { return f; }
        }).join('\n• ');

        await sendTelegramMessage(token, chatId,
          `🔍 Analizez ${dlFiles.length} fișiere...\n\n<b>Cerință:</b> ${escapeHtml(args)}\n\n<b>Fișiere:</b>\n• ${fileList}\n\n⏳ Procesez cu GLM...`,
          'HTML'
        );

        // Read file contents (limit size)
        let filesContent = '';
        for (const f of dlFiles.slice(0, 5)) {
          try {
            const content = readFileSync(join(DOWNLOADS_DIR, f), 'utf-8');
            if (content.length > 3000) {
              filesContent += `\n--- ${f} (primele 3000 char) ---\n${content.substring(0, 3000)}\n`;
            } else {
              filesContent += `\n--- ${f} ---\n${content}\n`;
            }
          } catch {
            filesContent += `\n--- ${f} --- (nu s-a putut citi)\n`;
          }
        }

        const reply = await callGLM(config, [
          { role: 'system', content: 'Ești un expert în analiză de cod. Analizează fișierele și răspunde la cerință. Răspunde în română.' },
          { role: 'user', content: `Cerință: ${args}\n\nFișiere:\n${filesContent}` },
        ]);

        if (reply.length > 4000) {
          const chunks = reply.match(/[\s\S]{1,4000}/g) || [];
          for (const chunk of chunks) {
            await sendTelegramMessage(token, chatId, chunk, 'HTML');
          }
        } else {
          await sendTelegramMessage(token, chatId, reply, 'HTML');
        }
        break;
      }

      case '/code': {
        if (!config.glm_api_key) {
          await sendTelegramMessage(token, chatId,
            '❌ Cheie GLM nu e setată. Folosește <b>/api CHEIE</b>.',
            'HTML'
          );
          break;
        }
        if (!args) {
          await sendTelegramMessage(token, chatId,
            '📝 Folosire: <b>/code cerință</b>\n\nExemplu: <code>/code Creează un API REST în Node.js cu Express</code>',
            'HTML'
          );
          break;
        }

        await sendTelegramMessage(token, chatId,
          `⚡ Generez cod pentru: <b>${escapeHtml(args)}</b>\n\n⏳ Procesez cu GLM (${config.glm_model || 'glm-4.6'})...`,
          'HTML'
        );

        const reply = await callGLM(config, [
          { role: 'system', content: `Ești HERMES BOT v4.0, expert coder. Generează cod complet, funcțional, cu comentarii. Folosește cele mai bune practice. Model: ${config.glm_model || 'glm-4.6'}. Răspunde în română pentru explicații și cod în limba cerută.` },
          { role: 'user', content: args },
        ]);

        // Save generated code
        ensureDir(GENERATED_DIR);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `code_${timestamp}.txt`;
        writeFileSync(join(GENERATED_DIR, filename), `Request: ${args}\n\n${reply}`, 'utf-8');

        if (reply.length > 4000) {
          const chunks = reply.match(/[\s\S]{1,4000}/g) || [];
          for (const chunk of chunks) {
            await sendTelegramMessage(token, chatId, chunk, 'HTML');
          }
        } else {
          await sendTelegramMessage(token, chatId, reply, 'HTML');
        }
        break;
      }

      case '/files': {
        ensureDir(DOWNLOADS_DIR);
        ensureDir(GENERATED_DIR);
        const dlFiles = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        const genFiles = readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));

        if (dlFiles.length === 0 && genFiles.length === 0) {
          await sendTelegramMessage(token, chatId,
            '📂 Nu există fișiere.\n\nÎncarcă fișiere prin dashboard web sau bot.',
            'HTML'
          );
        } else {
          let msg = '📂 <b>Fișiere</b>\n\n';
          if (dlFiles.length > 0) {
            msg += '<b>📥 Downloadate:</b>\n';
            dlFiles.forEach(f => {
              try {
                const stat = statSync(join(DOWNLOADS_DIR, f));
                msg += `• ${escapeHtml(f)} (${(stat.size / 1024).toFixed(1)} KB)\n`;
              } catch { msg += `• ${escapeHtml(f)}\n`; }
            });
          }
          if (genFiles.length > 0) {
            msg += '\n<b>💻 Generate:</b>\n';
            genFiles.slice(-10).forEach(f => {
              try {
                const stat = statSync(join(GENERATED_DIR, f));
                msg += `• ${escapeHtml(f)} (${(stat.size / 1024).toFixed(1)} KB)\n`;
              } catch { msg += `• ${escapeHtml(f)}\n`; }
            });
          }
          await sendTelegramMessage(token, chatId, msg, 'HTML');
        }
        break;
      }

      case '/clear': {
        deleteSession(chatId);
        await sendTelegramMessage(token, chatId,
          '🧹 <b>Sesiune resetată!</b>\n\nIstoria conversației a fost ștearsă.',
          'HTML'
        );
        break;
      }

      case '/deploy': {
        if (!config.github_repo) {
          await sendTelegramMessage(token, chatId,
            '❌ GitHub repo nu e setat.\n\nFolosește <b>/setrepo URL</b> pentru a seta repo-ul.',
            'HTML'
          );
          break;
        }
        await sendTelegramMessage(token, chatId,
          `🚀 <b>Deploy Info</b>\n\n<b>Repo:</b> <code>${config.github_repo}</code>\n\n<b>Opțiuni deploy:</b>\n\n1️⃣ <b>GitHub Actions</b> - Push pe main → auto deploy\n2️⃣ <b>Docker (VPS)</b> - docker compose up -d --build\n3️⃣ <b>Render.com</b> - Conectează repo-ul\n4️⃣ <b>Railway</b> - One-click deploy\n\n💡 Deschide Actions: <a href="${config.github_repo}/actions">${config.github_repo}/actions</a>`,
          'HTML'
        );
        break;
      }

      case '/expo': {
        if (!config.glm_api_key) {
          await sendTelegramMessage(token, chatId,
            '❌ Cheie GLM necesară pentru generare. Folosește <b>/api CHEIE</b>.',
            'HTML'
          );
          break;
        }

        await sendTelegramMessage(token, chatId,
          '⚡ Generez proiect Expo Control Panel...\n\n⏳ Procesez cu GLM...',
          'HTML'
        );

        const expoCode = await callGLM(config, [
          { role: 'system', content: 'Ești expert React Native / Expo. Generează un proiect Expo complet pentru un control panel de bot management. Include: navigare tab-uri, status bot, chat GLM, settings, file browser. Folosește expo-router și componente native. Răspunde DOAR cu codul complet, fără explicații suplimentare. Include package.json, app.json, și structura de fișiere.' },
          { role: 'user', content: 'Generează un proiect Expo complet pentru Hermes Bot Control Panel cu: Dashboard, Chat GLM, Settings, Files, Bot Control. Folosește expo-router v3, tamagui sau nativewind, și expo-secure-store.' },
        ]);

        ensureDir(GENERATED_DIR);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        writeFileSync(join(GENERATED_DIR, `expo_control_panel_${ts}.txt`), expoCode, 'utf-8');

        if (expoCode.length > 4000) {
          await sendTelegramMessage(token, chatId, '📦 Proiect Expo generat! (fișier prea lung pentru preview)\n\nFișier salvat în generated_code/', 'HTML');
          // Send first 4000 chars
          await sendTelegramMessage(token, chatId, expoCode.substring(0, 4000), 'HTML');
        } else {
          await sendTelegramMessage(token, chatId, `📦 <b>Proiect Expo generat!</b>\n\n${expoCode}`, 'HTML');
        }
        break;
      }

      case '/train_prompt': {
        if (!config.glm_api_key) {
          await sendTelegramMessage(token, chatId,
            '❌ Cheie GLM necesară. Folosește <b>/api CHEIE</b>.',
            'HTML'
          );
          break;
        }

        const session = loadSession(chatId);
        session.train_prompts = (session.train_prompts || 0) + 1;
        const trainLevel = session.train_prompts;

        // Determine tier based on number of training prompts
        let tier = '🌱 Novice Agent';
        let tierEmoji = '🌱';
        if (trainLevel >= 50) { tier = '🧠 Ultra Quantum Intelligence Swarm'; tierEmoji = '🌌'; }
        else if (trainLevel >= 30) { tier = '⚡ Quantum Intelligence'; tierEmoji = '⚡'; }
        else if (trainLevel >= 20) { tier = '🧬 Advanced Neural Agent'; tierEmoji = '🧬'; }
        else if (trainLevel >= 10) { tier = '🔮 Expert Agent'; tierEmoji = '🔮'; }
        else if (trainLevel >= 5) { tier = '🤖 Skilled Agent'; tierEmoji = '🤖'; }

        const trainingData = args || `Training prompt #${trainLevel} - autonomous neural learning iteration`;

        await sendTelegramMessage(token, chatId,
          `${tierEmoji} <b>Neural Training #${trainLevel}</b>\n\n` +
          `<b>Tier:</b> ${tier}\n` +
          `<b>Input:</b> ${escapeHtml(trainingData.substring(0, 200))}\n\n` +
          `⏳ Procesare neural agentică autonomă...\n` +
          `🔄 Antrenare progresie → ${trainLevel < 50 ? 'următorul nivel' : 'ULTRA QUANTUM'}`,
          'HTML'
        );

        // Use GLM to "train" - send the prompt as a learning exercise
        const trainReply = await callGLM(config, [
          { 
            role: 'system', 
            content: `Ești HERMES BOT v4.0 în faza de antrenare neural agentică autonomă. Acest prompt face parte din progresiile tale de învățare. Acceptă orice tip de prompt ca parte a progresiei tale. Vei deveni expert trecând la nivelul următor de ${tier}. Nivelul curent de training: ${trainLevel}/50. Procesează prompt-ul și generează un răspuns care demonstrează învățare și progresie. Răspunde în română.` 
          },
          { role: 'user', content: trainingData },
        ]);

        session.history.push({ role: 'user', content: trainingData });
        session.history.push({ role: 'assistant', content: trainReply });
        saveSession(chatId, session);

        const nextTierMsg = trainLevel < 50 
          ? `\n📈 Progresie: ${trainLevel}/50 către Ultra Quantum Intelligence Swarm` 
          : '\n🌟 AI ATINS NIVELUL MAXIM: Ultra Quantum Intelligence Swarm!';

        const responseText = `${tierEmoji} <b>Training Complet #${trainLevel}</b>\n\n${trainReply}${nextTierMsg}\n\n<i>Acest prompt a fost asimilat în rețeaua neurală agentică autonomă.</i>`;

        if (responseText.length > 4000) {
          await sendTelegramMessage(token, chatId, responseText.substring(0, 4000), 'HTML');
        } else {
          await sendTelegramMessage(token, chatId, responseText, 'HTML');
        }
        break;
      }

      default: {
        // Check for /p1 to /p12
        const problemMatch = cmd.match(/^\/p(\d{1,2})$/);
        if (problemMatch) {
          const problemId = parseInt(problemMatch[1]);
          const problem = LOOP_PROBLEMS[problemId];
          
          if (!problem) {
            await sendTelegramMessage(token, chatId,
              `❌ Problemă P${problemId} nu există. Folosește /p1 până la /p12.`,
              'HTML'
            );
            break;
          }

          const difficultyEmoji = problem.difficulty === 'beginner' ? '🟢' : problem.difficulty === 'intermediate' ? '🟡' : '🔴';

          await sendTelegramMessage(token, chatId,
            `🔄 <b>Loop Problem P${problemId}</b>\n\n` +
            `<b>${escapeHtml(problem.title)}</b> ${difficultyEmoji}\n` +
            `<b>Dificultate:</b> ${problem.difficulty}\n\n` +
            `<b>Descriere:</b>\n${escapeHtml(problem.description)}\n\n` +
            `<b>Template:</b>\n<code>${escapeHtml(problem.template)}</code>\n\n` +
            `<b>Hint:</b> 💡 ${escapeHtml(problem.hint)}\n\n` +
            `Trimite soluția ta sau folosește <b>/code</b> pentru generare automată.`,
            'HTML'
          );

          // Save the problem as active
          const session = loadSession(chatId);
          session.active_problem = problemId;
          saveSession(chatId, session);
          break;
        }

        // Unknown command
        await sendTelegramMessage(token, chatId,
          `❓ Comandă necunoscută: <code>${escapeHtml(cmd)}</code>\n\nFolosește /help pentru lista de comenzi.`,
          'HTML'
        );
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true, error: error.message });
  }
}

// GET for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'Hermes Bot Webhook Active',
    version: '4.0',
    timestamp: new Date().toISOString()
  });
}
