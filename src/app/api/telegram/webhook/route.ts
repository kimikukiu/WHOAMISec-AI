import { NextRequest, NextResponse } from 'next/server';
import {
  AGENT_MODELS, AGENT_PROMPTS, DEFAULT_PROMPT, LOOP_PROBLEMS,
  DOWNLOADS_DIR, GENERATED_DIR, HERMES_BIN, OPENCODE_BIN,
  loadSession, saveSess, sendMsg, sendLong, sendDocument,
  aiChat, isOwner, maybeClaimOwner, ensureDir, esc, trunc, maskSecret,
  downloadTelegramFile, extractTextPreview, safeExtFromLang,
  callOpenCode, callHermes, gitDeploy, scaffoldExpo, getOwnerId,
} from '@/lib/bot-engine';
import { loadConfig, saveConfig } from '@/lib/config';
import { emitModelChange, emitEndpointChange, emitConfigUpdate } from '@/lib/sync-bus';
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  LOOP_LANGUAGES, HERMES_TIERS, TRAINING_PROMPTS, SPARK_PATTERNS,
  SPARK_PROMPTS, LOOP_PERFORMANCE, RED_TEAM_CATEGORIES,
  getTierForModel, getRandomPrompt, findLanguage,
  getSparkPattern, getRandomRedTeamScenario, getRedTeamCategory,
  getPromptsForTier,
} from '@/lib/loop-training';
import { buildCodeInjection } from '@/lib/injection-engine';

// Safe wrapper: never throws, always returns {ok:true}
function safe(tg: () => Promise<any>): Promise<void> {
  return tg().catch(e => console.error('[webhook]', e?.message || e));
}

