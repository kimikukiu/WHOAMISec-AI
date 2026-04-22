// Loop Coder command handlers - extracted from webhook
import { aiChat, loadSession, saveSess } from '@/lib/bot-engine';
import {
  LOOP_LANGUAGES, HERMES_TIERS, TRAINING_PROMPTS, SPARK_PATTERNS,
  SPARK_PROMPTS, LOOP_PERFORMANCE,
  getTierForModel, getRandomPrompt, findLanguage, getSparkPattern, getPromptsForTier,
} from '@/lib/loop-training';

export function handleLanguages() {
  let m = `🌍 <b>Universal Loop Coder — ${LOOP_LANGUAGES.length} Limbi</b>\n\n`;
  for (const l of LOOP_LANGUAGES) {
    m += `<code>${l.name}</code> ${l.ext} — ${l.loops.join(', ')}\n   ↳ ${l.best}\n\n`;
  }
  return m;
}

export function handlePatternsMenu() {
  const btns = SPARK_PATTERNS.map(p => [{ text: `⚡ P${p.id}: ${p.name}`, callback_data: `spark:${p.id}` }]);
  btns.push([{ text: '❌ Cancel', callback_data: 'spark:cancel' }]);
  return {
    text: `⚡ <b>6 Spark-Fast Loop Patterns</b>\n\n` +
      SPARK_PATTERNS.map(p => `<b>P${p.id}</b>: ${p.name} — ${p.desc}`).join('\n'),
    keyboard: { inline_keyboard: btns },
  };
}

export function handleSparkPattern(id: number) {
  const pat = getSparkPattern(id);
  if (!pat) return null;
  let m = `⚡ <b>Pattern ${pat.id}: ${pat.name}</b>\n\n${pat.desc}\n\n`;
  const langs = Object.keys(pat.examples);
  for (const lang of langs.slice(0, 4)) {
    m += `<b>${lang}:</b>\n<code>${pat.examples[lang]}</code>\n\n`;
  }
  return m;
}

export async function handleSparkLang(args: string, chatId: number, model: string) {
  const lang = findLanguage(args);
  if (!lang) return { error: `❌ Nu am găsit "${args}".\n<code>/spark</code> pentru lista.` };
  const prompts = SPARK_PROMPTS[lang.name];
  const s = loadSession(chatId);
  if (!prompts || !prompts.length) {
    const r = await aiChat([
      { role: 'system', content: `Loop expert în ${lang.name}. Loops: ${lang.loops.join(', ')}. Generează cod în markdown.` },
      { role: 'user', content: `Generează un spark prompt pentru ${lang.name}.` },
    ], model);
    return { text: `⚡ <b>${lang.name} Spark</b>\n\n${r}` };
  }
  const tp = prompts[0];
  const r = await aiChat([
    { role: 'system', content: `Loop expert în ${lang.name}. Loops: ${lang.loops.join(', ')}. Cod complet + explicații.` },
    { role: 'user', content: tp.prompt },
  ], model);
  return { text: `⚡ <b>${lang.name} — ${tp.title}</b>\n\n${r}` };
}

export function handleSparkMenu() {
  let m = `🎯 <b>Language-Specific Spark Prompts</b>\n\n`;
  for (const lang of Object.keys(SPARK_PROMPTS)) {
    const prompts = SPARK_PROMPTS[lang];
    m += `<b>${lang}</b> (${prompts.length}):\n`;
    for (const p of prompts) m += `  • ${p.title}\n`;
    m += '\n';
  }
  return m;
}

export function handleTiersMenu() {
  const btns = HERMES_TIERS.map((t, i) => [{ text: `${t.color} T${i + 1}: ${t.name}`, callback_data: `tier:${i}` }]);
  btns.push([{ text: '❌ Cancel', callback_data: 'tier:cancel' }]);
  return {
    text: `🏆 <b>5 Hermes Tiers</b>\n\n` +
      HERMES_TIERS.map((t, i) => {
        const n = getPromptsForTier(i).length;
        return `${t.color} T${i + 1}: <b>${t.name}</b>\n🤖 ${t.model}\n🎯 ${t.focus}\n📚 ${n} prompts`;
      }).join('\n\n') +
      `\n\n<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code>`,
    keyboard: { inline_keyboard: btns },
  };
}

