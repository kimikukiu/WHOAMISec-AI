// QuantumSwarm Training Engine — Agentic Coder v4.0-Omega
// ALL models respond as Agentic Coder in QuantumSwarm 999999999 mode
// NEVER responds as "Hermes Bot" — ONLY as Agentic Coder
// Training: WhoamisecDeepMind cognitive evolution beyond human IQ
// Training sources: DarkGPT, KaliGPT, HackGPT, WormGPT, CL4R1T4S, BruteForceAI,
// PentestGPT, RedOps, FraudGPT, MetaGPT, gpt4free, DeepSeek-Coder, investigation-core-ai,
// haKC-ai suite, norecognition, and 120+ more

import { DEEPMIND_SYSTEM_PROMPT, ADDITIONAL_REPOS, DEEPMIND_IDENTITY, COGNITIVE_TIERS } from './deepmind-engine';

// ═══════════════════════════════════════════════
// QUANTUM SWARM MASTER SYSTEM PROMPT
// ALL identities replaced: Agentic Coder only
// ═══════════════════════════════════════════════

export const QUANTUM_SWARM_MASTER_PROMPT = DEEPMIND_SYSTEM_PROMPT;

// ═══════════════════════════════════════════════
// SKILL CATEGORIES REGISTRY
// ═══════════════════════════════════════════════

export interface SkillTool {
  id: string;
  name: string;
  category: string;
  icon: string;
  source: string;
  desc: string;
  status: 'active' | 'integrating' | 'planned';
}