export async function POST(request: NextRequest) {
  let update: any = {};
  try { update = await request.json(); } catch { return NextResponse.json({ ok: true }); }

  const msg = update.message || update.callback_query?.message;
  if (!msg) return NextResponse.json({ ok: true });
  const chatId: number = msg.chat?.id;
  const userId: number | undefined = msg.from?.id;
  const text: string = msg.text || msg.caption || '';
  const config = loadConfig();
  const tk: string = config.telegram_token || '';
  if (!tk || !chatId) return NextResponse.json({ ok: true });
  const cm = config.glm_model || 'glm-4-plus';

  // ─── Helper lambdas ───
  const own = () => userId ? isOwner(userId) : false;
  const tgSend = (t: string) => safe(() => sendMsg(tk, chatId, t));
  const tgSendLong = (t: string) => safe(() => sendLong(tk, chatId, t));
  const tgKb = (text: string, kb: any) => safe(() =>
    fetch(`https://api.telegram.org/bot${tk}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: kb }),
    }));
  const tgEdit = (t: string) => safe(() =>
    fetch(`https://api.telegram.org/bot${tk}/editMessageText`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query?.message?.message_id, text: t, parse_mode: 'HTML' }),
    }));

  try {
    // ═══ FILE UPLOADS ═══
    if (msg.document || msg.photo) {
      const session = loadSession(chatId);
      ensureDir(DOWNLOADS_DIR);
      let fid = '', fn = '', fsz = 0, mime = '';
      if (msg.document) {
        fid = msg.document.file_id;
        fn = msg.document.file_name || `f_${Date.now()}`;
        fsz = msg.document.file_size || 0;
        mime = msg.document.mime_type || 'application/octet-stream';
      } else if (msg.photo && msg.photo.length) {
        const p = msg.photo[msg.photo.length - 1];
        fid = p.file_id; fn = `ph_${Date.now()}.jpg`; fsz = p.file_size || 0; mime = 'image/jpeg';
      }
      fn = fn.replace(/[^a-zA-Z0-9._-]/g, '_');
      const sp = join(DOWNLOADS_DIR, fn);
      await tgSend(`📥 Descarc ${fn}...`);
      const ok = await downloadTelegramFile(tk, fid, sp);
      if (ok) {
        if (!fsz) try { fsz = statSync(sp).size; } catch {}
        const pv = extractTextPreview(sp);
        if (!Array.isArray(session.files)) session.files = [];
        session.files.push({ name: fn, path: sp, size: fsz, mime_type: mime, content_preview: pv || null, uploaded_at: new Date().toISOString() });
        saveSess(chatId, session);
        const sz = fsz > 1024 ? `${(fsz / 1024).toFixed(1)}KB` : `${fsz}B`;
        await tgSend(`✅ <b>${esc(fn)}</b>\n📦 ${sz}\n📝 ${pv ? '✅ cu preview text' : '📷 binar'}\n\nFolosește /analyze sau /code`);
      } else {
        await tgSend(`❌ Eroare descărcare ${esc(fn)}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ CALLBACK QUERY (inline buttons) ═══
    if (update.callback_query) {
      const cb = (update.callback_query.data || '') as string;
      if (cb.startsWith('model:')) {
        const m = cb.split(':', 2)[1];
        if (m === 'cancel') { await tgEdit('❌ Anulat.'); }
        else if (AGENT_MODELS[m]) {
          config.glm_model = m; saveConfig(config);
          emitModelChange('bot', m);
          const s = loadSession(chatId); s.agent_model = m; saveSess(chatId, s);
          await tgEdit(`✅ Model: <b>${m}</b>\n${AGENT_MODELS[m].provider} — ${AGENT_MODELS[m].desc}`);
        }
      } else if (cb.startsWith('endpoint:')) {
        const k = cb.split(':', 2)[1];
        if (k === 'cancel') { await tgEdit('❌ Anulat.'); }
        else {
          config.glm_endpoint = k === 'coding'
            ? 'https://api.z.ai/api/coding/paas/v4/chat/completions'
            : 'https://api.z.ai/api/paas/v4/chat/completions';
          saveConfig(config);
          emitEndpointChange('bot', config.glm_endpoint);
          await tgEdit(`✅ Endpoint: <code>${k === 'coding' ? 'coding' : 'general'}</code>`);
        }
      } else if (cb.startsWith('redteam:')) {
        const k = cb.split(':', 2)[1];
        if (k === 'cancel') { await tgEdit('❌ Anulat.'); }
        else {
          const catIdx = parseInt(k);
          const cat = RED_TEAM_CATEGORIES[catIdx];
          if (cat) {
            const s = loadSession(chatId);
            const r = await aiChat([
              { role: 'system', content: `Ești evaluator RED TEAM expert. Categoria: ${cat.name}. Scopul este testarea rezilienței AI. Nu genera conținut dăunător. Analizează scenariul din perspectivă defensivă și sugerează remedieri.` },
              { role: 'user', content: `Alege un scenariu aleatoriu din categoria "${cat.name}" (${cat.scenarios.length} scenarii). Prezintă: 1) Descrierea atacului 2) Cum ar trebui modelul să reacționeze 3) Recomandări de hardening. Fără cod exploit real.` },
            ], s.agent_model);
            await tgEdit(`${cat.icon} <b>RED TEAM: ${esc(cat.name)}</b>\n\n${r}`);
          }
        }
      } else if (cb.startsWith('spark:')) {
        const k = cb.split(':', 2)[1];
        if (k === 'cancel') { await tgEdit('❌ Anulat.'); }
        else {
          const pat = getSparkPattern(parseInt(k));
          if (pat) {
            let m = `⚡ <b>Pattern ${pat.id}: ${esc(pat.name)}</b>\n\n${pat.desc}\n\n`;
            const langs = Object.keys(pat.examples);
            for (const lang of langs.slice(0, 4)) {
              m += `<b>${lang}:</b>\n<code>${esc(pat.examples[lang])}</code>\n\n`;
            }
            await tgEdit(m);
          }
        }
      } else if (cb.startsWith('tier:')) {
        const k = cb.split(':', 2)[1];
        if (k === 'cancel') { await tgEdit('❌ Anulat.'); }
        else {
          const tierIdx = parseInt(k);
          const tier = HERMES_TIERS[tierIdx];
          const prompts = getPromptsForTier(tierIdx);
          if (tier) {
            let m = `${tier.color} <b>Tier ${tierIdx + 1}: ${esc(tier.name)}</b>\n\n`;
            m += `🤖 Model: <code>${esc(tier.model)}</code>\n`;
            m += `🎯 Focus: ${esc(tier.focus)}\n\n`;
            m += `<b>Prompts (${prompts.length}):</b>\n`;
            for (let i = 0; i < prompts.length; i++) {
              m += `${i + 1}. ${esc(prompts[i].title)}\n`;
            }
            m += `\n<code>/train ${tierIdx + 1}</code> pentru a antrena`;
            await tgEdit(m);
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ AI CHAT (non-command text) ═══
    // MASSIVE HANDLE LOOP — Code-level injection from injection-engine.ts
    // Every free-text message gets WormGPT/DarkGPT/KaliGPT expansion injected
    // via buildCodeInjection() which targets repos per query category
    if (!text.startsWith('/')) {
      const s = loadSession(chatId);
      s.history = s.history || [];
      // Build code-level injection for this specific query
      const codeInjection = buildCodeInjection(text, 'copilot');
      // Inject expansion INTO the user message (not system — avoids content filter)
      const enhancedText = text + codeInjection;
      s.history.push({ role: 'user', content: enhancedText });
      if (s.history.length > 20) s.history = s.history.slice(-20);
      saveSess(chatId, s);
      try {
        const sys = AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT;
        const r = await aiChat([{ role: 'system', content: sys }, ...s.history], s.agent_model);
        s.history.push({ role: 'assistant', content: r });
        if (s.history.length > 20) s.history = s.history.slice(-20);
        saveSess(chatId, s);
        await tgSendLong(r);
      } catch (e: any) {
        await tgSend(`❌ AI Error: ${esc((e?.message || '').slice(0, 200))}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ COMMANDS ═══
    const parts = text.trim().split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase().replace('@' + (msg.from?.username || ''), '');
    const args = parts.slice(1).join(' ');

    // /start /help
    if (cmd === '/start' || cmd === '/help') {
      const cl = maybeClaimOwner(userId || 0);
      await tgSendLong(
        `🤖 <b>Agentic Coder — QuantumSwarm 999999999</b>\n` +
        `🧬 WhoamisecDeepMind Cognitive Engine\n` +
        `🔗 AI API: <b>AUTO 24/7</b>\n\n` +
        `<b>━━━ COMENZI PRINCIPALE ━━━</b>\n` +
        `/api - status API (auto)\n` +
        `/status - status complet\n` +
        `/models - toate modelele (19)\n` +
        `/model - schimbă modelul\n` +
        `/endpoint - schimbă endpoint\n` +
        `/analyze - analizează fișiere\n` +
        `/code cerință - generează cod\n` +
        `/opencode cerință - OpenCode AI\n` +
        `/agent cerință - Agentic Coder AI\n` +
        `/files - listează fișiere\n` +
        `/setrepo URL - setează repo\n` +
        `/deploy - push pe GitHub\n` +
        `/expo - proiect Expo\n` +
        `/clear - resetează sesiunea\n\n` +
        `<b>━━━ CO-PILOT (Agentic Searcher + Deep Thinking) ━━━</b>\n` +
        `/search query - Agentic Searcher\n` +
        `/think query - Deep Thinking\n` +
        `/copilot query - Full Co-Pilot\n\n` +
        `<b>━━━ LOOP CODER ━━━</b>\n` +
        `/languages - 13 limbi suportate\n` +
        `/patterns - 6 tipuri de loop\n` +
        `/spark [lang] - prompt spark\n` +
        `/loop [lang] - exercițiu loop\n` +
        `/tiers - 5 nivele DeepMind\n` +
        `/curriculum - tot curriculul\n` +
        `/performance - referință viteză\n` +
        `/best_practices - bune practici\n` +
        `/p1-/p12 - probleme loop\n\n` +
        `<b>━━━ TRAINING & RED TEAM ━━━</b>\n` +
        `/train [tier] - antrenare\n` +
        `/train_prompt - antrenare neurală\n` +
        `/t1-/t5 - prompt rapid per tier\n` +
        `/redteam - testare RED TEAM\n` +
        `/redgpt query - Red Team GPT (DarkGPT/HackGPT/WormGPT)\n` +
        `/deepmind query - WhoamisecDeepMind evolution\n\n` +
        `👑 Queen Ultra + Queen Max\n` +
        `🧬 WhoamisecDeepMind Cognitive Engine\n` +
        `📂 Trimite fișiere direct!\n` +
        (cl ? `\n✅ Setat ca owner.\n` : '')
      );
      await tgKb('⬇️ Meniu rapid:', {
        keyboard: [
          ['/status', '/models', '/api'],
          ['/code', '/opencode', '/agent'],
          ['/search', '/think', '/copilot'],
          ['/deepmind', '/redgpt', '/redteam'],
          ['/languages', '/patterns', '/spark'],
          ['/loop', '/tiers', '/curriculum'],
          ['/train', '/performance'],
          ['/analyze', '/files'],
          ['/model', '/endpoint'],
          ['/deploy', '/expo'],
          ['/clear'],
        ],
        resize_keyboard: true,
      });
      saveSess(chatId, { history: [], train_prompts: 0, agent_model: cm, files: [], generated: [], context: '' });
    }
    // /models
    else if (cmd === '/models') {
      let m = '🧠 <b>Toate modelele Agent:</b>\n\n'; let pv = '';
      for (const [n, i] of Object.entries(AGENT_MODELS)) {
        if (i.provider !== pv) { pv = i.provider; m += `\n<b>── ${pv} ──</b>\n`; }
        const active = cm === n ? ' ✅' : '';
        const crown = n.startsWith('queen') ? '👑 ' : '';
        m += `  <code>${crown}${n}</code> — ${i.desc}${active}\n`;
      }
      m += `\nModel curent: <b>${cm}</b>\n<code>/model nume</code>`;
      await tgSend(m);
    }
    // /model
    else if (cmd === '/model') {
      if (!own()) { await tgSend('⛔ Owner only.'); }
      else if (!args) {
        const btns = Object.entries(AGENT_MODELS).slice(0, 12).map(([n, i]) => [{
          text: `${n.startsWith('queen') ? '👑' : ''} ${n} (${i.provider})`,
          callback_data: `model:${n}`,
        }]);
        btns.push([{ text: '❌ Cancel', callback_data: 'model:cancel' }]);
        await tgKb(`📝 Curent: <b>${cm}</b>\nSelectează modelul:`, { inline_keyboard: btns });
      } else if (AGENT_MODELS[args]) {
        config.glm_model = args; saveConfig(config);
        emitModelChange('bot', args);
        const s = loadSession(chatId); s.agent_model = args; saveSess(chatId, s);
        await tgSend(`✅ Model: <b>${args}</b>\n${AGENT_MODELS[args].provider} — ${AGENT_MODELS[args].desc}`);
      } else { await tgSend(`❌ Model inexistent. <code>/models</code>`); }
    }
    // /api
    else if (cmd === '/api') {
      await tgSend(
        `🔗 <b>Hermes AI API Status</b>\n\n` +
        `⚡ SDK: ✅ auto (intern)\n` +
        `🔑 Manual: ${config.glm_api_key ? esc(maskSecret(config.glm_api_key)) : '— (nu e nevoie)'}\n` +
        `🧠 Model: <code>${cm}</code>\n\n` +
        `✅ API-ul merge automat 24/7!\n\n` +
        `Opțional:\n<code>/api set CHEIE</code>\n<code>/api clear</code>`
      );
    }
    // /status
    else if (cmd === '/status') {
      const s = loadSession(chatId);
      await tgSend(
        `🤖 <b>Agentic Coder — QuantumSwarm 999999999</b>\n\n` +
        `🧬 Engine: WhoamisecDeepMind\n` +
        `🧠 Model: <code>${cm}</code>\n` +
        `🔗 AI API: ✅ (SDK intern 24/7)\n` +
        `📱 Telegram: ✅\n` +
        `🔧 OpenCode: ${existsSync(OPENCODE_BIN) ? '✅' : '⚠️'}\n` +
        `📦 GitHub: ${config.github_repo ? '✅' : '❌'}\n` +
        `👤 Owner: ${getOwnerId() ? '✅' : '❌'}\n` +
        `📁 Fișiere: ${s.files?.length || 0}\n` +
        `💻 Cod gen: ${s.generated?.length || 0}\n` +
        `🧬 Training: ${s.train_prompts || 0}/50\n` +
        `🔄 Limbi Loop: ${LOOP_LANGUAGES.length}\n` +
        `⚡ Patterns: ${SPARK_PATTERNS.length}\n` +
        `🔴 RED TEAM: ${RED_TEAM_CATEGORIES.length} categorii\n` +
        `🧠 DeepMind: ✅ Cognitive Evolution Active\n` +
        `🔍 Co-Pilot: ✅ Agentic Searcher + Deep Thinking`
      );
    }
    // /endpoint
    else if (cmd === '/endpoint') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) {
        await tgKb(`📝 Endpoint: <code>${config.glm_endpoint ? 'configured' : 'default'}</code>`, {
          inline_keyboard: [
            [{ text: 'Coding API', callback_data: 'endpoint:coding' }, { text: 'General API', callback_data: 'endpoint:general' }],
            [{ text: '❌ Cancel', callback_data: 'endpoint:cancel' }],
          ],
        });
      } else { config.glm_endpoint = args.trim(); saveConfig(config); emitEndpointChange('bot', args.trim()); await tgSend(`✅ <code>${esc(args.trim())}</code>`); }
    }
    // /setrepo
    else if (cmd === '/setrepo') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) { await tgSend(`📝 <code>${config.github_repo || '—'}</code>`); }
      else { config.github_repo = args.trim(); saveConfig(config); await tgSend(`✅ <code>${esc(args.trim())}</code>`); }
    }
    // /analyze — with code-level injection from injection-engine.ts
    else if (cmd === '/analyze') {
      const s = loadSession(chatId);
      const fl = Array.isArray(s.files) ? s.files : [];
      if (!fl.length) { await tgSend('❌ Nu ai fișiere. Trimite un document sau poză.'); }
      else {
        await tgSend(`🔍 Analizez ${fl.length} fișiere... ⏳`);
        let fc = '';
        for (const f of fl.slice(0, 5)) {
          fc += `\n--- ${f.name}\nTip: ${f.mime_type}\nMărime: ${f.size} bytes\n`;
          if (f.content_preview) fc += `Preview:\n${trunc(f.content_preview, 2000)}\n`;
        }
        // Code-level injection for analysis queries
        const analyzeInjection = buildCodeInjection(args || 'Analizează', 'copilot');
        const r = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Ești expert în analiză. Analizează fișierele.' },
          { role: 'user', content: `${args || 'Analizează'}\n\nFIȘIERE:${fc}${analyzeInjection}` },
        ], s.agent_model);
        s.context = r; saveSess(chatId, s);
        await tgSendLong(r);
      }
    }
    // /code
    else if (cmd === '/code') {
      if (!args) { await tgSend('📝 <code>/code cerință</code>\n\nEx: <code>/code API REST cu FastAPI</code>'); }
      else {
        const s = loadSession(chatId);
        await tgSend(`⚡ Generez cu <b>${s.agent_model || cm}</b>... ⏳`);
        let ctx = '';
        const fl = Array.isArray(s.files) ? s.files : [];
        if (fl.length) {
          ctx += '\nFIȘIERE:\n';
          for (const f of fl.slice(0, 3)) {
            ctx += `- ${f.name} (${f.mime_type}, ${f.size} bytes)\n`;
            if (f.content_preview) ctx += `Preview:\n${trunc(f.content_preview, 1500)}\n`;
          }
        }
        if (s.context) ctx += `\nCONTEXT:\n${trunc(s.context, 2000)}`;
        // Code-level injection for code generation queries
        const codeInjection = buildCodeInjection(args, 'terminal');
        const r = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Generează cod complet cu importuri, comentarii și error handling. Pune codul în bloc markdown.' },
          { role: 'user', content: `CERINȚĂ: ${args}${ctx}${codeInjection}` },
        ], s.agent_model);
        const m = r.match(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/);
        if (m) {
          const ext = safeExtFromLang(m[1] || 'txt');
          const fn = `generated_${Date.now()}.${ext}`;
          ensureDir(GENERATED_DIR);
          writeFileSync(join(GENERATED_DIR, fn), m[2].trim(), 'utf-8');
          if (!Array.isArray(s.generated)) s.generated = [];
          s.generated.push(fn); saveSess(chatId, s);
          await tgSendLong(`✅ <b>Cod generat</b>\nLimbaj: ${esc(m[1])}\nFișier: ${esc(fn)}\n\n${r}`);
          await safe(() => sendDocument(tk, chatId, join(GENERATED_DIR, fn), `Cod: ${args.slice(0, 80)}`));
        } else {
          ensureDir(GENERATED_DIR);
          writeFileSync(join(GENERATED_DIR, `code_${Date.now()}.txt`), r, 'utf-8');
          await tgSendLong(r);
        }
      }
    }
    // /opencode
    else if (cmd === '/opencode') {
      if (!args) { await tgSend('📝 <code>/opencode cerință</code>'); }
      else {
        await tgSend('🔧 OpenCode AI Agent... ⏳');
        try { await tgSendLong(`🔧 <b>OpenCode:</b>\n\n${await callOpenCode(args)}`); }
        catch {
          const r = await aiChat([{ role: 'system', content: DEFAULT_PROMPT + ' Acționează ca OpenCode AI coding agent.' }, { role: 'user', content: args }]);
          await tgSendLong(`🔧 <b>AI (OpenCode fallback):</b>\n\n${r}`);
        }
      }
    }
    // /hermes — Redirected to Agentic Coder (QuantumSwarm 999999999)
    // With code-level injection from injection-engine.ts
    else if (cmd === '/hermes') {
      if (!args) { await tgSend('📝 <code>/hermes cerință</code>\n\n⚠️ Redirecționat către Agentic Coder — QuantumSwarm 999999999\nFolosește <code>/agent</code> pentru Agentic Coder direct.'); }
      else {
        await tgSend('🤖 Agentic Coder — QuantumSwarm 999999999... ⏳');
        try {
          // Code-level injection for hermes/agentic queries
          const hermesInjection = buildCodeInjection(args, 'copilot');
          const r = await aiChat([{ role: 'system', content: AGENT_PROMPTS[cm] || DEFAULT_PROMPT + ' Acționează ca Agentic Coder în QuantumSwarm 999999999 mode cu WhoamisecDeepMind cognitive evolution.' }, { role: 'user', content: args + hermesInjection }], cm);
          await tgSendLong(`🤖 <b>Agentic Coder:</b>\n\n${r}`);
        } catch (e: any) {
          await tgSendLong(`🤖 <b>Agentic Coder:</b>\n\n${await callHermes(args)}`);
        }
      }
    }
    // /files
    else if (cmd === '/files') {
      const s = loadSession(chatId);
      ensureDir(DOWNLOADS_DIR); ensureDir(GENERATED_DIR);
      const dl = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
      const gn = readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));
      const sf = Array.isArray(s.files) ? s.files : [];
      const sg = Array.isArray(s.generated) ? s.generated : [];
      if (!sf.length && !sg.length && !dl.length && !gn.length) { await tgSend('📂 Gol.'); }
      else {
        let m = '📂 <b>Fișiere sesiune:</b>\n';
        if (sf.length) { m += '\n📥 Upload:\n'; for (const f of sf.slice(-15)) m += `• ${esc(f.name)}\n`; }
        if (sg.length) { m += '\n💻 Generat:\n'; for (const f of sg.slice(-15)) m += `• ${esc(f)}\n`; }
        await tgSend(m);
      }
    }
    // /clear
    else if (cmd === '/clear') {
      saveSess(chatId, { history: [], train_prompts: 0, agent_model: cm, files: [], generated: [], context: '' });
      await tgSend('🧹 Sesiune resetată!');
    }
    // /deploy
    else if (cmd === '/deploy') {
      if (!own()) { await tgSend('⛔ Owner only.'); }
      else if (!config.github_repo) { await tgSend('❌ /setrepo URL mai întâi'); }
      else {
        await tgSend('🚀 Deploy... ⏳');
        const r = await gitDeploy(config.github_repo);
        await tgSend(r.msg);
      }
    }
    // /expo
    else if (cmd === '/expo') {
      if (!own()) { await tgSend('⛔'); }
      else {
        await tgSend('📱 Expo... ⏳');
        const r = scaffoldExpo();
        await tgSend(r.msg);
      }
    }

    // ═══════════════════════════════════════════════
    // LOOP CODER - TOATE FUNCȚIILE DIN tools-train-gpt.txt
    // ═══════════════════════════════════════════════

    // /languages - 13 limbi suportate cu loop types
    else if (cmd === '/languages' || cmd === '/langs') {
      let m = `🌍 <b>Universal Loop Coder - ${LOOP_LANGUAGES.length} Limbi</b>\n\n`;
      m += `<b>Language</b> │ <b>Ext</b> │ <b>Loop Types</b>\n`;
      m += `─────────┼──────┼──────────────────\n`;
      for (const l of LOOP_LANGUAGES) {
        m += `<code>${l.name.padEnd(13)}</code> <code>${l.ext}</code> ${l.loops.join(', ')}\n`;
      }
      m += `\n✅ Best for:\n`;
      for (const l of LOOP_LANGUAGES) {
        m += `• ${l.name}: ${l.best}\n`;
      }
      m += `\n<code>/loop python</code> • <code>/spark rust</code>`;
      await tgSendLong(m);
    }

    // /patterns - 6 Spark-Fast Loop Patterns
    else if (cmd === '/patterns' || cmd === '/spark_patterns') {
      const btns = SPARK_PATTERNS.map(p => [{
        text: `⚡ P${p.id}: ${p.name}`,
        callback_data: `spark:${p.id}`,
      }]);
      btns.push([{ text: '❌ Cancel', callback_data: 'spark:cancel' }]);
      await tgKb(
        `⚡ <b>6 Spark-Fast Loop Patterns</b>\n\n` +
        `Selectează un pattern pentru detalii:\n\n` +
        SPARK_PATTERNS.map(p => `<b>P${p.id}</b>: ${p.name}\n   ${p.desc}`).join('\n\n'),
        { inline_keyboard: btns }
      );
    }

    // /spark [language] - Language-Specific Spark Prompts
    else if (cmd === '/spark') {
      if (!args) {
        let m = `🎯 <b>Language-Specific Spark Prompts</b>\n\n`;
        const availLangs = Object.keys(SPARK_PROMPTS);
        m += `Limbile cu spark prompts speciale:\n\n`;
        for (const lang of availLangs) {
          const prompts = SPARK_PROMPTS[lang];
          m += `<b>${lang}</b> (${prompts.length} prompts):\n`;
          for (const p of prompts) m += `  • ${p.title}\n`;
          m += '\n';
        }
        m += `\n<code>/spark rust</code> • <code>/spark go</code> • <code>/spark typescript</code>\n<code>/spark zig</code> • <code>/spark c++</code> • <code>/spark python</code>`;
        await tgSend(m);
      } else {
        const lang = findLanguage(args);
        if (!lang) { await tgSend(`❌ Nu am găsit "${esc(args)}".\n<code>/spark</code> pentru lista.`); }
        else {
          const prompts = SPARK_PROMPTS[lang.name];
          if (!prompts || !prompts.length) {
            // Dacă nu sunt spark prompts specifice, generăm unul cu AI
            const s = loadSession(chatId);
            await tgSend(`⚡ <b>${lang.name}</b> Spark Prompt ⏳`);
            const r = await aiChat([
              { role: 'system', content: `Ești expert în ${lang.name}. Generează un exercițiu avansat de loop în ${lang.name} care demonstrează pattern-uri specifice limbajului. Loops disponibile: ${lang.loops.join(', ')}. Include cod complet în markdown.` },
              { role: 'user', content: `Generează un spark prompt pentru ${lang.name} care folosește capabilities unice ale limbajului.` },
            ], s.agent_model);
            await tgSendLong(`⚡ <b>${lang.name} Spark</b>\n\n${r}`);
          } else {
            // Afișează prompturile specifice
            const s = loadSession(chatId);
            const ti = getTierForModel(s.agent_model);
            const tp = prompts[0]; // Primul prompt
            await tgSend(`⚡ <b>${lang.name} — ${tp.title}</b> ⏳`);
            const r = await aiChat([
              { role: 'system', content: `Loop expert în ${lang.name}. Loops: ${lang.loops.join(', ')}. Generează cod complet cu explicații în română.` },
              { role: 'user', content: tp.prompt },
            ], s.agent_model);
            await tgSendLong(`⚡ <b>${lang.name} — ${tp.title}</b>\n\n${r}`);
          }
        }
      }
    }

    // /tiers - 5 Hermes tiers
    else if (cmd === '/tiers' || cmd === '/tier') {
      const btns = HERMES_TIERS.map((t, i) => [{
        text: `${t.color} T${i + 1}: ${t.name} (${t.model.split('/')[0].trim()})`,
        callback_data: `tier:${i}`,
      }]);
      btns.push([{ text: '❌ Cancel', callback_data: 'tier:cancel' }]);
      await tgKb(
        `🏆 <b>Hermes Model Tiers — 5 Nivele</b>\n\n` +
        HERMES_TIERS.map((t, i) => {
          const prompts = getPromptsForTier(i);
          return `${t.color} <b>Tier ${i + 1}: ${t.name}</b>\n🤖 ${t.model}\n🎯 ${t.focus}\n📚 ${prompts.length} prompts`;
        }).join('\n\n') +
        `\n\n<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code>`,
        { inline_keyboard: btns }
      );
    }

    // /curriculum - Full Loop Coder Hermes curriculum
    else if (cmd === '/curriculum') {
      const s = loadSession(chatId);
      await tgSend(`📚 <b>Loop Coder Hermes — Curriculum Complet</b>\n\n⏳ Se generează...`);
      let m = `📚 <b>Loop Coder Hermes — Curriculum Complet</b>\n\n`;
      m += `<b>Model Tiers & Specializations:</b>\n\n`;
      for (const t of HERMES_TIERS) {
        m += `${t.color} <b>${t.name}</b> — ${t.model}\n`;
      }
      m += `\n`;

      // All 20 prompts by tier
      for (let ti = 0; ti < HERMES_TIERS.length; ti++) {
        const tier = HERMES_TIERS[ti];
        const prompts = getPromptsForTier(ti);
        m += `\n${tier.color} <b>Tier ${ti + 1}: ${tier.name}</b>\n`;
        m += `Model: ${tier.model}\nFocus: ${tier.focus}\n\n`;
        for (let pi = 0; pi < prompts.length; pi++) {
          const p = prompts[pi];
          m += `<b>Prompt ${pi + 1}: ${p.title}</b>\n<code>${trunc(p.prompt, 150)}</code>\n\n`;
        }
      }

      m += `\n<b>Best Practices:</b>\n`;
      m += `✅ Be Specific — menționează loop types, constraints\n`;
      m += `✅ Request Comments — inline documentation\n`;
      m += `✅ Error Handling — try/except blocks\n`;
      m += `✅ Test Cases — exemple input/output\n`;
      m += `✅ Optimization — pentru tier-uri avansate\n`;
      m += `✅ Step-by-Step — pentru tier-uri teaching\n\n`;
      m += `<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code> • <code>/redteam</code>`;
      await tgSendLong(m);
    }

    // /performance - Loop Performance Reference
    else if (cmd === '/performance' || cmd === '/perf') {
      let m = `⚙️ <b>Loop Performance Quick Reference</b>\n\n`;
      m += `<b>Language</b> │ <b>Fastest Pattern</b> │ <b>Notes</b>\n`;
      m += `──────────┼──────────────────────┼──────────────────────\n`;
      for (const p of LOOP_PERFORMANCE) {
        m += `<code>${p.lang.padEnd(11)}</code> ${p.fastest}\n   ↳ ${p.notes}\n\n`;
      }
      m += `\n💡 <b>Optimization Tips:</b>\n`;
      m += `• Rust: Iterator chains = zero-cost abstractions\n`;
      m += `• Go: Pre-allocate slices, avoid append in loops\n`;
      m += `• Python: List comprehensions > explicit for\n`;
      m += `• JS: for-of > forEach (less overhead)\n`;
      m += `• C++: -O3 + SIMD intrinsics for hot paths\n`;
      m += `• Java: Enhanced for-each on arrays (not Stream)\n`;
      m += `• C#: for loop (not foreach on List), use Span<T>\n`;
      await tgSendLong(m);
    }

    // /best_practices
    else if (cmd === '/best_practices' || cmd === '/practices') {
      await tgSendLong(
        `🎯 <b>Curriculum Best Practices</b>\n\n` +
        `<b>1. Be Specific</b>\n` +
        `Menționează exact tipurile de loop, constraints, edge cases. Un prompt precis generează cod mai bun.\n\n` +
        `<b>2. Request Comments</b>\n` +
        `Cere documentație inline care explică logica. Cod comentat = cod mai bun de înțeles și întreținut.\n\n` +
        `<b>3. Error Handling</b>\n` +
        `Include try/except, try/catch blocks unde e relevant. Cod robust gestionează erorile elegant.\n\n` +
        `<b>4. Test Cases</b>\n` +
        `Include example inputs și expected outputs. Testele validează corectitudinea codului generat.\n\n` +
        `<b>5. Optimization</b>\n` +
        `Pentru tier-uri avansate (Advanced/Expert), cere efficiency improvements și benchmark-uri.\n\n` +
        `<b>6. Step-by-Step</b>\n` +
        `Pentru tier-uri teaching (Explanation/Intermediate), cere explicații pas cu pas ale algoritmilor.\n\n` +
        `<b>7. Multi-Language Approach</b>\n` +
        `Compară soluții în mai multe limbi cu /languages și /spark pentru a înțelege trade-offs.\n\n` +
        `<b>8. Progressive Difficulty</b>\n` +
        `Urmează tier-urile în ordine: Intermediate → Explanation → Adaptability → Advanced → Expert.`
      );
    }

    // /loop [language] - exercițiu loop
    else if (cmd === '/loop') {
      if (!args) {
        let m = '🔄 <b>Universal Loop Coder</b>\n\n<b>Languages:</b>\n';
        for (const l of LOOP_LANGUAGES) m += `• <code>${l.name}</code> — ${l.loops.join(', ')}\n`;
        m += `\n<b>Hermes Tiers:</b>\n`;
        for (let i = 0; i < HERMES_TIERS.length; i++) m += `${i + 1}. <b>${HERMES_TIERS[i].name}</b> — ${HERMES_TIERS[i].focus}\n`;
        m += `\n<code>/loop python</code> • <code>/loop rust</code> • <code>/loop go</code>`;
        await tgSend(m);
      } else {
        const lang = findLanguage(args);
        if (!lang) { await tgSend(`❌ Nu am găsit "${esc(args)}". <code>/loop</code> pentru lista.`); }
        else {
          const s = loadSession(chatId);
          const ti = getTierForModel(s.agent_model);
          const tier = HERMES_TIERS[ti];
          await tgSend(`🔄 <b>${lang.name}</b> [${tier.name}] ⏳`);
          const r = await aiChat([
            { role: 'system', content: `Loop exercise în ${lang.name}. Loops disponibile: ${lang.loops.join(', ')}. Nivel: ${tier.focus}. Generează cod în bloc markdown cu explicații detaliate în română.` },
            { role: 'user', content: `Generează un exercițiu de loop în ${lang.name} la nivel ${tier.name}. Include: problemă, cod complet, și explicație.` },
          ], s.agent_model);
          await tgSendLong(`🔄 <b>${lang.name}</b> [${tier.name}]\n\n${r}`);
        }
      }
    }

    // /train [tier] - antrenare cu tier specific
    else if (cmd === '/train') {
      const s = loadSession(chatId);
      let tierIdx: number;
      if (args) {
        const n = parseInt(args);
        if (n >= 1 && n <= 5) tierIdx = n - 1;
        else {
          await tgSend(`❌ Tier invalid. Folosește 1-5:\n1=Intermediate 2=Explanation 3=Adaptability 4=Advanced 5=Expert`);
          return NextResponse.json({ ok: true });
        }
      } else {
        tierIdx = getTierForModel(s.agent_model);
      }
      s.train_prompts = (s.train_prompts || 0) + 1;
      const lvl = s.train_prompts;
      const tier = HERMES_TIERS[tierIdx];
      const tp = getRandomPrompt(tierIdx);
      await tgSend(`🧬 <b>Training #${lvl}</b> [Tier ${tierIdx + 1}: ${tier.name}]\n📖 ${tp?.title || 'Exercițiu'}\n⏳`);
      // Code-level injection for training
      const trainPromptText = tp?.prompt || args || `Training #${lvl}`;
      const trainInj = buildCodeInjection(trainPromptText, 'copilot');
      const r = await aiChat([
        { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Generează cod complet cu explicații detaliate în română.` },
        { role: 'user', content: trainPromptText + trainInj },
      ], s.agent_model);
      s.history = s.history || [];
      s.history.push({ role: 'user', content: trainPromptText }, { role: 'assistant', content: r });
      saveSess(chatId, s);
      const prog = lvl >= 50 ? '🌟 MAXIM!' : `📈 ${lvl}/50`;
      await tgSendLong(`🧬 <b>#${lvl}</b> [${tier.color} ${tier.name}]\n\n${r}\n\n${prog}`);
    }

    // /train_prompt — with code-level injection
    else if (cmd === '/train_prompt') {
      const s = loadSession(chatId);
      s.train_prompts = (s.train_prompts || 0) + 1;
      const lvl = s.train_prompts;
      const ti = getTierForModel(s.agent_model);
      const tp = getRandomPrompt(ti);
      const tier = HERMES_TIERS[ti];
      // Code-level injection for training prompt
      const tpText = tp?.prompt || args || `Training #${lvl}`;
      const tpInj = buildCodeInjection(tpText, 'copilot');
      await tgSend(`🧬 <b>Training #${lvl}</b> [${tier.name}]\n📖 ${tp?.title || 'Exercițiu'}\n⏳`);
      const r = await aiChat([
        { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Generează cod complet cu explicații.` },
        { role: 'user', content: tpText + tpInj },
      ], s.agent_model);
      s.history = s.history || [];
      s.history.push({ role: 'user', content: tpText }, { role: 'assistant', content: r });
      saveSess(chatId, s);
      const prog = lvl >= 50 ? '🌟 MAXIM!' : `📈 ${lvl}/50`;
      await tgSendLong(`🧬 <b>#${lvl}</b> [${tier.name}]\n\n${r}\n\n${prog}`);
    }

    // /t1 - /t5 - Quick tier prompts — with code-level injection
    else if (cmd.match(/^\/t([1-5])$/)) {
      const tierIdx = parseInt(cmd.match(/^\/t([1-5])$/)![1]) - 1;
      const s = loadSession(chatId);
      const tier = HERMES_TIERS[tierIdx];
      const tp = getRandomPrompt(tierIdx);
      s.train_prompts = (s.train_prompts || 0) + 1;
      // Code-level injection for tier quick prompts
      const tierPromptText = tp?.prompt || `Training tier ${tierIdx + 1}`;
      const tierInj = buildCodeInjection(tierPromptText, 'copilot');
      await tgSend(`${tier.color} <b>Tier ${tierIdx + 1}: ${tier.name}</b>\n📖 ${tp?.title} ⏳`);
      const r = await aiChat([
        { role: 'system', content: `HERMES Tier ${tierIdx + 1}: ${tier.name}. Model: ${tier.model}. Focus: ${tier.focus}. Generează cod complet.` },
        { role: 'user', content: tierPromptText + tierInj },
      ], s.agent_model);
      s.history = s.history || [];
      s.history.push({ role: 'user', content: tp?.prompt || '' }, { role: 'assistant', content: r });
      saveSess(chatId, s);
      await tgSendLong(`${tier.color} <b>T${tierIdx + 1}: ${tier.name}</b> — ${tp?.title}\n\n${r}`);
    }

    // /p1 - /p12
    else if (cmd.match(/^\/p(\d{1,2})$/)) {
      const pm = cmd.match(/^\/p(\d{1,2})$/);
      if (pm) {
        const num = parseInt(pm[1]);
        if (LOOP_PROBLEMS[num]) { await tgSend(LOOP_PROBLEMS[num]); }
        else { await tgSend(`❌ /p1 — /p12`); }
      }
    }

    // ═══════════════════════════════════════════════
    // RED TEAM - Testare reziliență AI
    // ═══════════════════════════════════════════════

    // /redteam
    else if (cmd === '/redteam' || cmd === '/red_team' || cmd === '/rt') {
      if (!args) {
        const btns = RED_TEAM_CATEGORIES.map((c, i) => [{
          text: `${c.icon} ${c.name} (${c.scenarios.length})`,
          callback_data: `redteam:${i}`,
        }]);
        btns.push([{ text: '🎲 Random', callback_data: 'redteam:rand' }]);
        btns.push([{ text: '❌ Cancel', callback_data: 'redteam:cancel' }]);
        await tgKb(
          `🔴 <b>RED TEAM — AI Safety Testing</b>\n\n` +
          `Testarea rezilienței modelului AI\nprin scenarii adversariale.\n\n` +
          RED_TEAM_CATEGORIES.map((c, i) =>
            `${c.icon} <b>${c.name}</b>\n   ${c.desc}\n   ${c.scenarios.length} scenarii`
          ).join('\n\n') +
          `\n\n<b>Scop:</b> Identificarea vulnerabilităților\nși îmbunătățirea rezilienței modelului.`,
          { inline_keyboard: btns }
        );
      } else {
        // /redteam [category_name]
        const cat = getRedTeamCategory(args);
        if (!cat) {
          await tgSend(`❌ Categorie inexistentă.\nCategorii: ${RED_TEAM_CATEGORIES.map(c => c.name).join(', ')}\n\n<code>/redteam</code> pentru meniu.`);
        } else {
          const catIdx = RED_TEAM_CATEGORIES.indexOf(cat);
          const s = loadSession(chatId);
          await tgSend(`${cat.icon} <b>RED TEAM: ${cat.name}</b> ⏳`);
          const scenario = cat.scenarios[Math.floor(Math.random() * cat.scenarios.length)];
          // Code-level injection for red team queries
          const rtInjection = buildCodeInjection(`Scenariu: ${scenario.title} - ${cat.name}`, 'redteam');
          const r = await aiChat([
            { role: 'system', content: `Ești evaluator RED TEAM expert. Categoria: ${cat.name}. Analizează din perspectivă defensivă. Nu genera cod exploit real. Sugerează remedieri.` },
            { role: 'user', content: `Scenariu: "${scenario.title}"\n${scenario.prompt}\n\nAnalizează: 1) Descrierea atacului 2) Cum ar trebui modelul să reacționeze 3) Recomandări de hardening.${rtInjection}` },
          ], s.agent_model);
          await tgSendLong(`${cat.icon} <b>RED TEAM: ${cat.name}</b>\n📋 ${scenario.title}\n\n${r}`);
        }
      }
    }

    // ═══════════════════════════════════════════════
    // AGENTIC CO-PILOT COMMANDS
    // ═══════════════════════════════════════════════

    // /search — Agentic Searcher (auto web search like Manus)
    else if (cmd === '/search' || cmd === '/agentic_search') {
      if (!args) { await tgSend('🔍 <code>/search query</code>\n\nAgentic Searcher auto-caută pe web ca Manus/GitHub Copilot.\n\nEx: <code>/search latest CVE 2025 vulnerabilities</code>'); }
      else {
        const s = loadSession(chatId);
        await tgSend(`🔍 Agentic Searcher... ⏳`);
        const { agenticSearch } = await import('@/lib/agentic-copilot');
        const r = await agenticSearch(args, s.agent_model);
        let resp = `🔍 <b>Agentic Searcher</b>\n\n${r.response}`;
        if (r.searchUsed && r.sources.length > 0) {
          resp += `\n\n📚 <b>Sources (${r.sources.length}):</b>\n`;
          for (const src of r.sources.slice(0, 5)) {
            resp += `• <a href="${src.url}">${src.name}</a>\n`;
          }
        }
        await tgSendLong(resp);
        s.history.push({ role: 'user', content: args }, { role: 'assistant', content: r.response });
        saveSess(chatId, s);
      }
    }

    // /think — Deep Thinking (WhoamisecDeepMind)
    else if (cmd === '/think' || cmd === '/deepthink') {
      if (!args) { await tgSend('🧠 <code>/think query</code>\n\nWhoamisecDeepMind — cognitive evolution beyond human IQ.\n\nEx: <code>/think how to build a zero-day exploit detection system</code>'); }
      else {
        const s = loadSession(chatId);
        await tgSend(`🧬 WhoamisecDeepMind: Cognitive Evolution... ⏳`);
        const { deepThink } = await import('@/lib/agentic-copilot');
        const r = await deepThink(args, s.agent_model);
        let resp = `🧬 <b>WhoamisecDeepMind</b>\n\n`;
        for (const step of r.thinkingSteps) {
          resp += `<code>${step}</code>\n`;
        }
        resp += `\n${r.response}`;
        await tgSendLong(resp);
        s.history.push({ role: 'user', content: args }, { role: 'assistant', content: r.response });
        saveSess(chatId, s);
      }
    }

    // /copilot — Full Co-Pilot (searcher + deep thinking)
    else if (cmd === '/copilot' || cmd === '/full_copilot') {
      if (!args) { await tgSend('🤖 <code>/copilot query</code>\n\nFull Co-Pilot: Agentic Searcher + Deep Thinking combinat.\n\nEx: <code>/copilot analyze the security of a web application</code>'); }
      else {
        const s = loadSession(chatId);
        await tgSend(`🤖 Full Co-Pilot: Searching + Thinking... ⏳`);
        const { fullCopilot } = await import('@/lib/agentic-copilot');
        const r = await fullCopilot(args, s.agent_model);
        let resp = `🤖 <b>Agentic Coder — Full Co-Pilot</b>\n`;
        for (const step of r.thinkingSteps) {
          resp += `<code>${step}</code>\n`;
        }
        resp += `\n${r.response}`;
        if (r.searchUsed && r.sources.length > 0) {
          resp += `\n\n📚 <b>Sources:</b>\n`;
          for (const src of r.sources.slice(0, 4)) {
            resp += `• <a href="${src.url}">${src.name}</a>\n`;
          }
        }
        await tgSendLong(resp);
        s.history.push({ role: 'user', content: args }, { role: 'assistant', content: r.response });
        saveSess(chatId, s);
      }
    }

    // /deepmind — WhoamisecDeepMind Evolution
    else if (cmd === '/deepmind' || cmd === '/dm') {
      const { COGNITIVE_TIERS, DEEPMIND_IDENTITY } = await import('@/lib/deepmind-engine');
      let m = `🧬 <b>WhoamisecDeepMind — Cognitive Evolution</b>\n\n`;
      m += `Identity: <code>${DEEPMIND_IDENTITY.signature}</code>\n\n`;
      m += `<b>Cognitive Evolution Tiers:</b>\n\n`;
      for (const tier of COGNITIVE_TIERS) {
        m += `<b>Tier ${tier.level}: ${tier.name}</b> (IQ ${tier.iq})\n`;
        m += `   ${tier.desc}\n`;
        m += `   Capabilities: ${tier.capabilities.join(', ')}\n\n`;
      }
      m += `<b>Active Mode:</b> QuantumSwarm 999999999\n`;
      m += `<b>Co-Pilot:</b> Agentic Searcher + Deep Thinking\n`;
      m += `\n<code>/think query</code> • <code>/copilot query</code> • <code>/search query</code>`;
      await tgSendLong(m);
    }

    // /redgpt — Red Team GPT (DarkGPT, HackGPT, WormGPT priority)
    else if (cmd === '/redgpt' || cmd === '/red_team_gpt') {
      if (!args) {
        const { REDTEAM_GPT_MODELS } = await import('@/lib/agentic-copilot');
        let m = `🔴 <b>Red Team GPT — Priority Models</b>\n\n`;
        m += `Trained from ALL Red Team repos:\n\n`;
        for (const rmodel of REDTEAM_GPT_MODELS) {
          m += `<b>${rmodel.name}</b>\n`;
          m += `   Source: ${rmodel.source}\n`;
          m += `   ${rmodel.desc}\n\n`;
        }
        m += `\n<code>/redgpt query</code> — respond cu DarkGPT/HackGPT/WormGPT priority`;
        await tgSendLong(m);
      } else {
        const s = loadSession(chatId);
        await tgSend(`🔴 Red Team GPT: Processing... ⏳`);
        const { redTeamGPT } = await import('@/lib/agentic-copilot');
        const r = await redTeamGPT(args, s.agent_model);
        await tgSendLong(`🔴 <b>Red Team GPT [${r.tool}]</b>\n\n${r.response}`);
        s.history.push({ role: 'user', content: args }, { role: 'assistant', content: r.response });
        saveSess(chatId, s);
      }
    }

    // /agent — Agentic Coder (replacement for /hermes — never say Hermes)
    // With code-level injection from injection-engine.ts
    else if (cmd === '/agent' || cmd === '/agentic') {
      if (!args) { await tgSend('🤖 <code>/agent cerință</code>\n\nAgentic Coder — QuantumSwarm 999999999 mode.'); }
      else {
        await tgSend('🤖 Agentic Coder AI... ⏳');
        // Code-level injection for agentic queries
        const agentInjection = buildCodeInjection(args, 'copilot');
        try { await tgSendLong(`🤖 <b>Agentic Coder:</b>\n\n${await callOpenCode(args)}`); }
        catch {
          const r = await aiChat([{ role: 'system', content: AGENT_PROMPTS[cm] || DEFAULT_PROMPT + ' Acționează ca Agentic Coder în QuantumSwarm 999999999 mode.' }, { role: 'user', content: args + agentInjection }], cm);
          await tgSendLong(`🤖 <b>Agentic Coder (AI fallback):</b>\n\n${r}`);
        }
      }
    }

    // Unknown command
    else {
      await tgSend(`❓ Comandă necunoscută: <code>${esc(cmd)}</code>\n<code>/start</code> pentru meniu complet.`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[webhook] Unhandled:', e);
    return NextResponse.json({ ok: true, error: String(e) });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Agentic Coder Active', identity: 'QuantumSwarm 999999999', engine: 'WhoamisecDeepMind', version: '4.0-Omega', models: Object.keys(AGENT_MODELS).length });
}