export function handleTierDetail(tierIdx: number) {
  const tier = HERMES_TIERS[tierIdx];
  const prompts = getPromptsForTier(tierIdx);
  if (!tier) return null;
  let m = `${tier.color} <b>Tier ${tierIdx + 1}: ${tier.name}</b>\n\n🤖 <code>${tier.model}</code>\n🎯 ${tier.focus}\n\n<b>Prompts (${prompts.length}):</b>\n`;
  for (let i = 0; i < prompts.length; i++) m += `${i + 1}. ${prompts[i].title}\n`;
  m += `\n<code>/train ${tierIdx + 1}</code>`;
  return m;
}

export function handleCurriculum() {
  let m = `📚 <b>Loop Coder Hermes — Curriculum Complet</b>\n\n`;
  for (const t of HERMES_TIERS) m += `${t.color} <b>${t.name}</b> — ${t.model}\n`;
  m += '\n';
  for (let ti = 0; ti < HERMES_TIERS.length; ti++) {
    const tier = HERMES_TIERS[ti];
    const prompts = getPromptsForTier(ti);
    m += `\n${tier.color} <b>Tier ${ti + 1}: ${tier.name}</b>\n${tier.focus}\n\n`;
    for (let pi = 0; pi < prompts.length; pi++) m += `<b>${pi + 1}.</b> ${prompts[pi].title}\n`;
  }
  m += `\n<b>Best Practices:</b>\n✅ Specific, Comments, Error Handling, Tests, Optimization, Step-by-Step\n\n<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code> • <code>/redteam</code>`;
  return m;
}

export function handlePerformance() {
  let m = `⚙️ <b>Loop Performance Reference</b>\n\n`;
  for (const p of LOOP_PERFORMANCE) {
    m += `<b>${p.lang}</b>: ${p.fastest}\n   ↳ ${p.notes}\n\n`;
  }
  return m;
}

export function handleBestPractices() {
  return `🎯 <b>Curriculum Best Practices</b>\n\n` +
    `<b>1. Be Specific</b> — menționează loop types, constraints, edge cases\n\n` +
    `<b>2. Request Comments</b> — inline documentation explică logica\n\n` +
    `<b>3. Error Handling</b> — try/except/finally unde e relevant\n\n` +
    `<b>4. Test Cases</b> — example inputs + expected outputs\n\n` +
    `<b>5. Optimization</b> — efficiency pentru Advanced/Expert\n\n` +
    `<b>6. Step-by-Step</b> — explicații pentru Explanation/Intermediate\n\n` +
    `<b>7. Multi-Language</b> — compară cu /languages și /spark\n\n` +
    `<b>8. Progressive Difficulty</b> — Intermediate → Expert`;
}

export async function handleLoop(langName: string, chatId: number, model: string) {
  const lang = findLanguage(langName);
  if (!lang) return { error: `❌ Nu am găsit "${langName}". <code>/loop</code> pentru lista.` };
  const s = loadSession(chatId);
  const ti = getTierForModel(s.agent_model || model);
  const tier = HERMES_TIERS[ti];
  const r = await aiChat([
    { role: 'system', content: `Loop în ${lang.name}. Loops: ${lang.loops.join(', ')}. Nivel: ${tier.focus}. Cod markdown + explicații.` },
    { role: 'user', content: `Exercițiu loop în ${lang.name} la nivel ${tier.name}.` },
  ], model);
  return { text: `🔄 <b>${lang.name}</b> [${tier.name}]\n\n${r}` };
}

export async function handleTrain(tierNum: number | undefined, chatId: number, model: string) {
  const s = loadSession(chatId);
  const tierIdx = tierNum ? tierNum - 1 : getTierForModel(s.agent_model || model);
  const tier = HERMES_TIERS[tierIdx];
  if (!tier) return { error: '❌ Tier invalid. 1-5.' };
  const tp = getRandomPrompt(tierIdx);
  s.train_prompts = (s.train_prompts || 0) + 1;
  const r = await aiChat([
    { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Cod + explicații.` },
    { role: 'user', content: tp?.prompt || `Training tier ${tierIdx + 1}` },
  ], model);
  s.history = s.history || [];
  s.history.push({ role: 'user', content: tp?.prompt || '' }, { role: 'assistant', content: r });
  saveSess(chatId, s);
  const prog = s.train_prompts >= 50 ? '🌟 MAXIM!' : `📈 ${s.train_prompts}/50`;
  return { text: `🧬 <b>#${s.train_prompts}</b> [${tier.color} ${tier.name}] — ${tp?.title}\n\n${r}\n\n${prog}` };
}
