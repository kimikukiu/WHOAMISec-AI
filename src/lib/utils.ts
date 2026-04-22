import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ═══════════════════════════════════════════════
// SAFE JSON PARSING — Prevents "Unexpected token '<'" crashes
// When API returns HTML error pages instead of JSON
// ═══════════════════════════════════════════════
export async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e: any) {
      console.error('[safeJson] JSON parse failed:', e.message);
      return { success: false, error: 'Invalid JSON response from server', status: res.status };
    }
  }
  // Not JSON — read as text and return structured error
  const text = await res.text().catch(() => '');
  console.error(`[safeJson] Non-JSON response (${res.status}): ${text.substring(0, 200)}`);
  return {
    success: false,
    error: `Server returned ${res.status} — API error. Please try again.`,
    status: res.status,
    html: text.substring(0, 500),
  };
}

// Safe fetch wrapper — combines fetch + safeJson + error handling
export async function safeFetch(url: string, options?: RequestInit): Promise<{ data: any; ok: boolean }> {
  try {
    const res = await fetch(url, options);
    const data = await safeJson(res);
    return { data, ok: res.ok };
  } catch (e: any) {
    console.error(`[safeFetch] Network error: ${e.message}`);
    return { data: { success: false, error: `Network error: ${e.message}` }, ok: false };
  }
}
