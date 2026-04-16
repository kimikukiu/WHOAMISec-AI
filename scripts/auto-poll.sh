#!/bin/bash
# Auto-polling script for Hermes Bot
# Polls Telegram getUpdates and forwards to webhook every ~3s

OFFSET_FILE="/home/z/my-project/data/poll_offset.json"
WEBHOOK_URL="http://localhost:3000/api/telegram/webhook"
CONFIG_FILE="/home/z/my-project/data/config.json"

get_token() {
  python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['telegram_token'])" 2>/dev/null
}

get_offset() {
  python3 -c "import json; print(json.load(open('$OFFSET_FILE')).get('offset', -1))" 2>/dev/null || echo -1
}

save_offset() {
  echo "{\"offset\": $1}" > "$OFFSET_FILE"
}

TOKEN=$(get_token)
if [ -z "$TOKEN" ]; then
  echo "ERROR: No telegram token found"
  exit 1
fi

echo "[$(date)] Starting auto-poll..."

# Delete webhook so getUpdates works
curl -s "https://api.telegram.org/bot$TOKEN/deleteWebhook?drop_pending_updates=false" > /dev/null 2>&1

while true; do
  OFFSET=$(get_offset)
  
  # Long-poll with 15s timeout
  RESULT=$(curl -s --max-time 25 \
    "https://api.telegram.org/bot$TOKEN/getUpdates?limit=100&offset=${OFFSET}&timeout=15&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D" 2>/dev/null)
  
  if [ -z "$RESULT" ]; then
    sleep 3
    continue
  fi
  
  # Process updates using python
  echo "$RESULT" | python3 -c "
import json, sys, urllib.request

data = json.load(sys.stdin)
if not data.get('ok'):
    sys.exit(0)

updates = data.get('result', [])
max_off = ${OFFSET}
proc = 0

for u in updates:
    uid = u.get('update_id', 0)
    if uid > max_off:
        max_off = uid
    
    try:
        req = urllib.request.Request(
            '${WEBHOOK_URL}',
            data=json.dumps(u).encode(),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=30)
        proc += 1
    except Exception as e:
        print(f'[poll] Forward error: {e}', file=sys.stderr)

if updates:
    # Save offset = last update_id + 1
    with open('${OFFSET_FILE}', 'w') as f:
        json.dump({'offset': max_off + 1}, f)
    print(f'[{proc}/{len(updates)}] offset={max_off + 1}', end='')
" 2>>/tmp/poll-errors.log
  
  sleep 2
done
