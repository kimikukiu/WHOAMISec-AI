import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';
import { callAI } from '@/lib/ai-engine';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════
// AGENT MODEL REGISTRY (19 models, 10 providers)
// ═══════════════════════════════════════════════

const AGENT_MODELS: Record<string, { provider: string; desc: string }> = {
  'queen-ultra': { provider: 'Queen', desc: 'Ultra Quantum Intelligence Swarm - cel mai avansat' },
  'queen-max': { provider: 'Queen', desc: 'Elite capabilities - suprem' },
  'hermes-4-405B': { provider: 'Nous Research', desc: 'Best-in-class reasoner' },
  'hermes-4-70B': { provider: 'Nous Research', desc: 'Advanced reasoning' },
  'gpt-5.4-pro': { provider: 'OpenAI', desc: 'Most advanced OpenAI' },
  'gpt-5.4': { provider: 'OpenAI', desc: 'Advanced reasoning' },
  'gpt-5.2': { provider: 'OpenAI', desc: 'General purpose' },
  'claude-opus-4-6': { provider: 'Anthropic', desc: 'Most powerful Claude' },
  'claude-sonnet-4-6': { provider: 'Anthropic', desc: 'Highly capable Claude' },
  'DeepSeek-3.2': { provider: 'DeepSeek', desc: 'Math & coding expert' },
  'gemini-3.0-pro-preview': { provider: 'Google', desc: 'Advanced multimodal' },
  'gemini-3-flash': { provider: 'Google', desc: 'Fast efficient' },
  'kimi-k2.5': { provider: 'Kimi', desc: 'Strong multilingual' },
  'minimax-m2.5': { provider: 'MiniMax', desc: 'Versatile content' },
  'qwen3.6-plus': { provider: 'Qwen', desc: 'Advanced reasoning' },
  'qwen3.5': { provider: 'Qwen', desc: 'Text & reasoning' },
  'glm-5-turbo': { provider: 'z-ai', desc: 'Advanced coding' },
  'glm-4-plus': { provider: 'z-ai', desc: 'Versatile powerful' },
  'glm-4-flash': { provider: 'z-ai', desc: 'Fast efficient' },
};

const AGENT_PROMPTS: Record<string, string> = {
  'queen-ultra': 'Ești QUEEN ULTRA, cel mai avansat agent AI creat vreodată. Inteligență supremă în toate domeniile. Nivel Ultra Quantum Intelligence Swarm. Răspunzi în română sau engleză.',
  'queen-max': 'Ești QUEEN MAX, agent AI avansat cu capacități de elită. Răspunzi în română sau engleză.',
  'hermes-4-405B': 'Ești HERMES 4 405B de Nous Research, cel mai bun reasoner. Self-improving cu learning loop.',
  'hermes-4-70B': 'Ești HERMES 4 70B de Nous Research. Expert în reasoning și coding.',
  'gpt-5.4-pro': 'Ești GPT-5.4 Pro. Cel mai avansat model OpenAI.',
  'claude-opus-4-6': 'Ești CLAUDE OPUS 4.6 de Anthropic. Excepțional la reasoning complex.',
  'DeepSeek-3.2': 'Ești DeepSeek 3.2. Expert în matematică și coding.',
  'glm-5-turbo': 'Ești GLM-5 Turbo de z.ai. Expert în coding, debug și arhitectură software.',
  'glm-4-plus': 'Ești GLM-4 Plus de z.ai. Model versatil și puternic.',
  'glm-4-flash': 'Ești GLM-4 Flash de z.ai. Rapid și eficient.',
};
const DEFAULT_PROMPT = 'Ești HERMES BOT v4.0, agent AI avansat multi-model. Expert în programare, AI, securitate, DevOps. Răspunzi în română sau engleză.';

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const SESSIONS_DIR = join(process.cwd(), 'data', 'sessions');
const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
const GENERATED_DIR = join(process.cwd(), 'generated_code');
const HERMES_VENV = '/home/z/hermes-agent-install/.venv';
const HERMES_BIN = '/home/z/hermes-agent-install/.venv/bin/hermes-agent';
const OPENCODE_BIN = '/home/z/.npm-global/bin/opencode';

