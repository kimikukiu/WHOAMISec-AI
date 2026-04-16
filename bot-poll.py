#!/usr/bin/env python3
"""
Hermes Bot v4.0 - Standalone Telegram Poller
Polls Telegram getUpdates and forwards to Next.js webhook handler.
"""
import json
import time
import urllib.request
import urllib.error
import os
import sys

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'data', 'config.json')
OFFSET_FILE = os.path.join(os.path.dirname(__file__), 'data', 'poll_offset.json')
WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook'
POLL_INTERVAL = 3  # seconds between polls

def load_config():
    try:
        with open(CONFIG_FILE) as f:
            return json.load(f)
    except:
        return {}

def get_offset():
    try:
        with open(OFFSET_FILE) as f:
            return json.load(f).get('offset', -1)
    except:
        return -1

def save_offset(offset):
    os.makedirs(os.path.dirname(OFFSET_FILE), exist_ok=True)
    with open(OFFSET_FILE, 'w') as f:
        json.dump({'offset': offset}, f)

def telegram_api(token, method, params=''):
    url = f'https://api.telegram.org/bot{token}/{method}'
    if params:
        url += f'?{params}'
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f'[TG API Error] {method}: {e}', file=sys.stderr)
        return None

def forward_to_webhook(update):
    try:
        data = json.dumps(update).encode()
        req = urllib.request.Request(
            WEBHOOK_URL,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            return result.get('ok', False)
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        print(f'[Webhook HTTP {e.code}] {body}', file=sys.stderr)
        return False
    except Exception as e:
        print(f'[Webhook Error] {e}', file=sys.stderr)
        return False

def main():
    config = load_config()
    token = config.get('telegram_token', '')
    if not token:
        print('ERROR: No telegram_token in config.json')
        sys.exit(1)

    print(f'[poll] Starting Hermes Bot poller...')
    print(f'[poll] Token: {token[:10]}...')

    # Delete webhook to enable getUpdates
    result = telegram_api(token, 'deleteWebhook', 'drop_pending_updates=false')
    if result and result.get('ok'):
        print('[poll] Webhook deleted, getUpdates mode active')
    else:
        print('[poll] Warning: could not delete webhook')

    poll_count = 0
    total_processed = 0

    while True:
        try:
            offset = get_offset()
            params = f'limit=100&offset={offset}&timeout=15'

            result = telegram_api(token, 'getUpdates', params)
            if not result or not result.get('ok'):
                time.sleep(POLL_INTERVAL)
                continue

            updates = result.get('result', [])
            processed = 0

            for update in updates:
                uid = update.get('update_id', 0)
                ok = forward_to_webhook(update)
                if ok:
                    processed += 1
                else:
                    # Log what failed
                    msg = update.get('message', {})
                    text = msg.get('text', '')[:50]
                    print(f'[poll] Failed: uid={uid} text={text}', file=sys.stderr)

            if updates:
                max_uid = max(u.get('update_id', 0) for u in updates)
                save_offset(max_uid + 1)
                total_processed += processed
                poll_count += 1
                print(f'[poll] {processed}/{len(updates)} processed | total={total_processed} polls={poll_count}')

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print('\n[poll] Stopped by user')
            break
        except Exception as e:
            print(f'[poll] Error: {e}', file=sys.stderr)
            time.sleep(5)

if __name__ == '__main__':
    main()
