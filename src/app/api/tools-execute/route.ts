import { NextRequest, NextResponse } from 'next/server';
import { execSync, exec } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const TOOLS_DIR = '/home/z/my-project/tools';

interface ToolInfo {
  name: string;
  category: string;
  path: string;
  description: string;
  runnable: boolean;
  executable: string;
  installed: boolean;
  lang: 'python' | 'go' | 'js' | 'ruby' | 'bash' | 'other';
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  // Recon
  'theHarvester': 'OSINT tool for harvesting emails, subdomains, and IPs from public sources',
  'recon-ng': 'Full-featured web reconnaissance framework with modules',
  'Amass': 'Deep subdomain enumeration via DNS, scraping, APIs, and more',
  'Sublist3r': 'Fast subdomain enumeration using search engines',
  'PhoneInfoga': 'Advanced phone number OSINT reconnaissance',
  'EyeWitness': 'Screenshot and header capture tool for URLs and domains',
  'GoogD0rker': 'Google dorking automation for security research',
  'HostileSubBruteforcer': 'Subdomain bruteforcing with intelligent wordlists',
  'SecResearch': 'Security research and vulnerability lookup tool',
  'dnscan': 'DNS enumeration tool for subdomain discovery',
  'dvcs-ripper': 'Rip web accessible DVCS repositories (git/svn/hg/bazaar)',
  'git-hound': 'Find secrets and sensitive data in git history',
  'git-secrets': 'Prevents committing passwords and keys to git repos',
  'gitrob': 'Reconnaissance tool for GitHub organization enumeration',
  'knockpy': 'Python subdomain bruteforcer with DNS zone transfer check',
  'tko-subs': 'Subdomain takeover detection and enumeration',
  'waymore': 'Wayback Machine URL fetching and analysis tool',
  'xnLinkFinder': 'Endpoint and hidden link discovery from JavaScript files',
  // Web Pentest
  'sqlmap': 'Automatic SQL injection and database takeover tool',
  'XSStrike': 'Advanced XSS detection and exploitation suite',
  'Nikto': 'Web server scanner detecting dangerous files and misconfigs',
  'dirsearch': 'Advanced directory and file brute-forcing tool',
  'Gobuster': 'Directory/file/DNS brute-forcing tool written in Go',
  'CMSmap': 'CMS scanner for WordPress, Joomla, and Drupal',
  'GitTools': 'Git repository recovery and exploitation toolkit',
  'LFISuite': 'Automatic LFI exploitation suite with multiple techniques',
  'CORStest-rub': 'CORS misconfiguration testing tool',
  'Findsploit': 'Search and download exploits from various databases',
  'RetireJS': 'Scanner for known vulnerable JavaScript libraries',
  'admin-panel-finder': 'Admin panel and login page discovery tool',
  'bfac': 'Backup file analyzer for web applications',
  'changeme': 'Default credential scanner for network services',
  'ssrfDetector': 'Server-Side Request Forgery detection tool',
  // Scanner
  'Nuclei': 'Template-based vulnerability scanner with YAML templates',
  'Masscan': 'Mass IP port scanner for large networks',
  'Legba': 'Multi-protocol credential bruteforcer and scanner',
  'wafw00f': 'Web Application Firewall detection and fingerprinting',
  'MobSF': 'Mobile Security Framework for app analysis',
  'Sn1per': 'Automated pentest reconnaissance scanner',
  'Dracnmap': 'Network scanner with vulnerability assessment',
  'Argus': 'Security auditing and vulnerability assessment framework',
  'AutoPentestX': 'Automated penetration testing framework',
  'Sirius': 'Reconnaissance and vulnerability assessment tool',
  'jwt_tool': 'JWT token analysis, tampering, and exploitation toolkit',
  'NmapAutomator': 'Automated Nmap scanning with predefined profiles',
  'Airecon': 'Wireless network reconnaissance tool',
  'recollapse': 'Regex pattern security testing tool',
  'vulhub': 'Pre-built vulnerable Docker environments for testing',
  'Grafana-Final-Scanner': 'Grafana instance discovery and vulnerability scanner',
  // Exploits
  'Godzilla': 'Advanced webshell management framework',
  'MASTER_TOOLS': 'Collection of exploitation and post-exploitation tools',
  'RedTeam-Physical-Tools': 'Physical security assessment tools collection',
  'SAIKO_RAT': 'Remote Access Trojan for red team operations',
  'Rusty-PE-Packer': 'PE file packer written in Rust',
  'XXEinjector': 'XML External Entity injection tool',
  'oxml_xxe': 'OOXML XXE exploitation toolkit',
  'phpggc': 'PHP unserialize payload generator',
  'ysoserial': 'Java deserialization payload generator',
  'promptfoo': 'LLM prompt injection testing and evaluation framework',
  'Bolthole': 'Container escape and Docker security tool',
  'Clematis': 'Exploitation framework for various vulnerabilities',
  'CommandInWiFi': 'WiFi command injection exploitation tool',
  'GoldenDMSA': 'Detection bypass and evasion technique toolkit',
  'IObit-EoP': 'IObit privilege escalation exploit',
  'WEBCAPTURE': 'Web application capture and cloning tool',
  // OSINT
  'Sherlock': 'Username enumeration across 300+ social media sites',
  'Photon': 'Fast web crawler for OSINT data extraction',
  'GHunt': 'Advanced Google account OSINT investigation tool',
  'datasploit': 'OSINT data aggregation and analysis framework',
  'WhatsApp-OSINT': 'WhatsApp number reconnaissance tool',
  'fakjs': 'Fake identity generator for testing purposes',
  'fbcrawl-alt': 'Facebook profile information extractor',
  // Network
  'Scapy': 'Packet manipulation and network protocol crafting tool',
  'DEDSEC-ADB': 'Android Debug Bridge security testing toolkit',
  'DEDSEC-AVSCAN': 'Antivirus evasion and testing tool',
  'DEDSEC-BLUEJACKER': 'Bluetooth bluejacking demonstration tool',
  'DEDSEC-Bluetooth-exploit': 'Bluetooth vulnerability exploitation toolkit',
  'DEDSEC-TOR-GHOST': 'Tor network configuration and anonymity tool',
  'DEDSEC-WIFUCK': 'WiFi security testing and deauthentication tool',
  'Dedsec-Android-Fud': 'Android FUD (Fully Undetectable) builder',
  'Dedsec-Proxychain': 'Proxy chaining tool for anonymous routing',
  'Dedsec-Wifi-Killer': 'WiFi deauthentication attack tool',
  'Dedsec-Wifi-Troll': 'WiFi pranking and testing tool',
  'Dedsec-WifiV2': 'WiFi security assessment tool v2',
  'dedsec-wifiphish': 'WiFi phishing access point creation tool',
  'dedsec-wifiphish-v2': 'WiFi phishing tool v2 with improvements',
  // AI Tools
  'HackTricks': 'Comprehensive hacking and pentesting cheat sheets',
  'Dify': 'Open-source LLM application development platform',
  'pentagi': 'AI-powered security assessment assistant',
  // Crypto
  'WalletBruteForce': 'Cryptocurrency wallet brute-force recovery tool',
};