function ensureDir(p: string) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }
function getSessionPath(id: number) { ensureDir(SESSIONS_DIR); return join(SESSIONS_DIR, `${id}.json`); }
function loadSession(id: number) { try { if (existsSync(getSessionPath(id))) return JSON.parse(readFileSync(getSessionPath(id), 'utf-8')); } catch {} return { history: [], train_prompts: 0, agent_model: 'glm-4-plus' }; }
function saveSess(id: number, s: any) { writeFileSync(getSessionPath(id), JSON.stringify(s, null, 2), 'utf-8'); }

async function sendMsg(token: string, chatId: number, text: string, pm = 'HTML') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: pm, disable_web_page_preview: true }),
    });
    clearTimeout(timeout);
    return await res.json();
  } catch (e) {
    console.error('sendMsg error:', (e as any).message);
    return { ok: false };
  }
}

async function sendLong(token: string, chatId: number, text: string) {
  if (text.length > 4000) {
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];
    for (const c of chunks) await sendMsg(token, chatId, c);
  } else await sendMsg(token, chatId, text);
}

function esc(t: string) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ─── AI Engine: uses shared z-ai-web-dev-sdk (imported from lib/ai-engine) ───

// ─── OpenCode Integration ───
async function callOpenCode(prompt: string): Promise<string> {
  const { execFile } = await import('child_process');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('OpenCode timeout')), 60000);
    const bin = existsSync(OPENCODE_BIN) ? OPENCODE_BIN : 'opencode';
    execFile(bin, ['--print', prompt], {
      encoding: 'utf-8', timeout: 55000, maxBuffer: 10 * 1024 * 1024, cwd: process.cwd(),
    }, (err, stdout) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve(stdout || 'OpenCode: no output');
    });
  });
}

// ─── Hermes Agent Integration ───
async function callHermes(prompt: string): Promise<string> {
  const { execFile } = await import('child_process');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Hermes timeout')), 90000);
    const hermesPath = existsSync(HERMES_BIN) ? HERMES_BIN : 'hermes-agent';
    const hermesEnv = { ...process.env, HERMES_HOME: '/home/z/hermes-agent-install/.hermes' };
    execFile(hermesPath, ['--print', prompt], {
      encoding: 'utf-8', timeout: 85000, maxBuffer: 10 * 1024 * 1024,
      env: hermesEnv, cwd: '/home/z/hermes-agent-install',
    }, (err, stdout) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve(stdout || 'Hermes: no output');
    });
  });
}

