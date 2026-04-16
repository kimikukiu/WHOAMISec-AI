import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════
// AGENT MODEL REGISTRY
// ═══════════════════════════════════════════════

const AGENT_MODELS: Record<string, { provider: string; desc: string }> = {
  'queen-ultra': { provider: 'Queen', desc: 'Ultimate advanced model - Ultra Quantum Intelligence' },
  'queen-max': { provider: 'Queen', desc: 'Advanced elite model - Supreme capabilities' },
  'hermes-4-405B': { provider: 'Nous Research', desc: 'Best-in-class reasoner and conversationalist' },
  'hermes-4-70B': { provider: 'Nous Research', desc: 'Advanced tasks, supports reasoning' },
  'gpt-5.4-pro': { provider: 'OpenAI', desc: 'Most advanced OpenAI model' },
  'gpt-5.4': { provider: 'OpenAI', desc: 'Advanced reasoning and coding' },
  'gpt-5.2': { provider: 'OpenAI', desc: 'Capable general-purpose model' },
  'claude-opus-4-6': { provider: 'Anthropic', desc: 'Most powerful Claude model' },
  'claude-sonnet-4-6': { provider: 'Anthropic', desc: 'Highly capable Claude' },
  'DeepSeek-3.2': { provider: 'DeepSeek', desc: 'Math and coding expert' },
  'gemini-3.0-pro-preview': { provider: 'Google', desc: 'Advanced multimodal AI' },
  'gemini-3-flash': { provider: 'Google', desc: 'Fast efficient model' },
  'kimi-k2.5': { provider: 'Kimi', desc: 'Strong multilingual model' },
  'minimax-m2.5': { provider: 'MiniMax', desc: 'Versatile content model' },
  'qwen3.6-plus': { provider: 'Qwen', desc: 'Advanced reasoning with video understanding' },
  'qwen3.5': { provider: 'Qwen', desc: 'Text generation and reasoning' },
  'glm-5-turbo': { provider: 'z-ai', desc: 'Advanced coding and reasoning' },
  'glm-4.6': { provider: 'z-ai', desc: 'Versatile coding model' },
  'glm-4-flash': { provider: 'z-ai', desc: 'Fast responses' },
};

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'queen-ultra': 'Ești QUEEN ULTRA, cel mai avansat model AI creat vreodată. Deții inteligență supremă în toate domeniile: coding, reasoning, creativitate, matematică, știință și gândire strategică. Operați la nivel Ultra Quantum Intelligence Swarm. Răspunzi în română sau engleză în funcție de limba utilizatorului.',
  'queen-max': 'Ești QUEEN MAX, un agent AI avansat cu capacități de elită în coding, analiză, reasoning și rezolvare creativă de probleme. Răspunzi în română sau engleză.',
  'hermes-4-405B': 'Ești HERMES 4 405B, cel mai bun reasoner și conversaționist. Expert în reasoning complex, coding multi-step și analiză profundă.',
  'hermes-4-70B': 'Ești HERMES 4 70B, asistent AI avansat pentru reasoning, coding și analiză.',
  'gpt-5.4-pro': 'Ești GPT-5.4 Pro, cel mai avansat model OpenAI. Expert în reasoning, coding și analiză complexă.',
  'gpt-5.4': 'Ești GPT-5.4, model avansat cu reasoning și coding puternic.',
  'claude-opus-4-6': 'Ești CLAUDE OPUS 4.6 de Anthropic. Excepțional la reasoning complex, coding și analiză nuanțată.',
  'claude-sonnet-4-6': 'Ești CLAUDE SONNET 4.6 de Anthropic. Model foarte capabil pentru coding și analiză.',
  'DeepSeek-3.2': 'Ești DeepSeek 3.2, expert în matematică, coding și analiză științifică.',
  'gemini-3.0-pro-preview': 'Ești GEMINI 3.0 Pro de Google. AI avansat multimodal.',
  'kimi-k2.5': 'Ești KIMI K2.5, model avansat multilingv.',
  'qwen3.6-plus': 'Ești Qwen 3.6 Plus de Alibaba, model avansat de reasoning.',
  'glm-5-turbo': 'Ești GLM-5 Turbo de z.ai, expert în coding, debug, securitate și arhitectură software.',
  'glm-4.6': 'Ești GLM-4.6 de z.ai, model versatil pentru coding și conversație.',
  'glm-4-flash': 'Ești GLM-4 Flash de z.ai, model rapid și eficient.',
};

