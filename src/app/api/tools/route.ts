import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readdirSync } from 'path';

const TOOLS_DIR = '/home/z/my-project/tools';

interface ToolInfo {
  name: string;
  category: string;
  path: string;
  installed: boolean;
  description: string;
  language: string;
}

const TOOL_DESCRIPTIONS: Record<string, { desc: string; lang: string }> = {
  theHarvester: { desc: 'OSINT tool for harvesting emails, subdomains, and hosts from public sources', lang: 'Python' },
  'recon-ng': { desc: 'Full-featured web reconnaissance framework with module ecosystem', lang: 'Python' },
  Amass: { desc: 'Deep network attack surface mapping and external asset discovery', lang: 'Go' },
  Sublist3r: { desc: 'Fast subdomain enumeration tool using search engines', lang: 'Python' },
  PhoneInfoga: { desc: 'Advanced phone number OSINT scanning and information gathering', lang: 'Python' },
  sqlmap: { desc: 'Automatic SQL injection and database takeover tool', lang: 'Python' },
  XSStrike: { desc: 'Advanced XSS detection suite with fuzzy matching and context analysis', lang: 'Python' },
  Nikto: { desc: 'Web server scanner for dangerous files, outdated software, and misconfigurations', lang: 'Perl' },
  dirsearch: { desc: 'Advanced web content and directory brute-forcing tool', lang: 'Python' },
  Gobuster: { desc: 'Directory/file/DNS and VHost busting tool written in Go', lang: 'Go' },
  Nuclei: { desc: 'Fast template-based vulnerability scanner for security researchers', lang: 'Go' },
  Masscan: { desc: 'Mass IP port scanner — fastest internet port scanner', lang: 'C' },
  Legba: { desc: 'Multiprotocol credential stuffing and password spraying tool', lang: 'Rust' },
  wafw00f: { desc: 'Web Application Firewall (WAF) fingerprinting tool', lang: 'Python' },
  Volatility: { desc: 'Advanced memory forensics framework for incident response', lang: 'Python' },
  Zphisher: { desc: 'Automated phishing tool with 30+ templates for social engineering', lang: 'Bash' },
  Sherlock: { desc: 'Hunt social media accounts by username across 300+ sites', lang: 'Python' },
  Photon: { desc: 'Fast web crawler and OSINT reconnaissance tool with stealth mode', lang: 'Python' },
  GHunt: { desc: 'OSINT tool to investigate Google accounts via Gmail and YouTube', lang: 'Python' },
  Scapy: { desc: 'Powerful packet manipulation and network protocol crafting library', lang: 'Python' },
  HackTricks: { desc: 'Comprehensive pentesting methodology wiki and cheat sheets', lang: 'Markdown' },
};

function scanTools(): ToolInfo[] {
  const tools: ToolInfo[] = [];
  const categories = ['recon', 'web-pentest', 'scanner', 'exploits', 'osint', 'network', 'ai-tools'];

  for (const cat of categories) {
    const catDir = `${TOOLS_DIR}/${cat}`;
    if (!existsSync(catDir)) continue;
    try {
      const entries = readdirSync(catDir);
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        const toolPath = `${catDir}/${entry}`;
        const info = TOOL_DESCRIPTIONS[entry] || { desc: `${entry} — security tool`, lang: 'Various' };
        tools.push({
          name: entry,
          category: cat,
          path: toolPath,
          installed: existsSync(`${toolPath}/.git`) || existsSync(toolPath),
          description: info.desc,
          language: info.lang,
        });
      }
    } catch {}
  }
  return tools;
}

export async function GET(request: NextRequest) {
  const tools = scanTools();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const filtered = category && category !== 'all'
    ? tools.filter(t => t.category === category)
    : tools;

  const categories = [...new Set(tools.map(t => t.category))];
  const total = tools.length;
  const installed = tools.filter(t => t.installed).length;

  return NextResponse.json({ tools: filtered, categories, total, installed });
}
