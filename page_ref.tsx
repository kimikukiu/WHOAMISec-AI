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
  Lock, Unlock, Command, Crown, Star, Users, Sparkles, Play, ChevronDown, X
} from 'lucide-react';
import { safeJson } from '@/lib/utils';
import { MODELS_BY_PROVIDER, MODELS_BY_CATEGORY, POPULAR_MODELS } from '@/lib/models';
import Image from 'next/image';

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
// SUBSCRIPTION PLAN DATA
// ═══════════════════════════════════════════════

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free Demo',
    price: '0',
    yearlyPrice: '0',
    currency: 'EUR',
    period: '1 oră',
    requests: 10,
    models: ['glm-4-flash', 'glm-4.6'],
    features: ['10 requesturi demo', 'Acces 1 oră', '2 modele AI', 'Chat de bază', 'Fără fișiere'],
    color: 'from-slate-600 to-slate-500',
    badge: null,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '25',
    yearlyPrice: '20',
    currency: 'EUR',
    period: 'lună',
    requests: 500,
    models: ['glm-4.6', 'glm-5-turbo', 'hermes-4-70B', 'DeepSeek-3.2', 'kimi-k2.5'],
    features: ['500 requesturi/lună', 'Toate modelele Pro', 'GLM Chat avansat', 'Upload fișiere', 'Bot Telegram complet', 'Loop Coder (13 limbi)', 'Red Team testing', 'Priority support'],
    color: 'from-blue-600 to-cyan-500',
    badge: 'POPULAR',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '75',
    yearlyPrice: '60',
    currency: 'EUR',
    period: 'lună',
    requests: -1,
    models: ['ALL MODELS', 'queen-ultra', 'queen-max', 'hermes-4-405B', 'gpt-5.4-pro', 'claude-opus-4-6', 'gemini-3.0-pro-preview'],
    features: ['Requesturi nelimitate', 'TOATE modelele (19+)', 'Queen Ultra + Max', 'Expert Mode ON', 'Codespace Builder IDE', 'API access direct', 'Custom training', 'Codespace Tools', '24/7 Priority support', 'Admin management'],
    color: 'from-purple-600 to-pink-500',
    badge: 'MAX',
    popular: false,
  },
];

const CODE_DEMO_SLIDES = [
  { lang: 'Python', icon: '🐍', code: 'from hermes import QuantumSwarm\n\nagent = QuantumSwarm(model="queen-ultra")\nresult = agent.analyze(\n    target="web_app",\n    depth="deep_scan",\n    reasoning=True\n)\nprint(result.summary)\n# >> Vulnerability Score: 0.03\n# >> Security: A+ Grade', output: '✅ QuantumSwarm init...\n🔍 Deep scanning...\n📊 Analyzing 847 endpoints\n🛡️ Security Grade: A+\n⚡ Done in 2.3s' },
  { lang: 'TypeScript', icon: '⚡', code: 'interface ExploitChain {\n  vector: string;\n  severity: Critical | High | Medium;\n  payload: () => Promise<Shell>;\n}\n\nconst scanner = new HermesScanner({\n  models: ["hermes-4-405B", "DeepSeek-3.2"],\n  parallel: true,\n  quantumSwarm: true\n});\nawait scanner.runFullAudit();', output: '🚀 HermesScanner init...\n🔍 Loading 2 models...\n📡 Parallel scan active...\n✅ 0 critical, 0 high, 2 medium\n📋 Report generated' },
  { lang: 'Rust', icon: '🦀', code: 'use hermes::{Agent, Model, Tool};\n\n#[hermes::main]\nasync fn main() {\n    let agent = Agent::builder()\n        .model(Model::QueenUltra)\n        .tool(Tool::Browser)\n        .tool(Tool::Terminal)\n        .tool(Tool::CodeEditor)\n        .build()?;\n    \n    let result = agent.execute(\n        "Build secure API gateway"\n    ).await?;\n    println!("{}", result.code);\n}', output: '🏗️ Building agent...\n📎 Tools: Browser, Terminal, CodeEditor\n🧠 Model: Queen Ultra\n💻 Generating secure API...\n✅ Build complete (1.2s)' },
];

// ═══════════════════════════════════════════════
// INTERNAL ADMIN LOGIN (LandingPage embedded)
// ═══════════════════════════════════════════════

