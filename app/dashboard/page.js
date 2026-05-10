'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [trades,   setTrades]   = useState([])
  const [account,  setAccount]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [time,     setTime]     = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get active account
      const saved = localStorage.getItem('tp-active-account')
      let { data: accts } = await supabase.from('accounts').select('*')
        .eq('user_id', session.user.id).order('created_at')
      const acct = accts?.find(a => a.id === saved) || accts?.[0]
      setAccount(acct)

      if (acct) {
        const { data } = await supabase.from('trades').select('*')
          .eq('user_id', session.user.id)
          .eq('account_id', acct.id)
          .order('created_at', { ascending: false })
        setTrades(data || [])
      }
      setLoading(false)
    }
    load()

    const handleAcctChange = (e) => {
      setAccount(e.detail)
      setLoading(true)
      load()
    }
    window.addEventListener('account-changed', handleAcctChange)
    return () => window.removeEventListener('account-changed', handleAcctChange)
  }, [])

  // Stats
  const wins    = trades.filter(t => t.result === 'win').length
  const losses  = trades.filter(t => t.result === 'loss').length
  const be      = trades.filter(t => t.result === 'breakeven').length
  const total   = trades.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnlDollar = trades.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const totalPnlPts    = trades.reduce((s,t) => s+(t.pnl||0), 0)

  // Today's losses for risk meter
  const todayStr = new Date().toLocaleDateString('en-GB')
  const todayLosses = trades.filter(t =>
    (t.date === todayStr) && t.result === 'loss'
  ).length

  // Risk meter
  const riskColor  = todayLosses === 0 ? '#39ff14' : todayLosses === 1 ? '#ffcc00' : '#ff2d55'
  const riskText   = todayLosses === 0 ? 'TRADING ALLOWED — 0 of 2 daily losses used'
    : todayLosses === 1 ? 'ONE LOSS USED — Next loss = stop for the day'
    : '⛔ DAILY LIMIT REACHED — CLOSE PLATFORM NOW'

  // Streak
  let streak = 0, streakType = ''
  for (const t of trades) {
    const isW = t.result === 'win', isL = t.result === 'loss'
    if (streak === 0) { streakType = isW?'W':isL?'L':'BE'; streak = 1 }
    else if ((streakType==='W'&&isW)||(streakType==='L'&&isL)) streak++
    else break
  }

  // Equity (cumulative dollar)
  let running = 0
  const equity = [...trades].reverse().map(t => { running += (t.pnl_dollar||0); return running })
  const maxEq = Math.max(...equity, 1), minEq = Math.min(...equity, 0)

  // NY session time
  const nyTime = new Date(time.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyHour = nyTime.getHours(), nyMin = nyTime.getMinutes()
  const inSession = (nyHour >= 9 && nyHour < 12) || (nyHour === 8 && nyMin >= 30)
  const sessionLabel = inSession ? '🟢 NY SESSION OPEN' : '⚫ NY SESSION CLOSED'

  const pnlColor = totalPnlDollar >= 0 ? '#39ff14' : '#ff2d55'
  const wrColor  = parseFloat(winRate) >= 60 ? '#39ff14' : parseFloat(winRate) >= 45 ? '#ffcc00' : '#ff2d55'

  const SBox = ({ label, val, color = '#eaf4fb' }) => (
    <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
      padding:'11px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.5rem',
        letterSpacing:'2px', color, lineHeight:1, marginBottom:'3px' }}>{val}</div>
      <div style={{ fontSize:'0.58rem', letterSpacing:'2px', textTransform:'uppercase',
        color:'#4a6274' }}>{label}</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
            textTransform:'uppercase', marginBottom:'3px' }}>
            {account?.name || 'Dashboard'} · {sessionLabel}
          </div>
          <div style={{ color:'#eaf4fb', fontSize:'1.6rem', fontWeight:900,
            letterSpacing:'2px' }}>OVERVIEW</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ color:'#39ff14', fontFamily:'monospace', fontSize:'0.9rem',
            fontWeight:600 }}>
            {time.toLocaleTimeString('en-US', { timeZone:'America/New_York', hour12:false })}
          </div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'1px' }}>NEW YORK</div>
        </div>
      </div>

      {/* Risk Meter */}
      <div style={{
        display:'flex', alignItems:'center', gap:'10px',
        padding:'10px 14px', background:'#0d1117', border:'1px solid #1e2a35',
        borderRadius:'4px', marginBottom:'1rem',
      }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:riskColor,
          boxShadow:`0 0 8px ${riskColor}`, flexShrink:0,
          animation: todayLosses >= 2 ? 'flash 1s infinite' : 'none',
        }} />
        <div style={{ fontSize:'0.68rem', flex:1, color: todayLosses >= 2 ? '#ff2d55' :
          todayLosses === 1 ? '#ffcc00' : '#c9d6df' }}>{riskText}</div>
        <div style={{ color:'#4a6274', fontSize:'0.6rem' }}>{todayLosses}/2</div>
        <style>{`@keyframes flash{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem',
        marginBottom:'1rem' }}>
        <Link href="/dashboard/journal" style={{
          background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)',
          borderRadius:'4px', padding:'0.85rem', textDecoration:'none',
          display:'flex', flexDirection:'column', gap:'0.25rem',
        }}>
          <span style={{ fontSize:'1.1rem' }}>✎</span>
          <span style={{ color:'#00e5ff', fontWeight:700, fontSize:'0.75rem',
            letterSpacing:'1px' }}>LOG TRADE</span>
          <span style={{ color:'#4a6274', fontSize:'0.6rem' }}>New QT entry</span>
        </Link>
        <Link href="/dashboard/log" style={{
          background:'#0d1117', border:'1px solid #1e2a35',
          borderRadius:'4px', padding:'0.85rem', textDecoration:'none',
          display:'flex', flexDirection:'column', gap:'0.25rem',
        }}>
          <span style={{ fontSize:'1.1rem' }}>≡</span>
          <span style={{ color:'#eaf4fb', fontWeight:700, fontSize:'0.75rem',
            letterSpacing:'1px' }}>VIEW LOG</span>
          <span style={{ color:'#4a6274', fontSize:'0.6rem' }}>History + calendar</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ color:'#1e3a4a', fontSize:'0.75rem', textAlign:'center',
          padding:'2rem' }}>Loading…</div>
      ) : total === 0 ? (
        <div style={{ border:'1px dashed #1e2a35', borderRadius:'4px', padding:'2.5rem',
          textAlign:'center', color:'#4a6274', fontSize:'0.75rem', letterSpacing:'2px' }}>
          NO TRADES YET — LOG YOUR FIRST TRADE
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px',
            marginBottom:'1rem' }}>
            <SBox label="Trades"   val={total}        color='#00e5ff' />
            <SBox label="Wins"     val={wins}         color='#39ff14' />
            <SBox label="Losses"   val={losses}       color='#ff2d55' />
            <SBox label="Win Rate" val={`${winRate}%`} color={wrColor} />
            <SBox label="Total P&L" val={`${totalPnlDollar>=0?'+$':'-$'}${Math.abs(totalPnlDollar).toFixed(0)}`} color={pnlColor} />
            <SBox label="Streak"   val={streak>0?`${streak}${streakType}`:'—'}
              color={streakType==='W'?'#39ff14':streakType==='L'?'#ff2d55':'#ffcc00'} />
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'14px', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.55rem', letterSpacing:'3px', color:'#4a6274',
                textTransform:'uppercase', marginBottom:'10px' }}>Equity Curve</div>
              <svg width="100%" height="100" viewBox={`0 0 ${equity.length} 100`}
                preserveAspectRatio="none" style={{ display:'block' }}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnlDollar>=0?'#39ff14':'#ff2d55'} stopOpacity="0.35"/>
                    <stop offset="100%" stopColor={totalPnlDollar>=0?'#39ff14':'#ff2d55'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d={`M0,${100-((equity[0]-minEq)/(maxEq-minEq||1))*100} `+
                  equity.map((v,i)=>`L${i},${100-((v-minEq)/(maxEq-minEq||1))*100}`).join(' ')+
                  ` L${equity.length-1},100 L0,100 Z`}
                  fill="url(#eg)" />
                <polyline
                  points={equity.map((v,i)=>`${i},${100-((v-minEq)/(maxEq-minEq||1))*100}`).join(' ')}
                  fill="none" stroke={totalPnlDollar>=0?'#39ff14':'#ff2d55'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ color:'#4a6274', fontSize:'0.55rem' }}>{total} trades</span>
                <span style={{ color:pnlColor, fontSize:'0.7rem', fontWeight:700 }}>
                  {totalPnlDollar>=0?'+$':'-$'}{Math.abs(totalPnlDollar).toFixed(0)}
                </span>
              </div>
            </div>
          )}

          {/* Recent 5 trades */}
          <div style={{ fontSize:'0.55rem', letterSpacing:'3px', color:'#4a6274',
            textTransform:'uppercase', marginBottom:'8px',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Recent Trades</span>
            <Link href="/dashboard/log" style={{ color:'#00e5ff', textDecoration:'none',
              fontSize:'0.55rem' }}>VIEW ALL →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {trades.slice(0,5).map(t => (
              <div key={t.id} style={{
                background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
                padding:'10px 12px', display:'grid',
                gridTemplateColumns:'auto 1fr auto', gap:'10px', alignItems:'center',
              }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.2rem',
                  color: t.grade==='A++'?'#ffcc00':t.grade==='A+'?'#39ff14':
                    t.grade==='A'?'#00e5ff':t.grade==='B'?'#c084ff':
                    t.grade==='C'?'#ff6b35':'#ff2d55',
                  textShadow:'0 0 6px currentColor', minWidth:28,
                }}>{t.grade||'?'}</div>
                <div>
                  <div style={{ color:'#eaf4fb', fontSize:'0.8rem', fontWeight:600 }}>
                    {t.date} · {t.instrument} · {t.direction}
                  </div>
                  <div style={{ color:'#4a6274', fontSize:'0.65rem', marginTop:'2px' }}>
                    {t.session} · RR {t.rr||'—'} · {t.mistakes?.length ? `${t.mistakes.length} mistake(s)` : 'Clean'}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:t.pnl_dollar>=0?'#39ff14':'#ff2d55',
                    fontSize:'0.85rem', fontWeight:600 }}>
                    {t.pnl_dollar!=null?`${t.pnl_dollar>=0?'+':'-'}$${Math.abs(t.pnl_dollar).toFixed(0)}`:'—'}
                  </div>
                  <span style={{
                    fontSize:'0.62rem', padding:'2px 7px', borderRadius:'3px',
                    letterSpacing:'1px', fontWeight:600,
                    background:t.result==='win'?'rgba(57,255,20,.1)':t.result==='loss'?'rgba(255,45,85,.1)':'rgba(255,204,0,.1)',
                    color:t.result==='win'?'#39ff14':t.result==='loss'?'#ff2d55':'#ffcc00',
                    border:`1px solid ${t.result==='win'?'rgba(57,255,20,.3)':t.result==='loss'?'rgba(255,45,85,.3)':'rgba(255,204,0,.3)'}`,
                  }}>{t.result?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
