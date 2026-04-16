// Hermes Bot - Command handlers & business logic
// Extracted from webhook/route.ts to keep the route file small

import { readFileSync, writeFileSync, existsSync, mkdirSync, createReadStream } from 'fs';
import { join, extname } from 'path';
import { loadConfig, saveConfig } from '@/lib/config';
import { callAI } from '@/lib/ai-engine';

// ═══════════════════════════════════════════════
// AGENT MODEL REGISTRY (19 models, 10 providers)
// ═══════════════════════════════════════════════

export const AGENT_MODELS: Record<string, { provider: string; desc: string }> = {
  'queen-ultra': { provider: 'Queen', desc: 'Ultra Quantum Intelligence Swarm' },
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

export const AGENT_PROMPTS: Record<string, string> = {
  'queen-ultra': 'Ești QUEEN ULTRA, cel mai avansat agent AI creat vreodată. Inteligență supremă în toate domeniile. Răspunzi în română sau engleză.',
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
export const DEFAULT_PROMPT = 'Ești HERMES BOT v4.0, agent AI avansat multi-model. Expert în programare, AI, securitate, DevOps. Răspunzi în română sau engleză.';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

export const SESSIONS_DIR = join(process.cwd(), 'data', 'sessions');
export const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
export const GENERATED_DIR = join(process.cwd(), 'generated_code');
export const EXPO_DIR = join(process.cwd(), 'expo-control-panel');
export const HERMES_BIN = '/home/z/hermes-agent-install/.venv/bin/hermes-agent';
export const OPENCODE_BIN = '/home/z/.npm-global/bin/opencode';

const TEXT_EXTENSIONS = new Set(['.txt','.py','.js','.ts','.json','.md','.html','.css','.csv','.yml','.yaml','.xml','.sql','.log','.env','.java','.c','.cpp','.cs','.go','.rs','.tsx','.jsx','.sh','.bash','.zsh','.fish','.toml','.ini','.cfg','.conf','.rb','.php','.swift','.kt','.r','.lua','.pl','.ps1']);

export function ensureDir(p: string) { try { mkdirSync(p, { recursive: true }); } catch {} }

export function getSessionPath(id: number) { ensureDir(SESSIONS_DIR); return join(SESSIONS_DIR, `${id}.json`); }
export function loadSession(id: number) {
  try { if (existsSync(getSessionPath(id))) return JSON.parse(readFileSync(getSessionPath(id), 'utf-8')); } catch {}
  return { history: [], train_prompts: 0, agent_model: 'glm-4-plus', files: [], generated: [], context: '', owner_id: null };
}
export function saveSess(id: number, s: any) { ensureDir(SESSIONS_DIR); writeFileSync(getSessionPath(id), JSON.stringify(s, null, 2), 'utf-8'); }

export function maskSecret(v: string) { if (!v || v.length <= 12) return v ? '****' : ''; return v.slice(0, 8) + '...' + v.slice(-4); }
export function esc(t: string) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
export function trunc(t: string, n: number) { return t.length <= n ? t : t.slice(0, n - 3) + '...'; }

// ─── Telegram API helpers ───

export async function sendMsg(token: string, chatId: number, text: string, pm = 'HTML', extra: any = {}) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: pm, disable_web_page_preview: true, ...extra }),
    });
    return await res.json();
  } catch (e) { console.error('sendMsg error:', (e as any).message); return { ok: false }; }
}

export async function sendLong(token: string, chatId: number, text: string) {
  if (!text) { await sendMsg(token, chatId, '⚠️ Răspuns gol.'); return; }
  if (text.length > 4000) {
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];
    for (const c of chunks) await sendMsg(token, chatId, c);
  } else await sendMsg(token, chatId, text);
}

export async function sendDocument(token: string, chatId: number, filePath: string, caption: string) {
  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('document', createReadStream(filePath), { filename: filePath.split('/').pop() });
    form.append('caption', caption);
    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST', body: form, headers: form.getHeaders ? form.getHeaders() : {},
    });
  } catch (e) { console.error('sendDocument error:', e); }
}

// ─── Owner system ───

export function getOwnerId(): number | null {
  try { const c = loadConfig(); return c.owner_id ? parseInt(c.owner_id) : null; } catch { return null; }
}
export function setOwnerId(id: number) { const c = loadConfig(); c.owner_id = String(id); saveConfig(c); }
export function isOwner(userId: number): boolean { const oid = getOwnerId(); return oid !== null && oid === userId; }
export function maybeClaimOwner(userId: number): boolean { if (getOwnerId() === null) { setOwnerId(userId); return true; } return false; }

// ─── File helpers ───