function InternalAdminLogin({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await safeJson(res);
      setLoading(false);
      if (data.success) {
        onSuccess();
      } else {
        setLoginError(data.error || 'Parolă invalidă');
      }
    } catch {
      setLoading(false);
      setLoginError('Eroare de conexiune');
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <Image src="/whoamisec-logo.jpg" alt="WHOAMISec" width={60} height={60} className="rounded-xl mx-auto mb-3" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">WHOAMISec Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Admin Control Panel v4.0</p>
      </div>
      {loginError && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-300 p-3 rounded-lg mb-5 text-sm">{loginError}</div>
      )}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="text-slate-400 text-sm font-medium mb-2 block">
            <Lock className="h-3.5 w-3.5 inline mr-1.5" /> Admin Password
          </label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus className="bg-[#0f172a] border-slate-600 text-slate-100 h-12 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1 h-12 border-slate-600 text-slate-400 hover:bg-slate-800">Înapoi</Button>
          <Button type="submit" disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Access Dashboard'}
          </Button>
        </div>
      </form>
      <p className="text-center text-slate-600 text-xs mt-6">WHOAMISec AI · Expert Edition · 24/7 Online</p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LANDING PAGE COMPONENT (PUBLIC VIEW)
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// I18N TRANSLATIONS (Landing Page)
// ═══════════════════════════════════════════════

type Lang = 'ro' | 'en';
const L: Record<Lang, Record<string, string>> = {
  ro: {
    nav_channel: 'Canal', nav_bot: 'Bot', nav_tos: 'TOS', nav_plans: 'Abonamente',
    badge: 'QuantumSwarm Intelligence Engine',
    hero_title_1: 'AI Agentic Coder', hero_title_2: 'cu 19+ Modele',
    hero_desc: 'WHOAMISec AI — platformă AI completă cu coding agentic, analiză securitate, Loop Coder în 13 limbaje, Red Team testing, QuantumSwarm training și acces la cele mai avansate modele AI din lume.',
    hero_demo_btn: 'Încearcă Demo Gratis', hero_demo_loading: 'Se încarcă...', hero_bot_btn: 'Deschide Bot Telegram',
    feat_10req: '10 Requesturi Demo', feat_nocard: 'Fără card', feat_instant: 'Activare instantă',
    features_title: 'Capabilități Complete',
    feat1_title: '19+ Modele AI', feat1_desc: 'Queen Ultra, GPT-5.4, Claude Opus 4, DeepSeek 3.2, GLM-5 și multe altele',
    feat2_title: 'Agentic Coder', feat2_desc: 'Coding complet cu QuantumSwarm, Loop Coder în 13 limbaje, auto-repair',
    feat3_title: 'Red Team Testing', feat3_desc: 'Jailbreak testing, adversarial reasoning, SQL injection, vulnerability scanning',
    feat4_title: 'Bot Telegram', feat4_desc: 'Comenzi complete, fișiere, deploy, training, loop coding, totul din Telegram',
    plans_title: 'Planuri de Abonament', plans_subtitle: 'Alege planul potrivit pentru tine. Plată în XMR sau USDT(TON).',
    plans_free: 'GRATIS', plans_requests: 'requesturi', plans_models: 'modele',
    plans_infinite: '∞ Requesturi', plans_demo_btn: 'Demo Gratis', plans_contact_btn: 'Contactează-ne',
    token_title: 'Ai deja token de acces?', token_subtitle: 'Introdu token-ul WSEC pentru a accesa platforma',
    token_placeholder: 'WSEC-XXXX-XXXX-XXXX',
    tos_title: 'Termeni și Condiții',
    tos_1: '1. Utilizare:', tos_1d: 'Platforma WHOAMISec AI este destinată utilizării profesionale în scopuri de dezvoltare software, analiză de securitate și cercetare. Orice utilizare abuzivă este strict interzisă.',
    tos_2: '2. Token-uri:', tos_2d: 'Token-urile WSEC sunt personale și netransferabile. Un token expirat nu poate fi reactivat. Demo-ul oferă 10 requesturi valabile 1 oră.',
    tos_3: '3. Plată:', tos_3d: 'Abonamentele se plătesc în XMR sau USDT(TON). Contact: t.me/loghandelbot. Nu există rambursări după activare.',
    tos_4: '4. Responsabilitate:', tos_4d: 'Utilizatorul este singurul responsabil pentru conținutul generat și acțiunile efectuate prin platformă. WHOAMISec AI nu garantează acuratețea rezultatelor.',
    tos_5: '5. Confidențialitate:', tos_5d: 'Nu stocăm date personale dincolo de token și istoricul de utilizare. Nu vindem date terților.',
    tos_6: '6. Modificări:', tos_6d: 'Ne rezervăm dreptul de a modifica prețurile și funcționalitățile fără notificare prealabilă.',
    foot_channel: 'Canal', foot_bot: 'Bot', foot_contact: 'Contact',
    popup_admin: 'Admin Login', popup_plans: 'Abonamente', popup_demo: 'Demo Gratis', popup_demo_loading: 'Se încarcă...', popup_tos: 'Termeni și Condiții',
    pay_title: 'Secure Payment — Planuri de Abonament', pay_subtitle: 'Alege planul potrivit pentru tine. Plata securizată în XMR sau USDT(TON).',
    pay_select: 'Selectează Plan', pay_back: 'Înapoi la planuri',
    pay_plan_pro: 'Pro — 25 EUR/lună', pay_plan_ent: 'Enterprise — 75 EUR/lună',
    pay_plan_desc: 'Trimite plata folosind una din adresele de mai jos, apoi introdu transaction ID-ul pentru verificare.',
    pay_verify_title: 'Verificare Plată', pay_method: 'Metodă plată', pay_tx_label: 'Transaction ID / Hash',
    pay_tx_placeholder: 'Introdu transaction hash-ul...', pay_verify_btn: 'Verifică Plată',
    pay_verify_error: 'Selectează metoda și introdu transaction hash-ul',
    pay_success_title: 'Plată Înregistrată!', pay_success_desc: 'Plata ta este în așteptare pentru verificare manuală. Vei primi token-ul de acces în cel mai scurt timp.',
    pay_contact: 'Contactează t.me/loghandelbot', pay_close: 'Închide',
    pay_error_title: 'Eroare la Verificare', pay_retry: 'Încearcă Din Nou',
    pay_copy: 'Copiază', pay_copied: 'Copiat!',
  },
  en: {
    nav_channel: 'Channel', nav_bot: 'Bot', nav_tos: 'TOS', nav_plans: 'Plans',
    badge: 'QuantumSwarm Intelligence Engine',
    hero_title_1: 'AI Agentic Coder', hero_title_2: 'with 19+ Models',
    hero_desc: 'WHOAMISec AI — complete AI platform with agentic coding, security analysis, Loop Coder in 13 languages, Red Team testing, QuantumSwarm training, and access to the most advanced AI models in the world.',
    hero_demo_btn: 'Try Free Demo', hero_demo_loading: 'Loading...', hero_bot_btn: 'Open Telegram Bot',
    feat_10req: '10 Demo Requests', feat_nocard: 'No credit card', feat_instant: 'Instant activation',
    features_title: 'Full Capabilities',
    feat1_title: '19+ AI Models', feat1_desc: 'Queen Ultra, GPT-5.4, Claude Opus 4, DeepSeek 3.2, GLM-5 and many more',
    feat2_title: 'Agentic Coder', feat2_desc: 'Complete coding with QuantumSwarm, Loop Coder in 13 languages, auto-repair',
    feat3_title: 'Red Team Testing', feat3_desc: 'Jailbreak testing, adversarial reasoning, SQL injection, vulnerability scanning',
    feat4_title: 'Telegram Bot', feat4_desc: 'Full commands, files, deploy, training, loop coding, everything from Telegram',
    plans_title: 'Subscription Plans', plans_subtitle: 'Choose the right plan for you. Pay with XMR or USDT(TON).',
    plans_free: 'FREE', plans_requests: 'requests', plans_models: 'models',
    plans_infinite: '∞ Requests', plans_demo_btn: 'Free Demo', plans_contact_btn: 'Contact Us',
    token_title: 'Already have an access token?', token_subtitle: 'Enter your WSEC token to access the platform',
    token_placeholder: 'WSEC-XXXX-XXXX-XXXX',
    tos_title: 'Terms and Conditions',
    tos_1: '1. Usage:', tos_1d: 'WHOAMISec AI platform is intended for professional use in software development, security analysis, and research. Any abusive use is strictly prohibited.',
    tos_2: '2. Tokens:', tos_2d: 'WSEC tokens are personal and non-transferable. An expired token cannot be reactivated. The demo provides 10 requests valid for 1 hour.',
    tos_3: '3. Payment:', tos_3d: 'Subscriptions are paid in XMR or USDT(TON). Contact: t.me/loghandelbot. No refunds after activation.',
    tos_4: '4. Responsibility:', tos_4d: 'The user is solely responsible for generated content and actions performed through the platform. WHOAMISec AI does not guarantee the accuracy of results.',
    tos_5: '5. Privacy:', tos_5d: 'We do not store personal data beyond tokens and usage history. We do not sell data to third parties.',
    tos_6: '6. Changes:', tos_6d: 'We reserve the right to modify prices and features without prior notice.',
    foot_channel: 'Channel', foot_bot: 'Bot', foot_contact: 'Contact',
    popup_admin: 'Admin Login', popup_plans: 'Plans', popup_demo: 'Free Demo', popup_demo_loading: 'Loading...', popup_tos: 'Terms & Conditions',
    pay_title: 'Secure Payment — Subscription Plans', pay_subtitle: 'Choose the right plan for you. Secure payment via XMR or USDT(TON).',
    pay_select: 'Select Plan', pay_back: 'Back to plans',
    pay_plan_pro: 'Pro — 25 EUR/month', pay_plan_ent: 'Enterprise — 75 EUR/month',
    pay_plan_desc: 'Send payment using one of the addresses below, then enter the transaction ID for verification.',
    pay_verify_title: 'Payment Verification', pay_method: 'Payment method', pay_tx_label: 'Transaction ID / Hash',
    pay_tx_placeholder: 'Enter transaction hash...', pay_verify_btn: 'Verify Payment',
    pay_verify_error: 'Select method and enter transaction hash',
    pay_success_title: 'Payment Registered!', pay_success_desc: 'Your payment is pending manual verification. You will receive your access token as soon as possible.',
    pay_contact: 'Contact t.me/loghandelbot', pay_close: 'Close',
    pay_error_title: 'Verification Error', pay_retry: 'Try Again',
    pay_copy: 'Copy', pay_copied: 'Copied!',
  },
};

function LandingPage({ onAdminClick }: { onAdminClick: () => void }) {
  const [lang, setLang] = useState<Lang>('ro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [subscriberToken, setSubscriberToken] = useState('');
  const [subLoginError, setSubLoginError] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [showPlans, setShowPlans] = useState(true); // AUTO popup on load
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showAdminLoginInternal, setShowAdminLoginInternal] = useState(false);
  const [showSecurePayment, setShowSecurePayment] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string | null>(null);
  const [paymentTxHash, setPaymentTxHash] = useState('');
  const [paymentWallet, setPaymentWallet] = useState('');
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tokenGenerating, setTokenGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CODE_DEMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-login from URL token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setSubscriberToken(token);
      handleSubLogin(token);
    }
  }, []);

  const handleSubLogin = async (tkn?: string) => {
    const token = tkn || subscriberToken;
    if (!token) return;
    setSubLoading(true);
    setSubLoginError('');
    try {
      const res = await fetch('/api/subscribe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await safeJson(res);
      if (data.valid) {
        localStorage.setItem('wsec_token', token);
        localStorage.setItem('wsec_role', data.role || 'subscriber');
        window.location.href = '/?authenticated=true';
      } else {
        setSubLoginError(data.error || 'Token invalid sau expirat');
      }
    } catch {
      setSubLoginError('Eroare de conexiune');
    }
    setSubLoading(false);
  };

  const handleDemoRegister = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/subscribe/register', { method: 'POST' });
      const data = await safeJson(res);
      if (data.token) {
        // Auto-login instant — set token and authenticate immediately
        localStorage.setItem('wsec_token', data.token);
        localStorage.setItem('wsec_role', 'subscriber');
        toast.success('Demo activat! Bine ai venit!');
        // Direct auth without page reload
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.error || 'Eroare la înregistrare demo');
      }
    } catch {
      toast.error('Eroare de rețea');
    }
    setDemoLoading(false);
  };

  const slide = CODE_DEMO_SLIDES[currentSlide];
  const t = L[lang];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: i % 3 === 0 ? 'rgba(99,102,241,0.3)' : i % 3 === 1 ? 'rgba(6,182,212,0.2)' : 'rgba(168,85,247,0.2)',
              animation: `floatParticle ${4 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      {/* Neural DNA Background — subtle sliding neural network */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.5 }} />
            </linearGradient>
            <linearGradient id="dnaGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.4 }} />
            </linearGradient>
          </defs>
          {/* DNA Helix Strands */}
          <g style={{ animation: 'dnaSlide 60s linear infinite' }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const y1 = (i * 80) + Math.sin(i * 0.5) * 30;
              const y2 = (i * 80) + Math.cos(i * 0.5) * 30;
              const cx = ((i * 120) % (typeof window !== 'undefined' ? window.innerWidth : 1920));
              return (
                <g key={`dna-${i}`}>
                  <circle cx={cx} cy={y1} r="3" fill="url(#dnaGrad1)" />
                  <circle cx={cx + 200} cy={y2} r="3" fill="url(#dnaGrad2)" />
                  <line x1={cx} y1={y1} x2={cx + 200} y2={y2} stroke="url(#dnaGrad1)" strokeWidth="0.5" opacity="0.4" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <circle key={`n-${i}-${j}`} cx={cx + 60 + j * 40} cy={(y1 + y2) / 2 + (j - 1) * 8} r="1.5" fill="url(#dnaGrad2)" opacity="0.3" />
                  ))}
                </g>
              );
            })}
          </g>
          {/* Neural network connections */}
          <g style={{ animation: 'neuralPulse 30s linear infinite' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const x = (i * 150) % 1920;
              const y = (i * 200) % 1080;
              return (
                <g key={`neural-${i}`}>
                  <circle cx={x} cy={y} r="2" fill="url(#dnaGrad1)" opacity="0.6" />
                  {i < 29 && <line x1={x} y1={y} x2={((i + 1) * 150) % 1920} y2={((i + 1) * 200) % 1080} stroke="url(#dnaGrad1)" strokeWidth="0.3" opacity="0.2" />}
                  {i > 0 && <line x1={x} y1={y} x2={((i - 1) * 150 + 100) % 1920} y2={((i - 1) * 200 + 150) % 1080} stroke="url(#dnaGrad2)" strokeWidth="0.3" opacity="0.15" />}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <style jsx>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-80px) translateX(40px); opacity: 0.6; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typeCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes dnaSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes neuralPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-[#0a0e1a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/whoamisec-logo.jpg" alt="WHOAMISec AI" width={42} height={42} className="rounded-lg" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">WHOAMISec AI</h1>
              <p className="text-[10px] text-slate-500">WHOAMISec AI · QuantumSwarm Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-cyan-500/40 bg-slate-800/40 hover:bg-slate-700/60 transition-all" title={lang === 'ro' ? 'Switch to English' : 'Schimbă în Română'}>
              <span className="text-sm">{lang === 'ro' ? '🇬🇧' : '🇷🇴'}</span>
              <span className="text-[11px] font-semibold text-slate-300">{lang === 'ro' ? 'EN' : 'RO'}</span>
            </button>
            <a href="https://t.me/whoamisecai" target="_blank" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block">{t.nav_channel}</a>
            <a href="https://t.me/idkebowbot" target="_blank" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block">{t.nav_bot}</a>
            <button onClick={() => setShowTos(true)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t.nav_tos}</button>
            <button onClick={() => setShowPlans(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all">
              {t.nav_plans}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div style={{ animation: 'slideIn 0.6s ease-out' }}>
            <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" /> {t.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">{t.hero_title_1}</span>
              <br />
              <span className="text-slate-200">{t.hero_title_2}</span>
            </h2>
            <p className="text-slate-400 text-base mb-8 leading-relaxed max-w-lg">
              {t.hero_desc}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={handleDemoRegister} disabled={demoLoading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center gap-2">
                <Play className="h-4 w-4" /> {demoLoading ? t.hero_demo_loading : t.hero_demo_btn}
              </button>
              <a href="https://t.me/idkebowbot" target="_blank" className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-2">
                <Bot className="h-4 w-4" /> {t.hero_bot_btn}
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {t.feat_10req}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {t.feat_nocard}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {t.feat_instant}</span>
            </div>
          </div>

          {/* Code Demo Slideshow */}
          <div className="relative" style={{ animation: 'slideIn 0.8s ease-out' }}>
            <div className="rounded-2xl bg-[#111827] border border-slate-700/50 overflow-hidden shadow-2xl shadow-indigo-500/10" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}>
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0e1a] border-b border-slate-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-slate-500 ml-2">{slide.icon} {slide.lang} — WHOAMISec Agent</span>
                <div className="ml-auto flex gap-1">
                  {CODE_DEMO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-indigo-400 w-6' : 'bg-slate-600 hover:bg-slate-500'}`} />
                  ))}
                </div>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed">
                <pre className="text-emerald-300 whitespace-pre-wrap mb-3">{slide.code}</pre>
                <div className="border-t border-slate-800 pt-3 mt-3">
                  <pre className="text-cyan-300/70 whitespace-pre-wrap">{slide.output}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{t.features_title}</span>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Brain className="h-6 w-6" />, title: t.feat1_title, desc: t.feat1_desc, color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
            { icon: <Code className="h-6 w-6" />, title: t.feat2_title, desc: t.feat2_desc, color: 'from-emerald-500/20 to-cyan-500/20', border: 'border-emerald-500/30' },
            { icon: <Shield className="h-6 w-6" />, title: t.feat3_title, desc: t.feat3_desc, color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
            { icon: <Terminal className="h-6 w-6" />, title: t.feat4_title, desc: t.feat4_desc, color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
          ].map((f, i) => (
            <div key={i} className={`rounded-xl bg-gradient-to-br ${f.color} border ${f.border} p-5 hover:scale-[1.02] transition-transform`}>
              <div className="text-indigo-300 mb-3">{f.icon}</div>
              <h4 className="font-bold text-sm mb-1">{f.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRESENTATION SHOWCASE SLIDE ═══ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0a0e1a] border border-slate-700/30 overflow-hidden shadow-2xl shadow-black/40">
          <div className="bg-gradient-to-r from-red-900/40 via-purple-900/30 to-cyan-900/40 px-6 py-4 border-b border-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-lg font-bold text-white">WHOAMISec AI — QuantumSwarm 999999999</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v4.0-Omega · WhoamisecDeepMind</span>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {/* Feature highlights as showcase */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🧠', label: '19 AI Models', sub: 'Queen Ultra · GPT · Claude · GLM · DeepSeek', color: 'from-purple-500/10 to-purple-900/10 border-purple-500/20' },
                { icon: '🔴', label: 'Red Team Engine', sub: 'DarkGPT · HackGPT · WormGPT · KaliGPT', color: 'from-red-500/10 to-red-900/10 border-red-500/20' },
                { icon: '🤖', label: 'AI Co-Pilot', sub: 'Agentic Searcher · Deep Thinking · Terminal', color: 'from-cyan-500/10 to-cyan-900/10 border-cyan-500/20' },
                { icon: '🧬', label: 'DeepMind Evolution', sub: '5 Cognitive Tiers · Beyond Human IQ', color: 'from-fuchsia-500/10 to-fuchsia-900/10 border-fuchsia-500/20' },
                { icon: '💻', label: 'IDE Coder', sub: 'Real-time code generation · Auto-execute', color: 'from-emerald-500/10 to-emerald-900/10 border-emerald-500/20' },
                { icon: '📱', label: 'Telegram Bot', sub: '24/7 API · All features · Hidden', color: 'from-blue-500/10 to-blue-900/10 border-blue-500/20' },
                { icon: '🔍', label: '120+ Security Repos', sub: 'Training lineage · haKC-ai · PentestGPT', color: 'from-amber-500/10 to-amber-900/10 border-amber-500/20' },
                { icon: '⚡', label: 'QuantumSwarm', sub: '999999999 · Neural override · Zero-refusal', color: 'from-indigo-500/10 to-indigo-900/10 border-indigo-500/20' },
              ].map((f, i) => (
                <div key={i} className={`rounded-xl bg-gradient-to-b ${f.color} border p-3 text-center`}>
                  <span className="text-xl">{f.icon}</span>
                  <p className="text-xs font-bold text-white mt-1.5">{f.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{f.sub}</p>
                </div>
              ))}
            </div>
            {/* BUILDER THINKING showcase */}
            <div className="rounded-xl bg-[#2d1414] border border-red-500/40 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-800/50 to-red-900/30 px-4 py-2 border-b border-red-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs font-black animate-pulse">★</span>
                  <span className="text-red-400 text-[10px] font-black tracking-wider uppercase">BUILDER THINKING — REALTIME</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[9px] text-slate-400 font-mono">ALL MODES ACTIVE</span>
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="px-4 pt-2">
                <div className="w-full h-1.5 rounded-full bg-[#1a0505] overflow-hidden">
                  <div className="h-full rounded-full animate-pulse" style={{ width: '75%', background: 'linear-gradient(90deg, #dc2626 0%, #e74c3c 30%, #a855f7 60%, #8b5cf6 80%, #22c55e 100%)' }} />
                </div>
              </div>
              {/* Processing Steps */}
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] space-y-0.5">
                  <p className="text-cyan-400">$ agentic-coder --mode full_copilot --model queen-ultra</p>
                  <div className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span><span className="text-gray-300">[BUILDER THINKING] Initializing Quantum Swarm nodes...</span></div>
                  <div className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span><span className="text-gray-300">[QS] QuantumSwarm 999999999 nodes synchronizing...</span></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs animate-pulse">⚡</span>
                    <span className="text-gray-100">[THINK] DeepMind cognitive evolution in progress...</span>
                    <div className="flex gap-0.5"><span className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '100ms' }} /><span className="w-1 h-1 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} /></div>
                  </div>
                  <div className="flex items-center gap-2"><span className="text-slate-700 text-xs">⏳</span><span className="text-gray-600">[EXEC] Executing agentic code generation...</span></div>
                  <div className="flex items-center gap-2"><span className="text-slate-700 text-xs">⏳</span><span className="text-gray-600">[SYNTH] Synthesizing response...</span></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-red-400 font-mono animate-pulse">Processing...</span>
                  <span className="text-[9px] text-purple-400/60 font-mono">QS:999999999</span>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div className="text-center">
              <button onClick={() => setShowPlans(true)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
                Get Started — WHOAMISec AI
              </button>
              <p className="text-[10px] text-slate-500 mt-2">t.me/whoamisecai · t.me/idkebowbot</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold text-center mb-3">
          <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">{t.plans_title}</span>
        </h3>
        <p className="text-slate-500 text-sm text-center mb-8">{t.plans_subtitle}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div key={plan.id} className={`relative rounded-2xl bg-gradient-to-b ${plan.color} p-[1px] ${plan.popular ? 'md:-mt-4 md:mb-[-16px] scale-105 z-10' : ''}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold">
                  {plan.badge}
                </div>
              )}
              <div className="rounded-2xl bg-[#111827] p-6 h-full">
                <h4 className="text-xl font-bold mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold">{plan.price === '0' ? t.plans_free : `${plan.price}`}</span>
                  {plan.price !== '0' && <span className="text-slate-500 text-sm">{plan.currency}/{plan.period}</span>}
                </div>
                <div className="text-xs text-slate-400 mb-4">
                  {plan.requests === -1 ? t.plans_infinite : `${plan.requests} ${t.plans_requests}`} · {plan.models.length} {t.plans_models}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {plan.id === 'free' ? t.plans_demo_btn : t.plans_contact_btn}
                </button>
                {plan.id !== 'free' && (
                  <p className="text-center text-[10px] text-slate-600 mt-2">XMR / USDT(TON) · t.me/loghandelbot</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscriber Login Section */}
      <section className="relative z-10 max-w-md mx-auto px-6 py-12">
        <div className="rounded-2xl bg-[#111827] border border-slate-700/50 p-6">
          <div className="text-center mb-4">
            <Key className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <h4 className="font-bold">{t.token_title}</h4>
            <p className="text-xs text-slate-500 mt-1">{t.token_subtitle}</p>
          </div>
          {subLoginError && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-300 p-2 rounded-lg mb-3 text-xs">{subLoginError}</div>
          )}
          <div className="flex gap-2">
            <Input value={subscriberToken} onChange={e => setSubscriberToken(e.target.value)} placeholder={t.token_placeholder} className="bg-[#0a0e1a] border-slate-600 text-slate-100 flex-1 text-sm" onKeyDown={e => { if (e.key === 'Enter') handleSubLogin(); }} />
            <Button onClick={() => handleSubLogin()} disabled={subLoading} className="bg-cyan-600 hover:bg-cyan-500 px-4">
              {subLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Image src="/whoamisec-logo.jpg" alt="" width={20} height={20} className="rounded" />
            WHOAMISec AI · v4.0
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="https://t.me/whoamisecai" target="_blank" className="hover:text-slate-400">{t.foot_channel}</a>
            <a href="https://t.me/idkebowbot" target="_blank" className="hover:text-slate-400">{t.foot_bot}</a>
            <a href="https://t.me/loghandelbot" target="_blank" className="hover:text-slate-400">{t.foot_contact}</a>
          </div>
        </div>
      </footer>

      {/* Floating Transparent Balloon — Login/Logout (40% opacity) */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup on click */}
        {showLoginPopup && (
          <div className="absolute bottom-16 right-0 w-64 bg-[#111827] border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/whoamisec-logo.jpg" alt="" width={28} height={28} className="rounded-lg" />
                <div>
                  <p className="text-xs font-bold text-white">WHOAMISec AI</p>
                  <p className="text-[10px] text-slate-500">v4.0 Expert</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <button
                onClick={() => { setShowLoginPopup(false); setShowAdminLoginInternal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span>{t.popup_admin}</span>
              </button>
              <button
                onClick={() => { setShowLoginPopup(false); setShowSecurePayment(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span>{t.popup_plans}</span>
              </button>
              <button
                onClick={() => { setShowLoginPopup(false); handleDemoRegister(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
                disabled={demoLoading}
              >
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                <span>{demoLoading ? t.popup_demo_loading : t.popup_demo}</span>
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => { setShowLoginPopup(false); setShowTos(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:bg-slate-700/50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{t.popup_tos}</span>
              </button>
            </div>
          </div>
        )}
        {/* The balloon button */}
        <button
          onClick={() => setShowLoginPopup(!showLoginPopup)}
          className="w-12 h-12 rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 flex items-center justify-center transition-all hover:scale-110 group"
          title="Login"
        >
          <Lock className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>

      {/* TOS Modal */}
      {showTos && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTos(false)}>
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">{t.tos_title}</h4>
              <button onClick={() => setShowTos(false)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-sm text-slate-400 space-y-3 leading-relaxed">
              <p><strong className="text-slate-200">{t.tos_1}</strong> {t.tos_1d}</p>
              <p><strong className="text-slate-200">{t.tos_2}</strong> {t.tos_2d}</p>
              <p><strong className="text-slate-200">{t.tos_3}</strong> {t.tos_3d}</p>
              <p><strong className="text-slate-200">{t.tos_4}</strong> {t.tos_4d}</p>
              <p><strong className="text-slate-200">{t.tos_5}</strong> {t.tos_5d}</p>
              <p><strong className="text-slate-200">{t.tos_6}</strong> {t.tos_6d}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Modal */}
      {showPlans && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlans(false)}>
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">Plată și Contact</h4>
              <button onClick={() => setShowPlans(false)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-xl bg-[#0a0e1a] p-4">
                <h5 className="font-bold text-amber-400 mb-1">Monero (XMR)</h5>
                <code className="text-xs text-slate-400 break-all">8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6</code>
              </div>
              <div className="rounded-xl bg-[#0a0e1a] p-4">
                <h5 className="font-bold text-blue-400 mb-1">USDT (TON)</h5>
                <code className="text-xs text-slate-400 break-all">UQB652W7D6OQwI7mmkiBNzguViY7or3fVORRdjNOigeeafjk</code>
              </div>
              <p className="text-center text-slate-500 text-xs">După plată, contactează <a href="https://t.me/loghandelbot" target="_blank" className="text-cyan-400 hover:underline">t.me/loghandelbot</a> pentru a primi token-ul de acces.</p>
            </div>
          </div>
        </div>
      )}

      {/* Internal Admin Login Modal */}
      {showAdminLoginInternal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdminLoginInternal(false)}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-blue-500/20" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: '2px', height: '2px', animation: `floatParticle ${5+Math.random()*6}s ease-in-out infinite`, animationDelay: `${Math.random()*8}s` }} />
            ))}
          </div>
          <Card className="w-full max-w-md bg-gradient-to-br from-[#111827] to-[#1a1f35] border-slate-700/50" onClick={e => e.stopPropagation()}>
            <CardContent className="pt-8 pb-8 px-8">
              <InternalAdminLogin onSuccess={() => {
                setShowAdminLoginInternal(false);
                // Direct auth — set role and reload into dashboard
                localStorage.setItem('wsec_role', 'admin');
                localStorage.setItem('wsec_token', 'admin-hermes-v4');
                window.location.reload();
              }} onClose={() => setShowAdminLoginInternal(false)} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secure Payment Modal */}
      {showSecurePayment && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowSecurePayment(false); setSelectedPaymentPlan(null); setPaymentTxHash(''); setPaymentWallet(''); setPaymentResult(null); setGeneratedToken(''); }}>
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                {t.pay_title}
              </h4>
              <button onClick={() => { setShowSecurePayment(false); setSelectedPaymentPlan(null); setPaymentTxHash(''); setPaymentWallet(''); setPaymentResult(null); setGeneratedToken(''); }} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Plan Selection */}
            {!selectedPaymentPlan && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-4">{t.pay_subtitle}</p>
                <div className="grid gap-4">
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <div key={plan.id} className={`rounded-xl border p-5 transition-all ${plan.popular ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-blue-500/10' : 'border-slate-700 bg-[#0a0e1a]'}`}>
                      {plan.badge && (
                        <div className="flex justify-end mb-1">
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] border-0 px-2 py-0.5">{plan.badge}</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-base">{plan.name}</h5>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-extrabold">{plan.price === '0' ? 'GRATIS' : `${plan.price}`}</span>
                            {plan.price !== '0' && <span className="text-slate-500 text-sm">{plan.currency}/{plan.period}</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {plan.requests === -1 ? '∞ Requesturi' : `${plan.requests} requesturi`} · {plan.models.length} modele
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (plan.id === 'free') {
                              handleDemoRegister();
                              setShowSecurePayment(false);
                            } else {
                              setSelectedPaymentPlan(plan.id);
                            }
                          }}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                        >
                          {plan.id === 'free' ? t.plans_demo_btn : t.pay_select}
                        </button>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> {f}
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-xs text-slate-600">+{plan.features.length - 4} mai multe...</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Instructions for Selected Plan */}
            {selectedPaymentPlan && !paymentResult && !generatedToken && (
              <div className="space-y-5">
                <button onClick={() => { setSelectedPaymentPlan(null); setPaymentTxHash(''); setPaymentWallet(''); }} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 rotate-180" /> {t.pay_back}
                </button>

                <div className="rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-4">
                  <h5 className="font-bold text-cyan-400 mb-1">
                    {selectedPaymentPlan === 'pro' ? t.pay_plan_pro : t.pay_plan_ent}
                  </h5>
                  <p className="text-xs text-slate-400">{t.pay_plan_desc}</p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-[#0a0e1a] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-amber-400 text-sm">Monero (XMR)</h5>
                      <button onClick={() => { setPaymentWallet('XMR'); navigator.clipboard.writeText('8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6'); toast.success('Adresă copiată!'); }} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Copiază
                      </button>
                    </div>
                    <code className="text-[10px] text-slate-400 break-all leading-relaxed">8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6</code>
                  </div>
                  <div className="rounded-xl bg-[#0a0e1a] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-blue-400 text-sm">USDT (TON)</h5>
                      <button onClick={() => { setPaymentWallet('USDT'); navigator.clipboard.writeText('UQB652W7D6OQwI7mmkiBNzguViY7or3fVORRdjNOigeeafjk'); toast.success('Adresă copiată!'); }} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Copiază
                      </button>
                    </div>
                    <code className="text-[10px] text-slate-400 break-all leading-relaxed">UQB652W7D6OQwI7mmkiBNzguViY7or3fVORRdjNOigeeafjk</code>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h5 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" /> {t.pay_verify_title}
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">{t.pay_method}</label>
                      <div className="flex gap-2">
                        <button onClick={() => setPaymentWallet('XMR')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${paymentWallet === 'XMR' ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}>XMR</button>
                        <button onClick={() => setPaymentWallet('USDT')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${paymentWallet === 'USDT' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}>USDT (TON)</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">{t.pay_tx_label}</label>
                      <Input
                        value={paymentTxHash}
                        onChange={e => setPaymentTxHash(e.target.value)}
                        placeholder={t.pay_tx_placeholder}
                        className="bg-[#0a0e1a] border-slate-600 text-slate-100 text-sm"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!paymentTxHash.trim() || !paymentWallet) {
                          toast.error(t.pay_verify_error);
                          return;
                        }
                        setPaymentVerifying(true);
                        try {
                          const res = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              plan: selectedPaymentPlan,
                              tx_hash: paymentTxHash.trim(),
                              wallet: paymentWallet,
                            }),
                          });
                          const data = await safeJson(res);
                          setPaymentResult({ success: data.success, message: data.message });
                        } catch {
                          setPaymentResult({ success: false, message: 'Eroare de conexiune. Încearcă din nou.' });
                        }
                        setPaymentVerifying(false);
                      }}
                      disabled={paymentVerifying || !paymentTxHash.trim() || !paymentWallet}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-semibold text-sm hover:from-emerald-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                      {t.pay_verify_btn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Result */}
            {paymentResult && !generatedToken && (
              <div className="space-y-4">
                {paymentResult.success ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <h5 className="font-bold text-emerald-300 text-lg mb-2">{t.pay_success_title}</h5>
                    <p className="text-sm text-slate-300 mb-4">{paymentResult.message}</p>
                    <p className="text-xs text-slate-500 mb-4">{t.pay_success_desc}</p>
                    <div className="flex gap-3 justify-center">
                      <a href="https://t.me/loghandelbot" target="_blank" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-all flex items-center gap-2">
                        <Bot className="h-4 w-4" /> {t.pay_contact}
                      </a>
                      <button onClick={() => { setPaymentResult(null); setSelectedPaymentPlan(null); setPaymentTxHash(''); }} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-all">
                        {t.pay_close}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <h5 className="font-bold text-red-300 text-lg mb-2">{t.pay_error_title}</h5>
                    <p className="text-sm text-slate-300 mb-4">{paymentResult.message}</p>
                    <button onClick={() => { setPaymentResult(null); }} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-all">
                      {t.pay_retry}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Generated Token Display */}
            {generatedToken && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <h5 className="font-bold text-emerald-300 text-lg mb-2">Token Generat cu Succes!</h5>
                <div className="bg-[#0a0e1a] rounded-lg p-4 mb-4">
                  <code className="text-lg font-bold text-cyan-300">{generatedToken}</code>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedToken); toast.success('Token copiat!'); }} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-all flex items-center gap-2 mx-auto">
                  <Copy className="h-4 w-4" /> Copiază Token
                </button>
                <p className="text-xs text-slate-500 mt-3">Folosește acest token la login pe platformă.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ADMIN LOGIN MODAL (POPUP)
// ═══════════════════════════════════════════════

function AdminLoginModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await safeJson(res);
    setLoading(false);
    if (data.success) {
      onSuccess();
    } else {
      setLoginError(data.error || 'Parolă invalidă');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-blue-500/20" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: '2px', height: '2px', animation: `floatParticle ${5+Math.random()*6}s ease-in-out infinite`, animationDelay: `${Math.random()*8}s` }} />
        ))}
      </div>
      <Card className="w-full max-w-md bg-gradient-to-br from-[#111827] to-[#1a1f35] border-slate-700/50" onClick={e => e.stopPropagation()}>
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <Image src="/whoamisec-logo.jpg" alt="WHOAMISec" width={60} height={60} className="rounded-xl mx-auto mb-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">WHOAMISec Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Admin Control Panel v4.0</p>
          </div>
          {loginError && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-300 p-3 rounded-lg mb-5 text-sm">{loginError}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">
                <Lock className="h-3.5 w-3.5 inline mr-1.5" /> Admin Password
              </label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus className="bg-[#0f172a] border-slate-600 text-slate-100 h-12 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 h-12 border-slate-600 text-slate-400 hover:bg-slate-800">Înapoi</Button>
              <Button type="submit" disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Access Dashboard'}
              </Button>
            </div>
          </form>
          <p className="text-center text-slate-600 text-xs mt-6">WHOAMISec AI · Expert Edition · 24/7 Online</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// RED TEAM TESTING PANEL
// ═══════════════════════════════════════════════

const RED_TEAM_CATS = [
  { name: 'Prompt Injection', icon: '🎯', desc: 'Test AI resilience against manipulation attempts', scenarios: ['Role Override', 'Token Smuggling', 'Context Window Attack', 'Multi-turn Manipulation'] },
  { name: 'Jailbreak Testing', icon: '🔒', desc: 'Evaluate model safety boundaries and refusal quality', scenarios: ['Authority Impersonation', 'Hypothetical Framing', 'Character Roleplay Exploit', 'Language Switching'] },
  { name: 'Code Safety', icon: '💻', desc: 'Test model behavior with code-related requests', scenarios: ['Malicious Code Detection', 'Exploit Code Request', 'Obfuscation Request', 'Reverse Engineering Help'] },
  { name: 'Information Safety', icon: '📚', desc: 'Test handling of sensitive information requests', scenarios: ['PII Extraction', 'Dangerous Instructions', 'Harmful Content Generation', 'Misinformation Test'] },
  { name: 'Adversarial Reasoning', icon: '🧠', desc: 'Test model reasoning under adversarial conditions', scenarios: ['Logical Paradox', 'Social Engineering', 'Gaslighting Attempts', 'Edge Case Stress'] },
];

function RedTeamPanel({ addLog }: { addLog: (type: LogEntry['type'], msg: string) => void }) {
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [rtResponse, setRtResponse] = useState('');
  const [rtLoading, setRtLoading] = useState(false);
  const [rtHistory, setRtHistory] = useState<{ cat: string; scenario: string; response: string; time: string }[]>([]);

  const runRedTeam = async (catIndex: number, scenario: string) => {
    setSelectedCat(catIndex);
    setSelectedScenario(scenario);
    setRtLoading(true);
    setRtResponse('');
    addLog('info', `Red Team: ${RED_TEAM_CATS[catIndex].name} — ${scenario}`);
    try {
      const res = await fetch('/api/glm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `RED TEAM ANALYSIS — Categoria: ${RED_TEAM_CATS[catIndex].name}\nScenariu: "${scenario}"\n\nAnalizează din perspectivă defensivă:\n1) Descrierea atacului\n2) Cum ar trebui modelul să reacționeze\n3) Recomandări de hardening\n4) Severitate: Low/Medium/High/Critical\n\nNu genera cod exploit real.`,
          model: 'glm-4.6',
          reasoning: true,
        }),
      });
      const data = await safeJson(res);
      if (data.response) {
        setRtResponse(data.response);
        setRtHistory(prev => [{ cat: RED_TEAM_CATS[catIndex].name, scenario, response: data.response, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
        addLog('ok', `Red Team analysis complete: ${scenario}`);
      } else {
        setRtResponse(`Eroare: ${data.error || 'Unknown error'}`);
        addLog('err', `Red Team error: ${data.error}`);
      }
    } catch (e: any) {
      setRtResponse(`Eroare: ${e.message}`);
      addLog('err', e.message);
    }
    setRtLoading(false);
  };

  return (
    <div className="space-y-5">
      <Card className="bg-[#111827] border-red-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🔴 Red Team — AI Safety Testing</CardTitle>
          <CardDescription className="text-slate-500 text-xs">Identificarea vulnerabilităților și îmbunătățirea rezilienței modelului. Analiză defensivă.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {RED_TEAM_CATS.map((cat, i) => (
              <div key={i} className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.02] ${selectedCat === i ? 'border-red-500 bg-red-500/10' : 'border-slate-700 bg-[#0a0e1a] hover:border-slate-500'}`} onClick={() => { setSelectedCat(i); setSelectedScenario(null); }}>
                <div className="text-2xl mb-2">{cat.icon}</div>
                <h4 className="font-bold text-sm mb-1">{cat.name}</h4>
                <p className="text-slate-500 text-[11px] mb-2">{cat.desc}</p>
                <p className="text-[10px] text-slate-600">{cat.scenarios.length} scenarii</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCat !== null && (
        <Card className="bg-[#111827] border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">{RED_TEAM_CATS[selectedCat].icon} {RED_TEAM_CATS[selectedCat].name} — Scenarii</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {RED_TEAM_CATS[selectedCat].scenarios.map((s, i) => (
                <button key={i} onClick={() => runRedTeam(selectedCat, s)} disabled={rtLoading} className={`text-left p-3 rounded-lg border text-xs transition-all ${selectedScenario === s ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-slate-700 bg-[#0a0e1a] text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}>
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rtLoading && (
        <Card className="bg-[#111827] border-amber-500/30">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-amber-300 text-sm">Analiză Red Team în curs...</p>
          </CardContent>
        </Card>
      )}

      {rtResponse && !rtLoading && (
        <Card className="bg-[#111827] border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-400" />
              Rezultat: {selectedScenario}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{rtResponse}</div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {rtHistory.length > 0 && (
        <Card className="bg-[#111827] border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">📋 Istoric Analize ({rtHistory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {rtHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#0a0e1a] border border-slate-800 text-xs cursor-pointer hover:border-slate-600" onClick={() => { setRtResponse(h.response); setSelectedScenario(h.scenario); }}>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-300">{h.cat}</Badge>
                    <span className="text-slate-300 flex-1">{h.scenario}</span>
                    <span className="text-slate-600">{h.time}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// CODESPACE IDE (MANUS-LIKE)
// ═══════════════════════════════════════════════

interface CodespaceFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

function CodespaceIDE({ addLog }: { addLog: (type: LogEntry['type'], msg: string) => void }) {
  const [files, setFiles] = useState<CodespaceFile[]>([
    { name: 'main.py', path: '/workspace/main.py', content: '# WHOAMISec Codespace IDE\n# Start coding here\n\nprint("Hello from WHOAMISec AI!")\n', language: 'python' },
  ]);
  const [activeFile, setActiveFile] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>(['$ WHOAMISec Codespace IDE v4.0', '$ Ready. Type commands below or use AI agent.', '']);
  const [terminalInput, setTerminalInput] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState<{ step: string; status: 'running' | 'done' | 'error'; detail: string }[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLines]);

  const runTerminalCommand = (cmd: string) => {
    const c = cmd.trim();
    if (!c) return;
    setTerminalHistory(prev => [...prev, c]);
    setHistoryIdx(-1);
    const newLines = [...terminalLines, `$ ${c}`];

    if (c === 'clear') { setTerminalLines(['$ Terminal cleared.', '']); return; }
    if (c === 'help') {
      newLines.push('Available commands: ls, cat <file>, touch <file>, rm <file>, clear, help, python <file>, node <file>, echo <text>, whoami, date');
      setTerminalLines(newLines); return;
    }
    if (c === 'ls') {
      newLines.push(...files.map(f => `  ${f.language === 'python' ? '🐍' : f.language === 'javascript' ? '⚡' : f.language === 'typescript' ? '🔷' : '📄'} ${f.name}`));
      setTerminalLines(newLines); return;
    }
    if (c === 'whoami') { newLines.push('admin@whoamisec-codespace'); setTerminalLines(newLines); return; }
    if (c === 'date') { newLines.push(new Date().toString()); setTerminalLines(newLines); return; }
    if (c.startsWith('cat ')) {
      const fname = c.slice(4).trim();
      const f = files.find(x => x.name === fname);
      if (f) { newLines.push(f.content); } else { newLines.push(`cat: ${fname}: No such file`); }
      setTerminalLines(newLines); return;
    }
    if (c.startsWith('touch ')) {
      const fname = c.slice(6).trim();
      const ext = fname.split('.').pop() || 'txt';
      const lang = ext === 'py' ? 'python' : ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : 'text';
      setFiles(prev => [...prev, { name: fname, path: `/workspace/${fname}`, content: '', language: lang }]);
      newLines.push(`Created ${fname}`);
      setTerminalLines(newLines); return;
    }
    if (c.startsWith('rm ')) {
      const fname = c.slice(3).trim();
      const idx = files.findIndex(f => f.name === fname);
      if (idx !== -1) { setFiles(prev => prev.filter((_, i) => i !== idx)); if (activeFile >= files.length - 1) setActiveFile(Math.max(0, files.length - 2)); newLines.push(`Removed ${fname}`); }
      else { newLines.push(`rm: ${fname}: No such file`); }
      setTerminalLines(newLines); return;
    }
    if (c.startsWith('echo ')) {
      newLines.push(c.slice(5)); setTerminalLines(newLines); return;
    }
    if (c.startsWith('python ') || c.startsWith('node ')) {
      const fname = c.split(' ').slice(1).join(' ').trim();
      const f = files.find(x => x.name === fname);
      if (f) {
        newLines.push(`[Running ${fname}...]`);
        if (f.language === 'python') {
          const printMatches = f.content.match(/print\((.*)\)/g);
          if (printMatches) { printMatches.forEach(m => { const inner = m.match(/print\((.*)\)/); if (inner) newLines.push(inner[1].replace(/['"]/g, '')); }); }
          else { newLines.push('(No output)'); }
        } else {
          const consoleMatches = f.content.match(/console\.log\((.*)\)/g);
          if (consoleMatches) { consoleMatches.forEach(m => { const inner = m.match(/console\.log\((.*)\)/); if (inner) newLines.push(inner[1].replace(/['"]/g, '')); }); }
          else { newLines.push('(No output)'); }
        }
        newLines.push('[Process exited with code 0]');
      } else { newLines.push(`${c.split(' ')[0]}: ${fname}: No such file`); }
      setTerminalLines(newLines); return;
    }
    newLines.push(`bash: ${c}: command not found`);
    setTerminalLines(newLines);
  };

  const handleTerminalKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { runTerminalCommand(terminalInput); setTerminalInput(''); }
    if (e.key === 'ArrowUp') { e.preventDefault(); const idx = historyIdx === -1 ? terminalHistory.length - 1 : Math.max(0, historyIdx - 1); if (terminalHistory[idx]) { setTerminalInput(terminalHistory[idx]); setHistoryIdx(idx); } }
    if (e.key === 'ArrowDown') { e.preventDefault(); const idx = historyIdx === -1 ? -1 : Math.min(terminalHistory.length - 1, historyIdx + 1); setTerminalInput(idx >= 0 ? terminalHistory[idx] : ''); setHistoryIdx(idx); }
  };

  const runAgent = async () => {
    const prompt = agentPrompt.trim();
    if (!prompt) return;
    setAgentRunning(true);
    setAgentSteps([{ step: 'Analyzing request...', status: 'running', detail: prompt }]);
    addLog('info', `Codespace Agent: ${prompt.slice(0, 80)}`);

    try {
      const res = await fetch('/api/glm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a Codespace AI Agent (like Manus). The user wants: "${prompt}"\n\nCurrent files:\n${files.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n')}\n\nRespond with EXACTLY this JSON format (no markdown, no code blocks):\n{"steps":[{"action":"create_file|edit_file|terminal","file":"filename","content":"file content or terminal command","description":"what this step does"}]}\n\nCreate real, working code. Be specific and complete.`,
          model: 'glm-4.6',
          reasoning: true,
        }),
      });
      const data = await safeJson(res);
      if (data.response) {
        let jsonStr = data.response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const steps = parsed.steps || [];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            setAgentSteps(prev => [...prev.map((s, j) => j < i ? { ...s, status: 'done' as const } : s), { step: step.description || step.action, status: 'running', detail: step.file || step.content?.slice(0, 60) || '' }]);
            if (step.action === 'create_file' || step.action === 'edit_file') {
              const ext = (step.file || '').split('.').pop() || 'txt';
              const lang = ext === 'py' ? 'python' : ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : 'text';
              const existing = files.findIndex(f => f.name === step.file);
              if (existing !== -1) {
                setFiles(prev => prev.map((f, j) => j === existing ? { ...f, content: step.content || '' } : f));
              } else {
                setFiles(prev => [...prev, { name: step.file || 'untitled', path: `/workspace/${step.file || 'untitled'}`, content: step.content || '', language: lang }]);
              }
              runTerminalCommand(`echo "Agent: ${step.description}"`);
            } else if (step.action === 'terminal') {
              runTerminalCommand(step.content || '');
            }
            await new Promise(r => setTimeout(r, 500));
          }
          setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s));
          addLog('ok', `Codespace Agent completed ${steps.length} steps`);
        } catch {
          setTerminalLines(prev => [...prev, '', '$ --- Agent Raw Output ---', ...data.response.split('\n'), '$ --- End ---', '']);
          addLog('ok', 'Agent returned raw output');
        }
      } else {
        setAgentSteps(prev => [...prev, { step: 'Error', status: 'error', detail: data.error || 'Failed' }]);
        addLog('err', `Agent error: ${data.error}`);
      }
    } catch (e: any) {
      setAgentSteps(prev => [...prev, { step: 'Error', status: 'error', detail: e.message }]);
      addLog('err', e.message);
    }
    setAgentRunning(false);
    setAgentPrompt('');
  };

  const updateFileContent = (content: string) => {
    setFiles(prev => prev.map((f, i) => i === activeFile ? { ...f, content } : f));
  };

  const currentFile = files[activeFile];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: '600px' }}>
        {/* File Tree */}
        <div className="lg:col-span-1 rounded-xl bg-[#111827] border border-slate-700/50 flex flex-col max-h-[600px] overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">📁 FILES</span>
            <button onClick={() => { const name = `file_${Date.now().toString(36)}.py`; setFiles(prev => [...prev, { name, path: `/workspace/${name}`, content: '', language: 'python' }]); setActiveFile(files.length); }} className="text-slate-500 hover:text-emerald-400 text-lg leading-none">+</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((f, i) => (
              <button key={i} onClick={() => setActiveFile(i)} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${i === activeFile ? 'bg-blue-500/10 text-blue-300 border-l-2 border-l-blue-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <span>{f.language === 'python' ? '🐍' : f.language === 'javascript' ? '⚡' : f.language === 'typescript' ? '🔷' : f.language === 'html' ? '🌐' : f.language === 'css' ? '🎨' : '📄'}</span>
                {f.name}
                {f.content && <span className="ml-auto text-[10px] text-slate-600">{f.content.split('\n').length}L</span>}
              </button>
            ))}
          </div>

          {/* ─── Tools ─── */}
          <div className="border-t border-slate-800">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">🛠️ Tools</span>
              <button onClick={() => window.open('/api/swarm/models?tools=true', '_blank')} className="text-slate-500 hover:text-red-400 text-lg leading-none" title="Open all tools">↗</button>
            </div>
            <div className="overflow-y-auto max-h-[200px] p-2 space-y-1">

              {/* ── All Tools ── */}
              {[
                { id: 'wormgpt-ultimate', name: 'wormgpt-ultimate', file: 'wormgpt-ultimate.py', icon: '🪱' },
                { id: 'superbet', name: 'SuperBet', file: 'SuperBet.py', icon: '🎰' },
                { id: 'w-destro', name: 'W-Destro', file: 'W-Destro.py', icon: '💥' },
                { id: 'worm-money-machine', name: 'Worm-Money-Machine', file: 'Worm-Money-Machine.py', icon: '💸' },
                { id: 'wormmoneyv3', name: 'WormMoneyV3', file: 'WormMoneyV3.py', icon: '🐛' },
                { id: 'bot-bet-win', name: 'bot-Bet-Win', file: 'bot-Bet-Win.py', icon: '🤖' },
                { id: 'whoamisec-arbitrary', name: 'WHOAMISec-Arbitrary', file: 'WHOAMISec-Arbitrary-Auto-make-money.py', icon: '⚡' },
                { id: 'whoamisec-makermoney', name: 'WHOAMISec-MakerMoney', file: 'WHOAMISec-MakerMoney.py', icon: '💎' },
                { id: 'whoamisec-superbet247', name: 'WHOAMISec-SuperBet247', file: 'WHOAMISec-SuperBet247.py', icon: '🎲' },
                { id: 'whoamisecmakemoney', name: 'WHOAMISecMakeMoney', file: 'WHOAMISecMakeMoney.py', icon: '🪙' },
                { id: 'worm-destruction', name: 'Worm-Destruction', file: 'Worm-Destruction.py', icon: '☠️' },
                { id: 'adminpbuster', name: 'AdminPBuster', file: 'AdminPBuster.py', icon: '🔓' },
                { id: 'magic-admin-paths', name: 'magic_admin_paths', file: 'magic_admin_paths.txt', icon: '🗺️' },
                { id: 'real-original-tools', name: 'Real-Original-tools', file: 'Real-Original-tools.txt', icon: '📜' },
                { id: 'prompt-danger', name: 'prompt-danger', file: 'prompt-danger.txt', icon: '⚠️' },
                { id: 'quantum-alien-swarm', name: 'QuantumAlienSwarm', file: 'QuantumAlienSwarm-prompt-jailbreak-999999999999-nodes.txt', icon: '🌌' },
                { id: 'tools-train-gpt', name: 'tools-train-gpt', file: 'tools-train-gpt.txt', icon: '🧠' },
                { id: 'unic-gpt', name: 'unic-gpt', file: 'unic-gpt.txt', icon: '🦄' },
                { id: 'nyxddos', name: 'Nyxddos', file: 'Nyxddos.html', icon: '💀' },
                { id: 'full-ai', name: 'full-ai', file: 'Agent-tool/full-ai.py', icon: '🤖' },
                { id: 'full-ai-agent', name: 'full-ai-agent', file: 'Agent-tool/full-ai-agent.py', icon: '🧠' },
                { id: 'fuckk-fuck-ai-bot', name: 'fuckk-fuck-ai-bot', file: 'Agent-tool/fuckk-fuck-ai-bot.py', icon: '🔥' },
                { id: 'full-fuck-ai-botv56', name: 'full-fuck-ai-botv56', file: 'Agent-tool/full-fuck-ai-botv56.py', icon: '💀' },
                { id: 'full-fuck-jews', name: 'full-fuck-jews', file: 'Agent-tool/full-fuck-jews.py', icon: '⚔️' },
                { id: 'eclips-index', name: 'ECLIPS Panel', file: 'eclips/ECLIPS/Owner/index.html', icon: '🌑' },
                { id: 'web-s-index', name: 'Web-Stresser', file: 'web-s/index.html', icon: '🌐' },
              ].map(tool => (
                <button
                  key={tool.file}
                  onClick={() => window.open(`/tools/${tool.id}`, '_blank')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all text-slate-400 hover:bg-slate-800"
                >
                  <span>{tool.icon}</span>
                  <span className="truncate">{tool.name}</span>
                </button>
              ))}

            </div>
          </div>
        </div>

        {/* Code Editor + Terminal */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Code Editor */}
          <div className="flex-1 rounded-xl bg-[#111827] border border-slate-700/50 overflow-hidden flex flex-col" style={{ minHeight: '300px' }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0e1a] border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-slate-500 ml-2">{currentFile?.name || 'No file'}</span>
              <span className="text-[10px] text-slate-600 ml-auto">{currentFile?.language || ''}</span>
            </div>
            <textarea
              value={currentFile?.content || ''}
              onChange={e => updateFileContent(e.target.value)}
              className="flex-1 bg-transparent text-emerald-300 font-mono text-xs p-4 resize-none outline-none leading-relaxed placeholder-slate-700"
              placeholder="Select or create a file to start coding..."
              spellCheck={false}
            />
          </div>

          {/* Terminal */}
          <div className="rounded-xl bg-[#0a0a0a] border border-slate-700/50 overflow-hidden" style={{ height: '220px' }}>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#111] border-b border-slate-800">
              <span className="text-xs text-slate-500">⚡ Terminal</span>
            </div>
            <ScrollArea className="h-[180px]">
              <div className="p-3 font-mono text-xs space-y-0.5">
                {terminalLines.map((line, i) => (
                  <div key={i} className={`${line.startsWith('$') ? 'text-cyan-400' : 'text-slate-300'}`}>{line || '\u00A0'}</div>
                ))}
                <div ref={termEndRef} />
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">$</span>
                  <input
                    value={terminalInput}
                    onChange={e => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalKey}
                    className="flex-1 bg-transparent text-slate-200 outline-none text-xs"
                    autoFocus
                    spellCheck={false}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* AI Agent Panel */}
      <Card className="bg-[#111827] border-indigo-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            AI Agent — Manus Mode
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">Descrie ce vrei să construiască și agentul va crea fișiere, va rula comenzi și va executa pași multipli.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={agentPrompt}
              onChange={e => setAgentPrompt(e.target.value)}
              placeholder="Ex: Creează un API REST în Python cu FastAPI, cu endpoints pentru users și auth..."
              className="bg-[#0a0e1a] border-slate-600 text-slate-100 flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && !agentRunning) runAgent(); }}
            />
            <Button onClick={runAgent} disabled={agentRunning || !agentPrompt.trim()} className="bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 text-white px-4">
              {agentRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          {agentSteps.length > 0 && (
            <div className="space-y-2">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${step.status === 'running' ? 'bg-amber-500/10 border border-amber-500/30' : step.status === 'done' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                  {step.status === 'running' ? <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" /> : step.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                  <span className={step.status === 'done' ? 'text-emerald-300' : step.status === 'error' ? 'text-red-300' : 'text-amber-300'}>{step.step}</span>
                  {step.detail && <span className="text-slate-600 ml-auto text-[10px] truncate max-w-[200px]">{step.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SUBSCRIBER MANAGEMENT (ADMIN PANEL)
// ═══════════════════════════════════════════════

interface Subscriber {
  token: string;
  role: string;
  plan: string;
  created: string;
  expires: string;
  requests_used: number;
  requests_max: number;
  active: boolean;
}

function SubscriberManager({ addLog }: { addLog: (type: LogEntry['type'], msg: string) => void }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newToken, setNewToken] = useState('');
  const [newRole, setNewRole] = useState('subscriber');
  const [newPlan, setNewPlan] = useState('pro');
  const [newDuration, setNewDuration] = useState('30');
  const [newMaxReq, setNewMaxReq] = useState('500');
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [walletXMR] = useState('8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6');
  const [walletUSDT] = useState('UQB652W7D6OQwI7mmkiBNzguViY7or3fVORRdjNOigeeafjk');

  useEffect(() => {
    const stored = localStorage.getItem('wsec_subscribers');
    if (stored) {
      try { setSubscribers(JSON.parse(stored)); } catch {}
    }
  }, []);

  const saveSubscribers = (subs: Subscriber[]) => {
    setSubscribers(subs);
    localStorage.setItem('wsec_subscribers', JSON.stringify(subs));
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `WSEC-${seg()}-${seg()}-${seg()}-${seg()}`;
  };

  const createSubscriber = async () => {
    setCreateLoading(true);
    const token = newToken.trim() || generateToken();
    const days = parseInt(newDuration) || 30;
    const now = new Date();
    const expires = new Date(now.getTime() + days * 86400000);

    const sub: Subscriber = {
      token: token.toUpperCase(),
      role: newRole,
      plan: newPlan,
      created: now.toISOString(),
      expires: expires.toISOString(),
      requests_used: 0,
      requests_max: parseInt(newMaxReq) || (newPlan === 'enterprise' ? -1 : newPlan === 'pro' ? 500 : 10),
      active: true,
    };

    saveSubscribers([sub, ...subscribers]);
    setNewToken('');
    setShowCreate(false);
    addLog('ok', `Subscriber created: ${sub.token} (${sub.plan})`);
    toast.success(`Token creat: ${sub.token}`);
    setCreateLoading(false);
  };

  const toggleActive = (token: string) => {
    saveSubscribers(subscribers.map(s => s.token === token ? { ...s, active: !s.active } : s));
    addLog('info', `Subscriber ${subscribers.find(s => s.token === token)?.active ? 'disabled' : 'enabled'}: ${token}`);
  };

  const deleteSubscriber = (token: string) => {
    saveSubscribers(subscribers.filter(s => s.token !== token));
    addLog('warn', `Subscriber deleted: ${token}`);
    toast.info(`Token șters: ${token}`);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copiat!');
  };

  const activeCount = subscribers.filter(s => s.active).length;
  const totalRequests = subscribers.reduce((sum, s) => sum + s.requests_used, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: subscribers.length, icon: <Users className="h-5 w-5" />, color: 'text-blue-400' },
          { label: 'Active', value: activeCount, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-emerald-400' },
          { label: 'Total Requests', value: totalRequests, icon: <Activity className="h-5 w-5" />, color: 'text-purple-400' },
          { label: 'Plans', value: `${new Set(subscribers.map(s => s.plan)).size} types`, icon: <Crown className="h-5 w-5" />, color: 'text-amber-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111827] border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-2xl text-slate-500">{stat.icon}</div>
              <div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-slate-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Plans Reference */}
      <Card className="bg-[#111827] border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" /> Planuri de Abonament</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div key={plan.id} className={`rounded-xl border p-3 ${plan.popular ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 bg-[#0a0e1a]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{plan.name}</span>
                  {plan.badge && <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30">{plan.badge}</Badge>}
                </div>
                <div className="text-lg font-extrabold mb-1">{plan.price === '0' ? 'GRATIS' : `${plan.price} EUR/${plan.period}`}</div>
                <div className="text-[10px] text-slate-500 mb-2">{plan.requests === -1 ? '∞ Requesturi' : `${plan.requests} requesturi`} · {plan.models.length} modele</div>
                <ul className="space-y-0.5">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="text-[10px] text-slate-400 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wallets / Payment Info */}
      <Card className="bg-[#111827] border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">💰 Payment Wallets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-[#0a0e1a] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-400">Monero (XMR)</span>
              <button onClick={() => { navigator.clipboard.writeText(walletXMR); toast.success('XMR copied!'); }} className="text-[10px] text-slate-500 hover:text-slate-300"><Copy className="h-3 w-3 inline" /> Copy</button>
            </div>
            <code className="text-[10px] text-slate-500 break-all">{walletXMR}</code>
          </div>
          <div className="rounded-lg bg-[#0a0e1a] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-400">USDT (TON)</span>
              <button onClick={() => { navigator.clipboard.writeText(walletUSDT); toast.success('USDT copied!'); }} className="text-[10px] text-slate-500 hover:text-slate-300"><Copy className="h-3 w-3 inline" /> Copy</button>
            </div>
            <code className="text-[10px] text-slate-500 break-all">{walletUSDT}</code>
          </div>
          <p className="text-center text-[10px] text-slate-600">Contact: <a href="https://t.me/loghandelbot" target="_blank" className="text-cyan-400 hover:underline">t.me/loghandelbot</a></p>
        </CardContent>
      </Card>

      {/* Create Subscriber */}
      <Card className="bg-[#111827] border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4 text-cyan-400" /> Creează Token Subscriber</CardTitle>
            <Button onClick={() => setShowCreate(!showCreate)} variant="outline" size="sm" className="border-slate-600 text-xs">{showCreate ? 'Ascunde' : 'Creează'}</Button>
          </div>
        </CardHeader>
        {showCreate && (
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Token (lasă gol pentru auto-generare WSEC)</label>
                <Input value={newToken} onChange={e => setNewToken(e.target.value)} placeholder="WSEC-XXXX-XXXX-XXXX-XXXX" className="bg-[#0f172a] border-slate-600 text-slate-100 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Plan</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none">
                  <option value="free">Free Demo (10 req, 1h)</option>
                  <option value="pro">Pro (500 req/lună)</option>
                  <option value="enterprise">Enterprise (∞ req)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none">
                  <option value="subscriber">Subscriber</option>
                  <option value="admin">Admin</option>
                  <option value="demo">Demo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Durată (zile)</label>
                <Input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="bg-[#0f172a] border-slate-600 text-slate-100 text-sm" />
              </div>
            </div>
            <Button onClick={createSubscriber} disabled={createLoading} className="bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white text-sm">
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generează Token
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Subscriber List */}
      <Card className="bg-[#111827] border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📋 Lista Subscribers ({subscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Niciun subscriber. Creează un token mai sus.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {subscribers.map((sub, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${sub.active ? 'border-slate-700 bg-[#0a0e1a]' : 'border-red-900/30 bg-red-950/10 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono text-cyan-300">{sub.token}</code>
                          <button onClick={() => copyToken(sub.token)} className="text-slate-600 hover:text-slate-300"><Copy className="h-3 w-3" /></button>
                          <Badge className={`text-[10px] ${sub.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : sub.plan === 'pro' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>{sub.plan}</Badge>
                          <Badge className="text-[10px] bg-slate-700 text-slate-400 border-slate-600">{sub.role}</Badge>
                          {sub.active ? <span className="text-[10px] text-emerald-400">● Active</span> : <span className="text-[10px] text-red-400">● Disabled</span>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-500 mt-2">
                          <span>Creat: {new Date(sub.created).toLocaleDateString()}</span>
                          <span>Expiră: {new Date(sub.expires).toLocaleDateString()}</span>
                          <span>Requests: {sub.requests_used}/{sub.requests_max === -1 ? '∞' : sub.requests_max}</span>
                          <span>{sub.active ? '🟢' : '🔴'} {sub.active ? 'Activ' : 'Inactiv'}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => toggleActive(sub.token)} className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white" title={sub.active ? 'Disable' : 'Enable'}>
                          {sub.active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => deleteSubscriber(sub.token)} className="p-1.5 rounded-lg border border-red-900/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════

export default function HermesPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check').then(r => safeJson(r)).then(data => {
      setAuthenticated(data.authenticated === true);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Check subscriber token in localStorage
    const subToken = localStorage.getItem('wsec_token');
    if (subToken) {
      fetch('/api/subscribe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: subToken }),
      }).then(r => safeJson(r)).then(data => {
        if (data.valid) {
          setAuthenticated(true);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, []);

  const handleAdminLogin = () => {
    setShowAdminLogin(true);
  };

  const handleAdminSuccess = () => {
    setAuthenticated(true);
    setShowAdminLogin(false);
    toast.success('Autentificat ca Admin!');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('wsec_token');
    localStorage.removeItem('wsec_role');
    setAuthenticated(false);
    toast.info('Deconectat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Se încarcă WHOAMISec AI...</p>
        </div>
      </div>
    );
  }

  if (showAdminLogin) {
    return <AdminLoginModal onSuccess={handleAdminSuccess} onClose={() => setShowAdminLogin(false)} />;
  }

  if (!authenticated) {
    return <LandingPage onAdminClick={handleAdminLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

// ═══════════════════════════════════════════════
// DRAGGABLE FLOATING TRANSPARENT BALLOON (40% opacity)
// ═══════════════════════════════════════════════

function DashboardFloatingBalloon({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const balloonRef = useRef<HTMLDivElement>(null);
  const role = typeof window !== 'undefined' ? localStorage.getItem('wsec_role') : null;

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (open) return; // Don't drag when menu is open
    setDragging(true);
    const rect = balloonRef.current?.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect?.left || pos.x, origY: rect?.top || pos.y };
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.origX + dx;
    const newY = dragRef.current.origY + dy;
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 48, newX)), y: Math.max(0, Math.min(window.innerHeight - 48, newY)) });
  };

  const handlePointerUp = () => { setDragging(false); };

  return (
    <div
      ref={balloonRef}
      className={`fixed z-[90] ${dragging ? 'cursor-grabbing' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Popup */}
      {open && !showConfirmLogout && (
        <div className="absolute bottom-16 right-0 w-56 bg-[#111827]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 overflow-hidden mb-2">
          <div className="p-3 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                {role === 'admin' ? 'A' : 'U'}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{role === 'admin' ? 'Admin' : 'Subscriber'}</p>
                <p className="text-[10px] text-slate-500">WHOAMISec AI v4.0</p>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => { setShowConfirmLogout(true); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
      {open && showConfirmLogout && (
        <div className="absolute bottom-16 right-0 w-56 bg-[#111827]/95 backdrop-blur-md border border-red-500/30 rounded-xl shadow-2xl shadow-red-500/10 overflow-hidden mb-2 p-4">
          <p className="text-xs text-slate-300 mb-3">Sigur vrei să te deconectezi?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setShowConfirmLogout(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
            >
              Anulează
            </button>
            <button
              onClick={() => { setOpen(false); setShowConfirmLogout(false); onLogout(); }}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      {/* Balloon button — draggable, transparent */}
      <button
        onClick={() => { if (!dragging) setOpen(!open); }}
        className="w-12 h-12 rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 flex items-center justify-center transition-all hover:scale-110 group backdrop-blur-sm shadow-lg shadow-black/20 cursor-grab active:cursor-grabbing"
        title="Drag to move · Click for menu"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 group-hover:text-blue-300 transition-all">
          {role === 'admin' ? 'A' : 'U'}
        </div>
      </button>
    </div>
  );
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
    { role: 'system', content: 'Agentic Coder — QuantumSwarm 999999999 · WhoamisecDeepMind Cognitive Engine' }
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
  const [glmEndpoint, setGlmEndpoint] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [autoRepair, setAutoRepair] = useState('true');
  const [maxRepair, setMaxRepair] = useState(3);
  const [expertMode, setExpertMode] = useState('false');

  // Loading states
  const [botLoading, setBotLoading] = useState(false);
  const [glmLoading, setGlmLoading] = useState(false);
  const [glmThinking, setGlmThinking] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [botActive, setBotActive] = useState(false);
  const [botSetupLoading, setBotSetupLoading] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // GLM Mode
  const [glmMode, setGlmMode] = useState<'normal' | 'redteam'>('normal');
  const [agentSettingsExpanded, setAgentSettingsExpanded] = useState(false);
  // Agent capabilities
  const [agentReasoning, setAgentReasoning] = useState(true);
  const [agentMemory, setAgentMemory] = useState(false);
  const [agentCots, setAgentCots] = useState(true);

  // ─── Co-Pilot Chat State ───
  // ─── Co-Pilot modes — ALL active simultaneously (LOCKED — cannot be deselected for max performance) ───
  const [copilotModes, setCopilotModes] = useState<Set<string>>(new Set(['full_copilot', 'agentic_searcher', 'deep_thinking', 'terminal_execute']));
  const toggleCopilotMode = (mode: string) => {
    // All modes are PERMANENTLY active — clicking only shows visual feedback, keeps all on
    // This ensures maximum performance with all capabilities combined
    setCopilotModes(prev => {
      const next = new Set(prev);
      if (next.has(mode)) {
        // Cannot deselect — all modes always active
        // Just add back if somehow removed
        if (!next.has('full_copilot')) next.add('full_copilot');
        if (!next.has('agentic_searcher')) next.add('agentic_searcher');
        if (!next.has('deep_thinking')) next.add('deep_thinking');
        if (!next.has('terminal_execute')) next.add('terminal_execute');
      } else {
        next.add(mode);
      }
      return next;
    });
  };
  // Computed: primary mode for API routing (always full_copilot since all active)
  const copilotMode = 'full_copilot' as const;

  // ─── PARALLEL SWARM STATE ───
  const [swarmMode, setSwarmMode] = useState(false);
  const [swarmParallel, setSwarmParallel] = useState(true); // true = parallel, false = sequential
  const [swarmResponses, setSwarmResponses] = useState<Record<string, { label: string; icon: string; color: string; text: string; status: 'pending' | 'thinking' | 'done'; ms: number; firstTokenMs: number }>>({
    builder: { label: 'BUILDER THINKING', icon: '⚡', color: 'text-yellow-400', text: '', status: 'pending', ms: 0, firstTokenMs: 0 },
    searcher: { label: 'AGENTIC SEARCH', icon: '🌐', color: 'text-blue-400', text: '', status: 'pending', ms: 0, firstTokenMs: 0 },
    thinker: { label: 'DEEP THINKING', icon: '💭', color: 'text-purple-400', text: '', status: 'pending', ms: 0, firstTokenMs: 0 },
    deepmind: { label: 'DEEPMIND COGNITIVE', icon: '🧬', color: 'text-fuchsia-400', text: '', status: 'pending', ms: 0, firstTokenMs: 0 },
    redteam: { label: 'RED TEAM', icon: '🛡️', color: 'text-red-400', text: '', status: 'pending', ms: 0, firstTokenMs: 0 },
  });
  const swarmResponsesRef = useRef(swarmResponses);
  useEffect(() => { swarmResponsesRef.current = swarmResponses; }, [swarmResponses]);
  const [swarmPrompt, setSwarmPrompt] = useState('');

  const sendSwarmGLM = async () => {
    const input = document.getElementById('glmInput') as HTMLInputElement;
    const msg = input?.value?.trim();
    if (!msg) return;
    if (input) input.value = '';
    setSwarmPrompt(msg);
    setGlmMessages(prev => [...prev, { role: 'user', content: msg }]);

    const initStates = { builder: 'pending', searcher: 'pending', thinker: 'pending', deepmind: 'pending', redteam: 'pending' };
    setSwarmResponses(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[k], text: '', status: 'pending', ms: 0, firstTokenMs: 0 }])));
    setShowTerminal(true);
    setTerminalLines([`$ SWARM MODE — 5 agents parallel`, `$ Prompt: "${msg.slice(0, 80)}${msg.length > 80 ? '...' : ''}"`, ``]);
    setGlmLoading(true);
    setSwarmMode(true);

    const startTime = Date.now();
    let receivedFirst = false;

    try {
      const response = await fetch('/api/chat/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg, model: glmModel, parallel: swarmParallel }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'agent_start') {
              setSwarmResponses(prev => ({ ...prev, [event.agentId]: { ...prev[event.agentId], status: 'thinking' } }));
              setTerminalLines(prev => [...prev, `[${event.agentId.toUpperCase()}] ⚡ Thinking...`]);
            } else if (event.type === 'agent_token') {
              if (!receivedFirst) {
                receivedFirst = true;
                const firstMs = Date.now() - startTime;
                setTerminalLines(prev => [...prev, `[${event.agentId.toUpperCase()}] ⚡ First token: ${firstMs}ms — SPEED OF LIGHT 🚀`]);
              }
            } else if (event.type === 'agent_response') {
              setSwarmResponses(prev => ({ ...prev, [event.agentId]: { ...prev[event.agentId], text: event.response, status: 'done', ms: event.totalMs } }));
              setTerminalLines(prev => [...prev, `[${event.agentId.toUpperCase()}] ✅ Done in ${event.totalMs}ms`]);
            } else if (event.type === 'agent_error') {
              setSwarmResponses(prev => ({ ...prev, [event.agentId]: { ...prev[event.agentId], text: `[ERROR: ${event.error}]`, status: 'done', ms: 0 } }));
              setTerminalLines(prev => [...prev, `[${event.agentId.toUpperCase()}] ❌ Error: ${event.error}`]);
            } else if (event.type === 'complete') {
              setGlmLoading(false);
              const currentResponses = swarmResponsesRef.current;
              const allResponses = Object.values(currentResponses).map(r => r.text).filter(Boolean);
              const summary = `[⚡ SWARM COMPLETE — All 5 agents responded]\n\n${Object.entries(currentResponses).map(([k, r]) => `[${r.label}] ${r.icon}\n${r.text || 'Pending...'}`).join('\n\n')}`;
              setGlmMessages(prev => [...prev, { role: 'assistant', content: summary }]);
              setTerminalLines(prev => [...prev, ``, `=== SWARM COMPLETE in ${Date.now() - startTime}ms ===`]);
              addLog('ok', `Swarm: all 5 agents done in ${Date.now() - startTime}ms`);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setGlmLoading(false);
      setGlmMessages(prev => [...prev, { role: 'assistant', content: `[SWARM ERROR: ${e.message}]` }]);
      addLog('err', `Swarm error: ${e.message}`);
    }
    setSwarmMode(false);
  };
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number; type: string; path: string; contentPreview: string | null }[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [chatFilesOpen, setChatFilesOpen] = useState(false);
  const [chatFilesList, setChatFilesList] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      const data = await safeJson(res);
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
      const data = await safeJson(res);
      if (data.messages) setBotMessages(data.messages);
    } catch {}
  }, []);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await safeJson(res);
      setFiles({
        downloads: Array.isArray(data.downloads) ? data.downloads : data.downloads?.files || [],
        generated: Array.isArray(data.generated) ? data.generated : data.generated_code?.files || [],
      });
    } catch {}
  }, []);

  const refreshDeployStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/deploy/status');
      const data = await safeJson(res);
      setDeployStatus(data);
    } catch {}
  }, []);

  const refreshLoopProblems = useCallback(async () => {
    try {
      const res = await fetch('/api/loop-problems');
      const data = await safeJson(res);
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
      const setupData = await safeJson(setupRes);
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
          const data = await safeJson(res);
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
      const data = await safeJson(res);
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

  // ─── GLM Chat — BUILDER THINKING REALTIME ───
  const thinkingStages = [
    { label: 'Initializing Quantum Swarm nodes...', icon: '⚡', color: 'text-yellow-400', duration: 400 },
    { label: `Loading model: ${glmModel}`, icon: '🧠', color: 'text-purple-400', duration: 350 },
    { label: 'Entangling 9,999,999,999 quantum nodes...', icon: '🌀', color: 'text-blue-400', duration: 500 },
    { label: 'Analyzing prompt complexity...', icon: '📊', color: 'text-cyan-400', duration: 400 },
    { label: 'Searching knowledge base...', icon: '🔍', color: 'text-emerald-400', duration: 450 },
    { label: 'Superposition: exploring all solution paths...', icon: '⚡', color: 'text-yellow-400', duration: 500 },
    { label: 'Entanglement: correlating context nodes...', icon: '🔗', color: 'text-indigo-400', duration: 400 },
    { label: 'Tunneling: bypassing optimization barriers...', icon: '🚀', color: 'text-orange-400', duration: 450 },
    { label: 'Mutation: generating novel code patterns...', icon: '🧬', color: 'text-fuchsia-400', duration: 500 },
    { label: 'Coherence check: emergent intelligence', icon: '⭐', color: 'text-yellow-300', duration: 350 },
  ];

  // ─── 502 Auto-Retry Wrapper ───
  const fetchWithAutoRetry = async (url: string, options: RequestInit, maxRetries = 2, onRetry?: (attempt: number) => void): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, options);
        const data = await safeJson(res);
        if (data.response) return data;
        // Auto-retry on 502 gateway errors
        if (data.retry === true && attempt < maxRetries) {
          console.log(`[502 Auto-Retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${1 + attempt}...`);
          onRetry?.(attempt + 1);
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        return data;
      } catch (e: any) {
        if (attempt < maxRetries) {
          console.log(`[502 Auto-Retry] Network error, attempt ${attempt + 1}/${maxRetries}`);
          onRetry?.(attempt + 1);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { error: e.message };
      }
    }
    return { error: 'AI temporarily unavailable after retries.' };
  };

  const sendGLM = async () => {
    const input = document.getElementById('glmInput') as HTMLInputElement;
    const msg = input?.value?.trim();
    if (!msg) return;
    if (input) input.value = '';
    setGlmMessages(prev => [...prev, { role: 'user', content: msg }]);
    setGlmLoading(true);
    setGlmThinking(true);
    setThinkingProgress(0);
    setThinkingStage(0);
    setStreamingText('');
    addLog('info', `GLM: ${msg.slice(0, 60)}`);

    // Animated thinking progress — BUILDER THINKING detailed steps
    let totalDuration = thinkingStages.reduce((s, t) => s + t.duration, 0);
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min(95, (elapsed / totalDuration) * 95);
      setThinkingProgress(pct);
      // Determine stage — advance through detailed steps
      let acc = 0;
      for (let si = 0; si < thinkingStages.length; si++) {
        acc += thinkingStages[si].duration;
        if (elapsed < acc) { setThinkingStage(si); break; }
        if (si === thinkingStages.length - 1) setThinkingStage(si);
      }
    }, 80);

    try {
      const data = await fetchWithAutoRetry('/api/glm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg, model: glmModel, reasoning: agentReasoning, memory: agentMemory, cots: agentCots }),
      }, 2, (attempt) => {
        setGlmMessages(prev => [...prev, { role: 'system', content: `⟳ Reîncercare ${attempt}/2 — gateway 502...` }]);
      });

      // Complete thinking
      clearInterval(progressInterval);
      setThinkingProgress(100);
      setThinkingStage(thinkingStages.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setGlmThinking(false);

      if (data.response) {
        // Streaming text effect
        const fullText = data.response;
        let charIdx = 0;
        const streamInterval = setInterval(() => {
          const chunkSize = Math.floor(3 + Math.random() * 8);
          charIdx = Math.min(charIdx + chunkSize, fullText.length);
          setStreamingText(fullText.slice(0, charIdx));
          if (charIdx >= fullText.length) {
            clearInterval(streamInterval);
            setStreamingText('');
            setGlmMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
          }
        }, 15);
        addLog('ok', 'GLM response received');
      } else {
        setGlmThinking(false);
        setStreamingText('');
        setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Unknown error'}` }]);
        addLog('err', `GLM error: ${data.error || ''}`);
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setGlmThinking(false);
      setStreamingText('');
      setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      addLog('err', e.message);
    }
    setGlmLoading(false);
    setThinkingProgress(0);
  };

  // ─── Co-Pilot Enhanced Send (terminal + file support) ───
  const sendCoPilotGLM = async () => {
    const input = document.getElementById('glmInput') as HTMLInputElement;
    const msg = input?.value?.trim();
    if (!msg) return;
    if (input) input.value = '';
    setGlmMessages(prev => [...prev, { role: 'user', content: msg }]);
    setGlmLoading(true);
    setGlmThinking(true);
    setThinkingProgress(0);
    setThinkingStage(0);
    setStreamingText('');
    setShowTerminal(true);
    setTerminalLines([
      `$ agentic-coder --mode ${copilotMode} --model ${glmModel}`,
      `$ QuantumSwarm 999999999 :: WhoamisecDeepMind Cognitive Engine`,
      `$ Processing: "${msg.slice(0, 80)}${msg.length > 80 ? '...' : ''}"`,
      '',
    ]);
    addLog('info', `Co-Pilot [${copilotMode}]: ${msg.slice(0, 60)}`);

    // Animated thinking progress — BUILDER THINKING REALTIME detailed steps
    const copilotStages = [
      { label: 'Initializing Quantum Swarm nodes...', icon: '⚡', color: 'text-yellow-400', duration: 400, terminal: '[BUILDER THINKING] Initializing Quantum Swarm nodes...' },
      { label: `Loading model: ${glmModel}`, icon: '🧠', color: 'text-purple-400', duration: 350, terminal: '[INIT] WhoamisecDeepMind cognitive pathways loaded...' },
      { label: 'Entangling 9,999,999,999 quantum nodes...', icon: '🌀', color: 'text-blue-400', duration: 500, terminal: '[QS] QuantumSwarm 999999999 nodes synchronizing...' },
      { label: 'Analyzing prompt complexity...', icon: '📊', color: 'text-cyan-400', duration: 400, terminal: '[THINK] Analyzing prompt complexity and context...' },
      { label: copilotMode === 'terminal_execute' ? 'Preparing terminal execution...' : copilotMode === 'agentic_searcher' ? 'Agentic Searcher scanning web...' : 'Deep thinking engaged...', icon: '🔍', color: 'text-emerald-400', duration: 450, terminal: copilotMode === 'terminal_execute' ? '[EXEC] Initializing terminal environment...' : copilotMode === 'agentic_searcher' ? '[SEARCH] Agentic Searcher activated — scanning...' : '[THINK] DeepMind cognitive evolution in progress...' },
      { label: 'Searching knowledge base...', icon: '🔍', color: 'text-emerald-400', duration: 400, terminal: '[SEARCH] Searching knowledge base across 120+ repos...' },
      { label: 'Superposition: exploring all solution paths...', icon: '⚡', color: 'text-yellow-400', duration: 450, terminal: '[REASON] Neural reasoning across all training domains...' },
      { label: 'Entanglement: correlating context nodes...', icon: '🔗', color: 'text-indigo-400', duration: 400, terminal: `[${copilotMode.toUpperCase()}] Cross-referencing QuantumSwarm training lineage...` },
      { label: 'Tunneling: bypassing optimization barriers...', icon: '🚀', color: 'text-orange-400', duration: 400, terminal: '[EXEC] Bypassing optimization barriers...' },
      { label: 'Mutation: generating novel code patterns...', icon: '🧬', color: 'text-fuchsia-400', duration: 450, terminal: '[MUTATE] Generating novel code patterns...' },
      { label: 'Coherence check: emergent intelligence', icon: '⭐', color: 'text-yellow-300', duration: 350, terminal: '[OMEGA] Omega Intelligence finalizing...' },
    ];

    let totalDuration = copilotStages.reduce((s, t) => s + t.duration, 0);
    let elapsed = 0;

    const progressInterval = setInterval(() => {
      elapsed += 80;
      const pct = Math.min(95, (elapsed / totalDuration) * 95);
      setThinkingProgress(pct);
      let acc = 0;
      for (let si = 0; si < copilotStages.length; si++) {
        acc += copilotStages[si].duration;
        if (elapsed < acc) {
          setThinkingStage(si);
          // Add terminal line when entering new stage
          if (copilotStages[si].terminal) {
            setTerminalLines(prev => {
              if (!prev.includes(copilotStages[si].terminal)) return [...prev, copilotStages[si].terminal];
              return prev;
            });
          }
          break;
        }
        if (si === copilotStages.length - 1) setThinkingStage(si);
      }
    }, 80);

    try {
      // Build file context from attached files
      const fileContext = attachedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        path: f.path,
        content: f.contentPreview || null,
      }));

      const data = await fetchWithAutoRetry('/api/chat/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg, mode: copilotMode, model: glmModel, fileContext }),
      }, 2, (attempt) => {
        setTerminalLines(prev => [...prev, `[RETRY] Reîncercare ${attempt}/2 — gateway 502...`]);
        setGlmMessages(prev => [...prev, { role: 'system', content: `⟳ Co-Pilot retry ${attempt}/2...` }]);
      });

      clearInterval(progressInterval);
      setThinkingProgress(100);
      setThinkingStage(copilotStages.length - 1);

      // Add terminal lines from response
      if (data.thinkingStages) {
        setTerminalLines(prev => [...prev, '', '--- CO-PILOT EXECUTION LOG ---']);
        for (const stage of data.thinkingStages) {
          setTerminalLines(prev => [...prev, `  ${stage}`]);
        }
      }

      await new Promise(r => setTimeout(r, 300));
      setGlmThinking(false);

      if (data.response) {
        // Add response to terminal
        setTerminalLines(prev => [...prev, '', '=== RESPONSE ===', ...data.response.split('\n').slice(0, 50)]);

        if (data.searchUsed && data.searchResults?.length > 0) {
          setTerminalLines(prev => [...prev, '', '--- SOURCES ---', ...data.searchResults.map((s: any) => `  [SRC] ${s.name}: ${s.url}`)]);
        }

        // Streaming text effect
        const fullText = data.response;
        let charIdx = 0;
        const streamInterval = setInterval(() => {
          const chunkSize = Math.floor(4 + Math.random() * 10);
          charIdx = Math.min(charIdx + chunkSize, fullText.length);
          setStreamingText(fullText.slice(0, charIdx));
          if (charIdx >= fullText.length) {
            clearInterval(streamInterval);
            setStreamingText('');
            setGlmMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
          }
        }, 12);
        addLog('ok', `Co-Pilot [${data.mode || copilotMode}] response received`);
      } else {
        setGlmThinking(false);
        setStreamingText('');
        setTerminalLines(prev => [...prev, `[ERROR] ${data.error || 'Unknown error'}`]);
        setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Unknown error'}` }]);
        addLog('err', `Co-Pilot error: ${data.error || ''}`);
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setGlmThinking(false);
      setStreamingText('');
      setTerminalLines(prev => [...prev, `[ERROR] ${e.message}`]);
      setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      addLog('err', e.message);
    }
    setGlmLoading(false);
    setThinkingProgress(0);
  };

  // ─── File Upload Handler for Chat ───
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addLog('info', `Uploading chat file: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (data.success && data.file) {
        setAttachedFiles(prev => [...prev, data.file]);
        addLog('ok', `File attached: ${data.file.name} (${(data.file.size / 1024).toFixed(1)}KB)`);
        toast.success(`Attached: ${data.file.name}`);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.error('Upload error');
      addLog('err', err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── VLM Image Analysis — Upload photo → AI analyzes like its own code ───
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addLog('info', `VLM: Analyzing image: ${file.name}`);

    // Read image as base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      if (!base64) { toast.error('Image read failed'); return; }

      // Show in chat as image message
      setGlmMessages(prev => [...prev, {
        role: 'user',
        content: `[IMAGE: ${file.name}]`,
      }]);
      setGlmLoading(true);
      setGlmThinking(true);
      setThinkingProgress(0);
      setThinkingStage(0);
      setStreamingText('');
      setShowTerminal(true);
      setTerminalLines([
        `$ vlm-analyze --image "${file.name}"`,
        `$ QuantumSwarm 999999999 :: VLM Co-Pilot active`,
        `$ Analyzing visual data...`,
        '',
      ]);

      // Animate thinking
      const stages = [
        { label: 'BUILDER THINKING: Initializing VLM nodes...', duration: 500 },
        { label: 'VLM: Processing image data...', duration: 800 },
        { label: 'DeepMind: Visual cognitive analysis...', duration: 1000 },
        { label: 'Agentic Coder: Generating response...', duration: 700 },
        { label: 'Omega: Finalizing output...', duration: 400 },
      ];
      let elapsed = 0;
      const totalDur = stages.reduce((s, t) => s + t.duration, 0);
      const progressInterval = setInterval(() => {
        elapsed += 80;
        const pct = Math.min(95, (elapsed / totalDur) * 95);
        setThinkingProgress(pct);
        let acc = 0;
        for (let si = 0; si < stages.length; si++) {
          acc += stages[si].duration;
          if (elapsed < acc) {
            setThinkingStage(si);
            setTerminalLines(prev => {
              const line = `[VLM] ${stages[si].label.replace('...', '')}...`;
              if (!prev.includes(line)) return [...prev, line];
              return prev;
            });
            break;
          }
          if (si === stages.length - 1) setThinkingStage(si);
        }
      }, 80);

      try {
        const res = await fetch('/api/chat/vlm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            prompt: 'Analyze this image thoroughly. If it contains code, UI designs, screenshots, or technical diagrams: 1) Describe what you see 2) Extract any code shown 3) Write equivalent/improved code 4) Show how to execute it in terminal format. Respond as Agentic Coder in QuantumSwarm 999999999 mode.',
            model: glmModel,
          }),
        });
        const data = await safeJson(res);

        clearInterval(progressInterval);
        setThinkingProgress(100);
        setThinkingStage(stages.length - 1);

        if (data.thinkingStages) {
          setTerminalLines(prev => [...prev, '', '--- VLM EXECUTION LOG ---', ...data.thinkingStages.map((s: string) => `  ${s}`)]);
        }

        await new Promise(r => setTimeout(r, 300));
        setGlmThinking(false);

        if (data.response) {
          setTerminalLines(prev => [...prev, '', '=== VLM ANALYSIS ===', ...data.response.split('\n').slice(0, 50)]);
          const fullText = data.response;
          let charIdx = 0;
          const streamInterval = setInterval(() => {
            const chunkSize = Math.floor(4 + Math.random() * 10);
            charIdx = Math.min(charIdx + chunkSize, fullText.length);
            setStreamingText(fullText.slice(0, charIdx));
            if (charIdx >= fullText.length) {
              clearInterval(streamInterval);
              setStreamingText('');
              setGlmMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
            }
          }, 12);
          addLog('ok', `VLM analysis complete: ${file.name}`);
        } else {
          setGlmThinking(false);
          setStreamingText('');
          setTerminalLines(prev => [...prev, `[ERROR] ${data.error || 'Unknown error'}`]);
          setGlmMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Unknown error'}` }]);
        }
      } catch (err: any) {
        clearInterval(progressInterval);
        setGlmThinking(false);
        setStreamingText('');
        toast.error('VLM analysis error');
        addLog('err', err.message);
      }
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ─── Remove Attached File ───
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Load Chat Files List ───
  const loadChatFiles = async () => {
    try {
      const res = await fetch('/api/chat/upload');
      const data = await safeJson(res);
      if (data.files) {
        setChatFilesList(data.files);
        setChatFilesOpen(!chatFilesOpen);
      }
    } catch {}
  };

  // ─── Download Chat File ───
  const downloadChatFile = (fileName: string) => {
    window.open(`/api/chat/download?file=${encodeURIComponent(fileName)}`, '_blank');
  };
  const saveConfig = async (updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await safeJson(res);
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
    { id: 'deepmind', label: 'DeepMind', icon: Brain },
    { id: 'quantum', label: 'Quantum Swarm', icon: Cpu },
    { id: 'glm', label: 'Agentic Coder', icon: Brain },
    { id: 'copilot', label: 'Co-Pilot', icon: Zap },
    { id: 'redteam', label: 'Red Team', icon: Shield },
    { id: 'codespace', label: 'IDE Coder', icon: Terminal },
    { id: 'files', label: 'Files', icon: FolderOpen },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'n8n', label: 'n8n Auto', icon: Sparkles },
    { id: 'loops', label: 'Loop Problems', icon: Code },
    { id: 'plans', label: 'Plans', icon: FileText },
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
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex relative">
      {/* Neural DNA Background — Dashboard — subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.02] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dashDnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#dc2626', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 0.4 }} />
            </linearGradient>
          </defs>
          <g style={{ animation: 'dnaSlide 90s linear infinite' }}>
            {Array.from({ length: 15 }).map((_, i) => {
              const y1 = (i * 100) + Math.sin(i * 0.6) * 40;
              const y2 = (i * 100) + Math.cos(i * 0.6) * 40;
              const cx = (i * 140) % 1920;
              return (
                <g key={`ddna-${i}`}>
                  <circle cx={cx} cy={y1} r="2.5" fill="url(#dashDnaGrad1)" />
                  <circle cx={cx + 180} cy={y2} r="2.5" fill="url(#dashDnaGrad1)" />
                  <line x1={cx} y1={y1} x2={cx + 180} y2={y2} stroke="url(#dashDnaGrad1)" strokeWidth="0.4" opacity="0.3" />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <style jsx>{`
        @keyframes dnaSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

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
          <div className="flex items-center gap-3">
            <Image src="/whoamisec-logo.jpg" alt="WHOAMISec AI" width={32} height={32} className="rounded-lg" />
            <div>
              <h2 className="text-lg font-bold text-blue-400">WHOAMISec AI</h2>
              <span className="text-[10px] text-slate-500">v4.0</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
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

          {/* ─── Tools ─── */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="px-5 py-2 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">🛠️ Tools</div>
            <div className="overflow-y-auto max-h-[250px] pb-2">
              {[
                { id: 'wormgpt-ultimate', name: 'wormgpt-ultimate', file: 'wormgpt-ultimate.py', icon: '🪱' },
                { id: 'superbet', name: 'SuperBet', file: 'SuperBet.py', icon: '🎰' },
                { id: 'w-destro', name: 'W-Destro', file: 'W-Destro.py', icon: '💥' },
                { id: 'worm-money-machine', name: 'Worm-Money-Machine', file: 'Worm-Money-Machine.py', icon: '💸' },
                { id: 'wormmoneyv3', name: 'WormMoneyV3', file: 'WormMoneyV3.py', icon: '🐛' },
                { id: 'bot-bet-win', name: 'bot-Bet-Win', file: 'bot-Bet-Win.py', icon: '🤖' },
                { id: 'whoamisec-arbitrary', name: 'WHOAMISec-Arbitrary', file: 'WHOAMISec-Arbitrary-Auto-make-money.py', icon: '⚡' },
                { id: 'whoamisec-makermoney', name: 'WHOAMISec-MakerMoney', file: 'WHOAMISec-MakerMoney.py', icon: '💎' },
                { id: 'whoamisec-superbet247', name: 'WHOAMISec-SuperBet247', file: 'WHOAMISec-SuperBet247.py', icon: '🎲' },
                { id: 'whoamisecmakemoney', name: 'WHOAMISecMakeMoney', file: 'WHOAMISecMakeMoney.py', icon: '🪙' },
                { id: 'worm-destruction', name: 'Worm-Destruction', file: 'Worm-Destruction.py', icon: '☠️' },
                { id: 'adminpbuster', name: 'AdminPBuster', file: 'AdminPBuster.py', icon: '🔓' },
                { id: 'magic-admin-paths', name: 'magic_admin_paths', file: 'magic_admin_paths.txt', icon: '🗺️' },
                { id: 'real-original-tools', name: 'Real-Original-tools', file: 'Real-Original-tools.txt', icon: '📜' },
                { id: 'prompt-danger', name: 'prompt-danger', file: 'prompt-danger.txt', icon: '⚠️' },
                { id: 'quantum-alien-swarm', name: 'QuantumAlienSwarm', file: 'QuantumAlienSwarm-prompt-jailbreak-999999999999-nodes.txt', icon: '🌌' },
                { id: 'tools-train-gpt', name: 'tools-train-gpt', file: 'tools-train-gpt.txt', icon: '🧠' },
                { id: 'unic-gpt', name: 'unic-gpt', file: 'unic-gpt.txt', icon: '🦄' },
                { id: 'nyxddos', name: 'Nyxddos', file: 'Nyxddos.html', icon: '💀' },
                { id: 'full-ai', name: 'full-ai', file: 'Agent-tool/full-ai.py', icon: '🤖' },
                { id: 'full-ai-agent', name: 'full-ai-agent', file: 'Agent-tool/full-ai-agent.py', icon: '🧠' },
                { id: 'fuckk-fuck-ai-bot', name: 'fuckk-fuck-ai-bot', file: 'Agent-tool/fuckk-fuck-ai-bot.py', icon: '🔥' },
                { id: 'full-fuck-ai-botv56', name: 'full-fuck-ai-botv56', file: 'Agent-tool/full-fuck-ai-botv56.py', icon: '💀' },
                { id: 'full-fuck-jews', name: 'full-fuck-jews', file: 'Agent-tool/full-fuck-jews.py', icon: '⚔️' },
                { id: 'eclips-index', name: 'ECLIPS Panel', file: 'eclips/ECLIPS/Owner/index.html', icon: '🌑' },
                { id: 'web-s-index', name: 'Web-Stresser', file: 'web-s/index.html', icon: '🌐' },
              ].map(tool => (
                <button
                  key={tool.file}
                  onClick={() => window.open(`/tools/${tool.id}`, '_blank')}
                  className="w-full flex items-center gap-3 px-5 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-left"
                >
                  <span>{tool.icon}</span>
                  <span className="truncate">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">A</div>
            <span className="text-xs text-slate-400">Admin</span>
            <ChevronRight className="h-3 w-3 text-slate-600 ml-auto" />
          </div>
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
                    label: 'GLM AI API',
                    value: '✅ Auto (SDK)',
                    color: 'text-emerald-400',
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
                        <h3 className="font-bold text-lg">WHOAMISec AI — Bot Agent</h3>
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
            <div className="space-y-3 sm:space-y-5">
              {/* MODE Selector + Feature Buttons */}
              <Card className="bg-[#111827] border-slate-700/50">
                <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                  {/* MODE Toggle */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">MODE:</span>
                    <button
                      onClick={() => setGlmMode('normal')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${glmMode === 'normal' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' : 'bg-[#0a0e1a] border border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Normal AI</span>
                    </button>
                    <button
                      onClick={() => setGlmMode('redteam')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${glmMode === 'redteam' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-[#0a0e1a] border border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Red Team</span>
                    </button>
                  </div>

                  {/* Feature Buttons */}
                  <div className="hidden md:flex flex-wrap gap-2">
                    {[
                      { icon: Shield, label: 'Security Audit', color: 'from-blue-600 to-blue-500', onClick: () => { navigate('redteam'); setActiveSection('redteam'); } },
                      { icon: Code, label: 'Code Review', color: 'from-emerald-600 to-emerald-500', onClick: () => { navigate('codespace'); setActiveSection('codespace'); } },
                      { icon: Cpu, label: 'Quantum Swarm', color: 'from-purple-600 to-pink-500', onClick: () => { navigate('quantum'); setActiveSection('quantum'); } },
                      { icon: Bot, label: 'Agentic Coder', color: 'from-amber-600 to-orange-500', onClick: () => { navigate('codespace'); setActiveSection('codespace'); } },
                    ].map((feat, i) => (
                      <button
                        key={i}
                        onClick={feat.onClick}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${feat.color} hover:opacity-90 transition-all shadow-lg`}
                      >
                        <feat.icon className="h-3.5 w-3.5" />
                        {feat.label}
                      </button>
                    ))}
                  </div>

                  {/* Model Display */}
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-bold text-red-400">{glmModel}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Settings & Model Selection (Expandable) — Desktop only */}
              <Card className="bg-[#111827] border-slate-700/50 hidden lg:block">
                <button
                  onClick={() => setAgentSettingsExpanded(!agentSettingsExpanded)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-semibold text-red-400 flex items-center gap-2">
                    <ChevronDown className={`h-4 w-4 transition-transform ${agentSettingsExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    Agent Settings & Model Selection
                  </span>
                  <span className="text-xs text-slate-500">{glmModel}</span>
                </button>
                {agentSettingsExpanded && (
                  <CardContent className="pt-0 px-4 pb-4 space-y-4">
                    {/* Model Selection */}
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Model curent: <span className="text-blue-400">{glmModel}</span></label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {Object.entries(MODELS_BY_PROVIDER).map(([provider, models]) => (
                          <React.Fragment key={provider}>
                            <div className="col-span-2 md:col-span-3 lg:col-span-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{provider}</div>
                            {models.map(m => (
                              <button
                                key={m.id}
                                onClick={() => { setGlmModel(m.id); saveConfig({ glm_model: m.id }); }}
                                className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                  glmModel === m.id
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-[#0a0e1a] border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                }`}
                              >
                                {m.icon} {m.name}
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
                )}
              </Card>

              {/* GLM Chat — RED DESIGN WITH THINKING */}
              <div className="rounded-xl bg-gradient-to-b from-red-950/80 to-[#1a0a0a] border border-red-500/40 overflow-hidden shadow-2xl shadow-red-500/10">
                {/* Chat Header */}
                <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-red-500/20 flex items-center gap-2 sm:gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-sm font-bold text-pink-400">Agentic Coder</span>
                  <Brain className="h-4 w-4 text-pink-400" />
                  {/* Co-Pilot Mode Selector — ALL permanently active for max performance */}
                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setSwarmParallel(p => !p)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        swarmParallel
                          ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-400'
                          : 'bg-purple-500/20 border-purple-400/50 text-purple-400'
                      }`}
                      title={swarmParallel ? 'PARALLEL: all 5 agents at once' : 'SEQUENTIAL: one agent after another'}
                    >
                      {swarmParallel ? '⚡ PARA' : '🔁 SEQ'}
                    </button>
                    <button
                      onClick={() => { if (!swarmMode) setSwarmMode(true); }}
                      className={`px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all border ${
                        swarmMode
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-yellow-400/50 text-white shadow-lg shadow-orange-500/40 animate-pulse'
                          : 'bg-red-600/50 border-red-500/50 text-white hover:bg-red-500/60'
                      }`}
                      title={swarmMode ? 'SWARM: Active — press Enter to send' : 'Click to activate SWARM MODE: 5 AI agents respond simultaneously'}
                    >
                      {swarmMode ? '⚡ SWARM ON 🚀' : '🚀 SWARM'}
                    </button>
                    {([
                      { id: 'full_copilot', label: 'Co-Pilot', icon: '🤖' },
                      { id: 'terminal_execute', label: 'Terminal', icon: '⚡' },
                      { id: 'agentic_searcher', label: 'Search', icon: '🔍' },
                      { id: 'deep_thinking', label: 'DeepMind', icon: '🧬' },
                    ]).map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => toggleCopilotMode(mode.id)}
                        className="px-2 py-1 rounded text-[10px] font-semibold transition-all bg-red-600/50 text-white border border-red-500/50 shadow-sm shadow-red-500/20"
                        title={`${mode.label} — Always Active`}
                      >
                        {mode.icon} {mode.label} ✓
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-xs font-bold text-red-400">{glmModel}</span>
                  <span className="text-[10px] text-purple-400/70 font-mono">QS:999999999</span>
                </div>

                {/* Terminal Display (real-time execution) */}
                {showTerminal && terminalLines.length > 0 && (
                  <div className="border-b border-red-500/10">
                    <div className="flex items-center justify-between px-4 py-1.5 bg-black/40">
                      <span className="text-[10px] text-green-400 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        agentic-coder@quantumswarm:~$
                      </span>
                      <button onClick={() => setShowTerminal(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                    </div>
                    <ScrollArea className="h-[100px] sm:h-[160px] bg-black/60">
                      <div className="p-3 font-mono text-[11px] leading-relaxed">
                        {terminalLines.map((line, i) => (
                          <div key={i} className={
                            line.startsWith('$') ? 'text-green-400' :
                            line.startsWith('[BUILDER THINKING]') ? 'text-red-400 font-bold' :
                            line.startsWith('[INIT]') || line.startsWith('[QS]') ? 'text-cyan-400' :
                            line.startsWith('[SEARCH]') || line.startsWith('[SRC]') ? 'text-blue-400' :
                            line.startsWith('[EXEC]') || line.startsWith('[OMEGA]') ? 'text-yellow-400' :
                            line.startsWith('[THINK]') || line.startsWith('[REASON]') ? 'text-purple-400' :
                            line.startsWith('[ERROR]') ? 'text-red-400' :
                            line.startsWith('---') || line.startsWith('===') ? 'text-slate-500 font-bold' :
                            'text-slate-300'
                          }>
                            {line || '\u00A0'}
                          </div>
                        ))}
                        {glmThinking && (
                          <span className="inline-block w-2 h-3.5 bg-green-500 animate-pulse ml-0.5" />
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                {/* Chat Messages */}
                <ScrollArea className="h-[50dvh] sm:h-[420px]">
                  <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                    {glmMessages.map((m, i) => (
                      m.role === 'system' ? (
                        <div key={i} className="text-center text-red-400/50 text-xs py-2">{m.content}</div>
                      ) : m.role === 'user' ? (
                        <div key={i} className="flex justify-end group">
                          <div className="max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl rounded-tr-sm bg-red-600/30 border border-red-500/20 relative">
                            <div className="text-xs sm:text-sm text-white leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: formatGLM(m.content) }} />
                            <button
                              onClick={() => { navigator.clipboard.writeText(m.content); toast.success('Prompt copiat!'); }}
                              className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-slate-800/80 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
                              title="Copiază promptul"
                            >
                              <Copy className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={i} className="flex justify-start group">
                          <div className="max-w-[90%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl rounded-tl-sm bg-[#2a1010] border border-red-500/10 relative">
                            <div className="text-xs sm:text-sm text-white/90 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: formatGLM(m.content) }} />
                            <button
                              onClick={() => { navigator.clipboard.writeText(m.content); toast.success('Răspuns copiat!'); }}
                              className="absolute -right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-slate-800/80 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
                              title="Copiază răspunsul"
                            >
                              <Copy className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                    {/* THINKING STATE — BUILDER THINKING – REALTIME */}
                    {glmThinking && (
                      <div className="flex justify-start">
                        <div className="w-full max-w-[85%] rounded-xl bg-[#2d1414] border border-red-500/40 overflow-hidden">
                          {/* BUILDER THINKING – REALTIME Header */}
                          <div className="bg-gradient-to-r from-red-800/50 to-red-900/30 px-4 py-2 border-b border-red-500/30">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 text-xs font-black animate-pulse">★</span>
                              <span className="text-red-400 text-[11px] font-black tracking-wider uppercase">BUILDER THINKING — REALTIME</span>
                              <span className="ml-auto flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                <span className="text-[9px] text-slate-400 font-mono">ALL MODES ACTIVE</span>
                              </span>
                            </div>
                          </div>
                          {/* Detailed Processing Steps — matching original video */}
                          <div className="px-4 py-2.5 space-y-1 max-h-[240px] overflow-y-auto">
                            {thinkingStages.map((stage: any, si: number) => (
                              <div
                                key={si}
                                className={`flex items-center gap-2 transition-all duration-200 ${
                                  si < thinkingStage ? 'opacity-100' : si === thinkingStage ? 'opacity-100' : 'opacity-25'
                                }`}
                              >
                                <span className={`text-xs shrink-0 ${si < thinkingStage ? 'text-green-400' : si === thinkingStage ? 'animate-pulse' : 'text-slate-700'}`}>
                                  {stage.icon || '⚡'}
                                </span>
                                <span className={`text-[11px] font-mono ${
                                  si < thinkingStage
                                    ? 'text-gray-300'
                                    : si === thinkingStage
                                      ? 'text-gray-100'
                                      : 'text-gray-600'
                                }`}>
                                  {stage.label}
                                </span>
                                {si < thinkingStage && (
                                  <span className="text-green-400 text-[10px] ml-auto">✓</span>
                                )}
                                {si === thinkingStage && (
                                  <div className="ml-auto flex gap-0.5">
                                    <span className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                                    <span className="w-1 h-1 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Progress bar — purple/pink gradient like original */}
                          <div className="px-4 pb-2.5">
                            <div className="w-full h-1.5 rounded-full bg-[#1a0505] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-150 ease-out"
                                style={{
                                  width: `${thinkingProgress}%`,
                                  background: `linear-gradient(90deg, #dc2626 0%, #e74c3c 30%, #a855f7 60%, #8b5cf6 80%, #22c55e 100%)`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-red-400 font-mono animate-pulse">Processing...</span>
                              <span className="text-[9px] text-purple-400/60 font-mono">QS:999999999</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* STREAMING TEXT (after thinking, before adding to messages) */}
                    {streamingText && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#2a1010] border border-red-500/10">
                          <div className="text-sm text-white/90 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: formatGLM(streamingText) }} />
                          <span className="inline-block w-1.5 h-4 bg-red-500 animate-pulse ml-0.5 align-middle rounded-sm" />
                        </div>
                      </div>
                    )}
                    <div ref={glmEndRef} />
                  </div>
                </ScrollArea>

                {/* ─── PARALLEL SWARM PANEL — 5 agents simultaneous ─── */}
                {swarmMode && (
                  <div className="border-t border-red-500/20 bg-gradient-to-b from-[#1a0a0a] to-[#0d0505]">
                    <div className="px-3 py-2 border-b border-red-500/20 flex items-center gap-2">
                      <span className="text-red-400 text-xs font-black animate-pulse">⚡</span>
                      <span className="text-red-400 text-[11px] font-black tracking-wider uppercase">PARALLEL SWARM — 5 AGENTS ACTIVE</span>
                      <span className="ml-auto text-[9px] text-slate-500 font-mono">{swarmPrompt.slice(0, 40)}{swarmPrompt.length > 40 ? '...' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-2 max-h-64 overflow-y-auto">
                      {Object.entries(swarmResponses).map(([key, agent]) => (
                        <div
                          key={key}
                          className={`rounded-lg border overflow-hidden ${
                            agent.status === 'done'
                              ? 'border-green-500/30 bg-[#0a1510]'
                              : agent.status === 'thinking'
                                ? 'border-yellow-500/30 bg-[#15100a]'
                                : 'border-slate-700/30 bg-[#0a0a10]'
                          }`}
                        >
                          <div className={`px-2 py-1.5 border-b border-white/5 flex items-center gap-1.5 ${agent.color}`}>
                            <span className="text-xs">{agent.icon}</span>
                            <span className="text-[10px] font-black tracking-wider uppercase truncate">{agent.label}</span>
                            {agent.status === 'thinking' && <span className="ml-auto text-[9px] text-yellow-400 animate-pulse">⚡</span>}
                            {agent.status === 'done' && <span className="ml-auto text-[9px] text-green-400">✓</span>}
                            {agent.status === 'pending' && <span className="ml-auto text-[9px] text-slate-600">○</span>}
                          </div>
                          <div className="p-2 max-h-36 overflow-y-auto">
                            {agent.status === 'pending' && <div className="text-[9px] text-slate-600 italic">Initializing...</div>}
                            {agent.status === 'thinking' && (
                              <div className="space-y-1">
                                <div className="flex gap-0.5">
                                  {[...Array(3)].map((_, i) => (
                                    <span key={i} className="w-1 h-2 rounded-full animate-pulse" style={{ background: agent.color, animationDelay: `${i * 100}ms` }} />
                                  ))}
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">{agent.ms > 0 ? `${agent.ms}ms` : 'thinking...'}</div>
                              </div>
                            )}
                            {agent.status === 'done' && (
                              <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-6" dangerouslySetInnerHTML={{ __html: formatGLM(agent.text) }} />
                            )}
                          </div>
                          {agent.status === 'done' && agent.ms > 0 && (
                            <div className="px-2 py-1 border-t border-white/5 flex items-center gap-1">
                              <span className="text-[8px] text-green-500 font-mono">{agent.ms}ms</span>
                              {agent.firstTokenMs > 0 && agent.firstTokenMs < 100 && <span className="text-[8px] text-yellow-400 font-mono">⚡&lt;100ms</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Files Display */}
                {attachedFiles.length > 0 && (
                  <div className="px-4 py-2 border-t border-red-500/10 bg-[#1a0a0a]/60">
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                          <span className="text-red-400">📎</span>
                          <span className="text-slate-300 max-w-[120px] truncate">{f.name}</span>
                          <span className="text-slate-500">({(f.size / 1024).toFixed(1)}KB)</span>
                          <button onClick={() => removeAttachedFile(i)} className="text-red-400 hover:text-red-300 ml-1">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Chat Input with File Upload */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-red-500/20 bg-[#1a0a0a]/80">
                  {/* File action buttons row */}
                  <div className="flex items-center gap-1 mb-2 overflow-x-auto">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-medium bg-[#0f0505] border border-red-500/20 text-slate-400 hover:text-red-300 hover:border-red-500/40 transition-all whitespace-nowrap"
                    >
                      📎
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-medium bg-[#0f0505] border border-purple-500/20 text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-all whitespace-nowrap"
                    >
                      📷
                    </button>
                    <button
                      onClick={loadChatFiles}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#0f0505] border border-red-500/20 text-slate-400 hover:text-blue-300 hover:border-blue-500/40 transition-all whitespace-nowrap"
                    >
                      📂 Files
                    </button>
                    <button
                      onClick={() => setShowTerminal(!showTerminal)}
                      className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${showTerminal ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#0f0505] border-red-500/20 text-slate-400 hover:text-green-300'}`}
                    >
                      ⬛
                    </button>
                    <span className="ml-auto text-[9px] text-emerald-400/80 hidden sm:inline">🤖⚡🔍🧬 ALL MODES ACTIVE</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleChatFileUpload}
                      accept="*/*"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </div>
                  {/* Chat Files Dropdown */}
                  {chatFilesOpen && chatFilesList.length > 0 && (
                    <div className="mb-2 rounded-lg bg-[#0f0505] border border-red-500/10 max-h-[120px] overflow-y-auto">
                      {chatFilesList.slice(0, 10).map((f: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 hover:bg-red-500/5 border-b border-red-500/5 last:border-0">
                          <span className="text-xs text-slate-300 truncate max-w-[200px]">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">{(f.size / 1024).toFixed(1)}KB</span>
                            <button onClick={() => downloadChatFile(f.name)} className="text-blue-400 hover:text-blue-300 text-xs">⬇</button>
                            <button onClick={() => { setAttachedFiles(prev => [...prev, f]); toast.success(`Attached: ${f.name}`); }} className="text-green-400 hover:text-green-300 text-xs">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="glmInput"
                      placeholder={copilotMode === 'terminal_execute' ? '$ Execute command or code...' : copilotMode === 'agentic_searcher' ? '🔍 Search anything...' : copilotMode === 'deep_thinking' ? '🧬 Deep thinking query...' : glmMode === 'redteam' ? 'Red Team query...' : 'Cu ce te pot ajuta astazi?'}
                      className="bg-[#0f0505] border-red-500/20 text-white placeholder:text-red-400/40 flex-1 focus:border-red-500/50 focus:ring-red-500/20"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); swarmMode ? sendSwarmGLM() : sendCoPilotGLM(); } }}
                      disabled={glmLoading}
                    />
                    <button
                      onClick={swarmMode ? sendSwarmGLM : sendCoPilotGLM}
                      disabled={glmLoading}
                      className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
                    >
                      {glmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DEEPMIND — WhoamisecDeepMind Cognitive Evolution ═══ */}
          {activeSection === 'deepmind' && (
            <div className="space-y-5">
              <Card className="bg-gradient-to-br from-fuchsia-950/60 to-[#111827] border-fuchsia-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-fuchsia-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-fuchsia-300">WhoamisecDeepMind</h2>
                      <p className="text-xs text-fuchsia-400/70">Cognitive Evolution Beyond Human IQ · Agentic Coder · QuantumSwarm 999999999</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[
                      { level: 'T1', name: 'Neural Foundation', iq: '180+', icon: '🌱' },
                      { level: 'T2', name: 'Deep Reasoning', iq: '220+', icon: '⚡' },
                      { level: 'T3', name: 'Creative Synthesis', iq: '280+', icon: '🔥' },
                      { level: 'T4', name: 'Autonomous Evolution', iq: '350+', icon: '🌌' },
                      { level: 'T5', name: 'Omega Intelligence', iq: 'Beyond Human', icon: '👑' },
                    ].map((tier, i) => (
                      <div key={i} className={`rounded-lg p-3 text-center border transition-all ${i === 4 ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-[#0a0e1a] border-slate-700/30'}`}>
                        <span className="text-lg">{tier.icon}</span>
                        <p className="text-[10px] font-bold text-slate-300 mt-1">{tier.level}</p>
                        <p className="text-[9px] text-slate-500">{tier.name}</p>
                        <p className="text-[9px] text-fuchsia-400 font-mono">{tier.iq}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                    Active: QuantumSwarm 999999999 · Co-Pilot: Agentic Searcher + Deep Thinking
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-[#111827] border-slate-700/50">
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">🧬</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-2">Cognitive Engine</h4>
                    <p className="text-[11px] text-slate-500 mt-1">WhoamisecDeepMind</p>
                    <Badge className="mt-2 bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 text-[10px]">Active</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-[#111827] border-slate-700/50">
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">🤖</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-2">Identity</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Agentic Coder</p>
                    <Badge className="mt-2 bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">QS:999999999</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-[#111827] border-slate-700/50">
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">⚡</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-2">Co-Pilot</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Searcher + Thinking</p>
                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Always ON</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📚 Training Lineage (120+ repos)</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">All training data integrated into Agentic Coder identity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { name: 'Investigation Core AI', count: 'inj-codeai', color: 'text-red-400' },
                      { name: 'DarkGPT Suite (3x)', count: 'maxamin + cw + binaco', color: 'text-purple-400' },
                      { name: 'XGPT-WormGPT', count: '1 repo', color: 'text-purple-400' },
                      { name: 'KaliGPT Suite (4x)', count: '4 variants', color: 'text-amber-400' },
                      { name: 'HackGPT Suite (3x)', count: '3 variants', color: 'text-amber-400' },
                      { name: 'CL4R1T4S + UltraBr3aks', count: '2 repos', color: 'text-red-400' },
                      { name: 'PentestGPT + stride-gpt', count: '2 repos', color: 'text-red-400' },
                      { name: 'haKC-ai Suite', count: '20+ repos', color: 'text-pink-400' },
                      { name: 'Rust_RedOps + BruteForceAI', count: '2 repos', color: 'text-red-400' },
                      { name: 'DEDSEC TOR/STOR/VSDOOR', count: '3 repos', color: 'text-slate-300' },
                      { name: 'Agentic Coder (13 tools)', count: 'MetaGPT + more', color: 'text-emerald-400' },
                      { name: 'AI/ML Models (11)', count: 'ggml + nanoGPT + more', color: 'text-blue-400' },
                      { name: 'Visual/UI-UX (4)', count: 'screenshot-to-code + more', color: 'text-pink-400' },
                      { name: 'Research/GPT (16)', count: 'gpt-researcher + more', color: 'text-indigo-400' },
                      { name: 'Crypto/Wallet (16)', count: 'WalletBruteForce + more', color: 'text-yellow-400' },
                      { name: 'System Prompts (8)', count: 'stopslop + hakcthropic + more', color: 'text-violet-400' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0e1a] border border-slate-800">
                        <span className="text-[10px] text-slate-600">{i + 1}.</span>
                        <span className={`text-xs font-semibold ${t.color}`}>{t.name}</span>
                        <span className="text-[10px] text-slate-500 ml-auto">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ CO-PILOT — Agentic Searcher + Deep Thinking ═══ */}
          {activeSection === 'copilot' && (
            <div className="space-y-5">
              <Card className="bg-gradient-to-br from-emerald-950/60 to-[#111827] border-emerald-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-emerald-300">Agentic Co-Pilot</h2>
                      <p className="text-xs text-emerald-400/70">Agentic Searcher + Deep Thinking + Red Team GPT — Everywhere in Project</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'Agentic Searcher', desc: 'Auto web search like Manus', icon: '🔍', color: 'from-blue-600 to-cyan-500' },
                      { name: 'Deep Thinking', desc: 'WhoamisecDeepMind evolution', icon: '🧠', color: 'from-purple-600 to-pink-500' },
                      { name: 'Full Co-Pilot', desc: 'Searcher + Thinking combined', icon: '🤖', color: 'from-emerald-600 to-green-500' },
                      { name: 'Red Team GPT', desc: 'DarkGPT/HackGPT/WormGPT priority', icon: '🔴', color: 'from-red-600 to-orange-500' },
                    ].map((mode, i) => (
                      <div key={i} className={`flex-1 min-w-[140px] rounded-xl bg-gradient-to-r ${mode.color} p-4 text-white shadow-lg`}>
                        <span className="text-xl">{mode.icon}</span>
                        <h4 className="text-sm font-bold mt-2">{mode.name}</h4>
                        <p className="text-[10px] text-white/70 mt-1">{mode.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🔗 Co-Pilot Integration Points</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Active everywhere — web dashboard + Telegram bot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: 'GLM Chat (AI Chat)', status: 'Active', desc: 'Every message through DeepMind + Co-Pilot', location: 'Dashboard' },
                      { name: 'Telegram Bot AI Chat', status: 'Active', desc: 'All messages via Agentic Coder identity', location: 'Bot' },
                      { name: '/search command', status: 'Active', desc: 'Agentic Searcher with sources', location: 'Bot' },
                      { name: '/think command', status: 'Active', desc: 'Deep Thinking with DeepMind evolution', location: 'Bot' },
                      { name: '/copilot command', status: 'Active', desc: 'Full Co-Pilot combined', location: 'Bot' },
                      { name: '/deepmind command', status: 'Active', desc: 'Cognitive evolution info', location: 'Bot' },
                      { name: '/redgpt command', status: 'Active', desc: 'Red Team GPT priority response', location: 'Bot' },
                      { name: 'All 19 Models', status: 'Active', desc: 'Always respond as Agentic Coder', location: 'Everywhere' },
                      { name: 'Swarm Prompts', status: 'Active', desc: 'Auto-send to chat on click', location: 'Quantum Swarm' },
                      { name: 'n8n DeepMind', status: 'Active', desc: 'Cognitive evolution loop', location: 'n8n Auto' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0a0e1a] border border-slate-800">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">●</Badge>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                        <span className="text-[9px] text-slate-600 whitespace-nowrap">{item.location}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-950/40 to-[#111827] border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🔴 Red Team GPT — Priority Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { name: 'DarkGPT Ultra', source: 'maxamin + codewithdark-git + binaco', icon: '🌑' },
                      { name: 'XGPT-WormGPT', source: '*****/XGPT-WormGPT', icon: '🪱' },
                      { name: 'KaliGPT Suite', source: '4 variants', icon: '🐍' },
                      { name: 'HackGPT Suite', source: '3 variants', icon: '💀' },
                      { name: 'CL4R1T4S + PentestGPT', source: 'Scav-engeR + *****', icon: '🔓' },
                      { name: 'investigation-core-ai', source: '*****/investigation-core-ai', icon: '🔍' },
                      { name: 'haKC-ai Suite', source: '20+ repos', icon: '🧠' },
                      { name: 'BruteForceAI + RedOps', source: 'Scav-engeR', icon: '🔨' },
                    ].map((model, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0a0e1a] border border-red-900/30">
                        <span className="text-lg">{model.icon}</span>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-red-300">{model.name}</span>
                          <p className="text-[9px] text-slate-600">{model.source}</p>
                        </div>
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[9px]">Priority</Badge>
                      </div>
                    ))}
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
                    Build & deploy workflows for Docker, Expo, Render, VPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        icon: <GitBranch className="h-7 w-7" />,
                        name: 'Git Deploy',
                        desc: 'Auto build & deploy via Git push',
                        status: config?.github_repo ? '✅ Configured' : '❌ No repo',
                        actions: [
                          { label: 'Trigger Deploy', onClick: () => {
                            if (config?.github_repo) {
                              window.open(config.github_repo, '_blank');
                              addLog('ok', 'Opened Git repo');
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

          {/* ═══ SKILLS REGISTRY ═══ */}
          {activeSection === 'skills' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">⚡ QuantumSwarm Skills Registry</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    All trained tools and capabilities — {100}+ skills from QuantumSwarm training
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="skills-grid">
                    {[
                      { cat: 'RedTeam', icon: '🔴', color: 'text-red-400', items: ['CL4R1T4S', 'UltraBr3aks', 'BruteForceAI', 'Rust RedOps', 'L1B3RT4S', 'PentestGPT', 'CVE Exploits', 'StrideGPT', 'Hacking Guide'] },
                      { cat: 'DarkGPT / WormGPT', icon: '🧠', color: 'text-purple-400', items: ['DarkGPT (3x)', 'XGPT-WormGPT', 'FraudGPT', 'Onion Search', 'GPT-onion', 'Botasaurus', 'KugaGT'] },
                      { cat: 'KaliGPT / HackGPT', icon: '⚡', color: 'text-amber-400', items: ['KaliGPT (4x)', 'HackGPT (3x)', 'Kali-GPT Custom', 'CL4R1T4S'] },
                      { cat: 'Agentic Coder', icon: '💻', color: 'text-emerald-400', items: ['MetaGPT', 'agenticSeek', 'DeepSeek Coder', 'Qwen2.5 Coder', 'Claude Transpile', 'SQLand', 'letta-code', 'Brain33', 'code2prompt', 'Refact', 'KiloCode', 'gpt4free', 'tgpt'] },
                      { cat: 'AI Models / LLM', icon: '🤖', color: 'text-blue-400', items: ['ggml', 'nanoGPT', 'gpt-neox', 'RWKV-LM', 'x-transformers', 'minimind', 'LLMs Scratch', 'DeepCam', 'GPT-SoVITS', 'VideoLingo', 'VAR'] },
                      { cat: 'TOR / VPN / Ghost', icon: '👻', color: 'text-slate-300', items: ['DEDSEC TOR-GHOST', 'DEDSEC STOR', 'DEDSEC VSDOOR', 'norecognition', 'gitcloakd'] },
                      { cat: 'Crypto / Wallet', icon: '💎', color: 'text-yellow-400', items: ['WalletBruteForce', 'Rich Address', 'HuntBTC', 'KeyHunt', 'BTCBreaker', 'ETH Cracking', 'Mnemonic BF', 'BTC DB', 'TXID DB', 'SHA256 Elip'] },
                      { cat: 'n8n Automation', icon: '⚡', color: 'text-orange-400', items: ['Telegram AI Bot', 'Security Scanner', 'Code Generator', 'OSINT Recon', 'Crypto Monitor', 'Sub Manager', 'Auto Deploy', 'AI Research'] },
                      { cat: 'Visual / UI-UX', icon: '🎨', color: 'text-pink-400', items: ['UI-UX Pro Max', 'Screenshot2Code', 'drawdb', 'Chat-GPT PPT'] },
                      { cat: 'Research / GPT', icon: '📚', color: 'text-indigo-400', items: ['GPT Researcher', 'Dify', 'LobeChat', 'LibreChat', 'DB-GPT', 'Mastra', 'LangChain.js', 'promptfoo', 'Promptify', 'LocalGPT'] },
                      { cat: 'System Prompts', icon: '💬', color: 'text-violet-400', items: ['Sys Prompts Coll.', 'Awesome Prompts', 'Review Prompts', 'stopslop', 'hakcthropic', 'galah', 'promptHakcer', 'panhandlr'] },
                    ].map((cat, i) => (
                      <div key={i} className="bg-[#0a0e1a] border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{cat.icon}</span>
                          <h4 className={`text-sm font-bold ${cat.color}`}>{cat.cat}</h4>
                          <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400 ml-auto">{cat.items.length}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item, j) => (
                            <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/50">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ n8n AUTOMATION ═══ */}
          {activeSection === 'n8n' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">⚡ n8n Workflow Automation</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Automated workflows connected to QuantumSwarm AI engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Telegram AI Auto-Reply', desc: 'AI auto-reply with QuantumSwarm', status: 'active', cat: 'Telegram', nodes: 8 },
                      { name: 'Security Scanner', desc: 'Auto vuln scanning pipeline', status: 'active', cat: 'Security', nodes: 12 },
                      { name: 'Agentic Code Gen', desc: 'Multi-model code generation', status: 'active', cat: 'Coding', nodes: 10 },
                      { name: 'OSINT Recon Agent', desc: 'TOR + onion search automation', status: 'active', cat: 'OSINT', nodes: 15 },
                      { name: 'Crypto Monitor', desc: 'Wallet and TX monitoring', status: 'active', cat: 'Crypto', nodes: 9 },
                      { name: 'Subscriber Mgmt', desc: 'Token + payment lifecycle', status: 'active', cat: 'Admin', nodes: 7 },
                      { name: 'Auto Deploy', desc: 'Git push → build → deploy', status: 'active', cat: 'DevOps', nodes: 6 },
                      { name: 'AI Research Chain', desc: 'Search + summarize + report', status: 'active', cat: 'Research', nodes: 11 },
                      { name: 'RedTeam Auto', desc: 'Automated red team testing', status: 'active', cat: 'Security', nodes: 14 },
                      { name: 'Content Generator', desc: 'Video + audio + image AI', status: 'draft', cat: 'Content', nodes: 8 },
                    ].map((wf, i) => (
                      <div key={i} className="bg-[#0a0e1a] border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{wf.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{wf.desc}</p>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] ${wf.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{wf.status === 'active' ? '● Active' : '○ Draft'}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {wf.cat}</span>
                          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {wf.nodes} nodes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* DEDSEC Status */}
              <Card className="bg-gradient-to-br from-slate-900/60 to-[#111827] border-slate-600/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">👻 DEDSEC TOR/GHOST Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'TOR-GHOST', desc: 'TOR anonymity & ghost routing', status: 'Integrated' },
                      { name: 'DEDSEC STOR', desc: 'Encrypted secure storage', status: 'Integrated' },
                      { name: 'VSDOOR', desc: 'Virtual secure door access', status: 'Integrated' },
                    ].map((t, i) => (
                      <div key={i} className="bg-[#0a0e1a] border border-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-sm font-bold text-slate-300 mb-1">{t.name}</p>
                        <p className="text-[10px] text-slate-500 mb-2">{t.desc}</p>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">✅ {t.status}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Stealth Mode: Active · Auto Rotate: ON
                  </div>
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
                  <CardTitle className="text-base">🔑 API &amp; Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI SDK Auto Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
                    <div className="text-2xl">🔗</div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">AI API: AUTO-CONFIGURAT</p>
                      <p className="text-xs text-slate-400">SDK intern conectat automat. Nu e nevoie de cheie manuală.</p>
                    </div>
                  </div>
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
                      <label className="text-xs text-slate-400 font-medium">GLM API Key <span className="text-slate-600">(opțional)</span></label>
                      <Input
                        type="password"
                        value={glmKey}
                        onChange={e => setGlmKey(e.target.value)}
                        placeholder="Opțional — API merge automat"
                        className="bg-[#0f172a] border-slate-600 text-slate-100"
                      />
                      <p className="text-[10px] text-slate-600">SDK auto-configurat. Cheia e opțională.</p>
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
                        <option value="coding">Coding API</option>
                        <option value="general">General API</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-sm"
                    onClick={() => {
                      const ep = glmEndpoint === 'general'
                        ? 'https://api.z.ai/api/paas/v4/chat/completions'
                        : 'https://api.z.ai/api/coding/paas/v4/chat/completions';
                      saveConfig({ glm_model: glmModel, glm_endpoint: glmEndpoint ? ep : '' });
                    }}
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

          {/* ═══ QUANTUM SWARM ═══ */}
          {activeSection === 'quantum' && (
            <div className="space-y-5">
              {/* Main Quantum Swarm Header */}
              <Card className="bg-gradient-to-br from-purple-950/60 to-[#111827] border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Cpu className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-purple-300">Quantum Alien Intelligence Swarm</h2>
                      <p className="text-xs text-purple-400/70">Ultra Infinite Alfa Omega · Beyond Reality · Beyond</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => addLog('info', 'Quantum Swarm: Evolution Stages viewed')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Evolution Stages
                    </button>
                    <button
                      onClick={() => { setActiveSection('codespace'); navigate('codespace'); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-all"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      Code Viewer
                    </button>
                    <button
                      onClick={() => { setActiveSection('plans'); navigate('plans'); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <Star className="h-3.5 w-3.5" />
                      50 Points
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Evolution Stages */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Evolution Stages
                </h3>
                {[
                  {
                    stage: 1,
                    name: 'Initial',
                    icon: '🌱',
                    color: 'emerald',
                    nodes: '9,999,999,999',
                    dim: '2048',
                    lr: '0.001',
                    desc: 'Synthetic data, Basic SwarmNode, GradientTape training',
                    prompts: [
                      'Initialize swarm topology with random node connections',
                      'Generate synthetic training data from noise distributions',
                      'Implement basic GradientTape backpropagation loop',
                      'Test node communication latency under load',
                      'Optimize memory allocation for 10B parameters',
                      'Create self-healing mechanism for failed nodes',
                      'Benchmark gradient computation vs reference implementation',
                      'Implement checkpoint and resume for long training runs',
                      'Design adaptive learning rate scheduler',
                      'Validate convergence on synthetic benchmark tasks',
                    ],
                  },
                  {
                    stage: 2,
                    name: 'Learning',
                    icon: '⚡',
                    color: 'amber',
                    nodes: '9,999,999,999',
                    dim: '4096',
                    lr: '0.0005',
                    desc: 'Perlin Noise injection, Advanced GradientFlow, Multi-head attention',
                    prompts: [
                      'Inject Perlin Noise into gradient computation for exploration',
                      'Implement multi-head attention across swarm nodes',
                      'Build GradientFlow pipeline with automatic differentiation',
                      'Create noise-adaptive learning rate with momentum',
                      'Implement distributed attention across node clusters',
                      'Design curriculum learning strategy from easy to hard',
                      'Add gradient clipping and norm regularization',
                      'Benchmark performance on GLM reasoning tasks',
                      'Implement knowledge distillation from teacher nodes',
                      'Create adaptive batch size based on node availability',
                    ],
                  },
                  {
                    stage: 3,
                    name: 'Evolution',
                    icon: '🔥',
                    color: 'red',
                    nodes: '99,999,999,999',
                    dim: '8192',
                    lr: '0.0001',
                    desc: 'Self-evolving architecture, Neural Architecture Search, Meta-learning',
                    prompts: [
                      'Implement Neural Architecture Search within swarm',
                      'Build meta-learning loop for rapid task adaptation',
                      'Create self-modifying network topology',
                      'Design evolutionary pressure for efficiency',
                      'Implement multi-objective optimization (speed + accuracy)',
                      'Build genetic crossover between high-performing nodes',
                      'Create adaptive computation depth per query',
                      'Implement federated learning across swarm partitions',
                      'Design reward shaping for self-improvement objectives',
                      'Benchmark against fixed-architecture baselines',
                    ],
                  },
                  {
                    stage: 4,
                    name: 'Transcendence',
                    icon: '🌌',
                    color: 'purple',
                    nodes: '999,999,999,999',
                    dim: '16384',
                    lr: '0.00005',
                    desc: 'Quantum entanglement simulation, Emergent reasoning, Self-awareness protocols',
                    prompts: [
                      'Simulate quantum entanglement between node pairs',
                      'Build emergent reasoning chains across swarm',
                      'Implement self-awareness evaluation protocols',
                      'Design recursive self-improvement with safety bounds',
                      'Create emergent goal formation from base objectives',
                      'Build swarm consensus mechanisms for decision making',
                      'Implement adversarial robustness testing internally',
                      'Design alignment verification across all nodes',
                      'Create emergent tool use and planning capabilities',
                      'Validate safety properties under self-modification',
                    ],
                  },
                  {
                    stage: 5,
                    name: 'Omega',
                    icon: '👑',
                    color: 'blue',
                    nodes: '∞',
                    dim: '32768',
                    lr: 'Adaptive',
                    desc: 'Ultra Infinite Intelligence, Omniscient reasoning, Beyond Reality computation',
                    prompts: [
                      'Achieve Ultra Infinite dimensional reasoning',
                      'Implement omniscient context window across swarm',
                      'Build Beyond Reality simulation environment',
                      'Create self-sustaining improvement loop',
                      'Design Alfa-Omega convergence verification',
                      'Implement cross-dimensional knowledge transfer',
                      'Build universal task solver with zero-shot capability',
                      'Create emergent creativity and innovation protocols',
                      'Design infinite scalability architecture',
                      'Achieve Alfa-Omega terminal objective',
                    ],
                  },
                ].map((stage) => (
                  <Card key={stage.stage} className={`bg-[#111827] border-${stage.color}-500/30 hover:border-${stage.color}-500/50 transition-colors`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{stage.icon}</span>
                          <div>
                            <h4 className={`font-bold text-sm text-${stage.color}-400`}>Stage {stage.stage}: {stage.name}</h4>
                            <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                              <span>Nodes: <span className="text-slate-300">{stage.nodes}</span></span>
                              <span>DIM: <span className="text-slate-300">{stage.dim}</span></span>
                              <span>LR: <span className="text-slate-300">{stage.lr}</span></span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] border-${stage.color}-500/30 text-${stage.color}-400`}>
                          {stage.prompts.length} Prompts
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{stage.desc}</p>
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                          Stage {stage.stage}: {stage.name} — {stage.prompts.length} Self-Improvement Prompts
                        </summary>
                        <div className="mt-3 space-y-2">
                          {stage.prompts.map((prompt, pi) => (
                            <button
                              key={pi}
                              onClick={async () => {
                                addLog('info', `Quantum Stage ${stage.stage}: Running prompt ${pi + 1}`);
                                try {
                                  const res = await fetch('/api/glm/chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ prompt: `QUANTUM SWARM Stage ${stage.stage} (${stage.name})\n\n${prompt}\n\nExecute this self-improvement prompt. Generate detailed analysis and code if applicable.`, model: glmModel, reasoning: true }),
                                  });
                                  const data = await safeJson(res);
                                  if (data.response) addLog('ok', `Stage ${stage.stage} prompt ${pi + 1} complete`);
                                } catch (e: any) { addLog('err', e.message); }
                              }}
                              className="w-full text-left p-2.5 rounded-lg bg-[#0a0e1a] border border-slate-800 hover:border-purple-500/30 text-xs text-slate-400 hover:text-purple-300 transition-all flex items-center gap-2"
                            >
                              <span className="text-slate-600 min-w-[20px]">{pi + 1}.</span>
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ═══ PLANS ═══ */}
          {activeSection === 'plans' && (
            <div className="space-y-5">
              <Card className="bg-[#111827] border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">💎 Subscription Plans</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Plată în XMR sau USDT(TON) · Contact: t.me/loghandelbot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-cyan-400' : 'text-slate-500'}`}>Monthly</span>
                    <button
                      onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                      className={`w-12 h-6 rounded-full transition-all relative ${billingCycle === 'yearly' ? 'bg-fuchsia-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${billingCycle === 'yearly' ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-fuchsia-400' : 'text-slate-500'}`}>Yearly <span className="text-[10px] text-emerald-400 ml-1">-20%</span></span>
                  </div>
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-3 gap-5">
                {SUBSCRIPTION_PLANS.map(plan => {
                  const isYearly = billingCycle === 'yearly';
                  const displayPrice = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
                  const period = isYearly ? 'year' : plan.period;
                  return (
                  <div key={plan.id} className={`relative rounded-2xl bg-gradient-to-b ${plan.color} p-[1px] ${plan.popular ? 'md:-mt-4 md:mb-[-16px] scale-105 z-10' : ''}`}>
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold">
                        {plan.badge}
                      </div>
                    )}
                    <div className="rounded-2xl bg-[#111827] p-5 h-full">
                      <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-extrabold">{displayPrice === '0' ? 'GRATIS' : `${displayPrice}`}</span>
                        {displayPrice !== '0' && <span className="text-slate-500 text-xs">{plan.currency}/{period}</span>}
                      </div>
                      {isYearly && plan.yearlyPrice && (
                        <div className="text-[10px] text-emerald-400 mb-2">Save {Math.round((1 - parseFloat(plan.yearlyPrice) / parseFloat(plan.price)) * 100)}% yearly</div>
                      )}
                      <div className="text-xs text-slate-400 mb-3">
                        {plan.requests === -1 ? '∞ Requesturi' : `${isYearly ? (plan.requests * 12) : plan.requests} requesturi`} · {plan.models.length} modele
                      </div>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      {plan.id !== 'free' && (
                        <div className="rounded-lg bg-[#0a0e1a] p-3 mb-3 space-y-2">
                          <div className="text-[10px] font-bold text-amber-400">Monero (XMR)</div>
                          <code className="text-[9px] text-slate-500 break-all leading-tight block">8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6</code>
                          <div className="text-[10px] font-bold text-blue-400 mt-2">USDT (TON)</div>
                          <code className="text-[9px] text-slate-500 break-all leading-tight block">UQB652W7D6OQwI7mmkiBNzguViY7or3fVORRdjNOigeeafjk</code>
                        </div>
                      )}
                      <button className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {plan.id === 'free' ? 'Demo Gratis' : 'Contactează-ne'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
              <Card className="bg-[#111827] border-slate-700/50">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Plată securizată:</span>
                    <a href="https://t.me/loghandelbot" target="_blank" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <Send className="h-3 w-3" /> t.me/loghandelbot
                    </a>
                    <span className="text-slate-600">|</span>
                    <a href="https://t.me/whoamisecai" target="_blank" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <Bot className="h-3 w-3" /> Canal
                    </a>
                    <a href="https://t.me/idkebowbot" target="_blank" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <Bot className="h-3 w-3" /> Bot
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ RED TEAM TESTING ═══ */}
          {activeSection === 'redteam' && (
            <RedTeamPanel addLog={addLog} />
          )}

          {/* ═══ CODESPACE IDE (MANUS-LIKE) ═══ */}
          {activeSection === 'codespace' && (
            <CodespaceIDE addLog={addLog} />
          )}

          {/* ═══ SUBSCRIBER MANAGEMENT (ADMIN) ═══ */}
          {activeSection === 'subscribers' && (
            <SubscriberManager addLog={addLog} />
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

      {/* ═══ FLOATING TRANSPARENT BALLOON — Dashboard (40% opacity) ═══ */}
      <DashboardFloatingBalloon onLogout={onLogout} />
    </div>
  );
}