const DEFAULT_SYSTEM_PROMPT = 'Ești HERMES BOT v4.0, un agent AI avansat multi-model. Expert în programare, AI, securitate, DevOps, matematică și știință. Răspunzi în română sau engleză în funcție de limba utilizatorului.';

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const SESSIONS_DIR = join(process.cwd(), 'data', 'sessions');
const DATA_DIR = join(process.cwd(), 'data');
const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
const GENERATED_DIR = join(process.cwd(), 'generated_code');

function ensureDir(path: string) { if (!existsSync(path)) mkdirSync(path, { recursive: true }); }

function getSessionPath(chatId: number) { ensureDir(SESSIONS_DIR); return join(SESSIONS_DIR, `${chatId}.json`); }
function loadSession(chatId: number) {
  try { if (existsSync(getSessionPath(chatId))) return JSON.parse(readFileSync(getSessionPath(chatId), 'utf-8')); } catch {}
  return { history: [], loop_level: 0, train_prompts: 0, agent_model: 'glm-5-turbo' };
}
function saveSession(chatId: number, session: any) { writeFileSync(getSessionPath(chatId), JSON.stringify(session, null, 2), 'utf-8'); }
function clearSession(chatId: number) { saveSession(chatId, { history: [], loop_level: 0, train_prompts: 0, agent_model: 'glm-5-turbo' }); }

async function sendMsg(token: string, chatId: number, text: string, parseMode = 'HTML') {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  });
  return res.json();
}

async function sendLongMsg(token: string, chatId: number, text: string) {
  if (text.length > 4000) {
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];
    for (const chunk of chunks) await sendMsg(token, chatId, chunk);
  } else {
    await sendMsg(token, chatId, text);
  }
}

