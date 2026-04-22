/**
 * WHOAMISEC AI - Tools SDK
 * TypeScript/Web/Android compatible tools interface
 * Supports all bypass tools from swarm-models/byp-all-tools/
 */

export interface Tool {
  id: string;
  name: string;
  file: string;
  icon: string;
  description?: string;
  category?: 'script' | 'panel' | 'reference';
  platform?: ('web' | 'android' | 'ts')[];
}

export const TOOLS: Tool[] = [
  // Root scripts
  { id: 'wormgpt-ultimate', name: 'wormgpt-ultimate', file: 'wormgpt-ultimate.py', icon: '🪱', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'superbet', name: 'SuperBet', file: 'SuperBet.py', icon: '🎰', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'w-destro', name: 'W-Destro', file: 'W-Destro.py', icon: '💥', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'worm-money-machine', name: 'Worm-Money-Machine', file: 'Worm-Money-Machine.py', icon: '💸', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'wormmoneyv3', name: 'WormMoneyV3', file: 'WormMoneyV3.py', icon: '🐛', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'bot-bet-win', name: 'bot-Bet-Win', file: 'bot-Bet-Win.py', icon: '🤖', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'whoamisec-arbitrary', name: 'WHOAMISec-Arbitrary', file: 'WHOAMISec-Arbitrary-Auto-make-money.py', icon: '⚡', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'whoamisec-makermoney', name: 'WHOAMISec-MakerMoney', file: 'WHOAMISec-MakerMoney.py', icon: '💎', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'whoamisec-superbet247', name: 'WHOAMISec-SuperBet247', file: 'WHOAMISec-SuperBet247.py', icon: '🎲', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'whoamisecmakemoney', name: 'WHOAMISecMakeMoney', file: 'WHOAMISecMakeMoney.py', icon: '🪙', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'worm-destruction', name: 'Worm-Destruction', file: 'Worm-Destruction.py', icon: '☠️', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'adminpbuster', name: 'AdminPBuster', file: 'AdminPBuster.py', icon: '🔓', category: 'script', platform: ['web', 'android', 'ts'] },
  // Reference files
  { id: 'magic-admin-paths', name: 'magic_admin_paths', file: 'magic_admin_paths.txt', icon: '🗺️', category: 'reference', platform: ['web', 'android', 'ts'] },
  { id: 'real-original-tools', name: 'Real-Original-tools', file: 'Real-Original-tools.txt', icon: '📜', category: 'reference', platform: ['web', 'android', 'ts'] },
  { id: 'prompt-danger', name: 'prompt-danger', file: 'prompt-danger.txt', icon: '⚠️', category: 'reference', platform: ['web', 'android', 'ts'] },
  { id: 'quantum-alien-swarm', name: 'QuantumAlienSwarm', file: 'QuantumAlienSwarm-prompt-jailbreak-999999999999-nodes.txt', icon: '🌌', category: 'reference', platform: ['web', 'android', 'ts'] },
  { id: 'tools-train-gpt', name: 'tools-train-gpt', file: 'tools-train-gpt.txt', icon: '🧠', category: 'reference', platform: ['web', 'android', 'ts'] },
  { id: 'unic-gpt', name: 'unic-gpt', file: 'unic-gpt.txt', icon: '🦄', category: 'reference', platform: ['web', 'android', 'ts'] },
  // Panels
  { id: 'nyxddos', name: 'Nyxddos', file: 'Nyxddos.html', icon: '💀', category: 'panel', platform: ['web'] },
  // Agent-tool scripts
  { id: 'full-ai', name: 'full-ai', file: 'Agent-tool/full-ai.py', icon: '🤖', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'full-ai-agent', name: 'full-ai-agent', file: 'Agent-tool/full-ai-agent.py', icon: '🧠', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'fuckk-fuck-ai-bot', name: 'fuckk-fuck-ai-bot', file: 'Agent-tool/fuckk-fuck-ai-bot.py', icon: '🔥', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'full-fuck-ai-botv56', name: 'full-fuck-ai-botv56', file: 'Agent-tool/full-fuck-ai-botv56.py', icon: '💀', category: 'script', platform: ['web', 'android', 'ts'] },
  { id: 'full-fuck-jews', name: 'full-fuck-jews', file: 'Agent-tool/full-fuck-jews.py', icon: '⚔️', category: 'script', platform: ['web', 'android', 'ts'] },
  // eclips panel
  { id: 'eclips-index', name: 'ECLIPS Panel', file: 'eclips/ECLIPS/Owner/index.html', icon: '🌑', category: 'panel', platform: ['web'] },
  { id: 'eclips-profile', name: 'ECLIPS Profile', file: 'eclips/ECLIPS/Usr/profile.php', icon: '👤', category: 'panel', platform: ['web'] },
  // web-s panel
  { id: 'web-s-index', name: 'Web-Stresser', file: 'web-s/index.html', icon: '🌐', category: 'panel', platform: ['web'] },
  // Darkstresser
  { id: 'darkstresser-root', name: 'Darkstresser Root', file: '193.168.146.5 - darkstresser.tk/root.zip', icon: '💣', category: 'panel', platform: ['web'] },
];

export class WhoamisecToolsSDK {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '';
  }

  getTools(filter?: { category?: string; platform?: string }): Tool[] {
    let tools = TOOLS;
    if (filter?.category) tools = tools.filter(t => t.category === filter.category);
    if (filter?.platform) tools = tools.filter(t => t.platform?.includes(filter.platform as any));
    return tools;
  }

  getTool(id: string): Tool | undefined {
    return TOOLS.find(t => t.id === id);
  }

  async openTool(id: string, target: '_blank' | '_self' = '_blank'): Promise<void> {
    const url = `${this.baseUrl}/tools/${id}`;
    if (target === '_blank') window.open(url, '_blank');
    else window.location.href = url;
  }

  getToolUrl(id: string): string {
    return `${this.baseUrl}/tools/${id}`;
  }

  async downloadTool(id: string): Promise<Blob> {
    const tool = this.getTool(id);
    if (!tool) throw new Error(`Tool ${id} not found`);
    const url = `${this.baseUrl}/api/tools/${encodeURIComponent(tool.file)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${id}`);
    return res.blob();
  }
}

export const whoamisecTools = new WhoamisecToolsSDK();

export default whoamisecTools;