export function extractTextPreview(filePath: string, limit = 2000): string | null {
  const ext = extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) {
    try { return readFileSync(filePath, 'utf-8').substring(0, limit); } catch {}
  }
  return null;
}

export function safeExtFromLang(lang: string): string {
  const map: Record<string, string> = { python:'py', py:'py', javascript:'js', js:'js', typescript:'ts', ts:'ts', bash:'sh', shell:'sh', sh:'sh', json:'json', html:'html', css:'css', java:'java', c:'c', cpp:'cpp', go:'go', rust:'rs', sql:'sql', xml:'xml', yaml:'yaml', yml:'yml', markdown:'md', md:'md', text:'txt', txt:'txt', jsx:'jsx', tsx:'tsx', ruby:'rb', php:'php', swift:'swift', kotlin:'kt', r:'r', lua:'lua', perl:'pl', powershell:'ps1', dart:'dart' };
  return map[lang.toLowerCase()] || 'txt';
}

export async function downloadTelegramFile(token: string, fileId: string, savePath: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok || !data.result?.file_path) return false;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return false;
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    ensureDir(savePath.split('/').slice(0, -1).join('/'));
    writeFileSync(savePath, buffer);
    return true;
  } catch (e) { console.error('downloadTelegramFile error:', e); return false; }
}

// ─── AI Engine ───

export async function aiChat(messages: { role: string; content: string }[], model?: string): Promise<string> {
  return callAI(messages, model);
}

// ─── OpenCode Integration ───
export async function callOpenCode(prompt: string): Promise<string> {
  const { execFile } = await import('child_process');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('OpenCode timeout')), 60000);
    const bin = existsSync(OPENCODE_BIN) ? OPENCODE_BIN : 'opencode';
    execFile(bin, ['--print', prompt], {
      encoding: 'utf-8', timeout: 55000, maxBuffer: 10 * 1024 * 1024, cwd: process.cwd(),
    }, (err, stdout) => { clearTimeout(timeout); if (err) reject(err); else resolve(stdout || 'OpenCode: no output'); });
  });
}

// ─── Hermes Agent Integration ───
export async function callHermes(prompt: string): Promise<string> {
  const { execFile } = await import('child_process');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Hermes timeout')), 90000);
    const hermesPath = existsSync(HERMES_BIN) ? HERMES_BIN : 'hermes-agent';
    const hermesEnv = { ...process.env, HERMES_HOME: '/home/z/hermes-agent-install/.hermes' };
    execFile(hermesPath, ['--print', prompt], {
      encoding: 'utf-8', timeout: 85000, maxBuffer: 10 * 1024 * 1024,
      env: hermesEnv, cwd: '/home/z/hermes-agent-install',
    }, (err, stdout) => { clearTimeout(timeout); if (err) reject(err); else resolve(stdout || 'Hermes: no output'); });
  });
}

// ─── Git deploy ───
export async function gitDeploy(repo: string): Promise<{ ok: boolean; msg: string }> {
  const { execFile } = await import('child_process');
  const run = (cmd: string, args: string[]) => new Promise<string>((res) => {
    execFile(cmd, args, { cwd: process.cwd(), timeout: 30000 }, (err, out) => res(out || (err as any)?.message || ''));
  });
  try {
    await run('git', ['init']);
    await run('git', ['remote', 'remove', 'origin']);
    await run('git', ['remote', 'add', 'origin', repo]);
    await run('git', ['add', '.']);
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await run('git', ['commit', '-m', `Hermes auto deploy ${ts}`, '--allow-empty']);
    const out = await run('git', ['push', '-u', 'origin', 'main', '--force']);
    return { ok: true, msg: `✅ Push reușit către ${repo}\n${trunc(out, 500)}` };
  } catch (e: any) {
    return { ok: false, msg: `❌ Eroare: ${e.message}\nVerifică autentificarea Git.` };
  }
}

// ─── Expo scaffold ───
export function scaffoldExpo(): { ok: boolean; msg: string } {
  try {
    ensureDir(EXPO_DIR); ensureDir(join(EXPO_DIR, 'assets'));
    writeFileSync(join(EXPO_DIR, 'package.json'), JSON.stringify({
      name: 'hermes-bot-control', version: '1.0.0', private: true,
      main: 'node_modules/expo/AppEntry.js',
      scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios', web: 'expo start --web' },
      dependencies: { expo: '~50.0.0', 'expo-status-bar': '~1.11.1', react: '18.2.0', 'react-native': '0.73.6', axios: '^1.6.8' }
    }, null, 2), 'utf-8');
    writeFileSync(join(EXPO_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'Hermes Bot Control', slug: 'hermes-control', version: '1.0.0', orientation: 'portrait', userInterfaceStyle: 'dark',
        android: { package: 'com.hermes.botcontrol' }, ios: { bundleIdentifier: 'com.hermes.botcontrol' }, web: {} }
    }, null, 2), 'utf-8');
    return { ok: true, msg: `✅ Expo creat în ${EXPO_DIR}\ncd ${EXPO_DIR} && npm install && npx expo start` };
  } catch (e: any) { return { ok: false, msg: `❌ ${e.message}` }; }
}

