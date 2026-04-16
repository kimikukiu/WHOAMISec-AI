#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Hermes Bot v4.0 - Complete Start Script
# Starts Next.js server + Bot poller + Auto-restarts
# ═══════════════════════════════════════════════════════════

cd /home/z/my-project

echo "========================================="
echo "  Hermes Bot v4.0 - Starting..."
echo "========================================="

# Kill old processes
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "bot-runner" 2>/dev/null
pkill -f "auto-poll" 2>/dev/null
pkill -f "keep-server" 2>/dev/null
sleep 2

# Start Next.js server in background (auto-restart)
echo "[*] Starting Next.js server..."
(
  while true; do
    echo "[$(date)] Server starting..."
    npm run dev >> /home/z/my-project/dev.log 2>&1
    echo "[$(date)] Server died, restarting in 3s..."
    sleep 3
  done
) &
SERVER_PID=$!
echo "[+] Server PID: $SERVER_PID"

# Wait for server to be ready
echo "[*] Waiting for server..."
for i in $(seq 1 60); do
  if curl -s --max-time 2 http://localhost:3000/api/telegram/webhook > /dev/null 2>&1; then
    echo "[+] Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Verify server is up
if ! curl -s --max-time 5 http://localhost:3000/api/telegram/webhook > /dev/null 2>&1; then
  echo "[!] Server failed to start"
  exit 1
fi

# Start bot poller
echo "[*] Starting bot poller..."
node /home/z/my-project/bot-runner.mjs >> /tmp/bot-runner.log 2>&1 &
BOT_PID=$!
echo "[+] Bot PID: $BOT_PID"

# Setup bot commands on Telegram
TOKEN=$(python3 -c "import json; print(json.load(open('/home/z/my-project/data/config.json'))['telegram_token'])")

# Register bot commands
echo "[*] Registering bot commands..."
curl -s -X POST "https://api.telegram.org/bot$TOKEN/setMyCommands" \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"command": "start", "description": "Menu principal + Help"},
      {"command": "help", "description": "Ajutor"},
      {"command": "status", "description": "Status bot complet"},
      {"command": "models", "description": "Lista 19 modele"},
      {"command": "model", "description": "Schimba modelul AI"},
      {"command": "api", "description": "Status API z.ai"},
      {"command": "languages", "description": "13 limbi Loop Coder"},
      {"command": "patterns", "description": "6 Spark Patterns"},
      {"command": "spark", "description": "Spark prompt pentru limba"},
      {"command": "loop", "description": "Loop exercitiu"},
      {"command": "tiers", "description": "5 Tiere Hermes"},
      {"command": "curriculum", "description": "Curriculum complet"},
      {"command": "performance", "description": "Loop performance"},
      {"command": "best_practices", "description": "Best practices"},
      {"command": "train", "description": "Antrenament AI"},
      {"command": "train_prompt", "description": "Training prompt random"},
      {"command": "t1", "description": "Tier 1 Training"},
      {"command": "t2", "description": "Tier 2 Training"},
      {"command": "t3", "description": "Tier 3 Training"},
      {"command": "t4", "description": "Tier 4 Training"},
      {"command": "t5", "description": "Tier 5 Training"},
      {"command": "redteam", "description": "RED TEAM testing"},
      {"command": "code", "description": "Genereaza cod"},
      {"command": "opencode", "description": "OpenCode AI"},
      {"command": "hermes", "description": "Hermes Agent"},
      {"command": "analyze", "description": "Analizeaza fisiere"},
      {"command": "files", "description": "Lista fisiere"},
      {"command": "deploy", "description": "Git deploy"},
      {"command": "clear", "description": "Reseteaza sesiune"}
    ]
  }' | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Commands: {\"OK\" if d.get(\"ok\") else \"FAIL\"}')"

echo ""
echo "========================================="
echo "  Hermes Bot v4.0 - RUNNING"
echo "  Server: http://localhost:3000"
echo "  Server PID: $SERVER_PID"
echo "  Bot PID: $BOT_PID"
echo "========================================="