const CATEGORIES = [
  { dir: 'recon', label: 'Recon', icon: '🔍' },
  { dir: 'web-pentest', label: 'Web Pentest', icon: '🕸️' },
  { dir: 'scanner', label: 'Scanner', icon: '📡' },
  { dir: 'exploits', label: 'Exploits', icon: '💀' },
  { dir: 'osint', label: 'OSINT', icon: '🕵️' },
  { dir: 'network', label: 'Network', icon: '🌐' },
  { dir: 'ai-tools', label: 'AI Tools', icon: '🧠' },
  { dir: 'crypto', label: 'Crypto', icon: '🔐' },
];

function detectLang(dir: string): 'python' | 'go' | 'js' | 'ruby' | 'bash' | 'other' {
  if (existsSync(join(dir, 'main.go')) || existsSync(join(dir, 'cmd')) || existsSync(join(dir, 'go.mod'))) return 'go';
  if (existsSync(join(dir, 'main.py')) || existsSync(join(dir, 'setup.py')) || existsSync(join(dir, 'pyproject.toml'))) return 'python';
  if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, 'index.js'))) return 'js';
  if (existsSync(join(dir, 'Gemfile'))) return 'ruby';
  if (existsSync(join(dir, 'main.sh'))) return 'bash';
  // Check for py files
  const pyFiles = readdirSync(dir).filter(f => f.endsWith('.py'));
  if (pyFiles.length > 0) return 'python';
  const goFiles = readdirSync(dir).filter(f => f.endsWith('.go'));
  if (goFiles.length > 0) return 'go';
  return 'other';
}

function getExecutable(dir: string, toolName: string, lang: string): string {
  switch (lang) {
    case 'python':
      if (existsSync(join(dir, 'main.py'))) return `python3 ${join(dir, 'main.py')}`;
      if (existsSync(join(dir, `${toolName.toLowerCase()}.py`))) return `python3 ${join(dir, `${toolName.toLowerCase()}.py`)}`;
      const pyFiles = readdirSync(dir).filter(f => f.endsWith('.py') && f !== 'setup.py' && f !== 'test_' && !f.startsWith('_'));
      if (pyFiles.length > 0) return `python3 ${join(dir, pyFiles[0])}`;
      return `python3 ${dir}`;
    case 'go':
      if (existsSync(join(dir, 'main.go'))) return `go run ${join(dir, 'main.go')}`;
      return `cd ${dir} && go run .`;
    case 'js':
      return `cd ${dir} && node .`;
    case 'ruby':
      return `cd ${dir} && ruby main.rb`;
    case 'bash':
      return `bash ${join(dir, 'main.sh')}`;
    default:
      // Check if there's a Makefile
      if (existsSync(join(dir, 'Makefile'))) return `cd ${dir} && make`;
      return `cd ${dir} && ls -la`;
  }
}

