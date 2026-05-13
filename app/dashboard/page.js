'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const GC = { 'A++':'#ffcc44','A+':'#00ff88','A':'#00d4ff','B':'#a855f7','C':'#ff6b35','F':'#ff3366' }

function SkeletonCard() {
  return (
    <div className="skeleton" style={{ height: 88, borderRadius: 8 }} />
  )
}

function KpiCard({ label, value, sub, color = 'var(--text-1)', accent, delta }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '14px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }} />
      )}
      <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700,
        color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

function MiniEquity({ data, color }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = data.length - 1
  const points = data.map((v, i) => `${(i/w)*100},${100 - ((v-min)/range)*100}`).join(' ')

  return (
    <svg width="100%" height="48" viewBox={`0 0 100 100`} preserveAspectRatio="none"
      style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill="url(#mg)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function DashboardPage() {
  const [trades,  setTrades]  = useState([])
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time,    setTime]    = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const acctId = typeof window !== 'undefined' ? localStorage.getItem('tp-active-account') : null
    const { data: accts } = await supabase.from('accounts').select('*').eq('user_id', session.user.id)
    const acct = accts?.find(a => a.id === acctId) || accts?.[0]
    setAccount(acct)
    if (acct) {
      const { data } = await supabase.from('trades').select('*')
        .eq('user_id', session.user.id).eq('account_id', acct.id)
        .order('created_at', { ascending: false })
      setTrades(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const h = (e) => { setLoading(true); load() }
    window.addEventListener('account-changed', h)
    return () => window.removeEventListener('account-changed', h)
  }, [load])

  // Stats
  const wins    = trades.filter(t => t.result === 'win').length
  const losses  = trades.filter(t => t.result === 'loss').length
  const be      = trades.filter(t => t.result === 'breakeven').length
  const total   = trades.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = trades.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const avgWin  = wins ? (trades.filter(t=>t.result==='win').reduce((s,t)=>s+(t.pnl_dollar||0),0)/wins) : 0
  const avgLoss = losses ? (trades.filter(t=>t.result==='loss').reduce((s,t)=>s+(t.pnl_dollar||0),0)/losses) : 0
  const pf      = losses > 0 ? Math.abs(avgWin/avgLoss).toFixed(2) : wins > 0 ? '∞' : '0'

  // Today
  const todayStr = time.toLocaleDateString('en-GB')
  const todayTrades = trades.filter(t => t.date === todayStr)
  const todayPnl    = todayTrades.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const todayLosses = todayTrades.filter(t => t.result === 'loss').length

  // Equity
  let running = 0
  const equity = [...trades].reverse().map(t => { running += (t.pnl_dollar||0); return running })

  // Risk meter
  const riskPct = account?.balance ? Math.abs(Math.min(0,totalPnl)/account.balance*100) : 0
  const riskColor = todayLosses === 0 ? 'var(--green)' : todayLosses === 1 ? 'var(--gold)' : 'var(--red)'

  // NY session
  const nyHour = new Date(time.toLocaleString('en-US',{timeZone:'America/New_York'})).getHours()
  const inSession = nyHour >= 9 && nyHour < 12

  const pnlColor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)'
  const wrColor  = parseFloat(winRate) >= 60 ? 'var(--green)' : parseFloat(winRate) >= 45 ? 'var(--gold)' : 'var(--red)'

  // Streak
  let streak = 0, streakType = ''
  for (const t of trades) {
    if (streak === 0) { streakType = t.result === 'win' ? 'W' : t.result === 'loss' ? 'L' : ''; streak = 1 }
    else if ((streakType==='W'&&t.result==='win')||(streakType==='L'&&t.result==='loss')) streak++
    else break
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
            {account?.name || 'PORTFOLIO'} · {inSession ? '🟢 NY OPEN' : '⚫ NY CLOSED'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
            color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>Overview</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/journal" className="btn btn-primary" style={{ fontSize: '0.65rem' }}>
            ✦ LOG TRADE
          </Link>
          <Link href="/dashboard/log" className="btn btn-ghost" style={{ fontSize: '0.65rem' }}>
            ≡ VIEW LOG
          </Link>
        </div>
      </div>

      {/* Risk meter */}
      <div style={{
        background: 'var(--bg-2)', border: `1px solid ${todayLosses >= 2 ? 'rgba(255,51,102,0.4)' : 'var(--border)'}`,
        borderRadius: 8, padding: '10px 14px', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: todayLosses >= 2 ? 'rgba(255,51,102,0.06)' : 'var(--bg-2)',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor,
          boxShadow: `0 0 8px ${riskColor}`, flexShrink: 0,
          animation: todayLosses >= 2 ? 'pulse-dot 0.8s infinite' : 'none' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.68rem', color: todayLosses >= 2 ? 'var(--red)' : 'var(--text-2)',
            fontFamily: 'var(--font-mono)' }}>
            {todayLosses === 0 ? 'TRADING ACTIVE — 0/2 daily losses used'
              : todayLosses === 1 ? 'CAUTION — 1/2 daily losses used. One more = stop.'
              : '⛔ DAILY LIMIT HIT — CLOSE PLATFORM NOW'}
          </div>
          <div style={{ marginTop: 4, background: 'var(--bg-3)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(todayLosses/2)*100}%`, height: '100%', background: riskColor,
              transition: 'width 0.4s', borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: riskColor, fontFamily: 'var(--font-mono)',
          fontWeight: 700 }}>{todayLosses}/2</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : total === 0 ? (
        <div style={{
          background: 'var(--bg-2)', border: '1px dashed var(--border)',
          borderRadius: 12, padding: '4rem 2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--text-1)', marginBottom: '0.5rem' }}>No trades yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Start by logging your first QT trade
          </div>
          <Link href="/dashboard/journal" className="btn btn-primary" style={{ fontSize: '0.72rem' }}>
            ✦ LOG FIRST TRADE →
          </Link>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px',
            marginBottom: '1rem' }}>
            <KpiCard label="Win Rate" value={`${winRate}%`} sub={`${wins}W · ${losses}L · ${be}BE`}
              color={wrColor} accent={wrColor} />
            <KpiCard label="Total P&L" value={`${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(0)}`}
              sub={`${total} trades`} color={pnlColor} accent={pnlColor} />
            <KpiCard label="Profit Factor" value={pf} sub="win/loss ratio" accent="var(--purple)" />
            <KpiCard label="Avg Winner" value={`+$${Math.abs(avgWin).toFixed(0)}`}
              color="var(--green)" accent="var(--green)" />
            <KpiCard label="Avg Loser" value={`-$${Math.abs(avgLoss).toFixed(0)}`}
              color="var(--red)" accent="var(--red)" />
            <KpiCard label="Streak" value={streak > 0 ? `${streak}${streakType}` : '—'}
              color={streakType==='W'?'var(--green)':streakType==='L'?'var(--red)':'var(--text-2)'}
              accent={streakType==='W'?'var(--green)':streakType==='L'?'var(--red)':'var(--border)'} />
          </div>

          {/* Today strip */}
          <div style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '10px 14px', marginBottom: '1rem',
            display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '16px',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: '0.58rem', letterSpacing: '0.15em', color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)' }}>TODAY</div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                color: todayPnl>=0?'var(--green)':'var(--red)', fontWeight: 700 }}>
                {todayPnl>=0?'+$':'-$'}{Math.abs(todayPnl).toFixed(0)}
              </div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-3)' }}>P&L</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-1)',
                fontWeight: 700 }}>{todayTrades.length}</div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-3)' }}>TRADES</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: riskColor,
                fontWeight: 700 }}>{todayLosses}/2</div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-3)' }}>LOSSES</div>
            </div>
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '14px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Equity Curve</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                  fontWeight: 700, color: pnlColor }}>
                  {totalPnl>=0?'+$':'-$'}{Math.abs(totalPnl).toFixed(0)}
                </div>
              </div>
              <MiniEquity data={equity} color={totalPnl>=0?'#00ff88':'#ff3366'} />
            </div>
          )}

          {/* Account balance */}
          {account?.balance > 0 && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 14px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)' }}>ACCOUNT HEALTH</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-2)' }}>
                  ${(account.balance + totalPnl).toLocaleString()} / ${account.balance.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--bg-3)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.max(0, Math.min(100, ((account.balance+totalPnl)/account.balance)*100))}%`,
                  height: '100%',
                  background: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                  borderRadius: 3, transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontSize: '0.52rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {totalPnl >= 0 ? `+${riskPct.toFixed(2)}% growth` : `-${riskPct.toFixed(2)}% drawdown`}
                </span>
                <span style={{ fontSize: '0.52rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  Max 5% daily risk
                </span>
              </div>
            </div>
          )}

          {/* Recent trades */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '10px' }}>
              <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Recent Trades</div>
              <Link href="/dashboard/log" style={{ fontSize: '0.62rem', color: 'var(--cyan)',
                fontFamily: 'var(--font-mono)' }}>VIEW ALL →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {trades.slice(0,5).map(t => (
                <div key={t.id} style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700,
                    color: GC[t.grade]||'var(--text-3)', minWidth: 32,
                    textShadow: `0 0 8px ${GC[t.grade]||'transparent'}` }}>
                    {t.grade||'?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem',
                        color: 'var(--text-1)' }}>{t.instrument}</span>
                      <span className={`badge badge-${t.result==='win'?'win':t.result==='loss'?'loss':'be'}`}>
                        {t.direction==='LONG'?'▲':'▼'} {t.direction}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {t.date} · {t.session} · {t.confluence||0}/5 conf
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem',
                      color: (t.pnl_dollar||0)>=0?'var(--green)':'var(--red)' }}>
                      {t.pnl_dollar!=null?`${t.pnl_dollar>=0?'+$':'-$'}${Math.abs(t.pnl_dollar).toFixed(0)}`:'—'}
                    </div>
                    <span className={`badge badge-${t.result==='win'?'win':t.result==='loss'?'loss':'be'}`}
                      style={{ fontSize: '0.55rem' }}>
                      {t.result?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
