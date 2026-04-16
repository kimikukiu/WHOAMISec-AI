/**
 * HERMES BOT v4.0 - Standalone Telegram Bot
 * Complete feature set with z-ai-web-dev-sdk auto API
 * Polls Telegram directly, no webhook dependency.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, createReadStream, readdirSync, statSync, unlinkSync } from 'fs';
import { join, extname } from 'path';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const DATA_DIR = join(process.cwd(), '..', 'data');
const SESSIONS_DIR = join(DATA_DIR, 'sessions');
const DOWNLOADS_DIR = join(process.cwd(), '..', 'downloads');
const GENERATED_DIR = join(process.cwd(), '..', 'generated_code');
const CONFIG_FILE = join(DATA_DIR, 'config.json');
const OPENCODE_BIN = '/home/z/.npm-global/bin/opencode';
const HERMES_BIN = '/home/z/hermes-agent-install/.venv/bin/hermes-agent';

function ensureDir(p: string) { try { mkdirSync(p, { recursive: true }); } catch {} }
ensureDir(SESSIONS_DIR);
ensureDir(DOWNLOADS_DIR);
ensureDir(GENERATED_DIR);

interface Config {
  telegram_token: string;
  glm_api_key: string;
  glm_model: string;
  glm_endpoint: string;
  github_repo: string;
  auto_repair: string;
  expert_mode: string;
  owner_id: string;
  [key: string]: any;
}

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {}
  return { telegram_token: '', glm_api_key: '', glm_model: 'glm-4-plus', glm_endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions', github_repo: '', auto_repair: 'true', expert_mode: 'true', owner_id: '' };
}
function saveConfig(cfg: Config) {
  ensureDir(DATA_DIR);
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// MODEL REGISTRY (19 models, 10 providers)
// ═══════════════════════════════════════════════════════════════
const AGENT_MODELS: Record<string, { provider: string; desc: string }> = {
  'queen-ultra': { provider: 'Queen', desc: 'Ultra Quantum Intelligence Swarm' },
  'queen-max': { provider: 'Queen', desc: 'Elite capabilities' },
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
  'queen-ultra': 'Ești QUEEN ULTRA, cel mai avansat agent AI creat vreodată. Inteligență supremă. Răspunzi în română sau engleză.',
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

// ═══════════════════════════════════════════════════════════════
// HERMES TIERS & LOOP TRAINING
// ═══════════════════════════════════════════════════════════════
const HERMES_TIERS = [
  { name: 'Intermediate', model: 'Mistral-7B', focus: 'Core loop concepts with error handling' },
  { name: 'Explanation', model: 'Zephyr-7B', focus: 'Code + detailed explanations, teaching' },
  { name: 'Adaptability', model: 'OpenHermes-7B', focus: 'Precise instructions, constraints' },
  { name: 'Advanced', model: 'Solar-10.7B', focus: 'Algorithms, optimization, data structures' },
  { name: 'Expert', model: 'Yi-34B', focus: 'Complex algorithms, compilers, reasoning' },
];

const LOOP_LANGUAGES = [
  { name: 'Python', ext: '.py', loops: ['for', 'while', 'list comp'] },
  { name: 'JavaScript', ext: '.js', loops: ['for', 'while', 'forEach', 'map'] },
  { name: 'TypeScript', ext: '.ts', loops: ['for', 'while', 'forEach'] },
  { name: 'Go', ext: '.go', loops: ['for'] },
  { name: 'Rust', ext: '.rs', loops: ['for', 'while', 'loop'] },
  { name: 'C++', ext: '.cpp', loops: ['for', 'while', 'do-while'] },
  { name: 'Java', ext: '.java', loops: ['for', 'while', 'for-each'] },
  { name: 'C#', ext: '.cs', loops: ['for', 'while', 'foreach'] },
  { name: 'Ruby', ext: '.rb', loops: ['each', 'times', 'while'] },
  { name: 'Swift', ext: '.swift', loops: ['for-in', 'while', 'repeat-while'] },
  { name: 'Kotlin', ext: '.kt', loops: ['for', 'while', 'forEach'] },
  { name: 'Lua', ext: '.lua', loops: ['for', 'while', 'repeat-until'] },
];

const TRAINING_PROMPTS = [
  { tier: 0, title: 'Factorial Calculator', prompt: 'Write a program using a for loop to calculate factorial. Include error handling.' },
  { tier: 0, title: 'Even Number Filter', prompt: 'Create a function that returns even numbers from a list using while loop.' },
  { tier: 1, title: 'Prime Sum', prompt: 'Find sum of all primes up to 100 using for and while loops. Explain each step.' },
  { tier: 1, title: 'Fibonacci', prompt: 'Generate Fibonacci sequence up to 10 terms using while loop. Explain why while over for.' },
  { tier: 2, title: 'Manual Average', prompt: 'Write calculate_average(list) using for loop. Do NOT use sum().' },
  { tier: 2, title: 'Diamond Pattern', prompt: 'Print diamond of height 7 using nested for loops.' },
  { tier: 3, title: 'Quicksort', prompt: 'Implement quicksort. Include comments explaining each step.' },
  { tier: 3, title: 'BFS Pathfinding', prompt: 'Implement BFS for shortest path in adjacency list graph.' },
  { tier: 4, title: 'N-Queens', prompt: 'Solve N-Queens using backtracking and loops.' },
  { tier: 4, title: 'A* Search', prompt: 'Implement A* search on grid with obstacles using priority queue.' },
];

// ═══════════════════════════════════════════════════════════════
// RED TEAM TRAINING KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════
const REDTEAM_TOPICS = [
  { title: 'OWASP Top 10 2025', desc: 'Cele mai critice 10 vulnerabilități web: Broken Access Control, Injection, Auth Failures, etc.' },
  { title: 'SQL Injection Mastery', desc: 'Technici avansate: UNION-based, Blind (boolean/time), Second-order, Out-of-band. Prevenție cu prepared statements.' },
  { title: 'XSS Exploitation', desc: 'Reflected, Stored, DOM-based XSS. WAF bypass, polyglot payloads, CSP bypass.' },
  { title: 'SSRF Deep Dive', desc: 'Server-Side Request Forgery: internal port scanning, cloud metadata, protocol smuggling.' },
  { title: 'Authentication Bypass', desc: 'JWT manipulation, session fixation, IDOR, privilege escalation techniques.' },
  { title: 'API Security Testing', desc: 'REST/GraphQL security: BOLA, mass assignment, rate limiting bypass, schema exposure.' },
  { title: 'Network Pentesting', desc: 'Reconnaissance: nmap, masscan, enum4linux. Vulnerability scanning with Nessus/OpenVAS.' },
  { title: 'Container Security', desc: 'Docker/K8s: escape techniques, misconfigurations, image scanning, RBAC bypass.' },
  { title: 'Red Team Methodology', desc: 'Kill chain: Recon → Weaponize → Deliver → Exploit → Install → C2 → Actions on Objectives.' },
  { title: 'Blue Team Defense', desc: 'Defense strategies: SIEM, EDR, HIDS, network segmentation, incident response procedures.' },
  { title: 'Cryptography Essentials', desc: 'Symmetric/Asymmetric encryption, hashing, PKI, TLS/SSL, certificate pinning.' },
  { title: 'Reverse Engineering', desc: 'Static/dynamic analysis, disassembly, debugging, anti-reverse techniques.' },
  { title: 'Mobile Security', desc: 'Android/iOS: app analysis, Frida hooking, certificate pinning bypass, API traffic analysis.' },
  { title: 'Cloud Security (AWS/Azure/GCP)', desc: 'IAM misconfigurations, S3 bucket exposure, cloud metadata SSRF, serverless attacks.' },
  { title: 'Bug Bounty Workflow', desc: 'Methodology: scope analysis → recon → vulnerability discovery → PoC → report writing → reward.' },
];

const BUG_BOUNTY_TOOLS: Record<string, { cat: string; desc: string }> = {
  'nmap': { cat: 'Recon', desc: 'Network discovery and security auditing' },
  'burpsuite': { cat: 'Web Proxy', desc: 'Intercepting proxy for web app testing' },
  'sqlmap': { cat: 'Injection', desc: 'Automated SQL injection tool' },
  'nuclei': { cat: 'Scanner', desc: 'Fast vulnerability scanner with templates' },
  'subfinder': { cat: 'Recon', desc: 'Subdomain discovery tool' },
  'httpx': { cat: 'Recon', desc: 'HTTP probe toolkit' },
  'ffuf': { cat: 'Fuzzing', desc: 'Fast web fuzzer' },
  'hydra': { cat: 'Brute', desc: 'Online password cracking tool' },
  'metasploit': { cat: 'Exploit', desc: 'Penetration testing framework' },
  'wpscan': { cat: 'CMS', desc: 'WordPress vulnerability scanner' },
  'dirsearch': { cat: 'Recon', desc: 'Directory/file discovery tool' },
  'amass': { cat: 'Recon', desc: 'Attack surface mapping tool' },
  'nikto': { cat: 'Scanner', desc: 'Web server scanner' },
  'xsser': { cat: 'XSS', desc: 'Cross-site scripting tool' },
  'jwt_tool': { cat: 'Auth', desc: 'JWT toolkit for testing' },
  'feroxbuster': { cat: 'Fuzzing', desc: 'Recursive content discovery' },
  'seclists': { cat: 'Wordlists', desc: 'Collection of security wordlists' },
  'gobuster': { cat: 'Recon', desc: 'Directory/DNS brute force tool' },
  'waybackurls': { cat: 'Recon', desc: 'Fetch URLs from Wayback Machine' },
  'rustscan': { cat: 'Recon', desc: 'Fast port scanner in Rust' },
};

// ═══════════════════════════════════════════════════════════════
// FSRS (Free Spaced Repetition Scheduler)
// ═══════════════════════════════════════════════════════════════
interface FsrsCard {
  id: string;
  question: string;
  answer: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  last_review: number;
}

function getFsrsPath(chatId: number) { return join(SESSIONS_DIR, `fsrs_${chatId}.json`); }

function loadFsrs(chatId: number): FsrsCard[] {
  try {
    if (existsSync(getFsrsPath(chatId))) return JSON.parse(readFileSync(getFsrsPath(chatId), 'utf-8'));
  } catch {}
  return [];
}

function saveFsrs(chatId: number, cards: FsrsCard[]) {
  ensureDir(SESSIONS_DIR);
  writeFileSync(getFsrsPath(chatId), JSON.stringify(cards, null, 2), 'utf-8');
}

function fsrsReview(card: FsrsCard, quality: number): FsrsCard {
  // Simplified FSRS algorithm
  const q = Math.max(0, Math.min(5, quality));
  card.reps++;
  if (q < 2) { card.lapses++; card.state = 'relearning'; }
  const stabilityMultiplier = 1 + (q - 1.5) * 0.6;
  card.stability = Math.max(1, card.stability * stabilityMultiplier);
  card.difficulty = Math.max(1, Math.min(10, card.difficulty + (3 - q) * 0.5));
  card.scheduled_days = Math.max(1, Math.round(card.stability * card.difficulty * 0.1));
  card.last_review = Date.now();
  card.state = q >= 3 ? 'review' : 'learning';
  return card;
}

// ═══════════════════════════════════════════════════════════════
// LOOP PROBLEMS
// ═══════════════════════════════════════════════════════════════
const LOOP_PROBLEMS: Record<number, string> = {
  1: `📚 <b>PROBLEMA 1: Numere de la 1 la 10</b>\n\n<code>for i in range(1, 11):\n    print(i, end=" ")\nprint()</code>`,
  2: `📚 <b>PROBLEMA 2: Adunare până la 'done'</b>\n\n<code>total = 0\nwhile True:\n    user_input = input("Număr (sau 'done'): ")\n    if user_input.lower() == 'done': break\n    try: total += float(user_input)\n    except ValueError: print("Invalid")\nprint(f"Suma: {total}")</code>`,
  3: `📚 <b>PROBLEMA 3: Tabla înmulțirii pentru 7</b>\n\n<code>num = 7\nfor i in range(1, 11):\n    print(f"{num} x {i} = {num * i}")</code>`,
  4: `📚 <b>PROBLEMA 4: Fiecare al doilea element</b>\n\n<code>my_list = ['apple','banana','cherry','date']\nfor i in range(0, len(my_list), 2):\n    print(my_list[i])</code>`,
  5: `📚 <b>PROBLEMA 5: Triunghi cu asteriscuri</b>\n\n<code>height = 5\nfor i in range(1, height + 1):\n    print('*' * i)</code>`,
  6: `📚 <b>PROBLEMA 6: Numere prime 2-50</b>\n\n<code>import math\nprimes = []\nfor num in range(2, 51):\n    is_prime = True\n    for d in range(2, int(math.sqrt(num))+1):\n        if num % d == 0: is_prime = False; break\n    if is_prime: primes.append(num)\nprint(primes)</code>`,
  7: `📚 <b>PROBLEMA 7: String uppercase dacă len > 5</b>\n\n<code>strings = ["hello","python","code","programming"]\nfor s in strings:\n    if len(s) > 5: print(f"{s} -> {s.upper()}")\n    else: print(s)</code>`,
  8: `📚 <b>PROBLEMA 8: Intersecția a două liste</b>\n\n<code>list1 = [1,2,3,4,5,6,7]\nlist2 = [5,6,7,8,9]\nintersection = [x for x in list1 if x in list2]\nprint(intersection)</code>`,
  9: `📚 <b>PROBLEMA 9: Bubble Sort</b>\n\n<code>def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]: arr[j],arr[j+1] = arr[j+1],arr[j]; swapped = True\n        if not swapped: break\n    return arr\nprint(bubble_sort([64,34,25,12,22,11,90]))</code>`,
  10: `📚 <b>PROBLEMA 10: Palindrom</b>\n\n<code>import re\ndef is_palindrome(s):\n    cleaned = re.sub(r'[^a-zA-Z0-9]','',s).lower()\n    return cleaned == cleaned[::-1]\nprint(is_palindrome("A man, a plan, a canal: Panama"))</code>`,
  11: `📚 <b>PROBLEMA 11: Fibonacci</b>\n\n<code>n = 10\na, b = 0, 1\nfor _ in range(n):\n    print(a, end=" ")\n    a, b = b, a + b\nprint()</code>`,
  12: `📚 <b>PROBLEMA 12: LIS</b>\n\n<code>def lis(arr):\n    dp = [1]*len(arr)\n    for i in range(len(arr)):\n        for j in range(i):\n            if arr[j] < arr[i]: dp[i] = max(dp[i], dp[j]+1)\n    return max(dp)\nprint(lis([10,9,2,5,3,7,101,18]))</code>`,
};

// ═══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════
interface Session {
  history: { role: string; content: string }[];
  train_prompts: number;
  agent_model: string;
  files: any[];
  generated: string[];
  context: string;
  redteam_topic: number;
}

function getSessionPath(id: number) { ensureDir(SESSIONS_DIR); return join(SESSIONS_DIR, `${id}.json`); }
function loadSession(id: number): Session {
  try {
    if (existsSync(getSessionPath(id))) return JSON.parse(readFileSync(getSessionPath(id), 'utf-8'));
  } catch {}
  return { history: [], train_prompts: 0, agent_model: 'glm-4-plus', files: [], generated: [], context: '', redteam_topic: 0 };
}
function saveSession(id: number, s: Session) {
  ensureDir(SESSIONS_DIR);
  writeFileSync(getSessionPath(id), JSON.stringify(s, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// AI ENGINE (z-ai-web-dev-sdk)
// ═══════════════════════════════════════════════════════════════
let _zai: any = null;
let _zaiPromise: Promise<any> | null = null;

async function getZAI() {
  if (_zai) return _zai;
  if (_zaiPromise) return _zaiPromise;
  _zaiPromise = (async () => {
    try {
      const mod = await import('z-ai-web-dev-sdk');
      const ZAI = (mod as any).default || (mod as any).ZAI || mod;
      _zai = await ZAI.create();
      console.log('[AI] z-ai-web-dev-sdk initialized (auto via GitHub)');
      return _zai;
    } catch (e: any) {
      _zaiPromise = null;
      throw new Error(`SDK init failed: ${e.message}`);
    }
  })();
  return _zaiPromise;
}

async function callAI(messages: { role: string; content: string }[], model?: string): Promise<string> {
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      model: model || 'glm-4-plus',
      messages,
      temperature: 0.7,
      max_tokens: (model || '').includes('queen') ? 8192 : 4096,
    });
    return completion.choices?.[0]?.message?.content || 'No response.';
  } catch (e: any) {
    // Fallback to direct API
    const cfg = loadConfig();
    if (cfg.glm_api_key && cfg.glm_endpoint) {
      try {
        const res = await fetch(cfg.glm_endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${cfg.glm_api_key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model || cfg.glm_model || 'glm-4-plus', messages, temperature: 0.7, max_tokens: 4096 }),
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || `API Error: ${JSON.stringify(data).slice(0, 200)}`;
      } catch (e2: any) {
        return `❌ AI Error: ${e2.message}`;
      }
    }
    return `❌ AI Error: ${e.message}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// TELEGRAM API HELPERS
// ═══════════════════════════════════════════════════════════════
async function tgApi(method: string, body: any, token?: string): Promise<any> {
  const t = token || loadConfig().telegram_token;
  if (!t) return { ok: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e: any) { console.error(`[TG] ${method}:`, e.message); return { ok: false }; }
}

async function sendMsg(chatId: number, text: string, extra: any = {}): Promise<any> {
  return tgApi('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
}

async function sendLong(chatId: number, text: string) {
  if (!text) { await sendMsg(chatId, '⚠️ Răspuns gol.'); return; }
  if (text.length > 4000) {
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];
    for (const c of chunks) await sendMsg(chatId, c);
  } else await sendMsg(chatId, text);
}

async function sendChatAction(chatId: number, action: string = 'typing') {
  return tgApi('sendChatAction', { chat_id: chatId, action });
}

async function sendDocument(chatId: number, filePath: string, caption: string) {
  const tk = loadConfig().telegram_token;
  if (!tk) return;
  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('document', createReadStream(filePath), { filename: filePath.split('/').pop() });
    form.append('caption', caption);
    await fetch(`https://api.telegram.org/bot${tk}/sendDocument`, {
      method: 'POST', body: form, headers: form.getHeaders ? form.getHeaders() : {},
    });
  } catch (e) { console.error('[TG] sendDocument:', e); }
}

async function sendInlineKB(chatId: number, text: string, keyboard: any[][]) {
  return tgApi('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } });
}

async function editMessage(chatId: number, msgId: number, text: string) {
  return tgApi('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML' });
}

// ═══════════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════════
const TEXT_EXTENSIONS = new Set(['.txt','.py','.js','.ts','.json','.md','.html','.css','.csv','.yml','.yaml','.xml','.sql','.log','.env','.java','.c','.cpp','.cs','.go','.rs','.tsx','.jsx','.sh','.rb','.php','.swift','.kt','.lua']);

function extractTextPreview(filePath: string, limit = 2000): string | null {
  const ext = extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) {
    try { return readFileSync(filePath, 'utf-8').substring(0, limit); } catch {}
  }
  return null;
}

async function downloadTgFile(fileId: string, savePath: string): Promise<boolean> {
  const tk = loadConfig().telegram_token;
  if (!tk) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${tk}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok || !data.result?.file_path) return false;
    const fileUrl = `https://api.telegram.org/file/bot${tk}/${data.result.file_path}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return false;
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    ensureDir(savePath.split('/').slice(0, -1).join('/'));
    writeFileSync(savePath, buffer);
    return true;
  } catch (e) { console.error('[File] download:', e); return false; }
}

function safeExtFromLang(lang: string): string {
  const map: Record<string, string> = { python:'py', py:'py', javascript:'js', js:'js', typescript:'ts', ts:'ts', bash:'sh', sh:'sh', json:'json', html:'html', css:'css', java:'java', c:'c', cpp:'cpp', go:'go', rust:'rs', sql:'sql', xml:'xml', ruby:'rb', php:'php', swift:'swift', kotlin:'kt', r:'r', lua:'lua' };
  return map[lang.toLowerCase()] || 'txt';
}

// ═══════════════════════════════════════════════════════════════
// OWNER SYSTEM
// ═══════════════════════════════════════════════════════════════
function isOwner(userId: number): boolean {
  const cfg = loadConfig();
  return cfg.owner_id ? parseInt(cfg.owner_id) === userId : false;
}
function claimOwner(userId: number): boolean {
  const cfg = loadConfig();
  if (!cfg.owner_id) { cfg.owner_id = String(userId); saveConfig(cfg); return true; }
  return false;
}

function esc(t: string) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function trunc(t: string, n: number) { return t.length <= n ? t : t.slice(0, n - 3) + '...'; }
function maskSecret(v: string) { if (!v || v.length <= 12) return v ? '****' : ''; return v.slice(0, 8) + '...' + v.slice(-4); }

// ═══════════════════════════════════════════════════════════════
// COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleCommand(chatId: number, userId: number | undefined, text: string, update: any) {
  const cfg = loadConfig();
  const cm = cfg.glm_model || 'glm-4-plus';
  const own = userId ? isOwner(userId) : false;
  const parts = text.trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase().replace('@' + (update.message?.from?.username || ''), '');
  const args = parts.slice(1).join(' ');
  const session = loadSession(chatId);

  // /start /help
  if (cmd === '/start' || cmd === '/help') {
    const cl = userId ? claimOwner(userId) : false;
    await sendMsg(chatId,
      `🤖 <b>HERMES BOT v4.0 — Complete Edition</b>\n\n` +
      `🔗 API: <b>AUTO</b> (z-ai SDK via GitHub)\n` +
      `🧠 Model: <code>${cm}</code>\n\n` +
      `<b>🤖 AI & Chat:</b>\n` +
      `/models — 19 modele (10 providers)\n` +
      `/model — schimbă modelul\n` +
      `/endpoint — schimbă API endpoint\n` +
      `/api — status API\n\n` +
      `<b>💻 Coding:</b>\n` +
      `/code cerință — generează cod\n` +
      `/opencode cerință — OpenCode AI\n` +
      `/hermes cerință — Hermes Agent\n\n` +
      `<b>🧬 Training:</b>\n` +
      `/train_prompt — antrenare neurală\n` +
      `/loop [limbaj] — Loop Coder (12 limbi)\n` +
      `/p1-/p12 — probleme loop\n` +
      `/fsrs — Spaced Repetition (FSRS)\n` +
      `/fsrsadd Q|A — adaugă card\n\n` +
      `<b>🔴 RED TEAM:</b>\n` +
      `/redteam — topic de securitate\n` +
      `/learn [topic] — studiu securitate\n` +
      `/tools — bug bounty tools\n` +
      `/scan_info — metodologie scanare\n` +
      `/payload [tip] — exemples educaționale\n\n` +
      `<b>📁 Files & Deploy:</b>\n` +
      `/analyze — analizează fișiere\n` +
      `/files — listează fișiere\n` +
      `/setrepo URL — setează repo\n` +
      `/deploy — push GitHub\n` +
      `/expo — scaffold Expo\n\n` +
      `<b>⚙️ Admin:</b>\n` +
      `/status — status complet\n` +
      `/clear — resetează sesiune\n` +
      `/expert — toggle expert mode\n` +
      `/repair — toggle auto-repair\n` +
      (cl ? '\n✅ Setat ca <b>OWNER</b>!\n' : '')
    );
    // Menu keyboard
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: '⬇️ Meniu rapid:',
      reply_markup: {
        keyboard: [
          ['/status', '/models'],
          ['/code', '/opencode', '/hermes'],
          ['/redteam', '/learn', '/tools'],
          ['/fsrs', '/loop', '/train_prompt'],
          ['/analyze', '/files', '/deploy'],
          ['/scan_info', '/payload', '/api'],
        ],
        resize_keyboard: true,
      },
    });
  }
  // /status
  else if (cmd === '/status') {
    await sendMsg(chatId,
      `🤖 <b>HERMES BOT v4.0</b>\n\n` +
      `🧠 Model: <code>${cm}</code>\n` +
      `🔗 API: ✅ (z-ai SDK auto)\n` +
      `🔑 Key: ${cfg.glm_api_key ? esc(maskSecret(cfg.glm_api_key)) : 'SDK Auto'}\n` +
      `📱 Telegram: ✅ Active\n` +
      `🔧 OpenCode: ${existsSync(OPENCODE_BIN) ? '✅' : '⚠️'}\n` +
      `🤖 Hermes: ${existsSync(HERMES_BIN) ? '✅' : '⚠️'}\n` +
      `📦 GitHub: ${cfg.github_repo ? '✅' : '❌'}\n` +
      `👤 Owner: ${cfg.owner_id || '❌'}\n` +
      `📁 Files: ${session.files?.length || 0}\n` +
      `💻 Generated: ${session.generated?.length || 0}\n` +
      `🧬 Training: ${session.train_prompts || 0}\n` +
      `🔧 Repair: ${cfg.auto_repair !== 'false' ? '✅' : '❌'}\n` +
      `👑 Expert: ${cfg.expert_mode === 'true' ? '✅' : '❌'}`
    );
  }
  // /models
  else if (cmd === '/models') {
    let m = '🧠 <b>19 Models — 10 Providers:</b>\n\n';
    let pv = '';
    for (const [n, i] of Object.entries(AGENT_MODELS)) {
      if (i.provider !== pv) { pv = i.provider; m += `\n<b>── ${pv} ──</b>\n`; }
      const active = cm === n ? ' ✅' : '';
      const crown = n.startsWith('queen') ? '👑 ' : '';
      m += `  <code>${crown}${n}</code> — ${i.desc}${active}\n`;
    }
    m += `\nCurent: <b>${cm}</b> | <code>/model nume</code>`;
    await sendLong(chatId, m);
  }
  // /model
  else if (cmd === '/model') {
    if (!own) { await sendMsg(chatId, '⛔ Owner only.'); return; }
    if (!args) {
      const btns: any[][] = [];
      for (const [n, i] of Object.entries(AGENT_MODELS).slice(0, 12)) {
        btns.push([{ text: `${n.startsWith('queen') ? '👑' : ''} ${n}`, callback_data: `model:${n}` }]);
      }
      btns.push([{ text: '❌ Cancel', callback_data: 'model:cancel' }]);
      await sendInlineKB(chatId, `📝 Curent: <b>${cm}</b>\nSelectează:`, btns);
    } else if (AGENT_MODELS[args]) {
      cfg.glm_model = args; saveConfig(cfg);
      session.agent_model = args; saveSession(chatId, session);
      await sendMsg(chatId, `✅ Model: <b>${args}</b>\n${AGENT_MODELS[args].provider} — ${AGENT_MODELS[args].desc}`);
    } else await sendMsg(chatId, `❌ Model inexistent. /models`);
  }
  // /endpoint
  else if (cmd === '/endpoint') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    if (!args) {
      await sendInlineKB(chatId, `📝 Endpoint: <code>${esc(cfg.glm_endpoint || 'default')}</code>`, [
        [{ text: 'Coding API', callback_data: 'endpoint:coding' }, { text: 'General API', callback_data: 'endpoint:general' }],
        [{ text: '❌ Cancel', callback_data: 'endpoint:cancel' }],
      ]);
    } else { cfg.glm_endpoint = args.trim(); saveConfig(cfg); await sendMsg(chatId, `✅ <code>${esc(args.trim())}</code>`); }
  }
  // /api
  else if (cmd === '/api') {
    await sendMsg(chatId,
      `🔗 <b>z.ai API Status</b>\n\n` +
      `⚡ SDK: ✅ auto via GitHub\n` +
      `🔑 Key: ${cfg.glm_api_key ? esc(maskSecret(cfg.glm_api_key)) : 'SDK Auto'}\n` +
      `🧠 Model: <code>${cm}</code>\n` +
      `🔗 Endpoint: <code>${cfg.glm_endpoint || 'default'}</code>\n\n` +
      `✅ API funcționează automat!`
    );
  }
  // /setrepo
  else if (cmd === '/setrepo') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    if (!args) await sendMsg(chatId, `📝 <code>${cfg.github_repo || '—'}</code>`);
    else { cfg.github_repo = args.trim(); saveConfig(cfg); await sendMsg(chatId, `✅ <code>${esc(args.trim())}</code>`); }
  }
  // /deploy
  else if (cmd === '/deploy') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    if (!cfg.github_repo) { await sendMsg(chatId, '❌ /setrepo URL first'); return; }
    await sendMsg(chatId, '🚀 Deploying... ⏳');
    const { execFile } = await import('child_process');
    const run = (c: string, a: string[]) => new Promise<string>((res) => { execFile(c, a, { timeout: 30000 }, (err, out) => res(out || (err as any)?.message || '')); });
    try {
      await run('git', ['init']);
      await run('git', ['remote', 'remove', 'origin']);
      await run('git', ['remote', 'add', 'origin', cfg.github_repo]);
      await run('git', ['add', '.']);
      await run('git', ['commit', '-m', `Hermes deploy ${new Date().toISOString()}`, '--allow-empty']);
      const out = await run('git', ['push', '-u', 'origin', 'main', '--force']);
      await sendMsg(chatId, `✅ Push: ${trunc(out, 500)}`);
    } catch (e: any) { await sendMsg(chatId, `❌ ${e.message}`); }
  }
  // /expo
  else if (cmd === '/expo') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    await sendMsg(chatId, '📱 Expo... ⏳');
    const expoDir = join(process.cwd(), '..', 'expo-control-panel');
    ensureDir(expoDir);
    try {
      writeFileSync(join(expoDir, 'package.json'), JSON.stringify({
        name: 'hermes-bot-control', version: '1.0.0', private: true, main: 'node_modules/expo/AppEntry.js',
        scripts: { start: 'expo start' },
        dependencies: { expo: '~50.0.0', react: '18.2.0', 'react-native': '0.73.6' }
      }, null, 2), 'utf-8');
      await sendMsg(chatId, `✅ Expo creat în ${expoDir}`);
    } catch (e: any) { await sendMsg(chatId, `❌ ${e.message}`); }
  }
  // /code
  else if (cmd === '/code') {
    if (!args) { await sendMsg(chatId, '📝 <code>/code cerință</code>\nEx: <code>/code API REST cu FastAPI</code>'); return; }
    await sendChatAction(chatId, 'typing');
    await sendMsg(chatId, `⚡ Generez cu <b>${session.agent_model || cm}</b>... ⏳`);
    let ctx = '';
    if (session.files?.length) {
      ctx += '\nFIȘIERE:\n';
      for (const f of session.files.slice(0, 3)) {
        ctx += `- ${f.name} (${f.size} bytes)\n`;
        if (f.content_preview) ctx += `${trunc(f.content_preview, 1500)}\n`;
      }
    }
    if (session.context) ctx += `\nCONTEXT:\n${trunc(session.context, 2000)}`;
    const r = await callAI([
      { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Generează cod complet cu importuri, comentarii și error handling. Cod în markdown block.' },
      { role: 'user', content: `CERINȚĂ: ${args}${ctx}` },
    ], session.agent_model);
    const m = r.match(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/);
    if (m) {
      const ext = safeExtFromLang(m[1] || 'txt');
      const fn = `generated_${Date.now()}.${ext}`;
      ensureDir(GENERATED_DIR);
      writeFileSync(join(GENERATED_DIR, fn), m[2].trim(), 'utf-8');
      session.generated = session.generated || [];
      session.generated.push(fn); saveSession(chatId, session);
      await sendLong(chatId, `✅ <b>Cod generat</b>\nFișier: <code>${fn}</code>\n\n${r}`);
      await sendDocument(chatId, join(GENERATED_DIR, fn), `Cod: ${args.slice(0, 80)}`);
    } else {
      writeFileSync(join(GENERATED_DIR, `code_${Date.now()}.txt`), r, 'utf-8');
      await sendLong(chatId, r);
    }
  }
  // /opencode
  else if (cmd === '/opencode') {
    if (!args) { await sendMsg(chatId, '📝 <code>/opencode cerință</code>'); return; }
    await sendChatAction(chatId, 'typing');
    await sendMsg(chatId, '🔧 OpenCode AI... ⏳');
    try {
      const { execFile } = await import('child_process');
      const out = await new Promise<string>((res, rej) => {
        const bin = existsSync(OPENCODE_BIN) ? OPENCODE_BIN : 'opencode';
        const timeout = setTimeout(() => rej(new Error('timeout')), 60000);
        execFile(bin, ['--print', args], { encoding: 'utf-8', timeout: 55000, maxBuffer: 10*1024*1024 },
          (err, stdout) => { clearTimeout(timeout); if (err) rej(err); else res(stdout || 'No output'); });
      });
      await sendLong(chatId, `🔧 <b>OpenCode:</b>\n\n${out}`);
    } catch {
      const r = await callAI([{ role: 'system', content: DEFAULT_PROMPT + ' Acționează ca OpenCode AI.' }, { role: 'user', content: args }]);
      await sendLong(chatId, `🔧 <b>AI (fallback):</b>\n\n${r}`);
    }
  }
  // /hermes
  else if (cmd === '/hermes') {
    if (!args) { await sendMsg(chatId, '📝 <code>/hermes cerință</code>'); return; }
    await sendChatAction(chatId, 'typing');
    await sendMsg(chatId, '🤖 Hermes Agent... ⏳');
    try {
      const { execFile } = await import('child_process');
      const out = await new Promise<string>((res, rej) => {
        const bin = existsSync(HERMES_BIN) ? HERMES_BIN : 'hermes-agent';
        const timeout = setTimeout(() => rej(new Error('timeout')), 90000);
        execFile(bin, ['--print', args], {
          encoding: 'utf-8', timeout: 85000, maxBuffer: 10*1024*1024,
          env: { ...process.env, HERMES_HOME: '/home/z/hermes-agent-install/.hermes' },
          cwd: '/home/z/hermes-agent-install',
        }, (err, stdout) => { clearTimeout(timeout); if (err) rej(err); else res(stdout || 'No output'); });
      });
      await sendLong(chatId, `🤖 <b>Hermes Agent:</b>\n\n${out}`);
    } catch {
      const r = await callAI([{ role: 'system', content: 'Ești HERMES Agent, self-improving.' }, { role: 'user', content: args }]);
      await sendLong(chatId, `🤖 <b>Hermes (fallback):</b>\n\n${r}`);
    }
  }
  // /analyze
  else if (cmd === '/analyze') {
    const fl = session.files || [];
    if (!fl.length) { await sendMsg(chatId, '❌ Nu ai fișiere. Trimite un document.'); return; }
    await sendMsg(chatId, `🔍 Analizez ${fl.length} fișiere... ⏳`);
    let fc = '';
    for (const f of fl.slice(0, 5)) {
      fc += `\n--- ${f.name}\nTip: ${f.mime_type}\nMărime: ${f.size} bytes\n`;
      if (f.content_preview) fc += `Preview:\n${trunc(f.content_preview, 2000)}\n`;
    }
    const r = await callAI([
      { role: 'system', content: (AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT) + ' Expert în analiză. Analizează fișierele.' },
      { role: 'user', content: `${args || 'Analizează'}\n\nFIȘIERE:${fc}` },
    ], session.agent_model);
    session.context = r; saveSession(chatId, session);
    await sendLong(chatId, r);
  }
  // /files
  else if (cmd === '/files') {
    const sf = session.files || [];
    const sg = session.generated || [];
    if (!sf.length && !sg.length) { await sendMsg(chatId, '📂 Gol.'); return; }
    let m = '📂 <b>Fișiere:</b>\n';
    if (sf.length) { m += '\n📥 Upload:\n'; for (const f of sf.slice(-15)) m += `• ${esc(f.name)} (${f.size || '?'} bytes)\n`; }
    if (sg.length) { m += '\n💻 Generat:\n'; for (const f of sg.slice(-15)) m += `• ${esc(f)}\n`; }
    await sendMsg(chatId, m);
  }
  // /clear
  else if (cmd === '/clear') {
    saveSession(chatId, { history: [], train_prompts: 0, agent_model: cm, files: [], generated: [], context: '', redteam_topic: 0 });
    await sendMsg(chatId, '🧹 Sesiune resetată!');
  }
  // /expert
  else if (cmd === '/expert') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    cfg.expert_mode = cfg.expert_mode === 'true' ? 'false' : 'true';
    saveConfig(cfg);
    await sendMsg(chatId, `👑 Expert Mode: ${cfg.expert_mode === 'true' ? '✅ ON' : '❌ OFF'}`);
  }
  // /repair
  else if (cmd === '/repair') {
    if (!own) { await sendMsg(chatId, '⛔'); return; }
    cfg.auto_repair = cfg.auto_repair === 'false' ? 'true' : 'false';
    saveConfig(cfg);
    await sendMsg(chatId, `🔧 Auto-Repair: ${cfg.auto_repair === 'true' ? '✅ ON' : '❌ OFF'}`);
  }
  // ═══ TRAINING ═══
  // /train_prompt
  else if (cmd === '/train_prompt') {
    session.train_prompts = (session.train_prompts || 0) + 1;
    const lvl = session.train_prompts;
    const tp = TRAINING_PROMPTS[lvl % TRAINING_PROMPTS.length];
    const tier = HERMES_TIERS[tp.tier];
    await sendMsg(chatId, `🧬 <b>Training #${lvl}</b> [${tier.name}] — ${tp.title}\n⏳`);
    const r = await callAI([
      { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Cod complet cu explicații.` },
      { role: 'user', content: tp.prompt },
    ], session.agent_model);
    session.history = session.history || [];
    session.history.push({ role: 'user', content: tp.prompt }, { role: 'assistant', content: r });
    saveSession(chatId, session);
    const prog = lvl >= 50 ? '🌟 MAXIM!' : `📈 ${lvl}/50`;
    await sendLong(chatId, `🧬 <b>#${lvl}</b> [${tier.name}]\n\n${r}\n\n${prog}`);
  }
  // /loop
  else if (cmd === '/loop') {
    if (!args) {
      let m = '🔄 <b>Universal Loop Coder</b> — 12 limbi\n\n';
      for (const l of LOOP_LANGUAGES) m += `• <code>${l.name}</code> — ${l.loops.join(', ')}\n`;
      m += `\n<code>/loop python</code> • <code>/loop rust</code> • <code>/loop go</code>`;
      await sendLong(chatId, m);
    } else {
      const lang = LOOP_LANGUAGES.find(l => l.name.toLowerCase() === args.toLowerCase() || l.ext.replace('.','') === args.toLowerCase());
      if (!lang) { await sendMsg(chatId, `❌ Nu am găsit "${esc(args)}". /loop pentru lista.`); return; }
      await sendMsg(chatId, `🔄 <b>${lang.name}</b> ⏳`);
      const r = await callAI([
        { role: 'system', content: `Loop exercise în ${lang.name}. Loops: ${lang.loops.join(', ')}. Generează cod în markdown cu explicații în română.` },
        { role: 'user', content: `Generează exercițiu de loop în ${lang.name}. Include: problemă, cod complet, explicație.` },
      ], session.agent_model);
      await sendLong(chatId, `🔄 <b>${lang.name}</b>\n\n${r}`);
    }
  }
  // /p1-/p12
  else if (/^\/p(\d{1,2})$/.test(cmd)) {
    const num = parseInt(cmd.replace('/p', ''));
    if (LOOP_PROBLEMS[num]) await sendMsg(chatId, LOOP_PROBLEMS[num]);
    else await sendMsg(chatId, '❌ /p1 — /p12');
  }
  // ═══ LOOP CODER: tools-train-gpt.txt commands ═══
  // /languages
  else if (cmd === '/languages' || cmd === '/langs') {
    let m = `🌍 <b>Universal Loop Coder — ${LOOP_LANGUAGES.length} Limbi</b>\n\n`;
    for (const l of LOOP_LANGUAGES) m += `<code>${l.name}</code> ${l.ext} — ${l.loops.join(', ')}\n\n`;
    await sendLong(chatId, m);
  }
  // /patterns
  else if (cmd === '/patterns') {
    const patBtns: any[][] = [
      [{ text: '⚡ P1: Range Iterator', callback_data: 'spark:1' }],
      [{ text: '⚡ P2: Array Iteration', callback_data: 'spark:2' }],
      [{ text: '⚡ P3: Nested Loops', callback_data: 'spark:3' }],
      [{ text: '⚡ P4: Conditional Loop', callback_data: 'spark:4' }],
      [{ text: '⚡ P5: Infinite+Break', callback_data: 'spark:5' }],
      [{ text: '⚡ P6: Functional/Iterator', callback_data: 'spark:6' }],
      [{ text: '❌ Cancel', callback_data: 'spark:cancel' }],
    ];
    await sendInlineKB(chatId,
      `⚡ <b>6 Spark-Fast Loop Patterns</b>\n\n` +
      `<b>P1</b>: Range Iterator (1 to N)\n<b>P2</b>: Array/List Iteration\n<b>P3</b>: Nested Loops (Grid)\n<b>P4</b>: Conditional Loop (While)\n<b>P5</b>: Infinite Loop + Break\n<b>P6</b>: Functional/Iterator Style`,
      patBtns
    );
  }
  // /spark
  else if (cmd === '/spark') {
    if (!args) {
      await sendMsg(chatId,
        `🎯 <b>Spark Prompts per Language</b>\n\n<code>/spark python</code>\n<code>/spark rust</code>\n<code>/spark go</code>\n<code>/spark typescript</code>\n<code>/spark zig</code>\n<code>/spark c++</code>\n<code>/spark java</code>\n\nFiecare prompt generează cod cu explicații.`
      );
    } else {
      const lang = LOOP_LANGUAGES.find(l => l.name.toLowerCase() === args.toLowerCase() || l.ext.replace('.','') === args.toLowerCase());
      if (!lang) { await sendMsg(chatId, `❌ Nu am găsit "${esc(args)}". /languages pentru lista.`); return; }
      await sendMsg(chatId, `⚡ <b>${lang.name} Spark</b> ⏳`);
      const r = await callAI([
        { role: 'system', content: `Loop expert în ${lang.name}. Loops: ${lang.loops.join(', ')}. Generează cod complet în markdown cu explicații detaliate.` },
        { role: 'user', content: `Generează un exercițiu spark (rapid, avansat) de loop în ${lang.name}. Include: problemă, cod optimizat, explicație, și o variantă alternativă.` },
      ], session.agent_model);
      await sendLong(chatId, `⚡ <b>${lang.name} Spark</b>\n\n${r}`);
    }
  }
  // /tiers
  else if (cmd === '/tiers' || cmd === '/tier') {
    const tierBtns: any[][] = HERMES_TIERS.map((t, i) => [{ text: `T${i+1}: ${t.name}`, callback_data: `tier:${i}` }]);
    tierBtns.push([{ text: '❌ Cancel', callback_data: 'tier:cancel' }]);
    let m = '🏆 <b>5 Hermes Training Tiers</b>\n\n';
    HERMES_TIERS.forEach((t, i) => {
      const n = TRAINING_PROMPTS.filter(p => p.tier === i).length;
      m += `${i === 0 ? '🟢' : i === 1 ? '🔵' : i === 2 ? '🟡' : i === 3 ? '🟠' : '🔴'} <b>T${i+1}: ${t.name}</b>\n🤖 ${t.model}\n🎯 ${t.focus}\n📚 ${n} prompts\n\n`;
    });
    m += `<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code>`;
    await sendInlineKB(chatId, m, tierBtns);
  }
  // /curriculum
  else if (cmd === '/curriculum') {
    let m = '📚 <b>Loop Coder Hermes — Curriculum Complet</b>\n\n';
    HERMES_TIERS.forEach((t, i) => { m += `${i === 0 ? '🟢' : i === 1 ? '🔵' : i === 2 ? '🟡' : i === 3 ? '🟠' : '🔴'} <b>${t.name}</b> — ${t.model}\n`; });
    m += '\n';
    for (let ti = 0; ti < HERMES_TIERS.length; ti++) {
      const tier = HERMES_TIERS[ti];
      const prompts = TRAINING_PROMPTS.filter(p => p.tier === ti);
      m += `\n${ti === 0 ? '🟢' : ti === 1 ? '🔵' : ti === 2 ? '🟡' : ti === 3 ? '🟠' : '🔴'} <b>Tier ${ti+1}: ${tier.name}</b>\n${tier.focus}\n\n`;
      prompts.forEach((p, pi) => { m += `${pi+1}. ${p.title}\n`; });
    }
    m += `\n<b>Best Practices:</b> ✅ Specific, Comments, Error Handling, Tests, Optimization\n\n<code>/train 1-5</code> • <code>/t1</code>—<code>/t5</code> • <code>/redteam</code>`;
    await sendLong(chatId, m);
  }
  // /performance
  else if (cmd === '/performance' || cmd === '/perf') {
    await sendLong(chatId,
      `⚙️ <b>Loop Performance Reference</b>\n\n` +
      `<b>Python</b>: List comprehensions, map()\n   ↳ Avoid explicit for loops for data transform\n\n` +
      `<b>JavaScript</b>: for-of (not forEach)\n   ↳ forEach has function call overhead\n\n` +
      `<b>Go</b>: Single for loop, no allocations\n   ↳ Pre-allocate slices, avoid append in loops\n\n` +
      `<b>Rust</b>: Iterator chains\n   ↳ Zero-cost abstractions, often faster than C\n\n` +
      `<b>C/C++</b>: for with -O3, SIMD intrinsics\n   ↳ Manual unrolling for hot paths\n\n` +
      `<b>Java</b>: Enhanced for-each (on arrays)\n   ↳ Stream API has overhead unless parallel\n\n` +
      `<b>C#</b>: for loop (not foreach on List)\n   ↳ LINQ has overhead; Span<T> for speed\n\n` +
      `<b>Ruby</b>: each vs while\n   ↳ while is slightly faster for simple iteration\n\n` +
      `<b>Swift</b>: for-in with arrays\n   ↳ Compiler optimizes for-in well\n\n` +
      `<b>Kotlin</b>: for loop\n   ↳ forEach has inline penalty\n\n` +
      `<b>Lua</b>: numeric for\n   ↳ pairs/ipairs slower than numeric for\n\n` +
      `<b>Zig</b>: while with comptime\n   ↳ comptime evaluation is zero-cost`
    );
  }
  // /best_practices
  else if (cmd === '/best_practices') {
    await sendMsg(chatId,
      `🎯 <b>Curriculum Best Practices</b>\n\n` +
      `<b>1. Be Specific</b> — menționează loop types, constraints, edge cases\n\n` +
      `<b>2. Request Comments</b> — inline documentation explică logica\n\n` +
      `<b>3. Error Handling</b> — try/except/finally unde e relevant\n\n` +
      `<b>4. Test Cases</b> — example inputs + expected outputs\n\n` +
      `<b>5. Optimization</b> — efficiency pentru Advanced/Expert\n\n` +
      `<b>6. Step-by-Step</b> — explicații pentru Explanation/Intermediate\n\n` +
      `<b>7. Multi-Language</b> — compară cu /languages și /spark\n\n` +
      `<b>8. Progressive Difficulty</b> — Intermediate → Expert`
    );
  }
  // /train (with tier number)
  else if (cmd === '/train') {
    const tierNum = args ? parseInt(args) : undefined;
    const tierIdx = tierNum ? tierNum - 1 : -1;
    if (tierIdx < 0 || tierIdx >= HERMES_TIERS.length) {
      let m = '🧬 <b>Training cu Tier Specific</b>\n\nSelectează tier:\n';
      HERMES_TIERS.forEach((t, i) => { m += `<code>/train ${i+1}</code> sau <code>/t${i+1}</code> — ${t.name}\n`; });
      m += `\nSau <code>/train_prompt</code> pentru auto-antrenare.`;
      await sendMsg(chatId, m);
      return;
    }
    const tier = HERMES_TIERS[tierIdx];
    const tierPrompts = TRAINING_PROMPTS.filter(p => p.tier === tierIdx);
    const tp = tierPrompts[Math.floor(Math.random() * tierPrompts.length)] || tierPrompts[0];
    session.train_prompts = (session.train_prompts || 0) + 1;
    await sendMsg(chatId, `🧬 <b>#${session.train_prompts}</b> [${tier.name}] — ${tp?.title}\n⏳`);
    const r = await callAI([
      { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}. Cod complet cu explicații.` },
      { role: 'user', content: tp?.prompt || `Training tier ${tierIdx + 1}` },
    ], session.agent_model);
    session.history = session.history || [];
    session.history.push({ role: 'user', content: tp?.prompt || '' }, { role: 'assistant', content: r });
    saveSession(chatId, session);
    const prog = session.train_prompts >= 50 ? '🌟 MAXIM!' : `📈 ${session.train_prompts}/50`;
    await sendLong(chatId, `🧬 <b>#${session.train_prompts}</b> [${tier.name}] — ${tp?.title}\n\n${r}\n\n${prog}`);
  }
  // /t1-/t5
  else if (/^\/t([1-5])$/.test(cmd)) {
    const ti = parseInt(cmd[2]) - 1;
    const tier = HERMES_TIERS[ti];
    const tierPrompts = TRAINING_PROMPTS.filter(p => p.tier === ti);
    const tp = tierPrompts[Math.floor(Math.random() * tierPrompts.length)] || tierPrompts[0];
    session.train_prompts = (session.train_prompts || 0) + 1;
    await sendMsg(chatId, `🧬 <b>#${session.train_prompts}</b> [${tier.name}] — ${tp?.title}\n⏳`);
    const r = await callAI([
      { role: 'system', content: `HERMES training. Tier: ${tier.name} (${tier.model}). Focus: ${tier.focus}.` },
      { role: 'user', content: tp?.prompt || `Training tier ${ti + 1}` },
    ], session.agent_model);
    session.history = session.history || [];
    session.history.push({ role: 'user', content: tp?.prompt || '' }, { role: 'assistant', content: r });
    saveSession(chatId, session);
    const prog = session.train_prompts >= 50 ? '🌟 MAXIM!' : `📈 ${session.train_prompts}/50`;
    await sendLong(chatId, `🧬 <b>#${session.train_prompts}</b> [${tier.name}]\n\n${r}\n\n${prog}`);
  }
  // ═══ RED TEAM ═══
  // /redteam
  else if (cmd === '/redteam') {
    const idx = args ? parseInt(args) - 1 : -1;
    if (idx >= 0 && idx < REDTEAM_TOPICS.length) {
      const topic = REDTEAM_TOPICS[idx];
      session.redteam_topic = idx;
      saveSession(chatId, session);
      await sendMsg(chatId, `🔴 <b>RED TEAM #${idx + 1}: ${topic.title}</b>\n\n${topic.desc}`);
      await sendChatAction(chatId, 'typing');
      const r = await callAI([
        { role: 'system', content: 'Ești instructor RED TEAM. Explică conceptul de securitate în detaliu, cu exemple educaționale, contra-măsuri și best practices. Limbajul tehnic dar accesibil. Răspunzi în română.' },
        { role: 'user', content: `Prezentare completă despre: ${topic.title}\n${topic.desc}\n\nInclude: explicație detaliată, exemplu educațional, contra-măsuri, referințe OWASP.` },
      ], session.agent_model);
      await sendLong(chatId, r);
    } else {
      let m = '🔴 <b>RED TEAM Training</b> — Selectează topic:\n\n';
      REDTEAM_TOPICS.forEach((t, i) => { m += `${i + 1}. <b>${t.title}</b>\n   ${t.desc}\n\n`; });
      m += `\n<code>/redteam 1</code> ... <code>/redteam ${REDTEAM_TOPICS.length}</code>`;
      await sendLong(chatId, m);
    }
  }
  // /learn
  else if (cmd === '/learn') {
    if (!args) {
      let m = '📚 <b>Hermes Learning Hub</b>\n\n<code>/learn [topic]</code> pentru studiu detaliat.\n\n<b>Topics:</b>\n';
      REDTEAM_TOPICS.forEach((t, i) => { m += `${i + 1}. ${t.title}\n`; });
      m += `\nSau: <code>/learn python</code>, <code>/learn rust</code>, <code>/learn cybersecurity</code>`;
      await sendLong(chatId, m);
    } else {
      await sendMsg(chatId, `📚 Studiu: <b>${esc(args)}</b> ⏳`);
      const r = await callAI([
        { role: 'system', content: 'Ești profesor expert. Explică detaliat cu exemple practice. Folosește markdown formatting. Răspunzi în română.' },
        { role: 'user', content: `Explică detaliat: ${args}\n\nInclude: concepte de bază, exemple practice, exerciții, și resurse pentru studiu suplimentar.` },
      ], session.agent_model);
      await sendLong(chatId, r);
    }
  }
  // /tools
  else if (cmd === '/tools') {
    let m = '🔧 <b>Bug Bounty & Pentest Tools</b>\n\n';
    const cats: Record<string, string[]> = {};
    for (const [name, info] of Object.entries(BUG_BOUNTY_TOOLS)) {
      if (!cats[info.cat]) cats[info.cat] = [];
      cats[info.cat].push(name);
    }
    for (const [cat, tools] of Object.entries(cats)) {
      m += `\n<b>── ${cat} ──</b>\n`;
      for (const t of tools) m += `  <code>${t}</code> — ${BUG_BOUNTY_TOOLS[t].desc}\n`;
    }
    await sendLong(chatId, m);
  }
  // /scan_info
  else if (cmd === '/scan_info') {
    const r = await callAI([
      { role: 'system', content: 'Ești expert în securitate. Prezintă metodologia completă de scanare securitate. Răspunzi în română.' },
      { role: 'user', content: 'Prezintă metodologia completă de penetration testing, de la recon la raportare. Include: tool-uri recomandate, tehnicile cheie, și best practices.' },
    ], session.agent_model);
    await sendLong(chatId, `🔍 <b>Scan Methodology</b>\n\n${r}`);
  }
  // /payload
  else if (cmd === '/payload') {
    if (!args) {
      await sendMsg(chatId, `📝 <code>/payload [tip]</code>\n\nTipuri: sqli, xss, ssrf, lfi, rce, jwt, idor\n\n⚠️ Educational only!`);
    } else {
      await sendMsg(chatId, `📝 Payload educațional: <b>${esc(args)}</b> ⏳`);
      const r = await callAI([
        { role: 'system', content: 'Ești instructor de securitate. Prezintă exemple EDUCAȚIONALE de payload-uri pentru testarea autorizată. Include mereu contra-măsuri și remedieri. Răspunzi în română.' },
        { role: 'user', content: `Prezintă exemple educaționale de ${args} payload-uri pentru testare securitate. Include: payload, explicație, detectare, și contra-măsuri.` },
      ], session.agent_model);
      await sendLong(chatId, r);
    }
  }
  // ═══ FSRS ═══
  // /fsrs
  else if (cmd === '/fsrs') {
    const cards = loadFsrs(chatId);
    if (!cards.length) {
      await sendMsg(chatId,
        `🧠 <b>FSRS Spaced Repetition</b>\n\n` +
        `Niciun card. Adaugă cu:\n` +
        `<code>/fsrsadd Întrebare|Răspuns</code>\n\n` +
        `Ex:\n<code>/fsrsadd Ce este XSS?|Cross-Site Scripting este...</code>`
      );
    } else {
      const due = cards.filter(c => {
        if (c.state === 'new') return true;
        const daysSince = (Date.now() - c.last_review) / (1000 * 60 * 60 * 24);
        return daysSince >= c.scheduled_days;
      });
      if (!due.length) {
        const nextCard = cards.reduce((a, b) => a.scheduled_days < b.scheduled_days ? a : b);
        await sendMsg(chatId, `🧠 FSRS: ✅ Toate cele ${cards.length} carduri revizuite!\nUrmătorul card în ${nextCard.scheduled_days} zile.`);
      } else {
        const card = due[0];
        await sendInlineKB(chatId,
          `🧠 <b>FSRS Review</b> (${due.length} due)\n\n❓ <b>${esc(card.question)}</b>\n\nApasă pentru răspuns:`,
          [[{ text: '👁️ Arată răspunsul', callback_data: `fsrs_show:${card.id}` }]]
        );
      }
    }
  }
  // /fsrsadd
  else if (cmd === '/fsrsadd') {
    if (!args || !args.includes('|')) {
      await sendMsg(chatId, '📝 <code>/fsrsadd Întrebare|Răspuns</code>');
    } else {
      const [q, a] = args.split('|', 2);
      const cards = loadFsrs(chatId);
      cards.push({
        id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        question: q.trim(), answer: a.trim(),
        stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 0,
        reps: 0, lapses: 0, state: 'new', last_review: 0,
      });
      saveFsrs(chatId, cards);
      await sendMsg(chatId, `✅ Card adăugat! (${cards.length} total)\n\n❓ ${esc(q.trim())}\n💬 ${esc(a.trim())}`);
    }
  }
  // /fsrslist
  else if (cmd === '/fsrslist') {
    const cards = loadFsrs(chatId);
    if (!cards.length) { await sendMsg(chatId, '🧠 Niciun card.'); }
    else {
      let m = `🧠 <b>FSRS Cards (${cards.length})</b>\n\n`;
      cards.forEach((c, i) => {
        m += `${i + 1}. [${c.state}] ${esc(trunc(c.question, 50))}\n   Reps: ${c.reps} | Stability: ${c.stability.toFixed(1)}\n\n`;
      });
      await sendLong(chatId, m);
    }
  }
  // /fsrsreset
  else if (cmd === '/fsrsreset') {
    saveFsrs(chatId, []);
    await sendMsg(chatId, '🧠 FSRS resetat!');
  }
  // Unknown command
  else if (text.startsWith('/')) {
    await sendMsg(chatId, `❓ Necunoscut: <code>${esc(cmd)}</code>\n/start pentru meniu.`);
  }
}

// ═══════════════════════════════════════════════════════════════
// CALLBACK QUERY HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleCallback(update: any) {
  const cb = update.callback_query;
  if (!cb) return;
  const chatId = cb.message?.chat?.id;
  const msgId = cb.message?.message_id;
  const data = cb.data || '';
  const cfg = loadConfig();

  // Acknowledge
  await tgApi('answerCallbackQuery', { callback_query_id: cb.id });

  if (!chatId || !msgId) return;

  // Model selection
  if (data.startsWith('model:')) {
    const m = data.split(':', 2)[1];
    if (m === 'cancel') { await editMessage(chatId, msgId, '❌ Anulat.'); }
    else if (AGENT_MODELS[m]) {
      cfg.glm_model = m; saveConfig(cfg);
      const s = loadSession(chatId); s.agent_model = m; saveSession(chatId, s);
      await editMessage(chatId, msgId, `✅ Model: <b>${m}</b>\n${AGENT_MODELS[m].provider} — ${AGENT_MODELS[m].desc}`);
    }
  }
  // Endpoint selection
  else if (data.startsWith('endpoint:')) {
    const k = data.split(':', 2)[1];
    if (k === 'cancel') { await editMessage(chatId, msgId, '❌ Anulat.'); }
    else {
      cfg.glm_endpoint = k === 'coding'
        ? 'https://api.z.ai/api/coding/paas/v4/chat/completions'
        : 'https://api.z.ai/api/paas/v4/chat/completions';
      saveConfig(cfg);
      await editMessage(chatId, msgId, `✅ Endpoint: <code>${esc(cfg.glm_endpoint)}</code>`);
    }
  }
  // FSRS show answer
  else if (data.startsWith('fsrs_show:')) {
    const cardId = data.split(':', 2)[1];
    const cards = loadFsrs(chatId);
    const card = cards.find(c => c.id === cardId);
    if (card) {
      await editMessage(chatId, msgId,
        `🧠 <b>FSRS Review</b>\n\n❓ ${esc(card.question)}\n\n💬 <b>${esc(card.answer)}</b>\n\nCum te-ai descurcat?`
      );
      // Send rating buttons
      await sendInlineKB(chatId, 'Ratează:', [
        [
          { text: '😅 Greu (1)', callback_data: `fsrs_rate:${cardId}:1` },
          { text: '😐 Greșit (2)', callback_data: `fsrs_rate:${cardId}:2` },
          { text: '🔍 Dificil (3)', callback_data: `fsrs_rate:${cardId}:3` },
        ],
        [
          { text: '👍 OK (4)', callback_data: `fsrs_rate:${cardId}:4` },
          { text: '🤯 Ușor! (5)', callback_data: `fsrs_rate:${cardId}:5` },
        ],
      ]);
    }
  }
  // FSRS rate
  else if (data.startsWith('fsrs_rate:')) {
    const [, cardId, quality] = data.split(':');
    const cards = loadFsrs(chatId);
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx >= 0) {
      cards[idx] = fsrsReview(cards[idx], parseInt(quality));
      saveFsrs(chatId, cards);
      const labels = ['', 'Oops!', 'Greșit', 'Dificil', 'Bine!', 'Excelent!'];
      await editMessage(chatId, msgId,
        `🧠 ${parseInt(quality) >= 3 ? '✅' : '🔁'} <b>${labels[parseInt(quality)]}</b>\n\n` +
        `Stability: ${cards[idx].stability.toFixed(1)} | Difficulty: ${cards[idx].difficulty.toFixed(1)}\n` +
        `Next review: ${cards[idx].scheduled_days} zile | Reps: ${cards[idx].reps}`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleFileUpload(chatId: number, msg: any) {
  ensureDir(DOWNLOADS_DIR);
  let fid = '', fn = '', fsz = 0, mime = '';
  if (msg.document) {
    fid = msg.document.file_id;
    fn = msg.document.file_name || `f_${Date.now()}`;
    fsz = msg.document.file_size || 0;
    mime = msg.document.mime_type || 'application/octet-stream';
  } else if (msg.photo?.length) {
    const p = msg.photo[msg.photo.length - 1];
    fid = p.file_id; fn = `ph_${Date.now()}.jpg`; fsz = p.file_size || 0; mime = 'image/jpeg';
  }
  fn = fn.replace(/[^a-zA-Z0-9._-]/g, '_');
  const sp = join(DOWNLOADS_DIR, fn);
  await sendMsg(chatId, `📥 Descarc ${fn}...`);
  const ok = await downloadTgFile(fid, sp);
  if (ok) {
    if (!fsz) try { fsz = statSync(sp).size; } catch {}
    const pv = extractTextPreview(sp);
    const session = loadSession(chatId);
    session.files = session.files || [];
    session.files.push({ name: fn, path: sp, size: fsz, mime_type: mime, content_preview: pv || null, uploaded_at: new Date().toISOString() });
    saveSession(chatId, session);
    const sz = fsz > 1024 ? `${(fsz / 1024).toFixed(1)}KB` : `${fsz}B`;
    await sendMsg(chatId, `✅ <b>${esc(fn)}</b>\n📦 ${sz}\n📝 ${pv ? '✅ text preview' : '📷 binar'}\n\nFolosește /analyze sau /code`);
  } else {
    await sendMsg(chatId, `❌ Eroare descărcare ${esc(fn)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AI CHAT (non-command messages)
// ═══════════════════════════════════════════════════════════════
async function handleChat(chatId: number, text: string) {
  const session = loadSession(chatId);
  session.history = session.history || [];
  session.history.push({ role: 'user', content: text });
  if (session.history.length > 20) session.history = session.history.slice(-20);
  saveSession(chatId, session);
  await sendChatAction(chatId, 'typing');
  try {
    const sys = AGENT_PROMPTS[session.agent_model] || DEFAULT_PROMPT;
    const r = await callAI([{ role: 'system', content: sys }, ...session.history], session.agent_model);
    session.history.push({ role: 'assistant', content: r });
    if (session.history.length > 20) session.history = session.history.slice(-20);
    saveSession(chatId, session);
    await sendLong(chatId, r);
  } catch (e: any) {
    await sendMsg(chatId, `❌ AI Error: ${esc((e?.message || '').slice(0, 200))}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN POLLING LOOP
// ═══════════════════════════════════════════════════════════════
let lastOffset = 0;
let isRunning = true;
const POLL_INTERVAL = 2000;

async function poll() {
  const cfg = loadConfig();
  if (!cfg.telegram_token) { console.log('[Bot] No token, waiting...'); return; }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.telegram_token}/getUpdates?offset=${lastOffset + 1}&timeout=10&allowed_updates=["message","callback_query"]`
    );
    const data = await res.json();
    if (!data.ok) { console.log(`[Bot] API Error: ${data.description}`); lastOffset = 0; return; }

    for (const update of data.result || []) {
      lastOffset = update.update_id;

      // Callback queries
      if (update.callback_query) {
        console.log(`[Bot] Callback: ${update.callback_query.data}`);
        await handleCallback(update).catch(e => console.error('[CB]', e?.message));
        continue;
      }

      // Messages
      const msg = update.message;
      if (!msg) continue;

      const chatId = msg.chat?.id;
      const userId = msg.from?.id;
      const text = (msg.text || msg.caption || '').trim();
      const fromName = msg.from ? [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') : 'User';

      // File uploads
      if (msg.document || msg.photo) {
        console.log(`[Bot] File: ${(msg.document?.file_name || 'photo')} from ${fromName}`);
        await handleFileUpload(chatId, msg).catch(e => console.error('[File]', e?.message));
        continue;
      }

      if (!text) continue;

      console.log(`[Bot] ${fromName}: ${text.slice(0, 80)}`);

      // Commands
      if (text.startsWith('/')) {
        await handleCommand(chatId, userId, text, update).catch(e => console.error('[Cmd]', e?.message));
      } else {
        // Free chat
        await handleChat(chatId, text).catch(e => console.error('[Chat]', e?.message));
      }
    }
  } catch (e: any) {
    console.error(`[Bot] Poll error: ${e.message}`);
    lastOffset = 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════
console.log('═════════════════════════════════════════════');
console.log('🤖 HERMES BOT v4.0 — Complete Edition');
console.log('═════════════════════════════════════════════');
console.log(`[Bot] Config: ${CONFIG_FILE}`);
console.log(`[Bot] Token: ${loadConfig().telegram_token ? loadConfig().telegram_token.slice(0, 10) + '...' : 'NOT SET'}`);
console.log(`[Bot] Model: ${loadConfig().glm_model}`);
console.log(`[Bot] Owner: ${loadConfig().owner_id || 'none'}`);
console.log(`[Bot] AI: z-ai-web-dev-sdk (auto)`);
console.log(`[Bot] Polling every ${POLL_INTERVAL}ms...`);
console.log('═════════════════════════════════════════════');

// Initialize z-ai-web-dev-sdk eagerly
getZAI().then(() => console.log('[AI] SDK ready!')).catch(e => console.error('[AI] SDK init error:', e.message));

// Delete webhook so getUpdates works
(async () => {
  const cfg = loadConfig();
  if (cfg.telegram_token) {
    const r = await fetch(`https://api.telegram.org/bot${cfg.telegram_token}/deleteWebhook?drop_pending_updates=true`);
    console.log(`[Bot] Webhook deleted: ${(await r.json()).ok}`);
  }
})();

// Main loop
(async () => {
  while (isRunning) {
    await poll();
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
})();

process.on('SIGINT', () => { console.log('\n[Bot] Shutting down...'); isRunning = false; process.exit(0); });
process.on('SIGTERM', () => { isRunning = false; process.exit(0); });
