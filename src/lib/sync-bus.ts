import { loadConfig, saveConfig, maskSecret } from '@/lib/config';
import { loadSession, saveSess } from '@/lib/bot-engine';

export type EventType =
  | 'config.updated'
  | 'session.updated'
  | 'session.cleared'
  | 'subscriber.created'
  | 'subscriber.revoked'
  | 'model.changed'
  | 'endpoint.changed'
  | 'deploy.triggered'
  | 'deploy.completed';

export interface SyncEvent {
  id: string;
  type: EventType;
  source: 'web' | 'bot';
  timestamp: number;
  payload: Record<string, any>;
}

const EVENTS_FILE = () => {
  const { join } = require('path');
  const { DATA_DIR } = require('@/lib/bot-engine');
  return join(DATA_DIR, 'sync_events.json');
};

const subscribers = new Map<string, ((event: SyncEvent) => void)[]>();

export function emit(type: EventType, source: 'web' | 'bot', payload: Record<string, any> = {}) {
  const event: SyncEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    source,
    timestamp: Date.now(),
    payload,
  };

  const handlers = subscribers.get(type) || [];
  for (const h of handlers) {
    try { h(event); } catch {}
  }

  try {
    const { existsSync, readFileSync, writeFileSync } = require('fs');
    const f = EVENTS_FILE();
    let events: SyncEvent[] = [];
    if (existsSync(f)) {
      events = JSON.parse(readFileSync(f, 'utf-8'));
    }
    events.push(event);
    if (events.length > 200) events = events.slice(-200);
    writeFileSync(f, JSON.stringify(events, null, 2), 'utf-8');
  } catch {}

  return event;
}

export function subscribe(type: EventType | '*', handler: (event: SyncEvent) => void) {
  if (type === '*') {
    for (const t of [...subscribers.keys()]) {
      const h = subscribers.get(t) || [];
      if (!h.includes(handler)) subscribers.set(t, [...h, handler]);
    }
  } else {
    const h = subscribers.get(type) || [];
    if (!h.includes(handler)) subscribers.set(type, [...h, handler]);
  }
}

export function unsubscribe(type: EventType | '*', handler: (event: SyncEvent) => void) {
  if (type === '*') {
    for (const t of subscribers.keys()) {
      const h = subscribers.get(t) || [];
      subscribers.set(t, h.filter(x => x !== handler));
    }
  } else {
    const h = subscribers.get(type) || [];
    subscribers.set(type, h.filter(x => x !== handler));
  }
}

export function getEvents(since?: number, type?: EventType): SyncEvent[] {
  try {
    const { existsSync, readFileSync } = require('fs');
    const f = EVENTS_FILE();
    if (!existsSync(f)) return [];
    let events: SyncEvent[] = JSON.parse(readFileSync(f, 'utf-8'));
    if (since) events = events.filter(e => e.timestamp >= since);
    if (type) events = events.filter(e => e.type === type);
    return events.slice(-100);
  } catch {
    return [];
  }
}

export function emitConfigUpdate(source: 'web' | 'bot', newConfig: Record<string, any>) {
  emit('config.updated', source, newConfig);
}

export function emitModelChange(source: 'web' | 'bot', model: string) {
  emit('model.changed', source, { model });
}

export function emitEndpointChange(source: 'web' | 'bot', endpoint: string) {
  emit('endpoint.changed', source, { endpoint });
}

export function emitSubscriberCreated(source: 'web' | 'bot', token: string, plan: string) {
  emit('subscriber.created', source, { token, plan });
}

export function emitSubscriberRevoked(source: 'web' | 'bot', token: string) {
  emit('subscriber.revoked', source, { token });
}

export function emitSessionClear(source: 'web' | 'bot', chatId: string) {
  emit('session.cleared', source, { chatId });
}

export function emitDeploy(source: 'web' | 'bot', status: 'triggered' | 'completed', details?: any) {
  emit(status === 'triggered' ? 'deploy.triggered' : 'deploy.completed', source, details || {});
}

export async function notifyBotOfUpdate(telegramToken: string, chatId: number, message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch {}
}

export async function notifyWebOfUpdate(baseUrl: string, event: SyncEvent) {
  try {
    await fetch(`${baseUrl}/api/internal/sync-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': process.env.SYNC_SECRET || 'internal-sync-key' },
      body: JSON.stringify(event),
    });
  } catch {}
}

export function createApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 48; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

export function validateApiKey(request: Request): boolean {
  const key = request.headers.get('x-api-key');
  if (!key) return false;
  const config = loadConfig();
  return key === (config as any).api_key || key === process.env.SYNC_SECRET;
}
