'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = ['Features', 'How It Works', 'For Traders', 'AI Tools']

const STATS = [
  { val: '5-Step',  label: 'Proven Entry Model' },
  { val: 'A++',     label: 'Grade System' },
  { val: 'Free',    label: 'Forever. No Credit Card' },
  { val: 'AI',      label: 'Powered Analysis' },
]

const FEATURES = [
  {
    icon: '🎯',
    title: 'Pre-Trade Checklist',
    desc: 'The 5-step Continuation Model checklist. Every confluence verified before you touch the market. A++ to F grading in real time.',
    tag: 'EXECUTION',
    color: '#00e5ff',
  },
  {
    icon: '📊',
    title: 'Cloud Trade Journal',
    desc: 'Log every trade with entry, SL, TP, screenshots, narrative, and mood. Syncs across all your devices instantly.',
    tag: 'CLOUD SYNC',
    color: '#39ff14',
  },
  {
    icon: '📈',
    title: 'Performance Dashboard',
    desc: 'Win rate, equity curve, P&L calendar, streak tracker, average RR. See exactly where your edge lives.',
    tag: 'ANALYTICS',
    color: '#ff6b35',
  },
  {
    icon: '🤖',
    title: 'AI Trade Analyzer',
    desc: 'Upload any chart screenshot and get an instant QT framework analysis — cycle detection, SSMT check, bias, entry zone, and grade.',
    tag: 'AI · FREE',
    color: '#c084ff',
  },
  {
    icon: '🔥',
    title: 'Mistake Pattern Engine',
    desc: 'The system tracks every mistake you tag. After 20+ trades it tells you exactly what keeps costing you money.',
    tag: 'SELF-MASTERY',
    color: '#ffcc00',
  },
  {
    icon: '📋',
    title: 'Post-Trade Deep Review',
    desc: 'Execution rating, emotional control score, what went right, ideal trade reconstruction. The review most traders skip.',
    tag: 'DISCIPLINE',
    color: '#00e5ff',
  },
]

const STEPS = [
  { n: '01', title: 'Create Free Account',   desc: 'Sign up in 30 seconds. No credit card. No trial. Completely free.' },
  { n: '02', title: 'Run Pre-Trade Check',    desc: 'Before every trade, verify all 5 steps. The system grades your setup live.' },
  { n: '03', title: 'Log & Screenshot',       desc: 'Journal the trade with charts, narrative, and context. Saved to cloud instantly.' },
  { n: '04', title: 'Let AI Find Patterns',   desc: 'After each session, the AI analyzes your data and tells you exactly what to fix.' },
]

const TESTIMONIALS = [
  { name: 'Yasir A.',  role: 'NQ/ES Futures · Think Capital',   text: 'I went from 40% win rate to consistently above 65% in 90 days. The 5-step checklist alone stopped all my FOMO entries.' },
  { name: 'Marcus T.', role: 'ES Futures · FTMO Funded',        text: 'The mistake pattern engine showed me I lose 80% of my Thursday trades. I just stopped trading Thursdays. Problem solved.' },
  { name: 'Aisha R.',  role: 'NQ · Prop Trader',                 text: 'The AI chart analyzer is insane. Upload a chart, get a full QT breakdown in 10 seconds. No paid subscription.' },
]

