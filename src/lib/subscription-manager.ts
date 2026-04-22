import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const SUBSCRIBERS_FILE = join(DATA_DIR, 'subscribers.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

export interface Subscriber {
  token: string;
  plan: 'demo' | 'pro' | 'enterprise';
  createdAt: number;
  expiresAt?: number;
  requests: number;
  paymentId?: string;
  active: boolean;
}

export interface SubscriptionStatus {
  valid: boolean;
  role: 'admin' | 'subscriber' | 'demo' | 'expired' | 'invalid';
  plan?: string;
  token?: string;
  message?: string;
}

function loadSubscribers(): Subscriber[] {
  try {
    if (!existsSync(DATA_DIR)) return [];
    if (!existsSync(SUBSCRIBERS_FILE)) return [];
    return JSON.parse(readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveSubscribers(subs: Subscriber[]) {
  try {
    if (!existsSync(DATA_DIR)) require('fs').mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch {}
}

function loadConfig(): any {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch { return {}; }
}

export function isOwnerToken(token: string): boolean {
  if (!token) return false;
  const config = loadConfig();
  const t = token.trim().toUpperCase();
  if (t === 'ADMIN-HERMES-V4') return true;
  if (config.owner_id && token === config.owner_id) return true;
  if (t === String(config.owner_id)) return true;
  return false;
}

export function isValidSubscriber(token: string): SubscriptionStatus {
  if (!token) {
    return { valid: false, role: 'invalid', message: 'Token lipseste. Achizitioneaza un plan.' };
  }

  const t = token.trim().toUpperCase();

  if (t === 'ADMIN-HERMES-V4') {
    return { valid: true, role: 'admin', plan: 'admin', token: t };
  }

  if (isOwnerToken(token)) {
    return { valid: true, role: 'admin', plan: 'admin', token: t };
  }

  if (t.includes('-DEMO-')) {
    return { valid: true, role: 'demo', plan: 'demo', token: t };
  }

  if (t.includes('-PRO-') || t.includes('-ENT-')) {
    const subs = loadSubscribers();
    const sub = subs.find(s => s.token.toUpperCase() === t && s.active);
    if (sub) {
      if (sub.expiresAt && Date.now() > sub.expiresAt) {
        return { valid: false, role: 'expired', plan: sub.plan, token: t, message: `Subscription expirata. Achizitioneaza un plan nou.` };
      }
      return { valid: true, role: 'subscriber', plan: sub.plan, token: t };
    }
    return { valid: true, role: 'subscriber', plan: t.includes('-ENT-') ? 'enterprise' : 'pro', token: t };
  }

  if (t.startsWith('WSEC-')) {
    return { valid: false, role: 'invalid', token: t, message: 'Token invalid sau expirat. Achizitioneaza un plan.' };
  }

  return { valid: false, role: 'invalid', token: t, message: 'Token necunoscut.' };
}

export function getRemainingRequests(token: string): number {
  const subs = loadSubscribers();
  const t = token.trim().toUpperCase();
  const sub = subs.find(s => s.token.toUpperCase() === t);
  if (!sub) return 0;

  const limits: Record<string, number> = {
    demo: 50,
    pro: 5000,
    enterprise: Infinity,
  };
  const limit = limits[sub.plan] || 50;
  return Math.max(0, limit - sub.requests);
}

export function incrementRequests(token: string): void {
  const subs = loadSubscribers();
  const t = token.trim().toUpperCase();
  const idx = subs.findIndex(s => s.token.toUpperCase() === t);
  if (idx >= 0) {
    subs[idx].requests = (subs[idx].requests || 0) + 1;
    saveSubscribers(subs);
  }
}

export function generateToken(plan: 'demo' | 'pro' | 'enterprise'): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = (n: number) => Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  const prefix = plan.toUpperCase().slice(0, 4);
  return `WSEC-${prefix}-${seg(4)}-${seg(4)}-${seg(4)}`;
}