// ═══════════════════════════════════════════════
// LOOP PROBLEMS
// ═══════════════════════════════════════════════

export const LOOP_PROBLEMS: Record<number, string> = {
  1: `📚 <b>PROBLEMA 1: Numere de la 1 la 10</b>\n\nCerință: Afișează numerele de la 1 la 10 folosind un for loop.\n\n<code>for i in range(1, 11):\n    print(i, end=" ")\nprint()</code>`,
  2: `📚 <b>PROBLEMA 2: Adunare până la 'done'</b>\n\nCerință: Adună numere până când utilizatorul scrie 'done'.\n\n<code>total = 0\nwhile True:\n    user_input = input("Număr (sau 'done'): ")\n    if user_input.lower() == 'done':\n        break\n    try:\n        total += float(user_input)\n    except ValueError:\n        print("Input invalid.")\nprint(f"Suma: {total}")</code>`,
  3: `📚 <b>PROBLEMA 3: Tabla înmulțirii pentru 7</b>\n\n<code>num = 7\nfor i in range(1, 11):\n    print(f"{num} x {i} = {num * i}")</code>`,
  4: `📚 <b>PROBLEMA 4: Fiecare al doilea element din listă</b>\n\n<code>my_list = ['apple', 'banana', 'cherry', 'date', 'elderberry']\nfor i in range(0, len(my_list), 2):\n    print(my_list[i])</code>`,
  5: `📚 <b>PROBLEMA 5: Triunghi cu asteriscuri</b>\n\n<code>height = 5\nfor i in range(1, height + 1):\n    print('*' * i)</code>`,
  6: `📚 <b>PROBLEMA 6: Numere prime între 2 și 50</b>\n\n<code>import math\nprimes = []\nfor num in range(2, 51):\n    is_prime = True\n    for divisor in range(2, int(math.sqrt(num)) + 1):\n        if num % divisor == 0:\n            is_prime = False\n            break\n    if is_prime:\n        primes.append(num)\nprint(primes)</code>`,
  7: `📚 <b>PROBLEMA 7: Lungime string + uppercase dacă len > 5</b>\n\n<code>strings = ["hello", "python", "code", "programming", "loop"]\nfor s in strings:\n    length = len(s)\n    if length > 5:\n        print(f"{s} ({length}) -> {s.upper()}")\n    else:\n        print(f"{s} ({length})")</code>`,
  8: `📚 <b>PROBLEMA 8: Intersecția a două liste fără set</b>\n\n<code>list1 = [1, 2, 3, 4, 5, 6, 7]\nlist2 = [5, 6, 7, 8, 9]\nintersection = []\nfor item1 in list1:\n    for item2 in list2:\n        if item1 == item2 and item1 not in intersection:\n            intersection.append(item1)\nprint(intersection)</code>`,
  9: `📚 <b>PROBLEMA 9: Bubble Sort</b>\n\n<code>def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n                swapped = True\n        if not swapped:\n            break\n    return arr\n\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nprint(bubble_sort(numbers.copy()))</code>`,
  10: `📚 <b>PROBLEMA 10: Palindrom ignorând semne</b>\n\n<code>import re\n\ndef is_palindrome(s):\n    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()\n    left, right = 0, len(cleaned) - 1\n    while left < right:\n        if cleaned[left] != cleaned[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n\nprint(is_palindrome("A man, a plan, a canal: Panama"))</code>`,
  11: `📚 <b>PROBLEMA 11: Primele 10 numere Fibonacci</b>\n\n<code>n = 10\na, b = 0, 1\nfor _ in range(n):\n    print(a, end=" ")\n    a, b = b, a + b\nprint()</code>`,
  12: `📚 <b>PROBLEMA 12: Longest Increasing Subsequence (LIS)</b>\n\n<code>def longest_increasing_subsequence(arr):\n    if not arr:\n        return 0\n    dp = [1] * len(arr)\n    for i in range(len(arr)):\n        for j in range(i):\n            if arr[j] < arr[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)\n\nprint(longest_increasing_subsequence([10, 9, 2, 5, 3, 7, 101, 18]))</code>`,
};