function Navbar({ scrolled }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg/95 backdrop-blur border-b border-border' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-display text-2xl tracking-widest text-accent glow-accent">
          TRADEPULSE
        </div>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              className="text-dim hover:text-bright text-xs tracking-widest uppercase transition-colors font-mono">
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-xs tracking-widest uppercase text-dim hover:text-bright transition-colors font-mono px-4 py-2">
            LOG IN
          </Link>
          <Link href="/signup"
            className="text-xs tracking-widest uppercase font-mono px-5 py-2.5 rounded bg-accent text-bg font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_0_20px_rgba(0,229,255,.4)]">
            START FREE
          </Link>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-a2/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Scan line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-40 animate-scan pointer-events-none z-50" />

      {/* Badge */}
      <div className="animate-fade-up opacity-0-init delay-100 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs tracking-widest uppercase font-mono mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
        Built for QT / ICT Traders · Free Forever
      </div>

      {/* Headline */}
      <h1 className="animate-fade-up opacity-0-init delay-200 font-display text-[clamp(3rem,10vw,7rem)] leading-none tracking-wider text-bright mb-4">
        MASTER YOUR
        <span className="block text-accent glow-accent">TRADING EDGE</span>
      </h1>

      <p className="animate-fade-up opacity-0-init delay-300 max-w-xl mx-auto text-dim text-sm leading-relaxed font-body mb-10">
        The journal built specifically for QT and ICT framework traders.
        5-step confluence checklist, AI chart analysis, mistake pattern detection,
        and cloud sync — all free, forever.
      </p>

      {/* CTAs */}
      <div className="animate-fade-up opacity-0-init delay-400 flex flex-col sm:flex-row gap-4 items-center mb-20">
        <Link href="/signup"
          className="group px-8 py-4 bg-accent text-bg font-mono font-semibold text-sm tracking-widest uppercase rounded hover:bg-accent/90 transition-all hover:shadow-[0_0_40px_rgba(0,229,255,.4)] hover:scale-105">
          START FOR FREE
          <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <a href="#how-it-works"
          className="px-8 py-4 border border-border text-dim font-mono text-sm tracking-widest uppercase rounded hover:border-accent/40 hover:text-bright transition-all">
          SEE HOW IT WORKS
        </a>
      </div>

      {/* Stats row */}
      <div className="animate-fade-up opacity-0-init delay-500 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded overflow-hidden w-full max-w-2xl">
        {STATS.map((s, i) => (
          <div key={i} className="bg-surface px-6 py-5 text-center">
            <div className="font-display text-3xl text-accent glow-accent tracking-wider">{s.val}</div>
            <div className="text-xs text-dim tracking-widest uppercase mt-1 font-mono">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="text-xs text-accent tracking-[4px] uppercase font-mono mb-4">Everything You Need</div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-wider text-bright">
            BUILT FOR <span className="text-a3 glow-green">DISCIPLINE</span>
          </h2>
          <p className="mt-4 text-dim max-w-lg mx-auto text-sm leading-relaxed font-body">
            Every feature exists for one reason — to help you execute your model consistently and learn from every trade.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group relative p-6 bg-surface border border-border rounded card-hover overflow-hidden">
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}08 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="text-3xl mb-4 animate-float" style={{ animationDelay: `${i * .4}s` }}>{f.icon}</div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-mono font-semibold text-bright text-sm tracking-wide">{f.title}</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full border font-mono tracking-widest"
                    style={{ borderColor: `${f.color}40`, color: f.color, background: `${f.color}10` }}>
                    {f.tag}
                  </span>
                </div>
                <p className="text-dim text-xs leading-relaxed font-body">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="text-xs text-accent tracking-[4px] uppercase font-mono mb-4">Simple Process</div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-wider text-bright">
            HOW IT <span className="text-accent glow-accent">WORKS</span>
          </h2>
        </div>
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div key={i} className="group flex gap-6 p-6 bg-surface border border-border rounded card-hover items-start">
              <div className="font-display text-5xl text-border group-hover:text-accent/30 transition-colors leading-none flex-shrink-0">
                {s.n}
              </div>
              <div>
                <h3 className="font-mono font-semibold text-bright mb-2 tracking-wide">{s.title}</h3>
                <p className="text-dim text-sm leading-relaxed font-body">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ForTradersSection() {
  return (
    <section id="for-traders" className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs text-a2 tracking-[4px] uppercase font-mono mb-4">5-Step Model</div>
            <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-wider text-bright mb-6">
              ONE SETUP.<br/><span className="text-a3 glow-green">FULLY</span><br/>CONFIRMED.
            </h2>
            <p className="text-dim text-sm leading-relaxed font-body mb-8">
              TradePulse is built around the Continuation Model — the highest probability setup for QT traders.
              The checklist enforces the exact stack that your journal proves works every time.
            </p>
            <div className="space-y-3">
              {['4H TPD in direction', 'Daily Cycle SMT on M15', '90M Cycle SMT on M5 (after Daily)', 'M5 TPD as entry trigger', 'Price on correct side of both True Opens'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-a3/10 border border-a3/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-a3 text-xs font-mono font-bold">{i+1}</span>
                  </div>
                  <span className="text-bright text-sm font-mono">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-accent/5 rounded-2xl blur-xl" />
            <div className="relative bg-surface border border-border rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <div className="w-2 h-2 rounded-full bg-warn" />
                <div className="w-2 h-2 rounded-full bg-a3" />
                <span className="text-xs text-dim font-mono ml-2 tracking-widest">PRE-TRADE CHECK</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: '4H TPD · Continuation',     done: true },
                  { label: 'Daily SMT · M15 confirmed', done: true },
                  { label: '90M SMT · M5 confirmed',    done: true },
                  { label: 'M5 TPD · Entry trigger',    done: true },
                  { label: 'Below TDO + TSO',           done: true },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded text-xs font-mono border transition-all ${item.done ? 'border-a3/20 bg-a3/5 text-a3' : 'border-border text-dim'}`}>
                    <span>{item.done ? '✓' : '○'}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="mt-5 p-3 rounded bg-a3/8 border border-a3/20 text-center">
                <div className="font-display text-3xl text-a3 tracking-widest glow-green">A++</div>
                <div className="text-xs text-a3/70 font-mono tracking-widest mt-1">EXECUTE — FULL CONFLUENCE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AISection() {
  return (
    <section id="ai-tools" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-xs text-accent tracking-[4px] uppercase font-mono mb-4">Zero Cost · Instant Results</div>
        <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-wider text-bright mb-6">
          AI THAT READS<br/><span className="text-accent glow-accent">YOUR CHARTS</span>
        </h2>
        <p className="text-dim text-sm leading-relaxed font-body max-w-lg mx-auto mb-16">
          Upload any chart screenshot. Get a full QT framework breakdown in seconds —
          cycle detection, SSMT check, setup grade, bias, entry zone, and invalidation.
          Powered by Claude AI. No API key. No subscription. Free for every user.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {[
            { icon: '📤', title: 'Upload Chart',    desc: 'Any screenshot from TradingView' },
            { icon: '⚡', title: 'AI Analyzes',     desc: 'Claude reads the QT framework' },
            { icon: '📋', title: 'Get Full Report', desc: 'Grade · Bias · Entry · Invalidation' },
          ].map((s, i) => (
            <div key={i} className="p-6 bg-surface border border-border rounded text-center card-hover">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-mono text-bright text-sm mb-2">{s.title}</div>
              <div className="text-dim text-xs font-body">{s.desc}</div>
            </div>
          ))}
        </div>

        <Link href="/signup"
          className="inline-flex items-center gap-3 px-8 py-4 bg-accent/10 border border-accent/40 text-accent font-mono text-sm tracking-widest uppercase rounded hover:bg-accent/20 hover:border-accent transition-all hover:shadow-[0_0_30px_rgba(0,229,255,.2)]">
          ⚡ TRY THE AI ANALYZER FREE
        </Link>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs text-a2 tracking-[4px] uppercase font-mono mb-4">Trader Results</div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none tracking-wider text-bright">
            WHAT TRADERS <span className="text-a2 glow-orange">SAY</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="p-6 bg-surface border border-border rounded card-hover flex flex-col gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_,j) => <span key={j} className="text-warn text-xs">★</span>)}
              </div>
              <p className="text-bright text-sm leading-relaxed font-body flex-1">"{t.text}"</p>
              <div>
                <div className="font-mono text-accent text-xs font-semibold">{t.name}</div>
                <div className="text-dim text-xs font-mono mt-0.5">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="relative py-40 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-wider text-bright mb-6">
          ONE SETUP.<br/>
          <span className="text-accent glow-accent">90 DAYS.</span><br/>
          YOUR EDGE.
        </h2>
        <p className="text-dim text-sm leading-relaxed font-body mb-12 max-w-lg mx-auto">
          Stop guessing. Start tracking. The market keeps giving you the same setup.
          TradePulse makes sure you never miss it, never rush it, and never forget it.
        </p>
        <Link href="/signup"
          className="inline-flex items-center gap-3 px-12 py-5 bg-accent text-bg font-mono font-bold text-sm tracking-[3px] uppercase rounded hover:bg-accent/90 transition-all hover:shadow-[0_0_60px_rgba(0,229,255,.5)] hover:scale-105">
          START FREE TODAY
        </Link>
        <div className="mt-6 text-dim text-xs font-mono tracking-widest">
          No credit card · No trial · Free forever
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-display text-xl tracking-widest text-accent glow-accent">TRADEPULSE</div>
        <div className="text-dim text-xs font-mono tracking-widest">
          © 2026 TradePulse · Built for QT/ICT Traders · Free Forever
        </div>
        <div className="flex gap-6">
          <Link href="/login"  className="text-xs text-dim hover:text-bright font-mono tracking-widest transition-colors">LOGIN</Link>
          <Link href="/signup" className="text-xs text-accent hover:text-bright font-mono tracking-widest transition-colors">SIGN UP FREE</Link>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="relative">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ForTradersSection />
      <AISection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
