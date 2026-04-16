/**
 * HERMES TELEGRAM BOT - Mini Service
 * Polls Telegram for messages and responds to commands.
 * Reads config from ../data/config.json (shared with web panel).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ─── Config (shared with web panel via data/config.json) ───
const DATA_DIR = join(process.cwd().replace(/\/mini-services\/telegram-bot$/, ""), "data");
const CONFIG_FILE = join(DATA_DIR, "config.json");

interface HermesConfig {
  glm_api_key: string;
  telegram_token: string;
  glm_model: string;
  glm_endpoint: string;
  github_repo: string;
  auto_repair: string;
  max_repair_iterations: number;
  expert_mode: string;
  [key: string]: any;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): HermesConfig {
  ensureDataDir();
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return {
    glm_api_key: "",
    telegram_token: "",
    glm_model: "glm-4.6",
    glm_endpoint: "https://api.z.ai/api/coding/paas/v4/chat/completions",
    github_repo: "",
    auto_repair: "true",
    max_repair_iterations: 3,
    expert_mode: "false",
  };
}

function saveConfig(cfg: HermesConfig) {
  ensureDataDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

// ─── Types ───
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string; title?: string | null };
    from?: { id: number; first_name?: string; last_name?: string; username?: string };
    text?: string;
    photo?: any[];
    document?: { file_id: string; file_name?: string; file_size?: number };
    caption?: string;
    date: number;
  };
}

interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: string;
  reply_markup?: any;
}

// ─── Config ───
const POLL_INTERVAL = 2000; // ms between getUpdates calls
let lastOffset = 0;
let isRunning = true;

// ─── Helpers ───
function maskSecret(value: string): string {
  if (!value || value.length <= 12) return value ? "****" : "";
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function getConfig() {
  return loadConfig();
}

function updateConfig(updates: Record<string, any>) {
  const cfg = getConfig();
  for (const [key, value] of Object.entries(updates)) {
    cfg[key] = value;
  }
  saveConfig(cfg);
  return cfg;
}

// ─── Telegram API ───
async function tgApiCall(method: string, body: any, token?: string): Promise<any> {
  const t = token || getConfig().telegram_token;
  if (!t) return { ok: false, description: "No token configured" };
  const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(msg: TelegramMessage): Promise<any> {
  return tgApiCall("sendMessage", msg);
}

async function sendMenu(chatId: number) {
  const menu = {
    chat_id: chatId,
    text: `🤖 <b>HERMES BOT v4.0</b> — Expert Edition

Comenzi disponibile:

📋 <b>Configurare:</b>
/api CHEIE — setează cheia GLM
/status — status config curent
/model — schimbă modelul GLM
/endpoint — schimbă endpoint-ul

💬 <b>Utilitare:</b>
/analyze [cerință] — analizează cu GLM
/code cerință — generează cod
/ask întrebare — întreabă GLM orice

📁 <b>Fișiere:</b>
/files — listează fișierele
/clear — resetează sesiunea

🚀 <b>Deploy:</b>
/setrepo URL — setează repo GitHub
/deploy — info deploy
`,
    parse_mode: "HTML" as const,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📊 Status", callback_data: "cmd_status" },
          { text: "🧠 GLM Chat", callback_data: "cmd_glm" },
        ],
        [
          { text: "📁 Files", callback_data: "cmd_files" },
          { text: "⚙️ Settings", callback_data: "cmd_settings" },
        ],
        [
          { text: "🚀 Deploy", callback_data: "cmd_deploy" },
          { text: "🔄 Loop P1-P12", callback_data: "cmd_loops" },
        ],
        [
          { text: "💡 GLM Models", callback_data: "cmd_models" },
          { text: "🔗 Endpoints", callback_data: "cmd_endpoints" },
        ],
      ],
    },
  };
  return sendMessage(menu);
}

// ─── GLM Chat ───
async function callGLM(prompt: string, systemPrompt?: string): Promise<string> {
  const cfg = getConfig();
  if (!cfg.glm_api_key) return "❌ GLM API key nu este setat. Folosește /api CHEIA_TA";
  if (!cfg.glm_endpoint) return "❌ GLM endpoint nu este setat.";

  try {
    const messages: any[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch(cfg.glm_endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.glm_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.glm_model || "glm-4.6",
        messages,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    const data = await res.json();
    if (res.status !== 200 || !data.choices) {
      return `❌ GLM Error (${res.status}): ${(data.error?.message || JSON.stringify(data)).slice(0, 300)}`;
    }
    return data.choices[0].message.content;
  } catch (e: any) {
    return `❌ GLM Network Error: ${e.message}`;
  }
}

// ─── Loop Problems ───
const LOOP_PROBLEMS: Record<number, { title: string; code: string }> = {
  1: {
    title: "📚 PROBLEMA 1: Numere de la 1 la 10",
    code: `for i in range(1, 11):\n    print(i, end=" ")\nprint()`,
  },
  2: {
    title: "📚 PROBLEMA 2: Adunare până la 'done'",
    code: `total = 0\nwhile True:\n    user_input = input("Introdu un număr (sau 'done'): ")\n    if user_input.lower() == 'done':\n        break\n    try:\n        total += float(user_input)\n    except ValueError:\n        print("Input invalid.")\nprint(f"Suma: {total}")`,
  },
  3: {
    title: "📚 PROBLEMA 3: Tabla înmulțirii pentru 7",
    code: `num = 7\nfor i in range(1, 11):\n    print(f"{num} x {i} = {num * i}")`,
  },
  4: {
    title: "📚 PROBLEMA 4: Fiecare al doilea element",
    code: `my_list = ['apple', 'banana', 'cherry', 'date', 'elderberry']\nfor i in range(0, len(my_list), 2):\n    print(my_list[i])`,
  },
  5: {
    title: "📚 PROBLEMA 5: Triunghi cu asteriscuri",
    code: `height = 5\nfor i in range(1, height + 1):\n    print('*' * i)`,
  },
  6: {
    title: "📚 PROBLEMA 6: Numere prime între 2 și 50",
    code: `import math\nprimes = []\nfor num in range(2, 51):\n    is_prime = True\n    for d in range(2, int(math.sqrt(num)) + 1):\n        if num % d == 0:\n            is_prime = False\n            break\n    if is_prime:\n        primes.append(num)\nprint(primes)`,
  },
  7: {
    title: "📚 PROBLEMA 7: Lungime string + uppercase",
    code: `strings = ["hello", "python", "code", "programming", "loop"]\nfor s in strings:\n    length = len(s)\n    if length > 5:\n        print(f"{s} ({length}) -> {s.upper()}")\n    else:\n        print(f"{s} ({length})")`,
  },
  8: {
    title: "📚 PROBLEMA 8: Intersecția a două liste",
    code: `list1 = [1, 2, 3, 4, 5, 6, 7]\nlist2 = [5, 6, 7, 8, 9]\nintersection = []\nfor item1 in list1:\n    for item2 in list2:\n        if item1 == item2 and item1 not in intersection:\n            intersection.append(item1)\nprint(intersection)`,
  },
  9: {
    title: "📚 PROBLEMA 9: Bubble Sort",
    code: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n                swapped = True\n        if not swapped:\n            break\n    return arr\n\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nprint(bubble_sort(numbers.copy()))`,
  },
  10: {
    title: "📚 PROBLEMA 10: Palindrom",
    code: `import re\n\ndef is_palindrome(s):\n    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()\n    left, right = 0, len(cleaned) - 1\n    while left < right:\n        if cleaned[left] != cleaned[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n\nprint(is_palindrome("A man, a plan, a canal: Panama"))`,
  },
  11: {
    title: "📚 PROBLEMA 11: Primele 10 Fibonacci",
    code: `n = 10\na, b = 0, 1\nfor _ in range(n):\n    print(a, end=" ")\n    a, b = b, a + b\nprint()`,
  },
  12: {
    title: "📚 PROBLEMA 12: Longest Increasing Subsequence",
    code: `def longest_increasing_subsequence(arr):\n    if not arr:\n        return 0\n    dp = [1] * len(arr)\n    for i in range(len(arr)):\n        for j in range(i):\n            if arr[j] < arr[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)\n\nprint(longest_increasing_subsequence([10, 9, 2, 5, 3, 7, 101, 18]))`,
  },
};

// ─── Command Handlers ───
async function handleCommand(chatId: number, text: string, fromName: string) {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  const sender = fromName || "User";

  switch (cmd) {
    case "/start":
    case "/help":
      await sendMenu(chatId);
      break;

    case "/status": {
      const cfg = getConfig();
      await sendMessage({
        chat_id: chatId,
        parse_mode: "HTML",
        text: `📊 <b>Status Hermes Bot</b>\n\n` +
          `🤖 Telegram: ✅ Activ\n` +
          `🔑 GLM Key: ${cfg.glm_api_key ? "✅ " + maskSecret(cfg.glm_api_key) : "❌ Not set"}\n` +
          `🧠 GLM Model: <code>${cfg.glm_model || "not set"}</code>\n` +
          `🔗 Endpoint: <code>${(cfg.glm_endpoint || "not set").split("/").slice(-2).join("/")}</code>\n` +
          `🐙 GitHub: <code>${cfg.github_repo || "not set"}</code>\n` +
          `🔧 Auto-Repair: ${cfg.auto_repair !== "false" ? "✅ ON" : "❌ OFF"}\n` +
          `👑 Expert: ${cfg.expert_mode === "true" ? "✅ ON" : "❌ OFF"}`,
      });
      break;
    }

    case "/api": {
      if (!args) {
        const cfg = getConfig();
        await sendMessage({
          chat_id: chatId,
          text: `🔑 GLM API Key curentă: ${cfg.glm_api_key ? maskSecret(cfg.glm_api_key) : "not set"}\n\nFolosire: /api CHEIA_TA\nȘtergere: /api clear`,
        });
      } else if (args.toLowerCase() === "clear") {
        updateConfig({ glm_api_key: "" });
        await sendMessage({ chat_id: chatId, text: "✅ GLM API key ștearsă." });
      } else {
        updateConfig({ glm_api_key: args });
        // Test it
        const test = await callGLM("Reply with exactly: OK");
        if (test.includes("OK")) {
          await sendMessage({ chat_id: chatId, text: "✅ GLM API key salvată și testată cu succes!" });
        } else {
          await sendMessage({
            chat_id: chatId,
            text: `⚠️ Key salvată dar testul a eșuat:\n\n${test.slice(0, 500)}`,
          });
        }
      }
      break;
    }

    case "/model": {
      if (!args) {
        const cfg = getConfig();
        await sendMessage({
          chat_id: chatId,
          parse_mode: "HTML",
          text: `🧠 Model curent: <code>${cfg.glm_model || "not set"}</code>\n\nSelectează modelul:`,
          reply_markup: {
            inline_keyboard: [
              [{ text: "glm-4.6", callback_data: "model_glm-4.6" }],
              [{ text: "glm-4.5-air", callback_data: "model_glm-4.5-air" }],
              [{ text: "glm-4-plus", callback_data: "model_glm-4-plus" }],
              [{ text: "glm-5.1", callback_data: "model_glm-5.1" }],
              [{ text: "glm-5-turbo", callback_data: "model_glm-5-turbo" }],
            ],
          },
        });
      } else {
        updateConfig({ glm_model: args });
        await sendMessage({ chat_id: chatId, text: `✅ Model setat la: ${args}` });
      }
      break;
    }

    case "/endpoint": {
      if (!args) {
        const cfg = getConfig();
        await sendMessage({
          chat_id: chatId,
          parse_mode: "HTML",
          text: `🔗 Endpoint curent:\n<code>${cfg.glm_endpoint || "not set"}</code>\n\nSelectează:`,
          reply_markup: {
            inline_keyboard: [
              [{ text: "Coding API", callback_data: "ep_coding" }],
              [{ text: "General API", callback_data: "ep_general" }],
            ],
          },
        });
      } else {
        updateConfig({ glm_endpoint: args });
        await sendMessage({ chat_id: chatId, text: `✅ Endpoint setat la: ${args}` });
      }
      break;
    }

    case "/setrepo": {
      if (!args) {
        const cfg = getConfig();
        await sendMessage({
          chat_id: chatId,
          text: `🐙 Repo curent: ${cfg.github_repo || "not set"}\n\nFolosire: /setrepo https://github.com/USER/REPO.git`,
        });
      } else {
        updateConfig({ github_repo: args });
        await sendMessage({ chat_id: chatId, text: `✅ GitHub repo salvat: ${args}` });
      }
      break;
    }

    case "/deploy":
      await sendMessage({
        chat_id: chatId,
        parse_mode: "HTML",
        text: `🚀 <b>Deploy Info</b>\n\n` +
          `Docker: <code>docker compose up -d --build</code>\n` +
          `Render: Conectează repo la render.com\n` +
          `GitHub Actions: Push pe main → auto deploy\n` +
          `Expo: <code>cd expo-app && eas build</code>\n\n` +
          `Repo setat: ${getConfig().github_repo || "none"}`,
      });
      break;

    case "/code":
    case "/generate": {
      if (!args) {
        await sendMessage({ chat_id: chatId, text: "❌ Folosire: /code descriere cod dorit" });
        return;
      }
      await sendMessage({ chat_id: chatId, text: "⏳ Generez cod..." });
      const response = await callGLM(
        `Ești un expert software engineer. Generează cod complet și rulabil pentru:\n\n${args}\n\nReguli:\n1. Cod complet, nu fragmente\n2. Include importuri\n3. Include comentarii\n4. Pune în markdown code block cu limbajul corect`,
        getConfig().expert_mode === "true"
          ? "Ești un senior software engineer. Fii foarte detaliat, include edge cases, error handling, și best practices."
          : undefined
      );
      // Split if too long
      if (response.length > 4000) {
        await sendMessage({ chat_id: chatId, text: response.slice(0, 4000) });
        await sendMessage({ chat_id: chatId, text: response.slice(4000) });
      } else {
        await sendMessage({ chat_id: chatId, text: response });
      }
      break;
    }

    case "/analyze":
    case "/ask": {
      if (!args) {
        await sendMessage({ chat_id: chatId, text: "❌ Folosire: /analyze sau /ask urmarează cu întrebarea" });
        return;
      }
      await sendMessage({ chat_id: chatId, text: "🧠 Gândesc..." });
      const response = await callGLM(args);
      if (response.length > 4000) {
        await sendMessage({ chat_id: chatId, text: response.slice(0, 4000) });
        await sendMessage({ chat_id: chatId, text: response.slice(4000) });
      } else {
        await sendMessage({ chat_id: chatId, text: response });
      }
      break;
    }

    case "/files": {
      try {
        const { readdirSync, statSync, existsSync } = await import("fs");
        const { join } = await import("path");
        let text = "📁 Fișiere:\n\n📥 Downloads:\n";
        const dlDir = join(process.cwd(), "downloads");
        if (existsSync(dlDir)) {
          const files = readdirSync(dlDir).filter((f: string) => !f.startsWith("."));
          text += files.length ? files.map((f: string) => `  • ${f}`).join("\n") : "  (gol)";
        } else {
          text += "  (nu există)";
        }
        text += "\n\n💻 Generated:\n";
        const genDir = join(process.cwd(), "generated_code");
        if (existsSync(genDir)) {
          const files = readdirSync(genDir).filter((f: string) => !f.startsWith("."));
          text += files.length ? files.map((f: string) => `  • ${f}`).join("\n") : "  (gol)";
        } else {
          text += "  (nu există)";
        }
        await sendMessage({ chat_id: chatId, text });
      } catch {
        await sendMessage({ chat_id: chatId, text: "📁 Nu s-au putut lista fișierele." });
      }
      break;
    }

    case "/clear":
      await sendMessage({ chat_id: chatId, text: "✅ Sesiune resetată." });
      break;

    case "/p1": case "/p2": case "/p3": case "/p4": case "/p5": case "/p6":
    case "/p7": case "/p8": case "/p9": case "/p10": case "/p11": case "/p12": {
      const num = parseInt(cmd.replace("/p", ""));
      const problem = LOOP_PROBLEMS[num];
      if (problem) {
        await sendMessage({
          chat_id: chatId,
          parse_mode: "HTML",
          text: `${problem.title}\n\n<code>${problem.code}</code>`,
        });
      } else {
        await sendMessage({ chat_id: chatId, text: `❌ Problema ${num} nu există.` });
      }
      break;
    }

    case "/repair":
    case "/expert": {
      const cfg = getConfig();
      const isRepair = cmd === "/repair";
      const currentVal = isRepair ? cfg.auto_repair : cfg.expert_mode;
      const newVal = currentVal === "true" ? "false" : "true";
      if (isRepair) updateConfig({ auto_repair: newVal });
      else updateConfig({ expert_mode: newVal });
      await sendMessage({
        chat_id: chatId,
        text: `${isRepair ? "🔧 Auto-Repair" : "👑 Expert Mode"}: ${newVal === "true" ? "✅ ON" : "❌ OFF"}`,
      });
      break;
    }

    default:
      // If not a command, treat as GLM chat
      if (text.startsWith("/")) {
        await sendMessage({
          chat_id: chatId,
          text: `❓ Comandă necunoscută: ${cmd}\n\nTrimite /help pentru lista de comenzi.`,
        });
      } else {
        // Free chat with GLM
        await sendMessage({ chat_id: chatId, text: "🧠 Gândesc..." });
        const response = await callGLM(text);
        if (response.length > 4000) {
          await sendMessage({ chat_id: chatId, text: response.slice(0, 4000) });
          await sendMessage({ chat_id: chatId, text: response.slice(4000) });
        } else {
          await sendMessage({ chat_id: chatId, text: response });
        }
      }
  }
}

// ─── Callback Query Handler ───
async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data;
  if (!chatId || !data) return;

  // Acknowledge callback
  await tgApiCall("answerCallbackQuery", { callback_query_id: callbackQuery.id });

  if (data === "cmd_status") {
    await handleCommand(chatId, "/status", "");
  } else if (data === "cmd_glm") {
    await sendMessage({
      chat_id: chatId,
      text: "🧠 Scrie orice mesaj și GLM va răspunde!\n\nSau folosește:\n/ask întrebare\n/code descriere\n/analyze ceva",
    });
  } else if (data === "cmd_files") {
    await handleCommand(chatId, "/files", "");
  } else if (data === "cmd_settings") {
    await sendMessage({
      chat_id: chatId,
      parse_mode: "HTML",
      text: `⚙️ <b>Settings rapide:</b>\n\n/model — schimbă modelul\n/endpoint — schimbă endpoint-ul\n/repair — toggle auto-repair\n/expert — toggle expert mode\n/setrepo URL — setează GitHub repo`,
    });
  } else if (data === "cmd_deploy") {
    await handleCommand(chatId, "/deploy", "");
  } else if (data === "cmd_loops") {
    await sendMessage({
      chat_id: chatId,
      text: "🔄 Loop Problems:\n\n/p1 - /p12 pentru fiecare problemă\n\nEx: /p1, /p6, /p9",
    });
  } else if (data === "cmd_models") {
    await handleCommand(chatId, "/model", "");
  } else if (data === "cmd_endpoints") {
    await handleCommand(chatId, "/endpoint", "");
  } else if (data.startsWith("model_")) {
    const model = data.replace("model_", "");
    updateConfig({ glm_model: model });
    await sendMessage({ chat_id: chatId, text: `✅ Model setat la: ${model}` });
  } else if (data === "ep_coding") {
    updateConfig({ glm_endpoint: "https://api.z.ai/api/coding/paas/v4/chat/completions" });
    await sendMessage({ chat_id: chatId, text: "✅ Endpoint: Coding API" });
  } else if (data === "ep_general") {
    updateConfig({ glm_endpoint: "https://api.z.ai/api/paas/v4/chat/completions" });
    await sendMessage({ chat_id: chatId, text: "✅ Endpoint: General API" });
  }
}

// ─── Main Polling Loop ───
async function poll() {
  const cfg = getConfig();
  if (!cfg.telegram_token) {
    console.log("[Bot] No telegram token configured, waiting...");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.telegram_token}/getUpdates?offset=${lastOffset + 1}&timeout=10&allowed_updates=["message","callback_query"]`
    );

    const data = await res.json();
    if (!data.ok) {
      console.log(`[Bot] API Error: ${data.description}`);
      lastOffset = 0; // reset offset on error
      return;
    }

    for (const update of data.result || []) {
      lastOffset = update.update_id;

      // Handle callback queries (inline button presses)
      if (update.callback_query) {
        await handleCallback(update.callback_query);
        continue;
      }

      // Handle messages
      if (update.message?.text) {
        const text = update.message.text.trim();
        const fromName = update.message.from
          ? [update.message.from.first_name, update.message.from.last_name].filter(Boolean).join(" ")
          : "User";

        console.log(`[Bot] ${fromName}: ${text.slice(0, 100)}`);

        // Commands start with / or !
        if (text.startsWith("/") || text.startsWith("!")) {
          const cmdText = text.startsWith("!") ? "/" + text.slice(1) : text;
          await handleCommand(update.message.chat.id, cmdText, fromName);
        } else {
          // Free chat with GLM - any non-command message gets a GLM response
          const hasKey = getConfig().glm_api_key;
          if (hasKey) {
            try {
              await sendMessage({ chat_id: update.message.chat.id, text: "🧠 Gândesc..." });
              const response = await callGLM(text);
              const msg = response.length > 4000 ? response.slice(0, 4000) : response;
              await sendMessage({ chat_id: update.message.chat.id, text: msg });
              if (response.length > 4000) {
                await sendMessage({ chat_id: update.message.chat.id, text: response.slice(4000) });
              }
            } catch (e: any) {
              await sendMessage({ chat_id: update.message.chat.id, text: `❌ GLM Error: ${e.message}` });
            }
          } else {
            await sendMessage({
              chat_id: update.message.chat.id,
              text: "🤖 Hermes Bot activ!\n\nSetează GLM API key pentru chat:\n/api CHEIA_TA\n\nSau trimite /help pentru comenzi.",
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.error(`[Bot] Poll error: ${e.message}`);
    lastOffset = 0;
  }
}

// ─── Start ───
console.log("🤖 Hermes Telegram Bot starting...");
console.log("[Bot] Polling every 2s...");

(async () => {
  while (isRunning) {
    await poll();
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
})();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Bot] Shutting down...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  isRunning = false;
  process.exit(0);
});
