'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bot, Brain, FolderOpen, Rocket, Settings, FileText, LogOut, Send,
  RefreshCw, Key, Shield, ChevronRight, Terminal, Cpu, Zap,
  Download, Trash2, Copy, ExternalLink, Loader2, CheckCircle2,
  XCircle, AlertCircle, Eye, EyeOff, Monitor, Smartphone,
  Database, GitBranch, Globe, LayoutDashboard, Code, Activity,
  Lock, Unlock, Command
} from 'lucide-react';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface AppConfig {
  glm_api_key: string;
  telegram_token: string;
  glm_model: string;
  glm_endpoint: string;
  github_repo: string;
  auto_repair: string;
  max_repair_iterations: number;
  expert_mode: string;
  glm_api_key_masked?: string;
  telegram_token_masked?: string;
}

interface BotMessage {
  id: number;
  from: string;
  text: string;
  date: string;
}

interface FileInfo {
  name: string;
  size: number;
  modified: string;
}

interface LoopProblem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  template: string;
  hint?: string;
}

interface LogEntry {
  time: string;
  type: 'info' | 'ok' | 'err' | 'warn';
  message: string;
}

// ═══════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════

export default function HermesPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    fetch('/api/auth/check').then(r => r.json()).then(data => {
      setAuthenticated(data.authenticated === true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      setAuthenticated(true);
      toast.success('Autentificat cu succes!');
    } else {
      setLoginError(data.error || 'Parolă invalidă');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    toast.info('Deconectat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Se încarcă Hermes...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '2px',
                height: '2px',
                animation: `float ${5 + Math.random() * 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { transform: translateY(-100px) translateX(50px); opacity: 0.7; }
          }
        `}</style>
        <Card className="w-full max-w-md bg-gradient-to-br from-[#111827] to-[#1a1f35] border-slate-700/50">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🤖</div>
              <h1 className="text-3xl font-bold text-blue-400">Hermes</h1>
              <p className="text-slate-500 text-sm mt-1">Admin Control Panel v4.0</p>
            </div>
            {loginError && (
              <div className="bg-red-950/50 border border-red-900/50 text-red-300 p-3 rounded-lg mb-5 text-sm">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">
                  <Lock className="h-3.5 w-3.5 inline mr-1.5" />
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoFocus
                    className="bg-[#0f172a] border-slate-600 text-slate-100 h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-base"
              >
                Access Dashboard →
              </Button>
            </form>
            <p className="text-center text-slate-600 text-xs mt-6">
              Hermes Bot v4.0 · Expert Edition · 24/7 Online
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}

// ═══════════════════════════════════════════════
// DASHBOARD COMPONENT
// ═══════════════════════════════════════════════

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [deployStatus, setDeployStatus] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [glmMessages, setGlmMessages] = useState<{ role: string; content: string }[]>([
    { role: 'system', content: 'GLM Ready. Type any prompt - code, analysis, security, etc.' }
  ]);
  const [files, setFiles] = useState<{ downloads: FileInfo[]; generated: FileInfo[] }>({
    downloads: [],
    generated: [],
  });
  const [loopProblems, setLoopProblems] = useState<LoopProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<LoopProblem | null>(null);

  // Settings form state
  const [telegramToken, setTelegramToken] = useState('');
  const [glmKey, setGlmKey] = useState('');
  const [glmModel, setGlmModel] = useState('glm-4.6');
  const [glmEndpoint, setGlmEndpoint] = useState('https://api.z.ai/api/coding/paas/v4/chat/completions');
  const [githubRepo, setGithubRepo] = useState('');
  const [autoRepair, setAutoRepair] = useState('true');
  const [maxRepair, setMaxRepair] = useState(3);
  const [expertMode, setExpertMode] = useState('false');

  // Loading states
  const [botLoading, setBotLoading] = useState(false);
  const [glmLoading, setGlmLoading] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [botSetupLoading, setBotSetupLoading] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Agent capabilities
  const [agentReasoning, setAgentReasoning] = useState(true);
  const [agentMemory, setAgentMemory] = useState(false);
  const [agentCots, setAgentCots] = useState(true);

  const glmEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs(prev => {
      const newLogs = [...prev, { time: new Date().toLocaleTimeString(), type, message }];
      return newLogs.slice(-100);
    });
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      if (data.glm_model) setGlmModel(data.glm_model);
      if (data.glm_endpoint) setGlmEndpoint(data.glm_endpoint);
      if (data.auto_repair !== undefined) setAutoRepair(String(data.auto_repair));
      if (data.max_repair_iterations) setMaxRepair(data.max_repair_iterations);
      if (data.expert_mode !== undefined) setExpertMode(String(data.expert_mode));
      if (data.github_repo) setGithubRepo(data.github_repo);
    } catch {}
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/messages');
      const data = await res.json();
      if (data.messages) setBotMessages(data.messages);
    } catch {}
  }, []);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles({
        downloads: Array.isArray(data.downloads) ? data.downloads : data.downloads?.files || [],
        generated: Array.isArray(data.generated) ? data.generated : data.generated_code?.files || [],
      });
    } catch {}
  }, []);

  const refreshDeployStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/deploy/status');
      const data = await res.json();
      setDeployStatus(data);
    } catch {}
  }, []);

  const refreshLoopProblems = useCallback(async () => {
    try {
      const res = await fetch('/api/loop-problems');
      const data = await res.json();
      if (data.problems) setLoopProblems(data.problems);
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    refreshConfig();
    refreshMessages();
    refreshFiles();
    refreshDeployStatus();
    refreshLoopProblems();
    addLog('info', 'Dashboard loaded');
  }, [refreshConfig, refreshMessages, refreshFiles, refreshDeployStatus, refreshLoopProblems, addLog]);

  // Auto-refresh messages
  useEffect(() => {
    const interval = setInterval(refreshMessages, 15000);
    return () => clearInterval(interval);
  }, [refreshMessages]);

  // Auto-scroll GLM chat
  useEffect(() => {
    glmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [glmMessages]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ─── Start / Stop Bot ───
  const startBot = async () => {
    setBotSetupLoading(true);
    addLog('info', 'Starting bot...');
    try {
      // Setup bot commands and delete webhook (switch to polling)
      const setupRes = await fetch('/api/telegram/setup', { method: 'POST' });
      const setupData = await setupRes.json();
      if (setupData.success || setupData.mode === 'polling') {
        setBotActive(true);
        addLog('ok', `Bot activated (${setupData.mode || 'polling'} mode). Commands registered.`);
        toast.success('Bot activat! Trimite /start pe Telegram.');
      } else {
        addLog('err', setupData.error || 'Setup failed');
        toast.error(setupData.error || 'Eroare la activare');
      }
    } catch (e: any) {
      addLog('err', e.message);
      toast.error('Eroare de rețea');
    }
    setBotSetupLoading(false);
  };

  const stopBot = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setBotActive(false);
    setPollCount(0);
    addLog('warn', 'Bot stopped');
    toast.info('Bot oprit');
  };

  // ─── Bot Polling ───
  useEffect(() => {
    if (botActive) {
      const poll = async () => {
        try {
          const res = await fetch('/api/telegram/poll', { method: 'POST' });
          const data = await res.json();
          if (data.success && data.processed > 0) {
            setPollCount(prev => prev + data.processed);
            addLog('info', `Polled ${data.processed} update(s)`);
            refreshMessages();
          }
        } catch {}
      };
      // Poll every 3 seconds
      poll();
      pollIntervalRef.current = setInterval(poll, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [botActive]);

  // ─── Bot Commands ───
  const sendBotCommand = async (cmd?: string) => {
    const input = document.getElementById('botCmdInput') as HTMLInputElement;
    const command = cmd || input?.value?.trim();
    if (!command) return;
    if (input) input.value = '';
    setBotLoading(true);
    addLog('info', `Bot cmd: ${command.slice(0, 80)}`);
    try {
      const res = await fetch('/api/bot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Command sent!');
        addLog('ok', `Sent: ${command}`);
      } else {
        toast.error(data.error || 'Failed to send');
        addLog('err', data.error || 'Failed');
      }
    } catch (e: any) {
      toast.error('Network error');
      addLog('err', e.message);
    }
    setBotLoading(false);
    setTimeout(refreshMessages, 2000);
  };

  // ─── GLM Chat ───
  const sendGLM = async () => {
    const input = document.getElementById('glmInput') as HTMLInputElement;
    const msg = input?.value?.trim();
    if (!msg) return;
    if (input) input.value = '';
    setGlmMessages(prev => [...prev, { role: 'user', content: msg }]);
    setGlmLoading(true);
    addLog('info', `GLM: ${msg.slice(0, 60)}`);
    try {
      const res = await fetch('/api/glm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg }),
      });
      const data = await res.json();
      if (data.response) {
        setGlmMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        addLog('ok', 'GLM response received');
      } else {
        setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Unknown error'}` }]);
        addLog('err', `GLM error: ${data.error || ''}`);
      }
    } catch (e: any) {
      setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      addLog('err', e.message);
    }
    setGlmLoading(false);
  };

  // ─── Config Save ───
  const saveConfig = async (updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok !== false) {
        toast.success('Saved!');
        addLog('ok', 'Config updated');
        refreshConfig();
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // ─── Navigation ───
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bot', label: 'Bot Control', icon: Bot },
    { id: 'glm', label: 'GLM Engine', icon: Brain },
    { id: 'files', label: 'Files', icon: FolderOpen },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'loops', label: 'Loop Problems', icon: Code },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Activity Log', icon: Activity },
  ];

  const navigate = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
    if (section === 'files') refreshFiles();
    if (section === 'deploy') refreshDeployStatus();
  };

  // ─── Format helpers ───
  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const formatGLM = (text: string) => {
    let html = text
      .replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-[#111827] border-r border-slate-700/50 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-blue-400">🤖 Hermes</h2>
          <span className="text-[10px] bg-[#1a1f35] text-slate-500 px-2 py-0.5 rounded">v4.0 Expert</span>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all text-left ${
                activeSection === item.id
                  ? 'bg-blue-500/10 text-blue-400 border-l-3 border-l-blue-500'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-3 border-l-transparent'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0a0e1a]/85 backdrop-blur-md border-b border-slate-700/50 px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            <Command className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold flex-1">
            {navItems.find(n => n.id === activeSection)?.icon && (
              <span className="inline-flex items-center gap-2">
                {React.createElement(navItems.find(n => n.id === activeSection)!.icon, { className: 'h-5 w-5' })}
                {navItems.find(n => n.id === activeSection)?.label}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            Online
          </div>
        </header>

        <div className="p-5 max-w-7xl mx-auto">
          {/* ═══ OVERVIEW ═══ */}
          {activeSection === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  {
                    icon: <Bot className="h-5 w-5" />,
                    label: 'Bot Status',
                    value: config?.telegram_token_masked ? '✅ Ready' : '❌ No Token',
                    color: config?.telegram_token_masked ? 'text-emerald-400' : 'text-red-400',
                  },
                  {
                    icon: <Brain className="h-5 w-5" />,
                    label: 'GLM Engine',
                    value: config?.glm_api_key_masked ? '✅ Ready' : '❌ No Key',
                    color: config?.glm_api_key_masked ? 'text-emerald-400' : 'text-red-400',
                  },
                  {
                    icon: <FolderOpen className="h-5 w-5" />,
                    label: 'Files',
                    value: `${(files.downloads?.length || 0) + (files.generated?.length || 0)} files`,
                    color: 'text-blue-400',
                  },
                  {
                    icon: <Rocket className="h-5 w-5" />,
                    label: 'Deploy Ready',
                    value: deployStatus ? `${deployStatus.summary?.ok || 0}/${deployStatus.summary?.total || 9}` : '—',
                    color: 'text-blue-400',
                  },
                  {
                    icon: <Shield className="h-5 w-5" />,
                    label: 'Auto-Repair',
                    value: autoRepair !== 'false' ? `✅ ON (${maxRepair})` : '❌ OFF',
                    color: autoRepair !== 'false' ? 'text-emerald-400' : 'text-red-400',
                  },
                  {
                    icon: <Cpu className="h-5 w-5" />,
                    label: 'Expert Mode',
                    value: expertMode === 'true' ? '👑 ON' : '🌱 OFF',
                    color: expertMode === 'true' ? 'text-amber-400' : 'text-slate-400',
                  },
                ].map((stat, i) => (
                  <Card key={i} className="bg-[#111827] border-slate-700/50 hover:border-slate-600 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="text-2xl">{stat.icon}</div>
                      <div>
                        <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[11px] text-slate-500">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">⚡ Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {['/status', '/files', '/clear', '/progress'].map(cmd => (
                    <Button
                      key={cmd}
                      variant="outline"
                      size="sm"
                      className="bg-[#1a1f35] border-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs"
                      onClick={() => sendBotCommand(cmd)}
                    >
                      <Terminal className="h-3 w-3 mr-1" />
                      {cmd}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#1a1f35] border-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs"
                    onClick={() => navigate('deploy')}
                  >
                    <Rocket className="h-3 w-3 mr-1" />
                    🚀 Deploy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#1a1f35] border-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs"
                    onClick={() => navigate('glm')}
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    🧠 GLM Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">💬 Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    {botMessages.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No messages yet</p>
                    ) : (
                      <div className="space-y-0">
                        {botMessages.map((m, i) => (
                          <div key={i} className="flex gap-3 py-2.5 border-b border-slate-800 last:border-0">
                            <span className="text-blue-400 font-semibold text-xs min-w-[50px]">{typeof m.from === 'object' ? m.from?.name || m.from?.username || '?' : m.from}</span>
                            <span className="text-slate-300 text-xs flex-1 break-all">{m.text}</span>
                            <span className="text-slate-600 text-[10px] whitespace-nowrap">
                              {m.date?.split('T')[1]?.slice(0, 5) || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ BOT CONTROL ═══ */}
          {activeSection === 'bot' && (
            <div className="space-y-5">
              {/* Bot Power Card */}
              <Card className={`bg-[#111827] border-2 ${botActive ? 'border-emerald-500/50' : 'border-slate-700/50'}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${botActive ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                        {botActive ? '🟢' : '🔴'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Hermes Bot Agent</h3>
                        <p className="text-xs text-slate-500">
                          {botActive ? `Polling activ · ${pollCount} update(s) procesate` : 'Bot oprit · Click Start pentru activare'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!botActive ? (
                        <Button
                          onClick={startBot}
                          disabled={botSetupLoading || !config?.telegram_token_masked}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold px-6"
                        >
                          {botSetupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                          Start Bot
                        </Button>
                      ) : (
                        <Button
                          onClick={stopBot}
                          variant="destructive"
                          className="px-6"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Stop Bot
                        </Button>
                      )}
                    </div>
                  </div>
                  {botActive && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['/start', '/status', '/api', '/code', '/analyze', '/files', '/model', '/deploy', '/train_prompt', '/p1', '/p12'].map(cmd => (
                        <Button
                          key={cmd}
                          variant="outline"
                          size="sm"
                          className="bg-[#1a1f35] border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs"
                          onClick={() => sendBotCommand(cmd)}
                        >
                          <Terminal className="h-3 w-3 mr-1" />
                          {cmd}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">💬 Send Command to Bot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      id="botCmdInput"
                      placeholder="Type /command or any message..."
                      className="bg-[#0f172a] border-slate-600 text-slate-100 flex-1"
                      onKeyDown={e => { if (e.key === 'Enter') sendBotCommand(); }}
                    />
                    <Button
                      onClick={() => sendBotCommand()}
                      disabled={botLoading}
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      {botLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] text-slate-500 mr-1">Quick:</span>
                    {['/status', '/files', '/clear', '/progress', '/p1', '/p6', '/p12', '/analyze'].map(cmd => (
                      <Button
                        key={cmd}
                        variant="outline"
                        size="sm"
                        className="bg-[#1a1f35] border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs"
                        onClick={() => sendBotCommand(cmd)}
                      >
                        {cmd}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">📨 Bot Messages (Live)</CardTitle>
                  <Button variant="ghost" size="sm" onClick={refreshMessages} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {botMessages.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No messages yet</p>
                    ) : (
                      <div className="space-y-0">
                        {botMessages.map((m, i) => (
                          <div key={i} className="flex gap-3 py-2.5 border-b border-slate-800 last:border-0">
                            <span className="text-blue-400 font-semibold text-xs min-w-[50px]">{typeof m.from === 'object' ? m.from?.name || m.from?.username || '?' : m.from}</span>
                            <span className="text-slate-300 text-xs flex-1 break-all">{m.text}</span>
                            <span className="text-slate-600 text-[10px] whitespace-nowrap">
                              {m.date?.split('T')[1]?.slice(0, 5) || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ GLM ENGINE ═══ */}
          {activeSection === 'glm' && (
            <div className="space-y-5">
              {/* Model Selector & Agent Toggles */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🧠 Agent Settings</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Multi-model AI Agent · Selectează modelul și capabilitățile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-2 block">Model curent: <span className="text-blue-400">{glmModel}</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {[
                        { provider: 'Queen', models: ['queen-ultra', 'queen-max'] },
                        { provider: 'Nous Research', models: ['hermes-4-405B', 'hermes-4-70B'] },
                        { provider: 'OpenAI', models: ['gpt-5.4-pro', 'gpt-5.4', 'gpt-5.2'] },
                        { provider: 'Anthropic', models: ['claude-opus-4-6', 'claude-sonnet-4-6'] },
                        { provider: 'DeepSeek', models: ['DeepSeek-3.2'] },
                        { provider: 'Google', models: ['gemini-3.0-pro-preview', 'gemini-3-flash'] },
                        { provider: 'Kimi', models: ['kimi-k2.5'] },
                        { provider: 'MiniMax', models: ['minimax-m2.5'] },
                        { provider: 'Qwen', models: ['qwen3.6-plus', 'qwen3.5'] },
                        { provider: 'z-ai / GLM', models: ['glm-5-turbo', 'glm-4.6', 'glm-4-flash'] },
                      ].map(group => (
                        <React.Fragment key={group.provider}>
                          <div className="col-span-2 md:col-span-3 lg:col-span-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{group.provider}</div>
                          {group.models.map(m => (
                            <button
                              key={m}
                              onClick={() => { setGlmModel(m); saveConfig({ glm_model: m }); }}
                              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                glmModel === m
                                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                  : 'bg-[#0a0e1a] border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                              }`}
                            >
                              {m === 'queen-ultra' ? '👑 ' : m === 'queen-max' ? '👑 ' : ''}{m}
                            </button>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Agent Capability Toggles */}
                  <Separator className="bg-slate-800" />
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => { setAgentReasoning(!agentReasoning); addLog('info', `Reasoning: ${!agentReasoning ? 'ON' : 'OFF'}`); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${agentReasoning ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-[#0a0e1a] border-slate-700/50 text-slate-500'}`}
                    >
                      💡 Reasoning {agentReasoning ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => { setAgentMemory(!agentMemory); addLog('info', `Memory: ${!agentMemory ? 'ON' : 'OFF'}`); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${agentMemory ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-[#0a0e1a] border-slate-700/50 text-slate-500'}`}
                    >
                      🧠 Memory {agentMemory ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => { setAgentCots(!agentCots); addLog('info', `CoTs: ${!agentCots ? 'ON' : 'OFF'}`); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${agentCots ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-[#0a0e1a] border-slate-700/50 text-slate-500'}`}
                    >
                      🔗 CoTs in Context {agentCots ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* GLM Chat */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🧠 AI Chat · <span className="text-blue-400">{glmModel}</span></CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    {agentReasoning ? '💡 ' : ''}{agentMemory ? '🧠 ' : ''}{agentCots ? '🔗 ' : ''}
                    {agentReasoning && 'Reasoning '}{agentMemory && 'Memory '}{agentCots && 'CoTs '}
                    {!agentReasoning && !agentMemory && !agentCots && 'Standard mode'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <ScrollArea className="h-[420px]">
                  <div className="space-y-2 pr-3">
                    {glmMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-sm leading-relaxed break-words ${
                          m.role === 'user'
                            ? 'bg-[#1e3a5f] ml-10'
                            : m.role === 'assistant'
                            ? 'bg-blue-500/10 mr-10 border border-blue-500/10'
                            : 'text-center text-slate-500 text-xs py-1'
                        }`}
                        dangerouslySetInnerHTML={m.role !== 'system' ? { __html: formatGLM(m.content) } : undefined}
                      >
                        {m.role === 'system' ? m.content : undefined}
                      </div>
                    ))}
                    {glmLoading && (
                      <div className="text-center py-2">
                        <Loader2 className="h-4 w-4 text-blue-400 animate-spin inline" />
                        <span className="text-slate-500 text-xs ml-2">Thinking...</span>
                      </div>
                    )}
                    <div ref={glmEndRef} />
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-2">
                  <Input
                    id="glmInput"
                    placeholder="Ask anything..."
                    className="bg-[#0f172a] border-slate-600 text-slate-100 flex-1"
                    onKeyDown={e => { if (e.key === 'Enter') sendGLM(); }}
                    disabled={glmLoading}
                  />
                  <Button onClick={sendGLM} disabled={glmLoading} className="bg-blue-600 hover:bg-blue-500">
                    {glmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ FILES ═══ */}
          {activeSection === 'files' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">📥 Downloaded Files</CardTitle>
                  <Button variant="ghost" size="sm" onClick={refreshFiles} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {files.downloads?.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-6">No downloaded files</p>
                  ) : (
                    <ScrollArea className="h-60">
                      <div className="space-y-0">
                        {files.downloads?.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                            <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                            <span className="text-slate-200 text-xs flex-1 break-all">{f.name}</span>
                            <span className="text-slate-500 text-xs">{formatSize(f.size)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">💻 Generated Code</CardTitle>
                </CardHeader>
                <CardContent>
                  {files.generated?.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-6">No generated files</p>
                  ) : (
                    <ScrollArea className="h-60">
                      <div className="space-y-0">
                        {files.generated?.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                            <Code className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="text-slate-200 text-xs flex-1 break-all">{f.name}</span>
                            <span className="text-slate-500 text-xs">{formatSize(f.size)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ DEPLOY ═══ */}
          {activeSection === 'deploy' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🚀 Deployment Center</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Build & deploy workflows for GitHub, Expo, Docker, Render
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        icon: <GitBranch className="h-7 w-7" />,
                        name: 'GitHub Actions',
                        desc: 'Auto build & deploy on push to main',
                        status: config?.github_repo ? '✅ Configured' : '❌ No repo',
                        actions: [
                          { label: 'Trigger Deploy', onClick: () => {
                            if (config?.github_repo) {
                              const parts = config.github_repo.replace('https://github.com/', '').replace('.git', '').split('/');
                              if (parts.length === 2) {
                                window.open(`https://github.com/${parts[0]}/${parts[1]}/actions`, '_blank');
                                addLog('ok', 'Opened GitHub Actions');
                              }
                            } else toast.error('Set repo in Settings first');
                          }},
                        ],
                      },
                      {
                        icon: <Smartphone className="h-7 w-7" />,
                        name: 'Expo.dev',
                        desc: 'Build Android/iOS/Web via EAS',
                        status: '✅ Workflow ready',
                        actions: [
                          { label: 'Open Expo', onClick: () => window.open('https://expo.dev', '_blank') },
                        ],
                      },
                      {
                        icon: <Monitor className="h-7 w-7" />,
                        name: 'Docker (VPS)',
                        desc: 'Container deployment for 24/7',
                        status: '✅ Dockerfile ready',
                        actions: [
                          { label: 'Copy Commands', onClick: () => {
                            const cmds = `# Docker Deploy 24/7
git clone YOUR_REPO.git hermes && cd hermes
cp .env.example .env
docker compose up -d --build
docker compose logs -f`;
                            navigator.clipboard.writeText(cmds);
                            toast.success('Docker commands copied!');
                            addLog('ok', 'Docker cmds copied');
                          }},
                        ],
                      },
                      {
                        icon: <Globe className="h-7 w-7" />,
                        name: 'Render / Railway',
                        desc: 'One-click PaaS hosting (free tier)',
                        status: '✅ Procfile ready',
                        actions: [
                          { label: 'Render', onClick: () => window.open('https://render.com', '_blank') },
                          { label: 'Railway', onClick: () => window.open('https://railway.app', '_blank') },
                        ],
                      },
                    ].map((d, i) => (
                      <div key={i} className="bg-[#0a0e1a] border border-slate-700/50 rounded-xl p-5 text-center">
                        <div className="text-3xl mb-3">{d.icon}</div>
                        <h4 className="text-sm font-semibold mb-1">{d.name}</h4>
                        <p className="text-[11px] text-slate-500 mb-2">{d.desc}</p>
                        <Badge variant="secondary" className="text-[10px] mb-3 bg-emerald-500/10 text-emerald-400">
                          {d.status}
                        </Badge>
                        <div className="space-y-2">
                          {d.actions.map((a, j) => (
                            <Button
                              key={j}
                              size="sm"
                              className="w-full bg-[#1a1f35] border border-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs"
                              onClick={a.onClick}
                            >
                              {a.label}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-slate-800" />

                  <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-semibold text-slate-200">📋 Deploy Instructions</h3>
                    {[
                      {
                        title: 'Option A: Docker (VPS) - Recommended 24/7',
                        code: `git clone YOUR_REPO.git hermes && cd hermes
cp .env.example .env
# Set ADMIN_PASSWORD_HASH and API keys in .env
docker compose up -d --build`,
                      },
                      {
                        title: 'Option B: Render.com (Free tier)',
                        code: `1. Push to GitHub
2. render.com → New Web Service
3. Connect repo
4. Build: pip install -r requirements.txt
5. Start: gunicorn web.app:app
6. Set env vars from .env.example`,
                      },
                      {
                        title: 'Option C: GitHub Actions → VPS',
                        code: `1. Set secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY
2. Push to main → auto deploy via SSH
3. Or use workflow_dispatch for manual`,
                      },
                    ].map((block, i) => (
                      <div key={i} className="bg-[#0a0e1a] rounded-lg p-4">
                        <h4 className="text-xs text-blue-400 font-semibold mb-2">{block.title}</h4>
                        <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                          {block.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ LOOP PROBLEMS ═══ */}
          {activeSection === 'loops' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🔄 Loop Problems (P1-P12)</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Select a problem to view details, template, and hint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {loopProblems.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProblem(selectedProblem?.id === p.id ? null : p)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedProblem?.id === p.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700/50 bg-[#0a0e1a] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] ${
                              p.difficulty === 'beginner'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : p.difficulty === 'intermediate'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            P{p.id}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] bg-slate-700/50 text-slate-400">
                            {p.category}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate-200">{p.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{p.description}</p>
                      </button>
                    ))}
                  </div>

                  {selectedProblem && (
                    <div className="mt-5 bg-[#0a0e1a] rounded-lg p-5 space-y-4 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400">P{selectedProblem.id}</Badge>
                        <h3 className="text-lg font-bold">{selectedProblem.title}</h3>
                        <Badge
                          className={`${
                            selectedProblem.difficulty === 'beginner'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : selectedProblem.difficulty === 'intermediate'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {selectedProblem.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedProblem.description}</p>
                      <div>
                        <h4 className="text-xs text-blue-400 font-semibold mb-2">Template:</h4>
                        <pre className="bg-black/30 p-4 rounded-lg text-xs text-slate-300 font-mono overflow-x-auto">
                          {selectedProblem.template}
                        </pre>
                      </div>
                      {selectedProblem.hint && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                          <span className="text-amber-400 text-xs font-semibold">💡 Hint:</span>
                          <p className="text-xs text-slate-300 mt-1">{selectedProblem.hint}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-xs"
                        onClick={() => sendBotCommand(`/p${selectedProblem.id}`)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Send to Bot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeSection === 'settings' && (
            <div className="space-y-5">
              {/* API Keys */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🔑 API Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Telegram Bot Token</label>
                      <Input
                        type="password"
                        value={telegramToken}
                        onChange={e => setTelegramToken(e.target.value)}
                        placeholder="123456789:ABCdef..."
                        className="bg-[#0f172a] border-slate-600 text-slate-100"
                      />
                      {config?.telegram_token_masked && (
                        <p className="text-[10px] text-slate-600">Current: {config.telegram_token_masked}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">GLM API Key</label>
                      <Input
                        type="password"
                        value={glmKey}
                        onChange={e => setGlmKey(e.target.value)}
                        placeholder="Your GLM API key"
                        className="bg-[#0f172a] border-slate-600 text-slate-100"
                      />
                      {config?.glm_api_key_masked && (
                        <p className="text-[10px] text-slate-600">Current: {config.glm_api_key_masked}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-sm"
                    onClick={() => {
                      const updates: Record<string, string> = {};
                      if (telegramToken) updates.telegram_token = telegramToken;
                      if (glmKey) updates.glm_api_key = glmKey;
                      if (!telegramToken && !glmKey) { toast.info('No changes'); return; }
                      saveConfig(updates);
                      setTelegramToken('');
                      setGlmKey('');
                    }}
                  >
                    <Key className="h-3.5 w-3.5 mr-1.5" /> Save Keys
                  </Button>
                </CardContent>
              </Card>

              {/* GLM Settings */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🧠 GLM Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Model</label>
                      <select
                        value={glmModel}
                        onChange={e => setGlmModel(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                      >
                        {['glm-4.6', 'glm-4.5-air', 'glm-4-plus', 'glm-5.1', 'glm-5-turbo'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Endpoint</label>
                      <select
                        value={glmEndpoint}
                        onChange={e => setGlmEndpoint(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                      >
                        <option value="https://api.z.ai/api/coding/paas/v4/chat/completions">Coding API</option>
                        <option value="https://api.z.ai/api/paas/v4/chat/completions">General API</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-sm"
                    onClick={() => saveConfig({ glm_model: glmModel, glm_endpoint: glmEndpoint })}
                  >
                    <Brain className="h-3.5 w-3.5 mr-1.5" /> Save GLM Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Auto-Repair & Expert */}
              <div className="grid md:grid-cols-2 gap-5">
                <Card className="bg-[#111827] border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">🔧 Auto-Repair</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Status</label>
                      <select
                        value={autoRepair}
                        onChange={e => setAutoRepair(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                      >
                        <option value="true">✅ ON</option>
                        <option value="false">❌ OFF</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Max Iterations</label>
                      <Input
                        type="number"
                        value={maxRepair}
                        onChange={e => setMaxRepair(parseInt(e.target.value) || 3)}
                        min={1}
                        max={10}
                        className="bg-[#0f172a] border-slate-600 text-slate-100"
                      />
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-sm"
                      onClick={() => saveConfig({ auto_repair, max_repair_iterations: maxRepair })}
                    >
                      <Shield className="h-3.5 w-3.5 mr-1.5" /> Save Repair
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#111827] border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">👑 Expert Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">Mode</label>
                      <select
                        value={expertMode}
                        onChange={e => setExpertMode(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                      >
                        <option value="true">👑 Expert ON - Detailed prompts</option>
                        <option value="false">🌱 Normal</option>
                      </select>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-sm"
                      onClick={() => saveConfig({ expert_mode: expertMode })}
                    >
                      <Cpu className="h-3.5 w-3.5 mr-1.5" /> Save
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* GitHub Repo */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🐙 GitHub Repo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={githubRepo}
                      onChange={e => setGithubRepo(e.target.value)}
                      placeholder="https://github.com/user/repo.git"
                      className="bg-[#0f172a] border-slate-600 text-slate-100 flex-1"
                    />
                    <Button
                      className="bg-blue-600 hover:bg-blue-500"
                      onClick={() => {
                        if (!githubRepo.trim()) { toast.info('Empty repo'); return; }
                        saveConfig({ github_repo: githubRepo });
                      }}
                    >
                      <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {activeSection === 'logs' && (
            <Card className="bg-[#111827] border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📋 Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-0">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
                    ) : (
                      logs.map((log, i) => (
                        <div
                          key={i}
                          className="flex gap-3 py-1.5 border-b border-slate-800/50 last:border-0 font-mono text-xs"
                        >
                          <span className="text-slate-600 min-w-[65px]">{log.time}</span>
                          <span
                            className={`min-w-[40px] font-bold ${
                              log.type === 'info'
                                ? 'text-blue-400'
                                : log.type === 'ok'
                                ? 'text-emerald-400'
                                : log.type === 'err'
                                ? 'text-red-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {log.type.toUpperCase()}
                          </span>
                          <span className="text-slate-400 flex-1 break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
