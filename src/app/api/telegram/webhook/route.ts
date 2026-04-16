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
import * as RT from '@/lib/redteam-handler';
import * as LH from '@/lib/loop-handler';

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
  const own = () => userId ? isOwner(userId) : false;
  const tgSend = (t: string) => safe(() => sendMsg(tk, chatId, t));
  const tgSendLong = (t: string) => safe(() => sendLong(tk, chatId, t));
  const tgKb = (t: string, kb: any) => safe(() =>
    fetch(`https://api.telegram.org/bot${tk}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: t, parse_mode: 'HTML', reply_markup: kb }),
    }));
  const tgEdit = (t: string) => safe(() =>
    fetch(`https://api.telegram.org/bot${tk}/editMessageText`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query?.message?.message_id, text: t, parse_mode: 'HTML' }),
    }));

  try {
    // ═══ FILE UPLOADS ═══
    if (msg.document || msg.photo) {
      const session = loadSession(chatId); ensureDir(DOWNLOADS_DIR);
      let fid = '', fn = '', fsz = 0, mime = '';
      if (msg.document) { fid = msg.document.file_id; fn = msg.document.file_name || `f_${Date.now()}`; fsz = msg.document.file_size || 0; mime = msg.document.mime_type || 'application/octet-stream'; }
      else if (msg.photo?.length) { const p = msg.photo[msg.photo.length - 1]; fid = p.file_id; fn = `ph_${Date.now()}.jpg`; fsz = p.file_size || 0; mime = 'image/jpeg'; }
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
        await tgSend(`✅ <b>${esc(fn)}</b>\n📦 ${sz}\n📝 ${pv ? '✅ preview' : '📷 binar'}\n\n<code>/analyze</code> sau <code>/code</code>`);
      } else { await tgSend(`❌ Eroare descărcare`); }
      return NextResponse.json({ ok: true });
    }

    // ═══ CALLBACK QUERIES ═══
    if (update.callback_query) {
      const cb = (update.callback_query.data || '') as string;
      const [type, val] = cb.split(':', 2);
      if (type === 'model' && val === 'cancel') { await tgEdit('❌ Anulat.'); }
      else if (type === 'model' && AGENT_MODELS[val]) { config.glm_model = val; saveConfig(config); const s = loadSession(chatId); s.agent_model = val; saveSess(chatId, s); await tgEdit(`✅ <b>${val}</b>\n${AGENT_MODELS[val].provider}`); }
      else if (type === 'endpoint' && val === 'cancel') { await tgEdit('❌'); }
      else if (type === 'endpoint') { config.glm_endpoint = val === 'coding' ? 'https://api.z.ai/api/coding/paas/v4/chat/completions' : 'https://api.z.ai/api/paas/v4/chat/completions'; saveConfig(config); await tgEdit(`✅ <code>${esc(config.glm_endpoint)}</code>`); }
      else if (type === 'redteam') {
        if (val === 'cancel') { await tgEdit('❌'); }
        else { const r = await RT.handleRedteamCallback(val, cm); if (r) await tgEdit(`${r.icon} <b>${esc(r.name)}</b>\n📋 ${esc(r.title)}\n\n${r.response}`); }
      }
      else if (type === 'spark') {
        if (val === 'cancel') { await tgEdit('❌'); }
        else { const m = LH.handleSparkPattern(parseInt(val)); if (m) await tgEdit(m); }
      }
      else if (type === 'tier') {
        if (val === 'cancel') { await tgEdit('❌'); }
        else { const m = LH.handleTierDetail(parseInt(val)); if (m) await tgEdit(m); }
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ AI CHAT ═══
    if (!text.startsWith('/')) {
      const s = loadSession(chatId); s.history = s.history || [];
      s.history.push({ role: 'user', content: text });
      if (s.history.length > 20) s.history = s.history.slice(-20);
      saveSess(chatId, s);
      try {
        const r = await aiChat([{ role: 'system', content: AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT }, ...s.history], s.agent_model);
        s.history.push({ role: 'assistant', content: r });
        if (s.history.length > 20) s.history = s.history.slice(-20);
        saveSess(chatId, s); await tgSendLong(r);
      } catch (e: any) { await tgSend(`❌ ${esc((e?.message || '').slice(0, 200))}`); }
      return NextResponse.json({ ok: true });
    }

    // ═══ COMMANDS ═══
    const parts = text.trim().split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase().replace('@' + (msg.from?.username || ''), '');
    const args = parts.slice(1).join(' ');

    if (cmd === '/start' || cmd === '/help') {
      const cl = maybeClaimOwner(userId || 0);
      await tgKb(
        `🤖 <b>Hermes Bot v4.0</b>\n\n` +
        `🔗 z.ai API: <b>AUTO</b> (SDK)\n` +
        `🧠 Model: <code>${cm}</code>\n\n` +
        `<b>Loop Coder:</b>\n/languages /patterns /spark\n/loop /tiers /curriculum\n/performance /best_practices\n\n` +
        `<b>Training:</b>\n/train /t1-/t5 /redteam\n\n` +
        `<b>Tools:</b>\n/code /opencode /hermes\n/analyze /files /deploy\n\n` +
        `<code>/models</code> <code>/model</code> <code>/status</code>`,
        { keyboard: [['/status', '/models'], ['/code', '/opencode', '/hermes'], ['/languages', '/spark', '/loop'], ['/tiers', '/train', '/redteam'], ['/analyze', '/files', '/clear']], resize_keyboard: true }
      );
      saveSess(chatId, { history: [], train_prompts: 0, agent_model: cm, files: [], generated: [], context: '' });
    }
    else if (cmd === '/models') {
      let m = '🧠 <b>19 Modele:</b>\n\n'; let pv = '';
      for (const [n, i] of Object.entries(AGENT_MODELS)) { if (i.provider !== pv) { pv = i.provider; m += `\n<b>${pv}</b>:\n`; } m += `${cm === n ? '✅' : '  '}<code>${n.startsWith('queen') ? '👑' : ''}${n}</code> ${i.desc}\n`; }
      await tgSend(m);
    }
    else if (cmd === '/model') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) {
        const btns = Object.entries(AGENT_MODELS).slice(0, 12).map(([n, i]) => [{ text: `${n}`, callback_data: `model:${n}` }]);
        btns.push([{ text: '❌', callback_data: 'model:cancel' }]);
        await tgKb(`Model: <b>${cm}</b>`, { inline_keyboard: btns });
      } else if (AGENT_MODELS[args]) { config.glm_model = args; saveConfig(config); const s = loadSession(chatId); s.agent_model = args; saveSess(chatId, s); await tgSend(`✅ <b>${args}</b>`); }
      else { await tgSend(`❌ <code>/models</code>`); }
    }
    else if (cmd === '/api') { await tgSend(`🔗 <b>z.ai API</b>\n⚡ SDK: ✅ AUTO (via GitHub)\n🧠 Model: <code>${cm}</code>`); }
    else if (cmd === '/status') {
      const s = loadSession(chatId);
      await tgSend(
        `🤖 <b>Hermes Bot v4.0</b>\n🧠 <code>${cm}</code>\n🔗 z.ai: ✅ AUTO\n📱 TG: ✅\n` +
        `🔧 OpenCode: ${existsSync(OPENCODE_BIN) ? '✅' : '⚠️'}\n🤖 Hermes: ${existsSync(HERMES_BIN) ? '✅' : '⚠️'}\n` +
        `📦 GitHub: ${config.github_repo ? '✅' : '❌'}\n👤 Owner: ${getOwnerId() ? '✅' : '❌'}\n` +
        `📁 ${s.files?.length || 0} files | 💻 ${s.generated?.length || 0} gen\n🧬 Train: ${s.train_prompts || 0}/50\n` +
        `🌍 ${LOOP_LANGUAGES.length} limbi | ⚡ ${HERMES_TIERS.length} tiers | 🔴 RED TEAM`
      );
    }
    else if (cmd === '/endpoint') {
      if (!own()) { await tgSend('⛔'); }
      else if (!args) { await tgKb(`Endpoint: <code>${esc(config.glm_endpoint || '')}</code>`, { inline_keyboard: [[{ text: 'Coding', callback_data: 'endpoint:coding' }, { text: 'General', callback_data: 'endpoint:general' }], [{ text: '❌', callback_data: 'endpoint:cancel' }]] }); }
      else { config.glm_endpoint = args.trim(); saveConfig(config); await tgSend(`✅`); }
    }
    else if (cmd === '/setrepo') { if (!own()) { await tgSend('⛔'); } else if (!args) { await tgSend(`<code>${config.github_repo || '—'}</code>`); } else { config.github_repo = args.trim(); saveConfig(config); await tgSend(`✅`); } }
    else if (cmd === '/analyze') {
      const s = loadSession(chatId); const fl = Array.isArray(s.files) ? s.files : [];
      if (!fl.length) { await tgSend('❌ Trimite un fișier.'); }
      else { await tgSend('🔍 ⏳'); let fc = ''; for (const f of fl.slice(0, 5)) { fc += `\n--- ${f.name}\n${f.mime_type} ${f.size}b\n`; if (f.content_preview) fc += trunc(f.content_preview, 2000) + '\n'; } const r = await aiChat([{ role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Analizează.' }, { role: 'user', content: `${args || 'Analizează'}\n${fc}` }], s.agent_model); s.context = r; saveSess(chatId, s); await tgSendLong(r); }
    }
    else if (cmd === '/code') {
      if (!args) { await tgSend('<code>/code cerință</code>'); }
      else {
        const s = loadSession(chatId); await tgSend('⚡ ⏳');
        let ctx = ''; const fl = Array.isArray(s.files) ? s.files : [];
        if (fl.length) { ctx += '\nFIȘIERE:\n'; for (const f of fl.slice(0, 3)) { ctx += `- ${f.name} (${f.size}b)\n`; if (f.content_preview) ctx += trunc(f.content_preview, 1500) + '\n'; } }
        if (s.context) ctx += `\nCTX:\n${trunc(s.context, 2000)}`;
        const r = await aiChat([{ role: 'system', content: (AGENT_PROMPTS[s.agent_model] || DEFAULT_PROMPT) + ' Cod complet markdown.' }, { role: 'user', content: `${args}${ctx}` }], s.agent_model);
        const m = r.match(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/);
        if (m) { const ext = safeExtFromLang(m[1] || 'txt'); const fn = `gen_${Date.now()}.${ext}`; ensureDir(GENERATED_DIR); writeFileSync(join(GENERATED_DIR, fn), m[2].trim(), 'utf-8'); if (!Array.isArray(s.generated)) s.generated = []; s.generated.push(fn); saveSess(chatId, s); await tgSendLong(`✅ <code>${fn}</code>\n\n${r}`); await safe(() => sendDocument(tk, chatId, join(GENERATED_DIR, fn), args.slice(0, 80))); }
        else { ensureDir(GENERATED_DIR); writeFileSync(join(GENERATED_DIR, `code_${Date.now()}.txt`), r, 'utf-8'); await tgSendLong(r); }
      }
    }
    else if (cmd === '/opencode') { if (!args) { await tgSend('<code>/opencode cerință</code>'); } else { await tgSend('🔧 ⏳'); try { await tgSendLong(`🔧 ${await callOpenCode(args)}`); } catch { await tgSendLong(`🔧 ${await aiChat([{ role: 'system', content: DEFAULT_PROMPT + ' OpenCode AI.' }, { role: 'user', content: args }], cm)}`); } } }
    else if (cmd === '/hermes') { if (!args) { await tgSend('<code>/hermes cerință</code>'); } else { await tgSend('🤖 ⏳'); try { await tgSendLong(`🤖 ${await callHermes(args)}`); } catch { await tgSendLong(`🤖 ${await aiChat([{ role: 'system', content: 'Ești HERMES Agent Nous Research.' }, { role: 'user', content: args }], cm)}`); } } }
    else if (cmd === '/files') { const s = loadSession(chatId); ensureDir(DOWNLOADS_DIR); const sf = Array.isArray(s.files) ? s.files : []; const sg = Array.isArray(s.generated) ? s.generated : []; if (!sf.length && !sg.length) { await tgSend('📂 Gol.'); } else { let m = '📂\n'; if (sf.length) { m += '📥 Upload:\n'; for (const f of sf.slice(-10)) m += `• ${esc(f.name)}\n`; } if (sg.length) { m += '💻 Gen:\n'; for (const f of sg.slice(-10)) m += `• ${esc(f)}\n`; } await tgSend(m); } }
    else if (cmd === '/clear') { saveSess(chatId, { history: [], train_prompts: 0, agent_model: cm, files: [], generated: [], context: '' }); await tgSend('🧹 Reset!'); }
    else if (cmd === '/deploy') { if (!own()) { await tgSend('⛔'); } else if (!config.github_repo) { await tgSend('❌ /setrepo'); } else { await tgSend('🚀 ⏳'); const r = await gitDeploy(config.github_repo); await tgSend(r.msg); } }
    else if (cmd === '/expo') { if (!own()) { await tgSend('⛔'); } else { await tgSend('📱 ⏳'); const r = scaffoldExpo(); await tgSend(r.msg); } }

    // ═══ LOOP CODER ═══
    else if (cmd === '/languages' || cmd === '/langs') { await tgSendLong(LH.handleLanguages()); }
    else if (cmd === '/patterns') { const r = LH.handlePatternsMenu(); await tgKb(r.text, r.keyboard); }
    else if (cmd === '/spark') {
      if (!args) { await tgSend(LH.handleSparkMenu()); }
      else { const r = await LH.handleSparkLang(args, chatId, cm); if (r.error) await tgSend(r.error); else await tgSendLong(r.text); }
    }
    else if (cmd === '/tiers' || cmd === '/tier') { const r = LH.handleTiersMenu(); await tgKb(r.text, r.keyboard); }
    else if (cmd === '/curriculum') { await tgSendLong(LH.handleCurriculum()); }
    else if (cmd === '/performance' || cmd === '/perf') { await tgSendLong(LH.handlePerformance()); }
    else if (cmd === '/best_practices') { await tgSendLong(LH.handleBestPractices()); }
    else if (cmd === '/loop') {
      if (!args) { let m = '🔄 <b>Loop Coder</b>\n\n'; for (const l of LOOP_LANGUAGES) m += `<code>${l.name}</code> — ${l.loops.join(', ')}\n`; m += `\n<code>/loop python</code>`; await tgSend(m); }
      else { const r = await LH.handleLoop(args, chatId, cm); if (r.error) await tgSend(r.error); else await tgSendLong(r.text); }
    }
    else if (cmd === '/train') {
      const n = args ? parseInt(args) : undefined;
      const r = await LH.handleTrain(n, chatId, cm);
      if (r.error) await tgSend(r.error); else await tgSendLong(r.text);
    }
    else if (cmd === '/train_prompt') {
      const s = loadSession(chatId); s.train_prompts = (s.train_prompts || 0) + 1;
      const ti = getTierForModel(s.agent_model); const tp = getRandomPrompt(ti); const tier = HERMES_TIERS[ti];
      await tgSend(`🧬 #${s.train_prompts} ⏳`);
      const r = await aiChat([{ role: 'system', content: `HERMES Tier ${tier.name}. ${tier.focus}.` }, { role: 'user', content: tp?.prompt || `Training #${s.train_prompts}` }], s.agent_model);
      s.history = s.history || []; s.history.push({ role: 'user', content: tp?.prompt || '' }, { role: 'assistant', content: r }); saveSess(chatId, s);
      await tgSendLong(`🧬 <b>#${s.train_prompts}</b> [${tier.name}]\n\n${r}`);
    }
    else if (cmd.match(/^\/t([1-5])$/)) {
      const ti = parseInt(cmd[2]) - 1; const r = await LH.handleTrain(ti + 1, chatId, cm);
      if (r.error) await tgSend(r.error); else await tgSendLong(r.text);
    }
    else if (cmd.match(/^\/p(\d{1,2})$/)) {
      const num = parseInt(cmd.match(/^\/p(\d{1,2})$/)![1]);
      if (LOOP_PROBLEMS[num]) await tgSend(LOOP_PROBLEMS[num]); else await tgSend('❌ /p1—/p12');
    }

    // ═══ RED TEAM ═══
    else if (cmd === '/redteam' || cmd === '/rt') {
      if (!args) { const r = RT.handleRedteamMenu(); await tgKb(r.text, r.keyboard); }
      else { const r = await RT.handleRedteamCategory(args, cm); if (!r) await tgSend(`❌ <code>/redteam</code>`); else await tgSendLong(`${r.icon} <b>${esc(r.name)}</b>\n📋 ${esc(r.title)}\n\n${r.response}`); }
    }

    else { await tgSend(`❓ <code>${esc(cmd)}</code>\n<code>/start</code>`); }

    return NextResponse.json({ ok: true });
  } catch (e) { console.error('[webhook]', e); return NextResponse.json({ ok: true }); }
}

export async function GET() { return NextResponse.json({ status: 'Hermes Bot Active', version: '4.0', models: 19 }); }
