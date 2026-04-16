import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig } from '@/lib/config';
import { callAI } from '@/lib/ai-engine';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, createWriteStream } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';

// ═══════════════════════════════════════════════
// AGENT MODEL REGISTRY (19 models, 10 providers)
// ═══════════════════════════════════════════════

const AGENT_MODELS: Record<string, { provider: string; desc: string }> = {
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
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════

const SESSIONS_DIR = join(process.cwd(), 'data', 'sessions');
const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
const GENERATED_DIR = join(process.cwd(), 'generated_code');
const EXPO_DIR = join(process.cwd(), 'expo-control-panel');
const HERMES_BIN = '/home/z/hermes-agent-install/.venv/bin/hermes-agent';
const OPENCODE_BIN = '/home/z/.npm-global/bin/opencode';

const TEXT_EXTENSIONS = new Set(['.txt','.py','.js','.ts','.json','.md','.html','.css','.csv','.yml','.yaml','.xml','.sql','.log','.env','.java','.c','.cpp','.cs','.go','.rs','.tsx','.jsx','.sh','.bash','.zsh','.fish','.toml','.ini','.cfg','.conf','.rb','.php','.swift','.kt','.r','.lua','.pl','.ps1']);

function ensureDir(p: string) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function getSessionPath(id: number) { ensureDir(SESSIONS_DIR); return join(SESSIONS_DIR, `${id}.json`); }
function loadSession(id: number) {
  try { if (existsSync(getSessionPath(id))) return JSON.parse(readFileSync(getSessionPath(id), 'utf-8')); } catch {}
  return { history: [], train_prompts: 0, agent_model: 'glm-4-plus', files: [], generated: [], context: '', owner_id: null };
}
function saveSess(id: number, s: any) { ensureDir(SESSIONS_DIR); writeFileSync(getSessionPath(id), JSON.stringify(s, null, 2), 'utf-8'); }

function maskSecret(v: string) { if (!v || v.length <= 12) return v ? '****' : ''; return v.slice(0, 8) + '...' + v.slice(-4); }
function esc(t: string) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function trunc(t: string, n: number) { return t.length <= n ? t : t.slice(0, n - 3) + '...'; }

// ─── Telegram API helpers ───

async function sendMsg(token: string, chatId: number, text: string, pm = 'HTML', extra: any = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: pm, disable_web_page_preview: true, ...extra }),
    });
    clearTimeout(timeout);
    return await res.json();
  } catch (e) { console.error('sendMsg error:', (e as any).message); return { ok: false }; }
}

async function sendLong(token: string, chatId: number, text: string) {
  if (!text) { await sendMsg(token, chatId, '⚠️ Răspuns gol.'); return; }
  if (text.length > 4000) {
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];
    for (const c of chunks) await sendMsg(token, chatId, c);
  } else await sendMsg(token, chatId, text);
}

async function sendDocument(token: string, chatId: number, filePath: string, caption: string) {
  try {
    const { createReadStream } = await import('fs');
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('document', createReadStream(filePath), { filename: filePath.split('/').pop() });
    form.append('caption', caption);
    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders ? form.getHeaders() : {},
    });
  } catch (e) { console.error('sendDocument error:', e); }
}

// ─── Owner system ───

function getOwnerId(): number | null {
  try { const c = loadConfig(); return c.owner_id ? parseInt(c.owner_id) : null; } catch { return null; }
}
function setOwnerId(id: number) {
  const c = loadConfig(); c.owner_id = String(id); saveConfig(c);
}
function isOwner(userId: number): boolean {
  const oid = getOwnerId();
  return oid !== null && oid === userId;
}
function maybeClaimOwner(userId: number): boolean {
  if (getOwnerId() === null) { setOwnerId(userId); return true; }
  return false;
}

// ─── File helpers ───

function extractTextPreview(filePath: string, limit = 2000): string | null {
  const ext = extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) {
    try { return readFileSync(filePath, 'utf-8').substring(0, limit); } catch {}
  }
  return null;
}

