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
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LOOP_LANGUAGES, HERMES_TIERS, getTierForModel, getRandomPrompt, findLanguage } from '@/lib/loop-training';

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
          await tgEdit(`✅ Endpoint: <code>${esc(config.glm_endpoint)}</code>`);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ AI CHAT (non-command text) ═══
    if (!text.startsWith('/')) {
      const s = loadSession(chatId);
      s.history = s.history || [];
      s.history.push({ role: 'user', content: text });
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
      await tgSend(
        `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
        `🔗 z.ai API: <b>AUTO</b> (conectat via GitHub)\n\n` +
        `<b>Comenzi principale:</b>\n` +
        `/api - status API (auto)\n` +
        `/status - status complet\n` +
        `/models - toate modelele (19)\n` +
        `/model - schimbă modelul\n` +
        `/endpoint - schimbă endpoint\n` +
        `/analyze - analizează fișiere\n` +
        `/code cerință - generează cod\n` +
        `/opencode cerință - OpenCode AI\n` +
        `/hermes cerință - Hermes Agent\n` +
        `/files - listează fișiere\n` +
        `/setrepo URL - setează repo\n` +
        `/deploy - push pe GitHub\n` +
        `/expo - proiect Expo\n` +
        `/train_prompt - antrenare neurală\n` +
        `/loop [language] - Loop Coder\n` +
        `/p1-/p12 - probleme loop\n` +
        `/clear - resetează sesiunea\n\n` +
        `👑 Queen Ultra + Queen Max\n` +
        `🔧 OpenCode + Hermes Agent\n` +
        `📂 Trimite fișiere direct!\n` +
        (cl ? `\n✅ Setat ca owner.\n` : '')
      );
      await tgKb('⬇️ Meniu rapid:', {
        keyboard: [
          ['/status', '/models'],
          ['/code', '/opencode', '/hermes'],
          ['/analyze', '/files'],
          ['/model', '/endpoint'],
          ['/deploy', '/expo'],
          ['/train_prompt', '/loop', '/clear'],
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
        const s = loadSession(chatId); s.agent_model = args; saveSess(chatId, s);
        await tgSend(`✅ Model: <b>${args}</b>\n${AGENT_MODELS[args].provider} — ${AGENT_MODELS[args].desc}`);
      } else { await tgSend(`❌ Model inexistent. <code>/models</code>`); }
    }
    // /api
    else if (cmd === '/api') {
      await tgSend(
        `🔗 <b>z.ai API Status</b>\n\n` +
        `⚡ SDK: ✅ auto via GitHub\n` +
        `🔑 Manual: ${config.glm_api_key ? esc(maskSecret(config.glm_api_key)) : '— (nu e nevoie)'}\n` +
        `🧠 Model: <code>${cm}</code>\n\n` +
        `✅ API-ul merge automat!\n\n` +
        `Opțional:\n<code>/api set CHEIE</code>\n<code>/api clear</code>`
      );
    }
    // /status
    else if (cmd === '/status') {
      const s = loadSession(chatId);
      await tgSend(
        `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
        `🧠 Model: <code>${cm}</code>\n` +
        `🔗 z.ai API: ✅ (SDK auto via GitHub)\n` +
        `📱 Telegram: ✅\n` +
        `🔧 OpenCode: ${existsSync(OPENCODE_BIN) ? '✅' : '⚠️'}\n` +
        `🤖 Hermes: ${existsSync(HERMES_BIN) ? '✅' : '⚠️'}\n` +
        `📦 GitHub: ${config.github_repo ? '✅' : '❌'}\n` +
        `👤 Owner: ${getOwnerId() ? '✅' : '❌'}\n` +
        `📁 Fișiere: ${s.files?.length || 0}\n` +
        `💻 Cod gen: ${s.generated?.length || 0}\n` +
        `🧬 Training: ${s.train_prompts || 0}/50`
      );
    }
    // /endpoint
    else if (cmd === '/endpoint') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) {
        await tgKb(`📝 Endpoint: <code>${esc(config.glm_endpoint || 'default')}</code>`, {
          inline_keyboard: [
            [{ text: 'Coding API', callback_data: 'endpoint:coding' }, { text: 'General API', callback_data: 'endpoint:general' }],
            [{ text: '❌ Cancel', callback_data: 'endpoint:cancel' }],
          ],
        });
      } else { config.glm_endpoint = args.trim(); saveConfig(config); await tgSend(`✅ <code>${esc(args.trim())}</code>`); }
    }
    // /setrepo
    else if (cmd === '/setrepo') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) { await tgSend(`📝 <code>${config.github_repo || '—'}</code>`); }
      else { config.github_repo = args.trim(); saveConfig(config); await tgSend(`✅ <code>${esc(args.trim())}</code>`); }
    }
    // /analyze
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
        const r = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Ești expert în analiză. Analizează fișierele.' },
          { role: 'user', content: `${args || 'Analizează'}\n\nFIȘIERE:${fc}` },
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
        const r = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Generează cod complet cu importuri, comentarii și error handling. Pune codul în bloc markdown.' },
          { role: 'user', content: `CERINȚĂ: ${args}${ctx}` },
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
    // /hermes
    else if (cmd === '/hermes') {
      if (!args) { await tgSend('📝 <code>/hermes cerință</code>'); }
      else {
        await tgSend('🤖 Hermes Agent... ⏳');
        try { await tgSendLong(`🤖 <b>Hermes Agent:</b>\n\n${await callHermes(args)}`); }
        catch {
          const r = await aiChat([{ role: 'system', content: 'Ești HERMES Agent de Nous Research, self-improving. Răspunde în română.' }, { role: 'user', content: args }], cm);
          await tgSendLong(`🤖 <b>Hermes AI (fallback):</b>\n\n${r}`);
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
    // /train_prompt
    else if (cmd === '/train_prompt') {
      const s = loadSession(chatId);
      s.train_prompts = (s.train_prompts || 0) + 1;
      const lvl = s.train_prompts;
      const ti = getTierForModel(s.agent_model);
      const tp = getRandomPrompt(ti);
      const tier = HERMES_TIERS[ti];
      await tgSend(`🧬 <b>Training #${lvl}</b> [${tier.name}]\n📖 ${tp?.title || 'Exercițiu'}\n⏳`);
      const r = await aiChat([
        { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Generează cod complet cu explicații.` },
        { role: 'user', content: tp?.prompt || args || `Training #${lvl}` },
      ], s.agent_model);
      s.history = s.history || [];
      s.history.push({ role: 'user', content: tp?.prompt || args }, { role: 'assistant', content: r });
      saveSess(chatId, s);
      const prog = lvl >= 50 ? '🌟 MAXIM!' : `📈 ${lvl}/50`;
      await tgSendLong(`🧬 <b>#${lvl}</b> [${tier.name}]\n\n${r}\n\n${prog}`);
    }
    // /loop
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
    // /p1 - /p12
    else {
      const pm = cmd.match(/^\/p(\d{1,2})$/);
      if (pm) {
        const num = parseInt(pm[1]);
        if (LOOP_PROBLEMS[num]) { await tgSend(LOOP_PROBLEMS[num]); }
        else { await tgSend(`❌ /p1 — /p12`); }
      }
      // Unknown command
      else { await tgSend(`❓ Comandă necunoscută: <code>${esc(cmd)}</code>\n<code>/start</code> pentru meniu.`); }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[webhook] Unhandled:', e);
    return NextResponse.json({ ok: true, error: String(e) });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Hermes Bot Active', version: '4.0', models: Object.keys(AGENT_MODELS).length });
}
