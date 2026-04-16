import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

export interface HermesConfig {
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

export function loadConfig(): HermesConfig {
  ensureDataDir();
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return {
    glm_api_key: '',
    telegram_token: '',
    glm_model: 'glm-4.6',
    glm_endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    github_repo: '',
    auto_repair: 'true',
    max_repair_iterations: 3,
    expert_mode: 'false',
  };
}

export function saveConfig(cfg: HermesConfig) {
  ensureDataDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

/** Mask a secret: show first 8 + last 4 chars, rest replaced with asterisks */
export function maskSecret(value: string): string {
  if (!value || value.length <= 12) {
    return value ? '****' : '';
  }
  const prefix = value.slice(0, 8);
  const suffix = value.slice(-4);
  const masked = '*'.repeat(Math.min(value.length - 12, 20));
  return `${prefix}${masked}${suffix}`;
}
