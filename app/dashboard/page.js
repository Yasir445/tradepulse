'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function StatCard({ label, value, sub, color = '#00e5ff', icon }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 card-hover relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 0% 0%, ${color}08 0%, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-dim font-mono tracking-widest uppercase">{label}</div>
          <div className="text-lg">{icon}</div>
        </div>
        <div className="font-display text-4xl tracking-wider" style={{ color }}>{value}</div>
        {sub && <div className="text-dim text-xs font-mono mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function QuickAction({ href, icon, title, desc, color }) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-4 bg-surface border border-border rounded-xl card-hover">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="font-mono text-bright text-sm font-semibold tracking-wide group-hover:text-accent transition-colors">{title}</div>
        <div className="text-dim text-xs font-body mt-0.5">{desc}</div>
      </div>
      <div className="ml-auto text-dim group-hover:text-accent transition-colors text-lg">→</div>
    </Link>
  )
}

export default function DashboardPage() {
  const [user, setUser]       = useState(null)
  const [trades, setTrades]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const name      = user?.user_metadata?.full_name?.split(' ')[0] || 'Trader'
  const totalWins = trades.filter(t => t.outcome === 'WIN').length
  const totalLoss = trades.filter(t => t.outcome === 'LOSS').length
  const winRate   = trades.length ? Math.round((totalWins / trades.length) * 100) : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in opacity-0-init">

      {/* Greeting */}
      <div>
        <div className="text-dim text-xs font-mono tracking-[4px] mb-1">{greeting}</div>
        <h1 className="font-display text-5xl tracking-wider text-bright">
          {name.toUpperCase()} <span className="text-accent glow-accent">↗</span>
        </h1>
        <p className="text-dim text-xs font-mono mt-2 tracking-wide">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Trades" value={trades.length || '—'} sub="all time" icon="📊" color="#00e5ff" />
        <StatCard label="Win Rate"     value={trades.length ? `${winRate}%` : '—'} sub={`${totalWins}W · ${totalLoss}L`} icon="🎯" color="#39ff14" />
        <StatCard label="Wins"         value={totalWins || '—'} sub="confirmed TP" icon="✓" color="#39ff14" />
        <StatCard label="Losses"       value={totalLoss || '—'} sub="SL triggered" icon="✕" color="#ff2d55" />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-xs text-dim font-mono tracking-[4px] uppercase mb-4">Quick Actions</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <QuickAction href="/dashboard/checklist" icon="✓" title="Run Pre-Trade Check" desc="Verify 5-step confluence before entering" />
          <QuickAction href="/dashboard/journal"   icon="📋" title="Log New Trade"       desc="Record your setup, entry, and outcome" />
          <QuickAction href="/dashboard/analyzer"  icon="🤖" title="AI Chart Analysis"   desc="Upload chart · get instant QT breakdown" />
          <QuickAction href="/dashboard/stats"     icon="📈" title="View Stats"           desc="Win rate, patterns, mistake analysis" />
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-dim font-mono tracking-[4px] uppercase">Recent Trades</div>
          <Link href="/dashboard/journal" className="text-xs text-accent font-mono tracking-widest hover:text-bright transition-colors">
            VIEW ALL →
          </Link>
        </div>

        {loading ? (
          <div className="text-dim text-xs font-mono tracking-widest text-center py-12 border border-border rounded-xl">
            LOADING...
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <div className="font-mono text-bright text-sm mb-2">No trades yet</div>
            <p className="text-dim text-xs font-body mb-6">Log your first trade to start tracking your edge</p>
            <Link href="/dashboard/journal"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg font-mono font-bold text-xs tracking-widest uppercase rounded hover:bg-accent/90 transition-all">
              LOG FIRST TRADE →
            </Link>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['DATE', 'PAIR', 'DIRECTION', 'OUTCOME', 'GRADE', 'RR'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-dim font-mono tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id} className={`border-b border-border/50 hover:bg-s2 transition-colors ${i === trades.length-1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 text-xs text-dim font-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-bright font-mono font-semibold">{t.instrument || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${t.direction === 'LONG' ? 'text-a3 bg-a3/10' : 'text-danger bg-danger/10'}`}>
                        {t.direction || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${
                        t.outcome === 'WIN'  ? 'text-a3 bg-a3/10' :
                        t.outcome === 'LOSS' ? 'text-danger bg-danger/10' :
                        'text-warn bg-warn/10'
                      }`}>{t.outcome || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: t.grade?.startsWith('A') ? '#39ff14' : t.grade === 'B' ? '#ffcc00' : '#ff2d55' }}>
                      {t.grade || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-bright font-mono">{t.rr ? `${t.rr}R` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily reminder */}
      <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl">
        <div className="text-xs text-accent font-mono tracking-[4px] mb-2">TODAY'S REMINDER</div>
        <div className="text-bright text-sm font-mono leading-relaxed">
          One setup. Fully confirmed. Every time. <span className="text-dim">— If any of the 5 steps is missing, there is no trade.</span>
        </div>
      </div>
    </div>
  )
}