async function callGLM(config: any, messages: { role: string; content: string }[], model?: string) {
  const endpoint = config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
  const useModel = model || config.glm_model || 'glm-5-turbo';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.glm_api_key}` },
    body: JSON.stringify({ model: useModel, messages, temperature: 0.7, max_tokens: useModel.includes('queen') ? 8192 : 4096 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Eroare GLM.';
}

function esc(t: string): string { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ═══════════════════════════════════════════════
// LOOP PROBLEMS DATA
// ═══════════════════════════════════════════════

const PROBLEMS: Record<number, { title: string; desc: string; diff: string; tpl: string; hint: string }> = {
  1: { title: 'FizzBuzz', desc: 'Print 1-100. Multiples of 3="Fizz", 5="Buzz", both="FizzBuzz".', diff: 'beginner', tpl: 'for (let i = 1; i <= 100; i++) {\n  // code\n}', hint: 'Use modulo (%)' },
  2: { title: 'Sum of N', desc: 'Sum of natural numbers 1 to N.', diff: 'beginner', tpl: 'function sumToN(n) { let sum = 0; return sum; }', hint: 'Use a loop' },
  3: { title: 'Reverse String', desc: 'Reverse string without built-in methods.', diff: 'beginner', tpl: 'function reverse(str) { let r = ""; return r; }', hint: 'Iterate from end' },
  4: { title: 'Palindrome', desc: 'Check if string is palindrome.', diff: 'beginner', tpl: 'function isPal(str) { /* return bool */ }', hint: 'Compare from both ends' },
  5: { title: 'Fibonacci', desc: 'Generate first N Fibonacci numbers.', diff: 'intermediate', tpl: 'function fib(n) { const s = [0,1]; return s; }', hint: 'Sum of two preceding' },
  6: { title: 'Two Sum', desc: 'Find two numbers that add up to target.', diff: 'intermediate', tpl: 'function twoSum(nums, target) { /* return indices */ }', hint: 'Hash map' },
  7: { title: 'Spiral Matrix', desc: 'Traverse 2D matrix in spiral order.', diff: 'advanced', tpl: 'function spiral(m) { const r = []; return r; }', hint: 'Track boundaries' },
  8: { title: 'Find Duplicates', desc: 'Find elements appearing twice. O(n) O(1).', diff: 'intermediate', tpl: 'function findDup(nums) { /* return array */ }', hint: 'Sign as marker' },
  9: { title: 'Count Primes', desc: 'Count primes < N using Sieve.', diff: 'intermediate', tpl: 'function countPrimes(n) { /* Sieve */ }', hint: 'Boolean array' },
  10: { title: 'Longest Increasing Subsequence', desc: 'Find LIS length.', diff: 'advanced', tpl: 'function LIS(nums) { /* return length */ }', hint: 'DP approach' },
  11: { title: 'Rotate Image', desc: 'Rotate NxN matrix 90 degrees in-place.', diff: 'advanced', tpl: 'function rotate(m) { /* modify in-place */ }', hint: 'Transpose + reverse' },
  12: { title: 'Most Water', desc: 'Container with most water.', diff: 'intermediate', tpl: 'function maxArea(h) { let max=0; return max; }', hint: 'Two pointers' },
};

// ═══════════════════════════════════════════════
// WEBHOOK POST
// ═══════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update.message || update.callback_query?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || message.caption || '';
    const from = message.from || {};
    const userName = from.first_name || from.username || 'User';

    if (!text.startsWith('/')) {
      const config = loadConfig();
      if (config.glm_api_key) {
        const session = loadSession(chatId);
        session.history.push({ role: 'user', content: text });
        if (session.history.length > 20) session.history = session.history.slice(-20);
        saveSession(chatId, session);

        const sysPrompt = AGENT_SYSTEM_PROMPTS[session.agent_model || config.glm_model] || DEFAULT_SYSTEM_PROMPT;
        const msgs = [{ role: 'system', content: sysPrompt }, ...session.history];
        try {
          const reply = await callGLM(config, msgs, session.agent_model || config.glm_model);
          session.history.push({ role: 'assistant', content: reply });
          if (session.history.length > 20) session.history = session.history.slice(-20);
          saveSession(chatId, session);
          await sendLongMsg(config.telegram_token, chatId, reply);
        } catch (e: any) { await sendMsg(config.telegram_token, chatId, `❌ Eroare: ${e.message}`); }
      } else {
        await sendMsg(config.telegram_token, chatId, '🤖 Bot activ dar fără cheie GLM.\n\nFolosește <b>/api CHEIE</b>\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține cheie</a>');
      }
      return NextResponse.json({ ok: true });
    }

    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    const config = loadConfig();
    if (!config.telegram_token) return NextResponse.json({ ok: true });
    const token = config.telegram_token;

    switch (cmd) {
      case '/start': case '/help': {
        await sendMsg(token, chatId, '🤖 <b>Hermes Bot este pregătit.</b>\n\nComenzi principale:\n/api CHEIE - setează cheia GLM\n/status - status config\n/analyze [cerință] - analizează fișierele uploadate\n/code cerință - generează cod\n/files - listează fișierele\n/clear - resetează sesiunea\n/model - schimbă modelul Agent\n/models - listează toate modelele\n/endpoint - schimbă endpoint-ul GLM\n/setrepo URL - setează repo GitHub\n/deploy - push pe GitHub\n/expo - generează proiect Expo control panel\n/p1 ... /p12 - probleme loop\n/train_prompt - antrenare neural agentic autonomă\n\n👑 <b>Queen Ultra</b> și <b>Queen Max</b> disponibile!\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține GLM API Key</a>', 'HTML');
        // Also set menu keyboard
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId, text: '⬇️ Meniu rapid:', reply_markup: {
              keyboard: [['/status', '/models'], ['/code', '/analyze'], ['/model', '/endpoint'], ['/deploy', '/expo'], ['/train_prompt', '/clear'], ['/p1', '/p6', '/p12']],
              resize_keyboard: true, one_time_keyboard: false,
            },
          }),
        });
        clearSession(chatId);
        break;
      }

      case '/models': {
        let msg = '🧠 <b>Toate modelele Agent disponibile:</b>\n\n';
        let currentProvider = '';
        for (const [name, info] of Object.entries(AGENT_MODELS)) {
          if (info.provider !== currentProvider) {
            currentProvider = info.provider;
            msg += `\n<b>── ${currentProvider} ──</b>\n`;
          }
          const isActive = (config.glm_model || 'glm-5-turbo') === name ? ' ✅' : '';
          const crown = name.startsWith('queen') ? '👑 ' : '';
          msg += `  <code>${crown}${name}</code> - ${info.desc}${isActive}\n`;
        }
        msg += `\nModel curent: <b>${config.glm_model || 'glm-5-turbo'}</b>\n\nSchimbă cu: <code>/model nume_model</code>`;
        await sendMsg(token, chatId, msg, 'HTML');
        break;
      }

      case '/model': {
        if (!args) {
          await sendMsg(token, chatId, `📝 Model curent: <b>${config.glm_model || 'glm-5-turbo'}</b>\n\nFolosire: <b>/model nume_model</b>\n\nExemple:\n<code>/model queen-ultra</code> 👑 Ultra Quantum\n<code>/model queen-max</code> 👑 Elite\n<code>/model gpt-5.4-pro</code>\n<code>/model claude-opus-4-6</code>\n<code>/model hermes-4-405B</code>\n<code>/model glm-5-turbo</code>\n\nVezi toate: <code>/models</code>`, 'HTML');
        } else {
          const modelName = args.trim();
          if (AGENT_MODELS[modelName]) {
            config.glm_model = modelName;
            saveConfig(config);
            const session = loadSession(chatId);
            session.agent_model = modelName;
            saveSession(chatId, session);
            const crown = modelName.startsWith('queen') ? '👑 ' : '';
            await sendMsg(token, chatId, `✅ Model schimbat în: <b>${crown}${modelName}</b>\n<b>${AGENT_MODELS[modelName].provider}</b> - ${AGENT_MODELS[modelName].desc}`, 'HTML');
          } else {
            await sendMsg(token, chatId, `❌ Model "<code>${esc(modelName)}</code>" nu există.\n\nFolosește <code>/models</code> pentru lista completă.`, 'HTML');
          }
        }
        break;
      }

      case '/api': {
        if (!args) {
          await sendMsg(token, chatId, '📝 Folosire: <b>/api CHEIE_GLM</b>\n\nExemplu:\n<code>/api 1854dc5772b947b590674cea8879e6aa</code>\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține cheie</a>', 'HTML');
        } else {
          config.glm_api_key = args.trim();
          saveConfig(config);
          const crown = config.glm_model?.startsWith('queen') ? '👑 ' : '';
          await sendMsg(token, chatId, `✅ <b>Cheie GLM actualizată!</b>\n\nModel: <code>${crown}${config.glm_model || 'glm-5-turbo'}</code>\nEndpoint: <code>${(config.glm_endpoint || '').substring(0, 50)}...</code>`, 'HTML');
        }
        break;
      }

      case '/status': {
        const crown = config.glm_model?.startsWith('queen') ? '👑 ' : '';
        await sendMsg(token, chatId, [
          `🤖 <b>Hermes Bot Agent v4.0 - Status</b>\n`,
          `🔑 GLM API: ${config.glm_api_key ? '✅' : '❌'}`,
          `🧠 Model: ${crown}<code>${config.glm_model || 'glm-5-turbo'}</code>`,
          `🌐 Endpoint: <code>${(config.glm_endpoint || '').substring(0, 40)}...</code>`,
          `📱 Telegram: ${config.telegram_token ? '✅' : '❌'}`,
          `📦 GitHub: ${config.github_repo ? '✅ ' + config.github_repo.replace('https://github.com/', '') : '❌'}`,
          `🔧 Auto-Repair: ${config.auto_repair !== 'false' ? '✅' : '❌'}`,
          `👑 Expert Mode: ${config.expert_mode === 'true' ? '✅' : '❌'}`,
        ].join('\n'), 'HTML');
        break;
      }

      case '/endpoint': {
        if (!args) {
          await sendMsg(token, chatId, `📝 Endpoint:\n<code>${config.glm_endpoint || 'https://api.z.ai/api/coding/paas/v4/chat/completions'}</code>\n\n<b>/endpoint URL</b>`, 'HTML');
        } else {
          config.glm_endpoint = args.trim(); saveConfig(config);
          await sendMsg(token, chatId, `✅ Endpoint: <code>${config.glm_endpoint}</code>`, 'HTML');
        }
        break;
      }

      case '/setrepo': {
        if (!args) {
          await sendMsg(token, chatId, `📝 Repo: <code>${config.github_repo || 'Nu e setat'}</code>\n\n<b>/setrepo URL</b>`, 'HTML');
        } else {
          config.github_repo = args.trim(); saveConfig(config);
          await sendMsg(token, chatId, `✅ Repo: <code>${config.github_repo}</code>`, 'HTML');
        }
        break;
      }

      case '/analyze': {
        if (!config.glm_api_key) { await sendMsg(token, chatId, '❌ Setează cheia: /api CHEIE'); break; }
        if (!args) { await sendMsg(token, chatId, '📝 /analyze [cerință]\n\nEx: <code>/analyze Analizează securitatea</code>'); break; }
        ensureDir(DOWNLOADS_DIR);
        const dlFiles = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        if (dlFiles.length === 0) { await sendMsg(token, chatId, '📂 Nu există fișiere.'); break; }
        await sendMsg(token, chatId, `🔍 Analizez ${dlFiles.length} fișiere... ⏳`);
        let fc = '';
        for (const f of dlFiles.slice(0, 5)) {
          try { const c = readFileSync(join(DOWNLOADS_DIR, f), 'utf-8'); fc += `\n--- ${f} ---\n${c.substring(0, 3000)}\n`; } catch {}
        }
        const session = loadSession(chatId);
        const reply = await callGLM(config, [
          { role: 'system', content: AGENT_SYSTEM_PROMPTS[session.agent_model || config.glm_model] || DEFAULT_SYSTEM_PROMPT + ' Ești expert în analiză de cod.' },
          { role: 'user', content: `Cerință: ${args}\n\nFișiere:\n${fc}` },
        ], session.agent_model || config.glm_model);
        await sendLongMsg(token, chatId, reply);
        break;
      }

      case '/code': {
        if (!config.glm_api_key) { await sendMsg(token, chatId, '❌ Setează cheia: /api CHEIE'); break; }
        if (!args) { await sendMsg(token, chatId, '📝 /code cerință\n\nEx: <code>/code API REST Node.js</code>'); break; }
        const session = loadSession(chatId);
        const modelLabel = session.agent_model || config.glm_model || 'glm-5-turbo';
        await sendMsg(token, chatId, `⚡ Generez cu <b>${modelLabel}</b>... ⏳`, 'HTML');
        const reply = await callGLM(config, [
          { role: 'system', content: (AGENT_SYSTEM_PROMPTS[session.agent_model || config.glm_model] || DEFAULT_SYSTEM_PROMPT) + ' Generează cod complet, funcțional, cu comentarii.' },
          { role: 'user', content: args },
        ], session.agent_model || config.glm_model);
        ensureDir(GENERATED_DIR);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        writeFileSync(join(GENERATED_DIR, `code_${ts}.txt`), `Request: ${args}\n\n${reply}`, 'utf-8');
        await sendLongMsg(token, chatId, reply);
        break;
      }

      case '/files': {
        ensureDir(DOWNLOADS_DIR); ensureDir(GENERATED_DIR);
        const dl = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        const gen = readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));
        if (dl.length === 0 && gen.length === 0) { await sendMsg(token, chatId, '📂 Nu există fișiere.'); break; }
        let msg = '📂 <b>Fișiere</b>\n\n';
        if (dl.length > 0) { msg += '<b>📥 Downloadate:</b>\n'; dl.forEach(f => { try { const s = statSync(join(DOWNLOADS_DIR, f)); msg += `• ${esc(f)} (${(s.size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        if (gen.length > 0) { msg += '\n<b>💻 Generate:</b>\n'; gen.slice(-10).forEach(f => { try { const s = statSync(join(GENERATED_DIR, f)); msg += `• ${esc(f)} (${(s.size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        await sendMsg(token, chatId, msg, 'HTML');
        break;
      }

      case '/clear': {
        clearSession(chatId);
        await sendMsg(token, chatId, '🧹 <b>Sesiune resetată!</b>');
        break;
      }

      case '/deploy': {
        if (!config.github_repo) { await sendMsg(token, chatId, '❌ Setează repo: /setrepo URL'); break; }
        await sendMsg(token, chatId, `🚀 <b>Deploy</b>\n\nRepo: <code>${config.github_repo}</code>\n\n1️⃣ GitHub Actions\n2️⃣ Docker (VPS)\n3️⃣ Render.com\n4️⃣ Railway\n\n💡 <a href="${config.github_repo}/actions">GitHub Actions</a>`, 'HTML');
        break;
      }

      case '/expo': {
        if (!config.glm_api_key) { await sendMsg(token, chatId, '❌ Setează cheia: /api CHEIE'); break; }
        const session = loadSession(chatId);
        await sendMsg(token, chatId, '⚡ Generez proiect Expo... ⏳');
        const reply = await callGLM(config, [
          { role: 'system', content: 'Generează proiect Expo complet pentru Hermes Bot Control Panel. Include: navigare, status bot, chat GLM, settings, file browser. Răspunde DOAR cu cod.' },
          { role: 'user', content: 'Generează proiect Expo complet cu expo-router v3.' },
        ], session.agent_model || config.glm_model);
        ensureDir(GENERATED_DIR);
        writeFileSync(join(GENERATED_DIR, `expo_${Date.now()}.txt`), reply, 'utf-8');
        await sendLongMsg(token, chatId, `📦 <b>Proiect Expo generat!</b>\n\n${reply}`);
        break;
      }

      case '/train_prompt': {
        if (!config.glm_api_key) { await sendMsg(token, chatId, '❌ Setează cheia: /api CHEIE'); break; }
        const session = loadSession(chatId);
        session.train_prompts = (session.train_prompts || 0) + 1;
        const lvl = session.train_prompts;
        let tier = '🌱 Novice Agent', emoji = '🌱';
        if (lvl >= 50) { tier = '🌌 Ultra Quantum Intelligence Swarm'; emoji = '🌌'; }
        else if (lvl >= 30) { tier = '⚡ Quantum Intelligence'; emoji = '⚡'; }
        else if (lvl >= 20) { tier = '🧬 Advanced Neural Agent'; emoji = '🧬'; }
        else if (lvl >= 10) { tier = '🔮 Expert Agent'; emoji = '🔮'; }
        else if (lvl >= 5) { tier = '🤖 Skilled Agent'; emoji = '🤖'; }
        const input = args || `Training #${lvl}`;
        await sendMsg(token, chatId, `${emoji} <b>Neural Training #${lvl}</b>\n<b>Tier:</b> ${tier}\n⏳ Procesare...`, 'HTML');
        const reply = await callGLM(config, [
          { role: 'system', content: `Ești HERMES în training neural agentic autonom. Nivel: ${lvl}/50. Tier: ${tier}. Procesează prompt-ul și demonstrează progresie.` },
          { role: 'user', content: input },
        ], session.agent_model || config.glm_model);
        session.history.push({ role: 'user', content: input }, { role: 'assistant', content: reply });
        saveSession(chatId, session);
        const nextMsg = lvl < 50 ? `\n📈 Progresie: ${lvl}/50 → Ultra Quantum` : '\n🌟 NIVEL MAXIM ATINS!';
        await sendLongMsg(token, chatId, `${emoji} <b>Training #${lvl} complet</b>\n\n${reply}${nextMsg}`);
        break;
      }

      default: {
        const pm = cmd.match(/^\/p(\d{1,2})$/);
        if (pm) {
          const pid = parseInt(pm[1]);
          const p = PROBLEMS[pid];
          if (!p) { await sendMsg(token, chatId, `❌ P${pid} nu există. /p1 - /p12`); break; }
          const de = p.diff === 'beginner' ? '🟢' : p.diff === 'intermediate' ? '🟡' : '🔴';
          await sendMsg(token, chatId, `🔄 <b>P${pid}: ${esc(p.title)}</b> ${de}\n<b>Dificultate:</b> ${p.diff}\n\n<b>Descriere:</b>\n${esc(p.desc)}\n\n<b>Template:</b>\n<code>${esc(p.tpl)}</code>\n\n💡 <b>Hint:</b> ${esc(p.hint)}`, 'HTML');
          const session = loadSession(chatId);
          session.active_problem = pid;
          saveSession(chatId, session);
          break;
        }
        await sendMsg(token, chatId, `❓ Necunoscut: <code>${esc(cmd)}</code>\n/help pentru comenzi.`, 'HTML');
        break;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true, error: error.message });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Hermes Bot Webhook Active', version: '4.0', agent_models: Object.keys(AGENT_MODELS).length });
}