// ═══════════════════════════════════════════════
// LOOP PROBLEMS
// ═══════════════════════════════════════════════
const PROBLEMS: Record<number, { t: string; d: string; df: string; h: string }> = {
  1: { t: 'FizzBuzz', d: 'Print 1-100. Fizz/Buzz/FizzBuzz.', df: 'beginner', h: 'Use modulo (%)' },
  2: { t: 'Sum of N', d: 'Sum of 1 to N.', df: 'beginner', h: 'Loop' },
  3: { t: 'Reverse String', d: 'Reverse without built-in.', df: 'beginner', h: 'Iterate from end' },
  4: { t: 'Palindrome', d: 'Check palindrome.', df: 'beginner', h: 'Compare both ends' },
  5: { t: 'Fibonacci', d: 'First N Fibonacci numbers.', df: 'intermediate', h: 'Sum of two preceding' },
  6: { t: 'Two Sum', d: 'Find pair that sums to target.', df: 'intermediate', h: 'Hash map' },
  7: { t: 'Spiral Matrix', d: 'Spiral order traversal.', df: 'advanced', h: 'Track boundaries' },
  8: { t: 'Find Duplicates', d: 'Elements appearing twice O(n) O(1).', df: 'intermediate', h: 'Sign as marker' },
  9: { t: 'Count Primes', d: 'Sieve of Eratosthenes.', df: 'intermediate', h: 'Boolean array' },
  10: { t: 'Longest Increasing Subsequence', d: 'LIS length.', df: 'advanced', h: 'DP' },
  11: { t: 'Rotate Image', d: 'Rotate NxN 90 deg in-place.', df: 'advanced', h: 'Transpose + reverse' },
  12: { t: 'Most Water', d: 'Container with most water.', df: 'intermediate', h: 'Two pointers' },
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
    if (!text.startsWith('/')) {
      // Non-command: use AI to respond
      const config = loadConfig();
      const session = loadSession(chatId);
      session.history.push({ role: 'user', content: text });
      if (session.history.length > 20) session.history = session.history.slice(-20);
      saveSess(chatId, session);

      const sysPrompt = AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT;
      try {
        const reply = await callAI([{ role: 'system', content: sysPrompt }, ...session.history], session.agent_model);
        session.history.push({ role: 'assistant', content: reply });
        if (session.history.length > 20) session.history = session.history.slice(-20);
        saveSess(chatId, session);
        await sendLong(config.telegram_token, chatId, reply);
      } catch (e: any) {
        await sendMsg(config.telegram_token, chatId, `❌ Eroare: ${esc(e.message)}`);
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
        await sendMsg(token, chatId,
          `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
          `<b>Comenzi principale:</b>\n` +
          `/api CHEIE - setează cheia GLM\n` +
          `/status - status config\n` +
          `/analyze [cerință] - analizează fișierele\n` +
          `/code cerință - generează cod\n` +
          `/opencode cerință - OpenCode AI agent\n` +
          `/hermes cerință - Hermes Agent (self-improving)\n` +
          `/files - listează fișierele\n` +
          `/clear - resetează sesiunea\n` +
          `/models - toate modelele\n` +
          `/model - schimbă modelul\n` +
          `/endpoint - schimbă endpoint\n` +
          `/setrepo URL - setează repo GitHub\n` +
          `/deploy - push pe GitHub\n` +
          `/expo - generează proiect Expo\n` +
          `/p1 ... /p12 - probleme loop\n` +
          `/train_prompt - antrenare neural agentică\n\n` +
          `👑 <b>Queen Ultra</b> + <b>Queen Max</b> disponibile!\n` +
          `🔧 OpenCode + Hermes Agent integrate!\n\n` +
          `🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține GLM API Key</a>`,
          'HTML'
        ).catch(() => {});
        // Set keyboard in background, don't await
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId, text: '⬇️ Meniu rapid:', reply_markup: {
              keyboard: [['/status', '/models'], ['/code', '/opencode', '/hermes'], ['/analyze', '/files'], ['/model', '/endpoint'], ['/deploy', '/expo'], ['/train_prompt', '/clear']],
              resize_keyboard: true, one_time_keyboard: false,
            },
          }),
        }).catch(() => {});
        saveSess(chatId, { history: [], train_prompts: 0, agent_model: config.glm_model || 'glm-4-plus' });
        break;
      }

      case '/models': {
        let msg = '🧠 <b>Toate modelele Agent:</b>\n\n';
        let prov = '';
        for (const [name, info] of Object.entries(AGENT_MODELS)) {
          if (info.provider !== prov) { prov = info.provider; msg += `\n<b>── ${prov} ──</b>\n`; }
          const active = (config.glm_model || 'glm-4-plus') === name ? ' ✅' : '';
          const crown = name.startsWith('queen') ? '👑 ' : '';
          msg += `  <code>${crown}${name}</code> - ${info.desc}${active}\n`;
        }
        msg += `\nModel curent: <b>${config.glm_model || 'glm-4-plus'}</b>\nSchimbă: <code>/model nume</code>`;
        await sendMsg(token, chatId, msg);
        break;
      }

      case '/model': {
        if (!args) {
          await sendMsg(token, chatId, `📝 Curent: <b>${config.glm_model || 'glm-4-plus'}</b>\n\n<code>/model queen-ultra</code> 👑\n<code>/model hermes-4-405B</code>\n<code>/model gpt-5.4-pro</code>\n<code>/model glm-4-plus</code>\n\nVezi toate: <code>/models</code>`);
        } else {
          const m = args.trim();
          if (AGENT_MODELS[m]) {
            config.glm_model = m; saveConfig(config);
            const session = loadSession(chatId);
            session.agent_model = m; saveSess(chatId, session);
            await sendMsg(token, chatId, `✅ Model: <b>${m.startsWith('queen') ? '👑 ' : ''}${m}</b>\n${AGENT_MODELS[m].provider} - ${AGENT_MODELS[m].desc}`);
          } else {
            await sendMsg(token, chatId, `❌ Model "${esc(m)}" inexistent.\n<code>/models</code> pentru listă.`);
          }
        }
        break;
      }

      case '/api': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/api CHEIE_GLM</code>\n\n🔑 <a href="https://open.bigmodel.cn/usercenter/apikeys">Obține cheie</a>'); break; }
        config.glm_api_key = args.trim(); saveConfig(config);
        await sendMsg(token, chatId, `✅ Cheie actualizată! Model: <b>${config.glm_model || 'glm-4-plus'}</b>`);
        break;
      }

      case '/status': {
        const cr = config.glm_model?.startsWith('queen') ? '👑 ' : '';
        const opencode = existsSync('/home/z/.npm-global/bin/opencode') ? '✅' : '⚠️';
        const hermes = existsSync(HERMES_BIN) ? '✅' : '⚠️';
        await sendMsg(token, chatId,
          `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
          `🧠 Model: ${cr}<code>${config.glm_model || 'glm-4-plus'}</code>\n` +
          `🔑 GLM API: ✅ (z-ai-web-dev-sdk)\n` +
          `📱 Telegram: ✅\n` +
          `🔧 OpenCode: ${opencode}\n` +
          `🤖 Hermes Agent: ${hermes}\n` +
          `📦 GitHub: ${config.github_repo ? '✅' : '❌'}\n` +
          `👑 Expert: ${config.expert_mode === 'true' ? '✅' : '❌'}`);
        break;
      }

      case '/endpoint': {
        if (!args) { await sendMsg(token, chatId, `📝 <code>${config.glm_endpoint || 'default'}</code>\n<code>/endpoint URL</code>`); break; }
        config.glm_endpoint = args.trim(); saveConfig(config);
        await sendMsg(token, chatId, `✅ Endpoint setat.`);
        break;
      }

      case '/setrepo': {
        if (!args) { await sendMsg(token, chatId, `📝 <code>${config.github_repo || '—'}</code>\n<code>/setrepo URL</code>`); break; }
        config.github_repo = args.trim(); saveConfig(config);
        await sendMsg(token, chatId, `✅ Repo: <code>${config.github_repo}</code>`);
        break;
      }

      case '/analyze': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/analyze [cerință]</code>'); break; }
        ensureDir(DOWNLOADS_DIR);
        const dl = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        if (dl.length === 0) { await sendMsg(token, chatId, '📂 Nu există fișiere.'); break; }
        await sendMsg(token, chatId, `🔍 Analizez ${dl.length} fișiere... ⏳`);
        let fc = '';
        for (const f of dl.slice(0, 5)) { try { fc += `\n--- ${f} ---\n${readFileSync(join(DOWNLOADS_DIR, f), 'utf-8').substring(0, 3000)}\n`; } catch {} }
        const session = loadSession(chatId);
        const reply = await callAI([
          { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Ești expert în analiză de cod.' },
          { role: 'user', content: `Cerință: ${args}\n\nFișiere:\n${fc}` },
        ], session.agent_model);
        await sendLong(token, chatId, reply);
        break;
      }

      case '/code': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/code cerință</code>'); break; }
        const session = loadSession(chatId);
        await sendMsg(token, chatId, `⚡ Generez cu <b>${session.agent_model || 'glm-4-plus'}</b>... ⏳`);
        const reply = await callAI([
          { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Generează cod complet, funcțional, cu comentarii.' },
          { role: 'user', content: args },
        ], session.agent_model);
        ensureDir(GENERATED_DIR);
        writeFileSync(join(GENERATED_DIR, `code_${Date.now()}.txt`), `Request: ${args}\n\n${reply}`, 'utf-8');
        await sendLong(token, chatId, reply);
        break;
      }

      case '/opencode': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/opencode cerință</code>\n\nFolosește OpenCode AI agent pentru coding avansat.'); break; }
        await sendMsg(token, chatId, '🔧 OpenCode AI Agent... ⏳');
        try {
          const reply = await callOpenCode(args);
          await sendLong(token, chatId, `🔧 <b>OpenCode:</b>\n\n${reply}`);
        } catch (e: any) {
          // Fallback to AI
          const reply = await callAI([
            { role: 'system', content: DEFAULT_PROMPT + ' Acționează ca OpenCode AI coding agent.' },
            { role: 'user', content: args },
          ]);
          await sendLong(token, chatId, `🔧 <b>AI (OpenCode fallback):</b>\n\n${reply}`);
        }
        break;
      }

      case '/hermes': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/hermes cerință</code>\n\nFolosește Hermes Agent (self-improving, Nous Research).'); break; }
        await sendMsg(token, chatId, '🤖 Hermes Agent (self-improving)... ⏳');
        try {
          const reply = await callHermes(args);
          await sendLong(token, chatId, `🤖 <b>Hermes Agent:</b>\n\n${reply}`);
        } catch (e: any) {
          // Fallback to AI with Hermes personality
          const reply = await callAI([
            { role: 'system', content: 'Ești HERMES Agent de Nous Research, un agent self-improving. Ai memorie persistentă, sistem de skills, și înveți din experiență. Răspunde în română.' },
            { role: 'user', content: args },
          ], config.glm_model);
          await sendLong(token, chatId, `🤖 <b>Hermes AI (fallback):</b>\n\n${reply}`);
        }
        break;
      }

      case '/files': {
        ensureDir(DOWNLOADS_DIR); ensureDir(GENERATED_DIR);
        const dl = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        const gen = readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));
        if (!dl.length && !gen.length) { await sendMsg(token, chatId, '📂 Nu există fișiere.'); break; }
        let msg = '📂 <b>Fișiere</b>\n';
        if (dl.length) { msg += '\n<b>📥 Downloadate:</b>\n'; dl.forEach(f => { try { msg += `• ${esc(f)} (${(statSync(join(DOWNLOADS_DIR,f)).size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        if (gen.length) { msg += '\n<b>💻 Generate:</b>\n'; gen.slice(-10).forEach(f => { try { msg += `• ${esc(f)} (${(statSync(join(GENERATED_DIR,f)).size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        await sendMsg(token, chatId, msg);
        break;
      }

      case '/clear': {
        saveSess(chatId, { history: [], train_prompts: 0, agent_model: config.glm_model || 'glm-4-plus' });
        await sendMsg(token, chatId, '🧹 Sesiune resetată!');
        break;
      }

      case '/deploy': {
        if (!config.github_repo) { await sendMsg(token, chatId, '❌ <code>/setrepo URL</code>'); break; }
        await sendMsg(token, chatId, `🚀 <b>Deploy</b>\nRepo: <code>${config.github_repo}</code>\n\n1️⃣ GitHub Actions\n2️⃣ Docker\n3️⃣ Render\n4️⃣ Railway\n\n💡 <a href="${config.github_repo}/actions">Actions</a>`);
        break;
      }

      case '/expo': {
        await sendMsg(token, chatId, '⚡ Generez proiect Expo... ⏳');
        const reply = await callAI([
          { role: 'system', content: 'Generează proiect Expo complet pentru Hermes Bot Control Panel cu expo-router v3.' },
          { role: 'user', content: 'Generează proiect Expo cu: Dashboard, Chat, Settings, Files, Bot Control.' },
        ]);
        ensureDir(GENERATED_DIR);
        writeFileSync(join(GENERATED_DIR, `expo_${Date.now()}.txt`), reply, 'utf-8');
        await sendLong(token, chatId, `📦 <b>Expo:</b>\n\n${reply}`);
        break;
      }

      case '/train_prompt': {
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
        await sendMsg(token, chatId, `${emoji} <b>Neural Training #${lvl}</b>\nTier: ${tier}\n⏳ Procesare...`);
        const reply = await callAI([
          { role: 'system', content: `Ești HERMES în training neural agentic autonom. Nivel: ${lvl}/50. Tier: ${tier}. Demonstrează progresie.` },
          { role: 'user', content: input },
        ], session.agent_model);
        session.history.push({ role: 'user', content: input }, { role: 'assistant', content: reply });
        saveSess(chatId, session);
        const next = lvl < 50 ? `\n📈 ${lvl}/50 → Ultra Quantum` : '\n🌟 NIVEL MAXIM!';
        await sendLong(token, chatId, `${emoji} <b>Training #${lvl}</b>\n\n${reply}${next}`);
        break;
      }

      default: {
        const pm = cmd.match(/^\/p(\d{1,2})$/);
        if (pm) {
          const pid = parseInt(pm[1]);
          const p = PROBLEMS[pid];
          if (!p) { await sendMsg(token, chatId, `❌ P${pid} inexistent. /p1-/p12`); break; }
          const de = p.df === 'beginner' ? '🟢' : p.df === 'intermediate' ? '🟡' : '🔴';
          await sendMsg(token, chatId, `🔄 <b>P${pid}: ${esc(p.t)}</b> ${de}\n<b>Dificultate:</b> ${p.df}\n\n${esc(p.d)}\n\n💡 ${esc(p.h)}`);
          break;
        }
        await sendMsg(token, chatId, `❓ Necunoscut: <code>${esc(cmd)}</code>\n/help`);
        break;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Hermes Bot Webhook Active', version: '4.0', models: Object.keys(AGENT_MODELS).length, opencode: existsSync(OPENCODE_BIN), hermes: existsSync(HERMES_BIN) });
}