function getInstallCommand(dir: string, lang: string): string | null {
  switch (lang) {
    case 'python':
      if (existsSync(join(dir, 'requirements.txt'))) return `pip install --break-system-packages -r ${join(dir, 'requirements.txt')}`;
      if (existsSync(join(dir, 'setup.py'))) return `pip install --break-system-packages ${dir}`;
      if (existsSync(join(dir, 'pyproject.toml'))) return `pip install --break-system-packages ${dir}`;
      return null;
    case 'go':
      return 'cd ' + dir + ' && go build -o build/tool .';
    case 'js':
      if (existsSync(join(dir, 'package.json'))) return 'cd ' + dir + ' && npm install';
      return null;
    default:
      return null;
  }
}

function checkInstalled(dir: string, lang: string): boolean {
  if (lang === 'python') {
    if (existsSync(join(dir, 'requirements.txt'))) {
      const req = join(dir, 'requirements.txt');
      try {
        const content = require('fs').readFileSync(req, 'utf-8');
        // Simple check - if requirements.txt exists, tool is ready to install
        return false;
      } catch { return false; }
    }
    return true; // No requirements = ready to run
  }
  if (lang === 'js') return existsSync(join(dir, 'node_modules'));
  if (lang === 'go') {
    return existsSync(join(dir, 'go.sum')) || readdirSync(dir).some(f => f.endsWith('') && !f.includes('.go') && !f.includes('.mod'));
  }
  return true;
}

function scanTools(): ToolInfo[] {
  const tools: ToolInfo[] = [];
  for (const cat of CATEGORIES) {
    const catPath = join(TOOLS_DIR, cat.dir);
    if (!existsSync(catPath)) continue;
    try {
      const entries = readdirSync(catPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') || entry.name === '__pycache__') continue;
        const toolPath = join(catPath, entry.name);
        const lang = detectLang(toolPath);
        const executable = getExecutable(toolPath, entry.name, lang);
        const installCmd = getInstallCommand(toolPath, lang);
        tools.push({
          name: entry.name,
          category: cat.dir,
          path: toolPath,
          description: TOOL_DESCRIPTIONS[entry.name] || 'Security tool for penetration testing',
          runnable: true,
          executable,
          installed: !installCmd, // if no install needed, considered installed
          lang,
        });
      }
    } catch {}
  }
  return tools;
}

// GET — list all tools with status
export async function GET(request: NextRequest) {
  const tools = scanTools();
  const catParam = request.nextUrl.searchParams.get('category');
  const filtered = catParam ? tools.filter(t => t.category === catParam) : tools;

  // Count per category
  const counts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    counts[cat.dir] = tools.filter(t => t.category === cat.dir).length;
  }

  return NextResponse.json({
    tools: filtered,
    categories: CATEGORIES.map(c => ({ ...c, count: counts[c.dir] || 0 })),
    total: tools.length,
  });
}

// POST — install a tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category, tool } = body;

    if (!tool || !category) {
      return NextResponse.json({ error: 'Missing tool or category' }, { status: 400 });
    }

    const toolPath = join(TOOLS_DIR, category, tool);
    if (!existsSync(toolPath)) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const lang = detectLang(toolPath);

    if (action === 'install') {
      const installCmd = getInstallCommand(toolPath, lang);
      if (!installCmd) {
        return NextResponse.json({ ok: true, message: 'No installation needed', output: 'Tool is ready to run without additional installation.' });
      }

      return new Promise<NextResponse>((resolve) => {
        const proc = exec(installCmd, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          const output = (stdout || '') + '\n' + (stderr || '');
          resolve(NextResponse.json({
            ok: !error,
            message: error ? 'Installation failed' : 'Installation completed',
            output,
            error: error?.message,
          }));
        });
      });
    }

    if (action === 'run') {
      const execCmd = getExecutable(toolPath, tool, lang);
      const args = body.args ? ` ${body.args}` : '';
      const fullCmd = `${execCmd}${args} --help 2>&1 || ${execCmd}${args} -h 2>&1 || ${execCmd} --version 2>&1 || ${execCmd} 2>&1`;
      const timeout = body.timeout || 30000;

      return new Promise<NextResponse>((resolve) => {
        const proc = exec(fullCmd, { timeout, maxBuffer: 5 * 1024 * 1024, cwd: toolPath }, (error, stdout, stderr) => {
          const output = (stdout || '') + '\n' + (stderr || '');
          resolve(NextResponse.json({
            ok: true,
            message: 'Executed',
            output: output.substring(0, 50000),
            exitCode: error ? (error as any).code : 0,
          }));
        });
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "install" or "run"' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