function safeExtFromLang(lang: string): string {
  const map: Record<string, string> = { python:'py', py:'py', javascript:'js', js:'js', typescript:'ts', ts:'ts', bash:'sh', shell:'sh', sh:'sh', json:'json', html:'html', css:'css', java:'java', c:'c', cpp:'cpp', go:'go', rust:'rs', sql:'sql', xml:'xml', yaml:'yaml', yml:'yml', markdown:'md', md:'md', text:'txt', txt:'txt', jsx:'jsx', tsx:'tsx', ruby:'rb', php:'php', swift:'swift', kotlin:'kt', r:'r', lua:'lua', perl:'pl', powershell:'ps1', dart:'dart' };
  return map[lang.toLowerCase()] || 'txt';
}

async function downloadTelegramFile(token: string, fileId: string, savePath: string): Promise<boolean> {
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

async function aiChat(messages: { role: string; content: string }[], model?: string): Promise<string> {
  return callAI(messages, model);
}

// ─── OpenCode Integration ───
async function callOpenCode(prompt: string): Promise<string> {
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
async function callHermes(prompt: string): Promise<string> {
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
async function gitDeploy(repo: string): Promise<{ ok: boolean; msg: string }> {
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
function scaffoldExpo(): { ok: boolean; msg: string } {
  try {
    ensureDir(EXPO_DIR);
    ensureDir(join(EXPO_DIR, 'assets'));

    writeFileSync(join(EXPO_DIR, 'package.json'), JSON.stringify({
      name: 'hermes-bot-control', version: '1.0.0', private: true,
      main: 'node_modules/expo/AppEntry.js',
      scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios', web: 'expo start --web' },
      dependencies: { expo: '~50.0.0', 'expo-status-bar': '~1.11.1', react: '18.2.0', 'react-native': '0.73.6', axios: '^1.6.8' }
    }, null, 2), 'utf-8');

    writeFileSync(join(EXPO_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'Hermes Bot Control', slug: 'hermes-telegram-control', version: '1.0.0',
        orientation: 'portrait', userInterfaceStyle: 'dark',
        android: { package: 'com.hermes.botcontrol' }, ios: { bundleIdentifier: 'com.hermes.botcontrol' }, web: {} }
    }, null, 2), 'utf-8');

    writeFileSync(join(EXPO_DIR, 'App.js'), `import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

export default function App() {
  const [botToken, setBotToken] = useState('');
  const [logs, setLogs] = useState([]);
  const addLog = (message) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs(prev => [\`\${stamp} \${message}\`, ...prev].slice(0, 30));
  };
  const sendCommand = async (command) => {
    if (!botToken) { Alert.alert('Lipsește tokenul', 'Introdu Telegram Bot Token.'); return; }
    try {
      const updates = await axios.get(\`https://api.telegram.org/bot\${botToken}/getUpdates\`);
      const items = updates.data.result || [];
      if (!items.length) { addLog('⚠️ Nu există chat recent.'); return; }
      const chatId = items[items.length - 1].message.chat.id;
      await axios.post(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, { chat_id: chatId, text: command });
      addLog(\`✅ Trimis: \${command}\`);
    } catch (e) { addLog(\`❌ Eroare: \${e.message}\`); }
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>🤖 Hermes Control</Text>
      <TextInput style={styles.input} placeholder="Telegram Bot Token" placeholderTextColor="#7f8c8d" value={botToken} onChangeText={setBotToken} />
      {['/status','/files','/clear','/models','/code','/analyze','/deploy','/train_prompt'].map(cmd => (
        <TouchableOpacity key={cmd} style={styles.button} onPress={() => sendCommand(cmd)}>
          <Text style={styles.buttonText}>{cmd}</Text>
        </TouchableOpacity>
      ))}
      <ScrollView style={styles.logBox}>
        {logs.map((log, i) => <Text key={i} style={styles.logText}>{log}</Text>)}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1020', paddingTop: 60, paddingHorizontal: 16 },
  title: { color: '#60a5fa', fontSize: 26, fontWeight: '700', marginBottom: 20 },
  input: { backgroundColor: '#111827', color: 'white', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700' },
  logBox: { marginTop: 14, backgroundColor: '#111827', borderRadius: 10, padding: 10 },
  logText: { color: '#d1fae5', fontSize: 12, marginBottom: 6 }
});`, 'utf-8');

    return { ok: true, msg: `✅ Proiect Expo creat în: ${EXPO_DIR}\n\nComenzi:\ncd ${EXPO_DIR}\nnpm install\nnpx expo start` };
  } catch (e: any) {
    return { ok: false, msg: `❌ Eroare: ${e.message}` };
  }
}

// ═══════════════════════════════════════════════
// LOOP PROBLEMS (with full Python solutions)
// ═══════════════════════════════════════════════

const LOOP_PROBLEMS: Record<number, string> = {
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

// ═══════════════════════════════════════════════
// WEBHOOK POST - Main handler
// ═══════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update.message || update.callback_query?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text || message.caption || '';
    const config = loadConfig();
    if (!config.telegram_token) return NextResponse.json({ ok: true });
    const token = config.telegram_token;

    // ═══ FILE UPLOAD HANDLER (documents + photos) ═══
    if (message.document || message.photo) {
      const session = loadSession(chatId);
      ensureDir(DOWNLOADS_DIR);

      let fileId = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = '';

      if (message.document) {
        fileId = message.document.file_id;
        fileName = message.document.file_name || `file_${Date.now()}`;
        fileSize = message.document.file_size || 0;
        mimeType = message.document.mime_type || 'application/octet-stream';
      } else if (message.photo) {
        const photo = message.photo[message.photo.length - 1];
        fileId = photo.file_id;
        fileName = `photo_${Date.now()}.jpg`;
        fileSize = photo.file_size || 0;
        mimeType = 'image/jpeg';
      }

      // Sanitize filename
      fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const savePath = join(DOWNLOADS_DIR, fileName);

      await sendMsg(token, chatId, `📥 Descarc ${fileName}...`);

      const downloaded = await downloadTelegramFile(token, fileId, savePath);
      if (downloaded) {
        if (!fileSize) {
          try { fileSize = statSync(savePath).size; } catch {}
        }
        const preview = extractTextPreview(savePath);
        const fileInfo = {
          name: fileName, path: savePath, size: fileSize,
          mime_type: mimeType, content_preview: preview || null,
          uploaded_at: new Date().toISOString(),
        };
        if (!Array.isArray(session.files)) session.files = [];
        session.files.push(fileInfo);
        saveSess(chatId, session);

        const sizeStr = fileSize > 1024 ? `${(fileSize / 1024).toFixed(1)}KB` : `${fileSize}B`;
        const previewNote = preview ? '✅ cu preview text' : '📷 fișier binar';
        await sendMsg(token, chatId,
          `✅ <b>Fișier salvat:</b> ${esc(fileName)}\n` +
          `📦 Mărime: ${sizeStr}\n` +
          `📂 Tip: ${esc(mimeType)}\n` +
          `📝 Preview: ${previewNote}\n\n` +
          `Folosește /analyze sau /code cerință`
        );
      } else {
        await sendMsg(token, chatId, `❌ Eroare la descărcarea ${esc(fileName)}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ CALLBACK QUERY (inline buttons) ═══
    if (update.callback_query) {
      const cbData = update.callback_query.data || '';
      if (cbData.startsWith('model:')) {
        const modelName = cbData.split(':', 2)[1];
        if (modelName === 'cancel') {
          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query.message?.message_id, text: '❌ Anulat.' }),
          });
        } else if (AGENT_MODELS[modelName]) {
          config.glm_model = modelName; saveConfig(config);
          const session = loadSession(chatId); session.agent_model = modelName; saveSess(chatId, session);
          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query.message?.message_id,
              text: `✅ Model: ${modelName.startsWith('queen') ? '👑 ' : ''}${modelName}\n${AGENT_MODELS[modelName].provider} - ${AGENT_MODELS[modelName].desc}`, parse_mode: 'HTML' }),
          });
        }
      } else if (cbData.startsWith('endpoint:')) {
        const kind = cbData.split(':', 2)[1];
        if (kind === 'cancel') {
          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query.message?.message_id, text: '❌ Anulat.' }),
          });
        } else {
          const endpoint = kind === 'coding'
            ? 'https://api.z.ai/api/coding/paas/v4/chat/completions'
            : 'https://api.z.ai/api/paas/v4/chat/completions';
          config.glm_endpoint = endpoint; saveConfig(config);
          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query.message?.message_id, text: `✅ Endpoint: ${endpoint}`, parse_mode: 'HTML' }),
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ NON-COMMAND TEXT: AI chat ═══
    if (!text.startsWith('/')) {
      const session = loadSession(chatId);
      session.history.push({ role: 'user', content: text });
      if (session.history.length > 20) session.history = session.history.slice(-20);
      saveSess(chatId, session);

      const sysPrompt = AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT;
      try {
        const reply = await aiChat([{ role: 'system', content: sysPrompt }, ...session.history], session.agent_model);
        session.history.push({ role: 'assistant', content: reply });
        if (session.history.length > 20) session.history = session.history.slice(-20);
        saveSess(chatId, session);
        await sendLong(token, chatId, reply);
      } catch (e: any) {
        await sendMsg(token, chatId, `❌ Eroare: ${esc(e.message)}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ═══ COMMANDS ═══
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase().replace('@' + (message.from?.username || ''), '');
    const args = parts.slice(1).join(' ');

    // Helper: check owner
    const requireOwner = async () => {
      if (!userId || !isOwner(userId)) {
        await sendMsg(token, chatId, '⛔ Comanda este disponibilă doar pentru owner-ul botului.');
        return false;
      }
      return true;
    };

    switch (cmd) {
      // ─── START / HELP ───
      case '/start': case '/help': {
        const session = loadSession(chatId);
        const claimed = maybeClaimOwner(userId || 0);
        const isOwn = userId ? isOwner(userId) : false;

        let helpText =
          `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
          `🔗 z.ai API: <b>AUTO</b> (conectat via GitHub)\n` +
          `Nu mai trebuie cheie manuală!\n\n` +
          `<b>Comenzi principale:</b>\n` +
          `/api - status API (auto-configurat)\n` +
          `/status - status complet bot\n` +
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
          `🔧 OpenCode + Hermes Agent integrate!\n` +
          `📂 Trimite fișiere direct în chat!\n\n`;

        if (claimed) helpText += `✅ Tu ai fost setat automat ca owner al botului.\n`;
        if (isOwn) helpText += `🔑 Ești owner-ul botului.\n`;

        await sendMsg(token, chatId, helpText, 'HTML').catch(() => {});

        // Keyboard
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId, text: '⬇️ Meniu rapid:', reply_markup: {
              keyboard: [
                ['/status', '/models'],
                ['/code', '/opencode', '/hermes'],
                ['/analyze', '/files'],
                ['/model', '/endpoint'],
                ['/deploy', '/expo'],
                ['/train_prompt', '/clear'],
              ],
              resize_keyboard: true, one_time_keyboard: false,
            },
          }),
        }).catch(() => {});

        saveSess(chatId, { history: [], train_prompts: 0, agent_model: config.glm_model || 'glm-4-plus', files: [], generated: [], context: '' });
        break;
      }

      // ─── MODELS ───
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

      // ─── MODEL CHANGE ───
      case '/model': {
        if (!await requireOwner()) break;
        if (!args) {
          // Show inline keyboard
          const buttons = Object.entries(AGENT_MODELS).slice(0, 10).map(([name, info]) => [{
            text: `${name.startsWith('queen') ? '👑' : ''} ${name} (${info.provider})`,
            callback_data: `model:${name}`,
          }]);
          buttons.push([{ text: 'Cancel', callback_data: 'model:cancel' }]);
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `📝 Curent: <b>${config.glm_model || 'glm-4-plus'}</b>\n\nSelectează modelul:`,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: buttons },
            }),
          });
          await sendMsg(token, chatId, `💡 Sau tastează: <code>/model nume</code>\n\n<code>/model queen-ultra</code> 👑\n<code>/model hermes-4-405B</code>\n<code>/model gpt-5.4-pro</code>\n<code>/model glm-4-plus</code>`);
        } else {
          const m = args.trim();
          if (AGENT_MODELS[m]) {
            config.glm_model = m; saveConfig(config);
            const session = loadSession(chatId); session.agent_model = m; saveSess(chatId, session);
            await sendMsg(token, chatId, `✅ Model: <b>${m.startsWith('queen') ? '👑 ' : ''}${m}</b>\n${AGENT_MODELS[m].provider} - ${AGENT_MODELS[m].desc}`);
          } else {
            await sendMsg(token, chatId, `❌ Model "${esc(m)}" inexistent.\n<code>/models</code> pentru listă.`);
          }
        }
        break;
      }

      // ─── API KEY ───
      case '/api': {
        if (!args) {
          // Test SDK connectivity
          let sdkStatus = '❌';
          try {
            const testReply = await aiChat([{ role: 'user', content: 'Reply OK' }], 'glm-4-flash');
            sdkStatus = testReply.trim().toUpperCase().includes('OK') ? '✅' : '⚠️';
          } catch {}
          await sendMsg(token, chatId,
            `🔗 <b>z.ai API Status</b>\n\n` +
            `⚡ SDK (auto): ${sdkStatus} (z-ai-web-dev-sdk)\n` +
            `📦 Conectat via: GitHub → z.ai\n` +
            `🔑 Manual key: ${config.glm_api_key ? '✅ (' + esc(maskSecret(config.glm_api_key)) + ')' : '— (nu e nevoie)'}\n` +
            `🧠 Model curent: <code>${config.glm_model || 'glm-4.6'}</code>\n\n` +
            `✅ API-ul merge AUTOMAT prin z.ai SDK!\n` +
            `Nu mai trebuie cheie manuală.\n\n` +
            `Dacă vrei totuși cheie manuală:\n` +
            `<code>/api set CHEIA</code>\n` +
            `<code>/api clear</code>`
          );
          break;
        }
        if (args.trim().toLowerCase() === 'clear') {
          config.glm_api_key = ''; saveConfig(config);
          await sendMsg(token, chatId, '✅ Cheia manuală ștearsă. API-ul merge tot prin z.ai SDK automat.');
          break;
        }
        if (args.trim().toLowerCase() === 'set' && args.split(/\s+/).length < 2) {
          await sendMsg(token, chatId, '📝 Folosește: <code>/api set CHEIA_TA</code>\nSau lasă gol — API-ul merge automat!');
          break;
        }
        const keyPart = args.trim().toLowerCase() === 'set' ? args.trim().split(/\s+/).slice(1).join(' ') : args.trim();
        if (keyPart && keyPart.length >= 10) {
          config.glm_api_key = keyPart; saveConfig(config);
          await sendMsg(token, chatId, '✅ Cheia manuală salvată (opțional). API-ul merge și prin SDK automat.');
        } else if (keyPart) {
          await sendMsg(token, chatId, '❌ Cheia pare prea scurtă. (Minim 10 caractere)');
        }
        break;
      }

      // ─── STATUS ───
      case '/status': {
        const session = loadSession(chatId);
        const cr = config.glm_model?.startsWith('queen') ? '👑 ' : '';
        const opencode = existsSync(OPENCODE_BIN) ? '✅' : '⚠️';
        const hermes = existsSync(HERMES_BIN) ? '✅' : '⚠️';
        const fileCount = Array.isArray(session.files) ? session.files.length : 0;
        const genCount = Array.isArray(session.generated) ? session.generated.length : 0;

        // Quick SDK test
        let sdkOk = '...';
        try {
          const t = await aiChat([{ role: 'user', content: 'Reply OK' }], 'glm-4-flash');
          sdkOk = t.trim().toUpperCase().includes('OK') ? '✅ Activ' : '⚠️';
        } catch { sdkOk = '❌'; }

        await sendMsg(token, chatId,
          `🤖 <b>Hermes Bot Agent v4.0</b>\n\n` +
          `🧠 Model: ${cr}<code>${config.glm_model || 'glm-4.6'}</code>\n` +
          `🔗 z.ai API: ${sdkOk} (SDK auto via GitHub)\n` +
          `📱 Telegram: ✅\n` +
          `🔧 OpenCode: ${opencode}\n` +
          `🤖 Hermes Agent: ${hermes}\n` +
          `📦 GitHub: ${config.github_repo ? '✅ ' + esc(config.github_repo) : '❌'}\n` +
          `👤 Owner: ${getOwnerId() ? '✅' : '❌'}\n` +
          `📁 Fișiere sesiune: ${fileCount}\n` +
          `💻 Cod generat: ${genCount}\n` +
          `👑 Expert: ${config.expert_mode === 'true' ? '✅' : '❌'}\n` +
          `🧬 Training: ${(session.train_prompts || 0)}/50`
        );
        break;
      }

      // ─── ENDPOINT ───
      case '/endpoint': {
        if (!await requireOwner()) break;
        if (!args) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `📝 Endpoint curent:\n<code>${esc(config.glm_endpoint || 'default')}</code>\n\nSelectează:`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Coding API', callback_data: 'endpoint:coding' }, { text: 'General API', callback_data: 'endpoint:general' }],
                  [{ text: 'Cancel', callback_data: 'endpoint:cancel' }],
                ],
              },
            }),
          });
          await sendMsg(token, chatId, `💡 Sau tastează: <code>/endpoint URL</code>`);
        } else {
          config.glm_endpoint = args.trim(); saveConfig(config);
          await sendMsg(token, chatId, `✅ Endpoint: ${esc(config.glm_endpoint)}`);
        }
        break;
      }

      // ─── SETREPO ───
      case '/setrepo': {
        if (!await requireOwner()) break;
        if (!args) { await sendMsg(token, chatId, `📝 <code>${config.github_repo || '—'}</code>\n<code>/setrepo URL</code>`); break; }
        config.github_repo = args.trim(); saveConfig(config);
        await sendMsg(token, chatId, `✅ Repo: <code>${esc(config.github_repo)}</code>`);
        break;
      }

      // ─── ANALYZE FILES ───
      case '/analyze': {
        const session = loadSession(chatId);
        const files = Array.isArray(session.files) ? session.files : [];
        if (files.length === 0) { await sendMsg(token, chatId, '❌ Nu ai fișiere în sesiune. Trimite un document sau poză.'); break; }

        await sendMsg(token, chatId, `🔍 Analizez ${files.length} fișiere... ⏳`);
        let fileContent = '';
        for (const f of files.slice(0, 5)) {
          fileContent += `\n--- ${f.name} ---\nTip: ${f.mime_type || 'unknown'}\nMărime: ${f.size} bytes\n`;
          if (f.content_preview) fileContent += `Preview:\n${trunc(f.content_preview, 2000)}\n`;
        }

        const reply = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Ești expert în analiză de cod. Analizează fișierele și explică ce conțin, tipul de date și ce se poate face cu ele.' },
          { role: 'user', content: `${args ? 'CERINȚĂ: ' + args : ''}\n\nFIȘIERE:${fileContent}` },
        ], session.agent_model);
        session.context = reply;
        saveSess(chatId, session);
        await sendLong(token, chatId, reply);
        break;
      }

      // ─── CODE GENERATION ───
      case '/code': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/code cerință</code>\n\nEx: <code>/code Creează un API REST în Python cu FastAPI</code>'); break; }
        const session = loadSession(chatId);
        const files = Array.isArray(session.files) ? session.files : [];

        await sendMsg(token, chatId, `⚡ Generez cu <b>${session.agent_model || 'glm-4-plus'}</b>... ⏳`);

        let contextExtra = '';
        if (files.length > 0) {
          contextExtra = '\n\nFIȘIERE DISPONIBILE:\n';
          for (const f of files.slice(0, 3)) {
            contextExtra += `- ${f.name} (${f.mime_type}, ${f.size} bytes)\n`;
            if (f.content_preview) contextExtra += `Preview:\n${trunc(f.content_preview, 1500)}\n`;
          }
        }
        if (session.context) {
          contextExtra += `\n\nCONTEXT ANALIZĂ:\n${trunc(session.context, 2000)}`;
        }

        const reply = await aiChat([
          { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Generează cod complet, funcțional, cu importuri, comentarii și error handling. Pune codul în bloc markdown cu limbajul corect.' },
          { role: 'user', content: `CERINȚĂ: ${args}${contextExtra}` },
        ], session.agent_model);

        // Extract code block and save as file
        const codeMatch = reply.match(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/);
        if (codeMatch) {
          const lang = (codeMatch[1] || 'txt').trim();
          const code = codeMatch[2].trim();
          const extension = safeExtFromLang(lang);
          const filename = `generated_${Date.now()}.${extension}`;
          ensureDir(GENERATED_DIR);
          writeFileSync(join(GENERATED_DIR, filename), code, 'utf-8');
          if (!Array.isArray(session.generated)) session.generated = [];
          session.generated.push(filename);
          saveSess(chatId, session);
          await sendLong(token, chatId, `✅ <b>Cod generat</b>\nLimbaj: ${esc(lang)}\nFișier: ${esc(filename)}\n\n${esc(reply)}`);
          // Try to send as document
          await sendDocument(token, chatId, join(GENERATED_DIR, filename), `Cod generat: ${args.slice(0, 100)}`);
        } else {
          ensureDir(GENERATED_DIR);
          writeFileSync(join(GENERATED_DIR, `code_${Date.now()}.txt`), `Request: ${args}\n\n${reply}`, 'utf-8');
          await sendLong(token, chatId, reply);
        }
        break;
      }

      // ─── OPENCODE ───
      case '/opencode': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/opencode cerință</code>\n\nFolosește OpenCode AI agent pentru coding avansat.'); break; }
        await sendMsg(token, chatId, '🔧 OpenCode AI Agent... ⏳');
        try {
          const reply = await callOpenCode(args);
          await sendLong(token, chatId, `🔧 <b>OpenCode:</b>\n\n${reply}`);
        } catch (e: any) {
          const reply = await aiChat([
            { role: 'system', content: DEFAULT_PROMPT + ' Acționează ca OpenCode AI coding agent.' },
            { role: 'user', content: args },
          ]);
          await sendLong(token, chatId, `🔧 <b>AI (OpenCode fallback):</b>\n\n${reply}`);
        }
        break;
      }

      // ─── HERMES ───
      case '/hermes': {
        if (!args) { await sendMsg(token, chatId, '📝 <code>/hermes cerință</code>\n\nFolosește Hermes Agent (self-improving, Nous Research).'); break; }
        await sendMsg(token, chatId, '🤖 Hermes Agent (self-improving)... ⏳');
        try {
          const reply = await callHermes(args);
          await sendLong(token, chatId, `🤖 <b>Hermes Agent:</b>\n\n${reply}`);
        } catch (e: any) {
          const reply = await aiChat([
            { role: 'system', content: 'Ești HERMES Agent de Nous Research, un agent self-improving. Ai memorie persistentă, sistem de skills, și înveți din experiență. Răspunde în română.' },
            { role: 'user', content: args },
          ], config.glm_model);
          await sendLong(token, chatId, `🤖 <b>Hermes AI (fallback):</b>\n\n${reply}`);
        }
        break;
      }

      // ─── FILES ───
      case '/files': {
        const session = loadSession(chatId);
        const sessFiles = Array.isArray(session.files) ? session.files : [];
        const sessGen = Array.isArray(session.generated) ? session.generated : [];
        ensureDir(DOWNLOADS_DIR); ensureDir(GENERATED_DIR);
        const dl = readdirSync(DOWNLOADS_DIR).filter(f => !f.startsWith('.'));
        const gen = readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));

        if (!sessFiles.length && !sessGen.length && !dl.length && !gen.length) {
          await sendMsg(token, chatId, '📂 Nu există fișiere. Trimite un document sau poză în chat.');
          break;
        }

        let msg = '📂 <b>Fișierele tale</b>\n';
        if (sessFiles.length) { msg += '\n<b>📥 Uploadate în sesiune:</b>\n'; sessFiles.slice(-15).forEach(f => { msg += `• ${esc(f.name)} (${f.size > 1024 ? (f.size/1024).toFixed(1) + 'KB' : f.size + 'B'})\n`; }); }
        else if (dl.length) { msg += '\n<b>📥 Downloadate (pe disc):</b>\n'; dl.slice(-15).forEach(f => { try { msg += `• ${esc(f)} (${(statSync(join(DOWNLOADS_DIR,f)).size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        else { msg += '\n📥 Niciun fișier uploadat\n'; }

        if (sessGen.length) { msg += '\n<b>💻 Generate în sesiune:</b>\n'; sessGen.slice(-15).forEach(f => { msg += `• ${esc(f)}\n`; }); }
        else if (gen.length) { msg += '\n<b>💻 Generate (pe disc):</b>\n'; gen.slice(-10).forEach(f => { try { msg += `• ${esc(f)} (${(statSync(join(GENERATED_DIR,f)).size/1024).toFixed(1)}KB)\n`; } catch {} }); }
        else { msg += '\n💻 Niciun fișier generat\n'; }

        await sendMsg(token, chatId, msg);
        break;
      }

      // ─── CLEAR ───
      case '/clear': {
        saveSess(chatId, { history: [], train_prompts: 0, agent_model: config.glm_model || 'glm-4-plus', files: [], generated: [], context: '' });
        await sendMsg(token, chatId, '🧹 Sesiune resetată!\n\nFișierele din sesiune au fost șterse din memorie.\nFișierele de pe disc rămân intacte.');
        break;
      }

      // ─── DEPLOY ───
      case '/deploy': {
        if (!await requireOwner()) break;
        if (!config.github_repo) { await sendMsg(token, chatId, '❌ Nu există repo configurat.\n<code>/setrepo URL</code>'); break; }
        await sendMsg(token, chatId, `🚀 Deploy către GitHub...\nRepo: <code>${esc(config.github_repo)}</code>`);
        const result = await gitDeploy(config.github_repo);
        await sendMsg(token, chatId, result.msg);
        break;
      }

      // ─── EXPO ───
      case '/expo': {
        if (!await requireOwner()) break;
        await sendMsg(token, chatId, '📱 Generez proiect Expo... ⏳');
        const result = scaffoldExpo();
        await sendLong(token, chatId, result.msg);
        break;
      }

      // ─── TRAIN PROMPT ───
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
        const reply = await aiChat([
          { role: 'system', content: `Ești HERMES în training neural agentic autonom. Nivel: ${lvl}/50. Tier: ${tier}. Demonstrează progresie.` },
          { role: 'user', content: input },
        ], session.agent_model);
        session.history.push({ role: 'user', content: input }, { role: 'assistant', content: reply });
        saveSess(chatId, session);
        const next = lvl < 50 ? `\n📈 ${lvl}/50 → Ultra Quantum` : '\n🌟 NIVEL MAXIM!';
        await sendLong(token, chatId, `${emoji} <b>Training #${lvl}</b>\n\n${reply}${next}`);
        break;
      }

      // ─── LOOP PROBLEMS ───
      default: {
        const pm = cmd.match(/^\/p(\d{1,2})$/);
        if (pm) {
          const pid = parseInt(pm[1]);
          const content = LOOP_PROBLEMS[pid];
          if (!content) { await sendMsg(token, chatId, `❌ P${pid} inexistent. /p1-/p12`); break; }
          await sendMsg(token, chatId, content);
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
  return NextResponse.json({
    status: 'Hermes Bot Webhook Active',
    version: '4.0',
    models: Object.keys(AGENT_MODELS).length,
    opencode: existsSync(OPENCODE_BIN),
    hermes: existsSync(HERMES_BIN),
  });
}
