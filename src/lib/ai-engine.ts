// Shared AI engine using z-ai-web-dev-sdk
let _zaiInstance: any = null;
let _zaiPromise: Promise<any> | null = null;

async function getZAI() {
  if (_zaiInstance) return _zaiInstance;
  if (_zaiPromise) return _zaiPromise;
  _zaiPromise = (async () => {
    try {
      const mod = await import('z-ai-web-dev-sdk');
      const ZAI = (mod as any).default || (mod as any).ZAI || mod;
      _zaiInstance = await ZAI.create();
      return _zaiInstance;
    } catch (e: any) {
      _zaiPromise = null;
      throw new Error(`Failed to initialize z-ai-web-dev-sdk: ${e.message}`);
    }
  })();
  return _zaiPromise;
}

export async function callAI(messages: { role: string; content: string }[], model?: string): Promise<string> {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    model: model || 'glm-4-plus',
    messages,
    temperature: 0.7,
    max_tokens: (model || '').includes('queen') ? 8192 : 4096,
  });
  return completion.choices?.[0]?.message?.content || 'No response.';
}