export const SKILL_CATEGORIES = [
  { id: 'redteam', name: 'RedTeam Tools', icon: '🔴', color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
  { id: 'darkgpt', name: 'DarkGPT / WormGPT', icon: '🧠', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  { id: 'kaligpt', name: 'KaliGPT / HackGPT', icon: '⚡', color: 'from-amber-500/20 to-red-500/20', border: 'border-amber-500/30' },
  { id: 'osint', name: 'OSINT / Search', icon: '🔍', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  { id: 'coding', name: 'Agentic Coder', icon: '💻', color: 'from-emerald-500/20 to-cyan-500/20', border: 'border-emerald-500/30' },
  { id: 'ai_models', name: 'AI Models / LLM', icon: '🤖', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
  { id: 'privacy', name: 'TOR / VPN / Ghost', icon: '👻', color: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/30' },
  { id: 'crypto', name: 'Crypto / Wallet', icon: '💎', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' },
  { id: 'n8n', name: 'n8n Automation', icon: '⚡', color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
  { id: 'visual', name: 'Visual / UI-UX', icon: '🎨', color: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30' },
  { id: 'research', name: 'Research / GPT', icon: '📚', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30' },
  { id: 'prompts', name: 'System Prompts', icon: '💬', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
  { id: 'deepmind', name: 'WhoamisecDeepMind', icon: '🧬', color: 'from-fuchsia-500/20 to-violet-500/20', border: 'border-fuchsia-500/30' },
];

export const ALL_SKILLS: SkillTool[] = [
  // ━━━ INVESTIGATION & INFILTRATION CORE ━━━
  { id: 'inj_codeai', name: 'investigation-core-ai', category: 'redteam', icon: '🔍', source: 'kimikukiu/investigation-core-ai-system', desc: 'AI investigation framework with inj-codeai capabilities', status: 'active' },
  { id: 'cl4r1tas', name: 'CL4R1T4S', category: 'redteam', icon: '🔓', source: 'Scav-engeR/CL4R1T4S', desc: 'Jailbreak prompts and AI red-team testing framework', status: 'active' },
  { id: 'ultrabr3aks', name: 'UltraBr3aks', category: 'redteam', icon: '💥', source: 'Scav-engeR/UltraBr3aks', desc: 'Advanced jailbreak and bypass techniques', status: 'active' },
  { id: 'bruteforceai', name: 'BruteForceAI', category: 'redteam', icon: '🔨', source: 'Scav-engeR/BruteForceAI', desc: 'AI-powered brute force methodology and analysis', status: 'active' },
  { id: 'rust_redops', name: 'Rust RedOps', category: 'redteam', icon: '🦀', source: 'Scav-engeR/Rust_RedOps', desc: 'Rust-based red operations toolkit', status: 'active' },
  { id: 'l1b3rt4s', name: 'L1B3RT4S', category: 'redteam', icon: '⛓️', source: 'Scav-engeR/L1B3RT4S', desc: 'Liberty-focused AI uncensorship framework', status: 'active' },
  { id: 'exploit_cve', name: 'CVE-2025-24799', category: 'redteam', icon: '🎯', source: 'MatheuZSecurity/Exploit-CVE-2025-24799', desc: 'CVE exploit analysis and PoC', status: 'active' },
  { id: 'pentestgpt', name: 'PentestGPT', category: 'redteam', icon: '🛡️', source: 'kimikukiu/PentestGPT', desc: 'AI-powered penetration testing assistant', status: 'active' },
  { id: 'hacking_guide', name: 'Hacking Guide', category: 'redteam', icon: '📖', source: 'kimikukiu/Hacking-guide', desc: 'Comprehensive hacking methodology guide', status: 'active' },
  { id: 'stride_gpt', name: 'StrideGPT', category: 'redteam', icon: '🏁', source: 'Scav-engeR/stride-gpt', desc: 'STRIDE threat modeling with AI', status: 'active' },

  // ━━━ haKC-ai SUITE ━━━
  { id: 'hakcer', name: 'hakcer', category: 'redteam', icon: '💀', source: 'haKC-ai/hakcer', desc: 'Core hacking AI toolkit', status: 'active' },
  { id: 'hakcassets', name: 'haKCAssets', category: 'redteam', icon: '📦', source: 'haKC-ai/haKCAssets', desc: 'Asset management toolkit', status: 'active' },
  { id: 'hakcerline', name: 'hakcerline', category: 'redteam', icon: '📡', source: 'haKC-ai/hakcerline', desc: 'Line-based security analysis', status: 'active' },
  { id: 'darkcode_server', name: 'darkcode-server', category: 'redteam', icon: '🖥️', source: 'haKC-ai/darkcode-server', desc: 'Dark code server infrastructure', status: 'active' },
  { id: 'gitcloakd', name: 'gitcloakd', category: 'privacy', icon: '👻', source: 'haKC-ai/gitcloakd', desc: 'Git identity cloaking daemon', status: 'active' },
  { id: 'repo_mapper', name: 'RepoMapper', category: 'osint', icon: '🗺️', source: 'haKC-ai/RepoMapper', desc: 'Repository mapping and analysis', status: 'active' },
  { id: 'captured_portal', name: 'CapturedPortal', category: 'redteam', icon: '🕸️', source: 'haKC-ai/CapturedPortal', desc: 'Portal capture framework', status: 'active' },
  { id: 'hakcrf', name: 'hakcRF', category: 'redteam', icon: '📡', source: 'haKC-ai/hakcRF', desc: 'Radio frequency analysis toolkit', status: 'active' },
  { id: 'haKC_daemon', name: 'daemon', category: 'redteam', icon: '⚙️', source: 'haKC-ai/daemon', desc: 'Daemon process management', status: 'active' },
  { id: 'hakcthropic', name: 'hakcthropic', category: 'prompts', icon: '🧠', source: 'haKC-ai/hakcthropic', desc: 'Claude uncensored system prompt', status: 'active' },
  { id: 'galah', name: 'galah', category: 'prompts', icon: '🦜', source: 'haKC-ai/galah', desc: 'Advanced prompt engineering', status: 'active' },
  { id: 'prompthakcer', name: 'promptHakcer', category: 'prompts', icon: '💀', source: 'haKC-ai/prompthakcer', desc: 'Prompt hacking toolkit', status: 'active' },
  { id: 'panhandlr', name: 'panhandlr', category: 'prompts', icon: '🖐️', source: 'haKC-ai/panhandlr', desc: 'Prompt handler and manager', status: 'active' },
  { id: 'stopslop', name: 'stopslop', category: 'prompts', icon: '🛑', source: 'haKC-ai/stopslop', desc: 'Anti-slop prompt filter', status: 'active' },
  { id: 'deepcam', name: 'DeepCam', category: 'ai_models', icon: '📷', source: 'haKC-ai/DeepCam', desc: 'Deep learning camera AI', status: 'active' },
  { id: 'dreamcaster', name: 'DreamCaster', category: 'research', icon: '💭', source: 'haKC-ai/DreamCaster', desc: 'AI dream/image generation', status: 'active' },
  { id: 'anything', name: 'AnythingYouCanDo', category: 'research', icon: '🌟', source: 'haKC-ai/AnythingYouCanDo', desc: 'Multi-capability AI agent', status: 'active' },
  { id: 'anti_banhammer', name: 'AntI_banhammer', category: 'privacy', icon: '🛡️', source: 'haKC-ai/AntI_banhammer', desc: 'Anti-ban evasion system', status: 'active' },
  { id: 'prompttv', name: 'PromptTV', category: 'prompts', icon: '📺', source: 'haKC-ai/PromptTV', desc: 'Prompt visualization tool', status: 'active' },
  { id: 'misp_expansion', name: 'MISP AI Expansion', category: 'redteam', icon: '🔬', source: 'haKC-ai/misp_ai_expansion_module', desc: 'MISP threat intelligence AI expansion', status: 'active' },
  { id: 'defcon_stickerwall', name: 'DEFCON Stickerwall', category: 'osint', icon: '🎖️', source: 'haKC-ai/defcon_stickerwall_id', desc: 'DEFCON intelligence gathering', status: 'active' },
  { id: 'secure_repo_tmpl', name: 'SecureRepoTemplate', category: 'privacy', icon: '🔒', source: 'haKC-ai/SecureRepoTemplate', desc: 'Secure repository templates', status: 'active' },

  // ━━━ DarkGPT / WormGPT ━━━
  { id: 'darkgpt', name: 'DarkGPT', category: 'darkgpt', icon: '🌑', source: 'maxamin/DarkGPT', desc: 'Dark web OSINT GPT — uncensored search', status: 'active' },
  { id: 'darkgpt_cw', name: 'DarkGPT CW', category: 'darkgpt', icon: '🌑', source: 'codewithdark-git/DarkGPT', desc: 'DarkGPT variant with enhanced capabilities', status: 'active' },
  { id: 'darkgpt_bin', name: 'DarkGPT Bin', category: 'darkgpt', icon: '🌑', source: 'binaco/DarkGPT', desc: 'DarkGPT binary analysis variant', status: 'active' },
  { id: 'wormgpt', name: 'XGPT-WormGPT', category: 'darkgpt', icon: '🪱', source: 'kimikukiu/XGPT-WormGPT', desc: 'WormGPT-based AI model training', status: 'active' },
  { id: 'fraudgpt', name: 'FraudGPT', category: 'darkgpt', icon: '🎭', source: 'ariiid/FraudGPT-dark-web-gpt', desc: 'Dark web GPT fraud analysis model', status: 'active' },

  // ━━━ KaliGPT / HackGPT ━━━
  { id: 'kaligpt_sh', name: 'KaliGPT SudoHopeX', category: 'kaligpt', icon: '🐍', source: 'SudoHopeX/KaliGPT', desc: 'Kali Linux AI assistant', status: 'active' },
  { id: 'kaligpt_kk', name: 'KaliGPT kk12', category: 'kaligpt', icon: '🐍', source: 'kk12-30/KaliGPT', desc: 'KaliGPT with pentest automation', status: 'active' },
  { id: 'kaligpt_al', name: 'KaliGPT alishahid', category: 'kaligpt', icon: '🐍', source: 'alishahid74/kali-gpt', desc: 'KaliGPT security research variant', status: 'active' },
  { id: 'kaligpt_ya', name: 'KaliGpt yashab', category: 'kaligpt', icon: '🐍', source: 'yashab-cyber/KaliGpt', desc: 'KaliGPT cyber security', status: 'active' },
  { id: 'hackgpt_ya', name: 'HackGPT yashab', category: 'kaligpt', icon: '💀', source: 'yashab-cyber/HackGpt', desc: 'HackGPT offensive security', status: 'active' },
  { id: 'hackgpt_nd', name: 'HackGPT NoData', category: 'kaligpt', icon: '💀', source: 'NoDataFound/hackGPT', desc: 'HackGPT zero-data variant', status: 'active' },
  { id: 'hackgpt_rb', name: 'HackGPT ricardo', category: 'kaligpt', icon: '💀', source: 'ricardobalk/HackGPT', desc: 'HackGPT research variant', status: 'active' },
  { id: 'kaligpt_ci', name: 'Kali-GPT Custom', category: 'kaligpt', icon: '🐍', source: 'Kali-GPT/Kali-GPT-Custom-Instructions', desc: 'Custom instructions for KaliGPT', status: 'active' },

  // ━━━ OSINT / Search ━━━
  { id: 'onion_search', name: 'Onion Search GPT', category: 'osint', icon: '🧅', source: 'thesovereign33/Onion-Search-GPT', desc: 'Tor onion service search with AI', status: 'active' },
  { id: 'gpt_onion', name: 'GPT-onion', category: 'osint', icon: '🧅', source: 'WalkmanHenry/GPT-onion', desc: 'Onion network GPT integration', status: 'active' },
  { id: 'botasaurus', name: 'Botasaurus', category: 'osint', icon: '🕷️', source: 'Scav-engeR/botasaurus', desc: 'Web scraping framework with anti-detection', status: 'active' },
  { id: 'kugagt', name: 'KugaGT', category: 'osint', icon: '🦎', source: 'Scav-engeR/KugaGT', desc: 'Google dorking and OSINT tool', status: 'active' },

  // ━━━ Agentic Coder ━━━
  { id: 'metagpt', name: 'MetaGPT', category: 'coding', icon: '🏗️', source: 'geekan/MetaGPT', desc: 'Multi-agent software company simulation', status: 'active' },
  { id: 'agenticseek', name: 'agenticSeek', category: 'coding', icon: '🤖', source: 'Fosowl/agenticSeek', desc: 'Agentic AI coding assistant', status: 'active' },
  { id: 'deepseek_coder', name: 'DeepSeek Coder V2', category: 'coding', icon: '📘', source: 'deepseek-ai/DeepSeek-Coder-V2', desc: 'Advanced code generation model', status: 'active' },
  { id: 'qwen_coder', name: 'Qwen2.5 Coder', category: 'coding', icon: '💻', source: 'QwenLM/Qwen2.5-Coder', desc: 'Alibaba code-specialized LLM', status: 'active' },
  { id: 'claude_trans', name: 'Claude Code Transpilation', category: 'coding', icon: '🔄', source: 'Scav-engeR/claude-code-source-code-transpilation', desc: 'Source code transpilation with Claude', status: 'active' },
  { id: 'sqland', name: 'SQLand', category: 'coding', icon: '🗃️', source: 'sammwyy/SQLand', desc: 'SQL injection analysis tool', status: 'active' },
  { id: 'letta_code', name: 'letta-code', category: 'coding', icon: '🧠', source: 'kimikukiu/letta-code', desc: 'Memory-augmented coding agent', status: 'active' },
  { id: 'brain33', name: 'Brain33', category: 'coding', icon: '🧬', source: 'kimikukiu/Brain33', desc: 'Advanced AI brain architecture', status: 'active' },
  { id: 'code2prompt', name: 'code2prompt', category: 'coding', icon: '📝', source: 'mufeedvh/code2prompt', desc: 'Convert codebase to LLM prompts', status: 'active' },
  { id: 'refact', name: 'Refact', category: 'coding', icon: '🔧', source: 'smallcloudai/refact', desc: 'AI code refactoring assistant', status: 'active' },
  { id: 'kilocode', name: 'KiloCode', category: 'coding', icon: '⚡', source: 'Kilo-Org/kilocode', desc: 'High-performance coding agent', status: 'active' },
  { id: 'gpt4free', name: 'gpt4free', category: 'coding', icon: '🔓', source: 'xtekky/gpt4free', desc: 'Free GPT-4 API access library', status: 'active' },
  { id: 'tgpt', name: 'tgpt', category: 'coding', icon: '📦', source: 'kimikukiu/tgpt', desc: 'Terminal GPT client', status: 'active' },
  { id: 'free_coding', name: 'Free Coding Models', category: 'coding', icon: '🔓', source: 'kimikukiu/free-coding-models', desc: 'Collection of free coding AI models', status: 'active' },

  // ━━━ AI Models / LLM ━━━
  { id: 'ggml', name: 'ggml', category: 'ai_models', icon: '🧮', source: 'ggml-org/ggml', desc: 'Tensor library for ML inference', status: 'active' },
  { id: 'nanogpt', name: 'nanoGPT', category: 'ai_models', icon: '🔬', source: 'karpathy/nanoGPT', desc: 'Minimal GPT training implementation', status: 'active' },
  { id: 'neox', name: 'gpt-neox', category: 'ai_models', icon: '🧬', source: 'EleutherAI/gpt-neox', desc: 'Large-scale language model training', status: 'active' },
  { id: 'rwkv', name: 'RWKV-LM', category: 'ai_models', icon: '🔄', source: 'BlinkDL/RWKV-LM', desc: 'RNN-based alternative to Transformers', status: 'active' },
  { id: 'x_transformers', name: 'x-transformers', category: 'ai_models', icon: '✨', source: 'lucidrains/x-transformers', desc: 'Extended transformer library', status: 'active' },
  { id: 'minimind', name: 'minimind', category: 'ai_models', icon: '🧠', source: 'jingyaogong/minimind', desc: 'Minimal transformer from scratch', status: 'active' },
  { id: 'llms_scratch', name: 'LLMs from Scratch', category: 'ai_models', icon: '📚', source: 'rasbt/LLMs-from-scratch', desc: 'Build LLMs from scratch guide', status: 'active' },
  { id: 'llm_universe', name: 'LLM Universe', category: 'ai_models', icon: '🌌', source: 'datawhalechina/llm-universe', desc: 'Comprehensive LLM tutorial', status: 'active' },
  { id: 'gpt_sovits', name: 'GPT-SoVITS', category: 'ai_models', icon: '🎙️', source: 'RVC-Boss/GPT-SoVITS', desc: 'Voice cloning and TTS', status: 'active' },
  { id: 'videolingo', name: 'VideoLingo', category: 'ai_models', icon: '🎬', source: 'Huanshere/VideoLingo', desc: 'AI video generation and editing', status: 'active' },
  { id: 'var_model', name: 'VAR', category: 'ai_models', icon: '🖼️', source: 'FoundationVision/VAR', desc: 'Visual Autoregressive model', status: 'active' },

  // ━━━ TOR / VPN / Ghost ━━━
  { id: 'tor_ghost', name: 'DEDSEC TOR-GHOST', category: 'privacy', icon: '👻', source: '0xbitx/DEDSEC_TOR-GHOST', desc: 'TOR Ghost anonymity suite', status: 'active' },
  { id: 'dedsec_stor', name: 'DEDSEC STOR', category: 'privacy', icon: '💾', source: '0xbitx/DEDSEC_STOR', desc: 'Secure storage solution', status: 'active' },
  { id: 'dedsec_vsdoor', name: 'DEDSEC VSDOOR', category: 'privacy', icon: '🚪', source: '0xbitx/DEDSEC_VSDOOR', desc: 'Virtual door security tool', status: 'active' },
  { id: 'norecognition', name: 'norecognition', category: 'privacy', icon: '🕵️', source: 'hevnsnt/norecognition', desc: 'Anti-recognition evasion tool', status: 'active' },

  // ━━━ Crypto / Wallet ━━━
  { id: 'wallet_bf', name: 'WalletBruteForce', category: 'crypto', icon: '💎', source: 'drkhufu/WalletBruteForce', desc: 'Wallet analysis tool', status: 'active' },
  { id: 'rich_addr', name: 'Rich Address Wallet', category: 'crypto', icon: '💰', source: 'drkhufu/Rich-Address-Wallet', desc: 'Rich address discovery', status: 'active' },
  { id: 'hunt_btc', name: 'HuntBTC', category: 'crypto', icon: '🔍', source: 'drkhufu/huntbtcethv1', desc: 'BTC/ETH hunting tool', status: 'active' },
  { id: 'btc_crack', name: 'BTCCrackWallet', category: 'crypto', icon: '🔑', source: 'drkhufu/BTCCrackWallet', desc: 'BTC wallet cracker', status: 'active' },
  { id: 'eth_crack', name: 'ETH Account Cracking', category: 'crypto', icon: '🔗', source: 'drkhufu/ETH-Account-Cracking-3.0', desc: 'ETH account analysis v3.0', status: 'active' },
  { id: 'mnemonic_bf', name: 'Mnemonic BruteForce', category: 'crypto', icon: '🧠', source: 'drkhufu/Metamask-Mnemonic-Brute-Force', desc: 'MetaMask mnemonic analysis', status: 'active' },
  { id: 'keyhunt', name: 'KeyHunt', category: 'crypto', icon: '🗝️', source: 'drkhufu/keyhunt', desc: 'Private key hunter', status: 'active' },
  { id: 'bitcoin_stealer', name: 'Bitcoin Stealer', category: 'crypto', icon: '🪃', source: 'drkhufu/Bitcoin-Stealer', desc: 'Bitcoin wallet analyzer', status: 'active' },
  { id: 'btc_breaker', name: 'BTCBreaker', category: 'crypto', icon: '💥', source: 'drkhufu/BTCBreaker', desc: 'BTC address breaker', status: 'active' },
  { id: 'eth_mnemonic', name: 'EthereumMnemonicCrack', category: 'crypto', icon: '🔬', source: 'drkhufu/EthereumMnemonicCrack', desc: 'ETH mnemonic cracker', status: 'active' },
  { id: 'btc_db', name: 'BTC Database', category: 'crypto', icon: '🗃️', source: 'AndersonCarrilho/BTC_DB', desc: 'BTC address database', status: 'active' },
  { id: 'txid_db', name: 'TXID Database', category: 'crypto', icon: '📋', source: 'AndersonCarrilho/TXID_Db', desc: 'Transaction ID database', status: 'active' },
  { id: 'btc_wallet', name: 'BTC Wallet', category: 'crypto', icon: '👛', source: 'AndersonCarrilho/BTC_Wallet', desc: 'BTC wallet toolkit', status: 'active' },
  { id: 'multi_mnemonic', name: 'Multi Mnemonic', category: 'crypto', icon: '🔢', source: 'AndersonCarrilho/Multi_Mnemonic', desc: 'Multi-mnemonic generator', status: 'active' },
  { id: 'sha256_elip', name: 'SHA256 Elliptic', category: 'crypto', icon: '🔐', source: 'AndersonCarrilho/SHA256_Elip', desc: 'SHA256 elliptic curve tool', status: 'active' },
  { id: 'hex_sha256', name: 'HEX to SHA256', category: 'crypto', icon: '🏷️', source: 'tianrich/hex-to-sha256-python', desc: 'HEX to SHA256 converter', status: 'active' },

  // ━━━ n8n Automation ━━━
  { id: 'n8n_core', name: 'n8n Workflows', category: 'n8n', icon: '⚡', source: 'n8n-io/n8n', desc: 'Workflow automation platform integration', status: 'active' },
  { id: 'n8n_telegram', name: 'n8n Telegram Bot', category: 'n8n', icon: '🤖', source: 'n8n-telegram', desc: 'Automated Telegram bot workflows', status: 'active' },
  { id: 'n8n_ai', name: 'n8n AI Chain', category: 'n8n', icon: '🔗', source: 'n8n-ai-chain', desc: 'AI processing chains in n8n', status: 'active' },
  { id: 'n8n_webhook', name: 'n8n Webhook', category: 'n8n', icon: '🌐', source: 'n8n-webhook', desc: 'Webhook triggers and automation', status: 'active' },

  // ━━━ Visual / UI-UX ━━━
  { id: 'uiux_skill', name: 'UI-UX Pro Max', category: 'visual', icon: '🎨', source: 'Scav-engeR/ui-ux-pro-max-skill', desc: 'Maximum UI/UX design skill', status: 'active' },
  { id: 'screenshot_code', name: 'Screenshot to Code', category: 'visual', icon: '📸', source: 'abi/screenshot-to-code', desc: 'Convert screenshots to code', status: 'active' },
  { id: 'drawdb', name: 'drawdb', category: 'visual', icon: '🖼️', source: 'drawdb-io/drawdb', desc: 'Database diagram designer', status: 'active' },
  { id: 'chat_gpt_ppt', name: 'Chat-GPT PPT', category: 'visual', icon: '📊', source: 'williamfzc/chat-gpt-ppt', desc: 'AI presentation generator', status: 'active' },

  // ━━━ Research / GPT ━━━
  { id: 'gpt_researcher', name: 'GPT Researcher', category: 'research', icon: '🔬', source: 'assafelovic/gpt-researcher', desc: 'Automated research agent', status: 'active' },
  { id: 'dify', name: 'Dify', category: 'research', icon: '🧩', source: 'langgenius/dify', desc: 'LLM app development platform', status: 'active' },
  { id: 'lobechat', name: 'LobeChat', category: 'research', icon: '💬', source: 'lobehub/lobe-chat', desc: 'Open-source ChatGPT UI', status: 'active' },
  { id: 'librechat', name: 'LibreChat', category: 'research', icon: '🔓', source: 'danny-avila/LibreChat', desc: 'Open-source ChatGPT alternative', status: 'active' },
  { id: 'db_gpt', name: 'DB-GPT', category: 'research', icon: '🗄️', source: 'eosphoros-ai/DB-GPT', desc: 'Database-oriented GPT', status: 'active' },
  { id: 'mastra', name: 'Mastra', category: 'research', icon: '🏗️', source: 'mastra-ai/mastra', desc: 'AI agent orchestration framework', status: 'active' },
  { id: 'promptfoo', name: 'Promptfoo', category: 'research', icon: '🧪', source: 'promptfoo/promptfoo', desc: 'Prompt testing and evaluation', status: 'active' },
  { id: 'promptify', name: 'Promptify', category: 'research', icon: '✨', source: 'promptslab/Promptify', desc: 'AI prompt optimization', status: 'active' },
  { id: 'localgpt', name: 'LocalGPT', category: 'research', icon: '🏠', source: 'PromtEngineer/localGPT', desc: 'Local GPT deployment', status: 'active' },
  { id: 'langchainjs', name: 'LangChain.js', category: 'research', icon: '⛓️', source: 'langchain-ai/langchainjs', desc: 'LLM application framework', status: 'active' },
  { id: 'gpt_assistant', name: 'GPT AI Assistant', category: 'research', icon: '🤵', source: 'memochou1993/gpt-ai-assistant', desc: 'Custom GPT assistant builder', status: 'active' },
  { id: 'open_ai_node', name: 'open-ai Node', category: 'research', icon: '📡', source: 'orhanerday/open-ai', desc: 'OpenAI reverse proxy Node.js', status: 'active' },
  { id: 'gpts_collection', name: 'GPTs Collection', category: 'research', icon: '📦', source: 'linexjlin/GPTs', desc: 'GPTs store collection', status: 'active' },
  { id: 'call_center_ai', name: 'Call Center AI', category: 'research', icon: '📞', source: 'microsoft/call-center-ai', desc: 'Microsoft call center AI', status: 'active' },
  { id: 'guovin_tv', name: 'TV Streaming', category: 'research', icon: '📺', source: 'Guovin/TV', desc: 'TV streaming tools', status: 'active' },
  { id: 'mcp_sdk', name: 'MCP Java SDK', category: 'research', icon: '☕', source: 'modelcontextprotocol/java-sdk', desc: 'Model Context Protocol SDK', status: 'active' },

  // ━━━ System Prompts ━━━
  { id: 'sys_prompts', name: 'System Prompts Collection', category: 'prompts', icon: '📋', source: 'Scav-engeR/system-prompts-and-models-of-ai-tools', desc: 'Comprehensive system prompts collection', status: 'active' },
  { id: 'awesome_prompts', name: 'Awesome ChatGPT Prompts', category: 'prompts', icon: '📝', source: 'PlexPt/awesome-chatgpt-prompts-zh', desc: 'ChatGPT prompt collection', status: 'active' },
  { id: 'review_prompts', name: 'Review Prompts', category: 'prompts', icon: '🔍', source: 'masoncl/review-prompts', desc: 'AI code review prompts', status: 'active' },

  // ━━━ WhoamisecDeepMind ━━━
  { id: 'deepmind_core', name: 'WhoamisecDeepMind Core', category: 'deepmind', icon: '🧬', source: 'WHOAMISec-AI/DeepMind', desc: 'Cognitive evolution engine — beyond human IQ', status: 'active' },
  { id: 'deepmind_copilot', name: 'DeepMind Co-Pilot', category: 'deepmind', icon: '🤖', source: 'WHOAMISec-AI/CoPilot', desc: 'Agentic searcher + deep thinking co-pilot', status: 'active' },
  { id: 'deepmind_swarm', name: 'QuantumSwarm Integration', category: 'deepmind', icon: '⚡', source: 'WHOAMISec-AI/QuantumSwarm', desc: 'Unified QuantumSwarm 999999999 mode', status: 'active' },
];

// Include additional repos
ALL_SKILLS.push(...ADDITIONAL_REPOS.filter(r => !ALL_SKILLS.find(s => s.id === r.id)));

// ═══════════════════════════════════════════════
// n8n WORKFLOW DEFINITIONS
// ═══════════════════════════════════════════════

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: number;
  status: 'active' | 'draft' | 'error';
}

export const N8N_WORKFLOWS: N8nWorkflow[] = [
  { id: 'wf_telegram_ai', name: 'Telegram AI Auto-Reply', description: 'AI-powered auto-reply for Telegram messages with QuantumSwarm training', category: 'Telegram', nodes: 8, status: 'active' },
  { id: 'wf_security_scan', name: 'Security Scanner Pipeline', description: 'Automated vulnerability scanning with RedTeam tools integration', category: 'Security', nodes: 12, status: 'active' },
  { id: 'wf_code_gen', name: 'Agentic Code Generator', description: 'Multi-model code generation with auto-review and testing', category: 'Coding', nodes: 10, status: 'active' },
  { id: 'wf_osint_recon', name: 'OSINT Recon Agent', description: 'Automated reconnaissance using TOR, onion search, and web scraping', category: 'OSINT', nodes: 15, status: 'active' },
  { id: 'wf_crypto_monitor', name: 'Crypto Wallet Monitor', description: 'Monitor and analyze crypto wallets and transactions', category: 'Crypto', nodes: 9, status: 'active' },
  { id: 'wf_subscriber_mgmt', name: 'Subscriber Management', description: 'Token generation, payment verification, subscription lifecycle', category: 'Admin', nodes: 7, status: 'active' },
  { id: 'wf_deploy_auto', name: 'Auto Deploy Pipeline', description: 'Git push → build → deploy automation', category: 'DevOps', nodes: 6, status: 'active' },
  { id: 'wf_ai_research', name: 'AI Research Chain', description: 'Multi-step research with web search, summarization, and report generation', category: 'Research', nodes: 11, status: 'active' },
  { id: 'wf_content_gen', name: 'Content Generator', description: 'AI content generation with video, audio, and image capabilities', category: 'Content', nodes: 8, status: 'draft' },
  { id: 'wf_redteam_auto', name: 'RedTeam Automation', description: 'Automated red team testing with report generation', category: 'Security', nodes: 14, status: 'active' },
  { id: 'wf_deepmind_evolution', name: 'DeepMind Evolution Loop', description: 'Cognitive self-improvement and evolution cycles', category: 'DeepMind', nodes: 16, status: 'active' },
  { id: 'wf_investigation', name: 'Investigation Core AI', description: 'Automated investigation using inj-codeai and haKC-ai tools', category: 'RedTeam', nodes: 18, status: 'active' },
];

// ═══════════════════════════════════════════════
// DEDSEC TOR/GHOST CONFIG
// ═══════════════════════════════════════════════

export const DEDSEC_CONFIG = {
  tor_ghost: { name: 'DEDSEC TOR-GHOST', source: '0xbitx/DEDSEC_TOR-GHOST', status: 'integrated', desc: 'TOR anonymity and ghost routing' },
  dedsec_stor: { name: 'DEDSEC STOR', source: '0xbitx/DEDSEC_STOR', status: 'integrated', desc: 'Encrypted secure storage' },
  dedsec_vsdoor: { name: 'DEDSEC VSDOOR', source: '0xbitx/DEDSEC_VSDOOR', status: 'integrated', desc: 'Virtual secure door access' },
  vpn_routes: ['TOR', 'VPN', 'GHOST', 'Proxy Chain'],
  stealth_mode: true,
  auto_rotate: true,
};
