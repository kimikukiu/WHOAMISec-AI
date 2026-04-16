import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const config = loadConfig();
    const projectRoot = process.cwd();
    const checks: Record<string, { status: 'ok' | 'warning' | 'error'; message: string }> = {};

    // Check GLM API key
    if (config.glm_api_key && config.glm_api_key.length > 10) {
      checks.glm_api_key = { status: 'ok', message: 'GLM API key is configured' };
    } else {
      checks.glm_api_key = { status: 'error', message: 'GLM API key is not configured' };
    }

    // Check Telegram token
    if (config.telegram_token && config.telegram_token.length > 10) {
      checks.telegram_token = { status: 'ok', message: 'Telegram token is configured' };
    } else {
      checks.telegram_token = { status: 'warning', message: 'Telegram token is not configured (optional)' };
    }

    // Check GLM model
    if (config.glm_model) {
      checks.glm_model = { status: 'ok', message: `Model: ${config.glm_model}` };
    } else {
      checks.glm_model = { status: 'warning', message: 'No GLM model specified' };
    }

    // Check GLM endpoint
    if (config.glm_endpoint) {
      try {
        new URL(config.glm_endpoint);
        checks.glm_endpoint = { status: 'ok', message: `Endpoint: ${config.glm_endpoint}` };
      } catch {
        checks.glm_endpoint = { status: 'error', message: 'Invalid GLM endpoint URL' };
      }
    } else {
      checks.glm_endpoint = { status: 'warning', message: 'No GLM endpoint specified' };
    }

    // Check GitHub repo
    if (config.github_repo) {
      checks.github_repo = { status: 'ok', message: `Repository: ${config.github_repo}` };
    } else {
      checks.github_repo = { status: 'warning', message: 'GitHub repository not configured' };
    }

    // Check directories
    const downloadsPath = join(projectRoot, 'downloads');
    const generatedPath = join(projectRoot, 'generated_code');

    if (existsSync(downloadsPath)) {
      const files = readdirSync(downloadsPath).filter(f => !f.startsWith('.'));
      checks.downloads_dir = { status: 'ok', message: `Downloads directory exists (${files.length} files)` };
    } else {
      checks.downloads_dir = { status: 'error', message: 'Downloads directory does not exist' };
    }

    if (existsSync(generatedPath)) {
      const files = readdirSync(generatedPath).filter(f => !f.startsWith('.'));
      checks.generated_dir = { status: 'ok', message: `Generated code directory exists (${files.length} files)` };
    } else {
      checks.generated_dir = { status: 'error', message: 'Generated code directory does not exist' };
    }

    // Auto-repair setting
    checks.auto_repair = {
      status: config.auto_repair === 'true' ? 'ok' : 'warning',
      message: `Auto-repair is ${config.auto_repair === 'true' ? 'enabled' : 'disabled'}`,
    };

    // Expert mode
    checks.expert_mode = {
      status: 'ok',
      message: `Expert mode is ${config.expert_mode === 'true' ? 'enabled' : 'disabled'}`,
    };

    // Calculate overall readiness
    const statuses = Object.values(checks).map(c => c.status);
    const hasError = statuses.includes('error');
    const hasWarning = statuses.includes('warning');
    const errorCount = statuses.filter(s => s === 'error').length;
    const warningCount = statuses.filter(s => s === 'warning').length;

    const overall: 'ready' | 'partial' | 'not_ready' = hasError
      ? errorCount > 2 ? 'not_ready' : 'partial'
      : hasWarning ? 'partial' : 'ready';

    return NextResponse.json({
      ready: overall,
      checks,
      summary: {
        total: Object.keys(checks).length,
        ok: statuses.filter(s => s === 'ok').length,
        warnings: warningCount,
        errors: errorCount,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check deploy status' },
      { status: 500 }
    );
  }
}
