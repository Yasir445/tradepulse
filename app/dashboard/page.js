'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const GRADE_COLOR = {
  'A++':'#f59e0b','A+':'#10b981','A':'#34d399','B':'#6366f1','C':'#f97316','F':'#ef4444'
}

export default function DashboardPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      const { data } = await supabase
        .from('trades').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const wins     = trades.filter(t => t.result === 'WIN').length
  const losses   = trades.filter(t => t.result === 'LOSS').length
  const be       = trades.filter(t => t.result === 'BE').length
  const total    = trades.length
  const winRate  = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = trades.reduce((s,t) => s+(t.pnl||0), 0)
  const rrT      = trades.filter(t => t.rr)
  const avgRR    = rrT.length ? (rrT.reduce((s,t)=>s+(t.rr||0),0)/rrT.length).toFixed(2) : '0.00'
  const pf       = losses > 0 ? (wins/losses).toFixed(2) : wins > 0 ? '∞' : '0'
  const bestTrade = trades.reduce((b,t) => (!b||(t.pnl||0)>(b.pnl||0))?t:b, null)

  let running = 0
  const equity = [...trades].reverse().map(t => { running += (t.pnl||0); return running })
  const maxEq = Math.max(...equity, 1), minEq = Math.min(...equity, 0)
  const pnlColor = totalPnl > 0 ? '#10b981' : totalPnl < 0 ? '#ef4444' : '#94a3b8'
  const wrColor  = parseFloat(winRate)>=60?'#10b981':parseFloat(winRate)>=45?'#f97316':'#ef4444'

  return (
    <div>
      <style>{`
        .kpi-card { background: linear-gradient(135deg, #0f172a, #1a1a2e); border: 1px solid #1e293b; border-radius: 16px; padding: 1.25rem; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; right: 0; width: 50px; height: 50px; border-radius: 0 16px 0 50px; }
        .trade-row:last-child { border-bottom: none !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #1e293b' }}>
        <p style={{ color: '#6366f1', fontSize: '0.65rem', letterSpacing: '0.25em',
          textTransform: 'uppercase', margin: '0 0 0.25rem', fontWeight: 700 }}>TradePulse QT</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ color:'#f8fafc', fontSize:'1.75rem', fontWeight:900, margin:0, letterSpacing:'-0.03em' }}>
            Overview
          </h1>
          <div style={{
            background: totalPnl>=0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${totalPnl>=0?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`,
            borderRadius:'10px', padding:'0.4rem 0.9rem',
          }}>
            <p style={{ color:pnlColor, fontSize:'1rem', fontWeight:800, margin:0, fontFamily:'monospace' }}>
              {totalPnl>=0?'+':''}{totalPnl.toFixed(0)} pts
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <Link href="/dashboard/checklist" style={{
          background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius:'14px', padding:'1.1rem', textDecoration:'none',
          boxShadow:'0 8px 24px rgba(79,70,229,0.35)',
        }}>
          <div style={{ fontSize:'1.4rem', marginBottom:'0.35rem' }}>✓</div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:'0.85rem', marginBottom:'0.2rem' }}>Pre-Trade Check</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.68rem' }}>QT checklist + grade</div>
        </Link>
        <Link href="/dashboard/journal" style={{
          background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
          border:'1px solid #2d3748', borderRadius:'14px', padding:'1.1rem', textDecoration:'none',
        }}>
          <div style={{ fontSize:'1.4rem', marginBottom:'0.35rem' }}>+</div>
          <div style={{ color:'#f8fafc', fontWeight:800, fontSize:'0.85rem', marginBottom:'0.2rem' }}>Log Trade</div>
          <div style={{ color:'#475569', fontSize:'0.68rem' }}>Add to journal</div>
        </Link>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background:'#1a1a2e', borderRadius:'16px', height:80,
              animation:'pulse 1.5s infinite' }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        </div>
      ) : total===0 ? (
        <div style={{
          background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
          border:'1px solid #1e293b', borderRadius:'20px',
          padding:'3rem 1.5rem', textAlign:'center',
        }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📊</div>
          <h3 style={{ color:'#f8fafc', fontSize:'1.15rem', fontWeight:800, margin:'0 0 0.5rem' }}>
            No trades yet
          </h3>
          <p style={{ color:'#475569', fontSize:'0.85rem', margin:'0 0 1.5rem' }}>
            Start by running your pre-trade checklist
          </p>
          <Link href="/dashboard/checklist" style={{
            background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color:'#fff', textDecoration:'none', borderRadius:'10px',
            padding:'0.8rem 1.75rem', fontWeight:800, fontSize:'0.85rem',
            display:'inline-block', boxShadow:'0 4px 16px rgba(79,70,229,0.4)',
          }}>Run First Check →</Link>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
            <div className="kpi-card" style={{ '--accent':'rgba(99,102,241,0.12)' }}>
              <div style={{ position:'absolute', top:0, right:0, width:48, height:48,
                background:`${wrColor}15`, borderRadius:'0 16px 0 48px' }} />
              <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Win Rate</p>
              <p style={{ color:wrColor, fontSize:'2rem', fontWeight:900,
                margin:'0 0 0.2rem', lineHeight:1 }}>{winRate}%</p>
              <p style={{ color:'#334155', fontSize:'0.65rem', margin:0 }}>{wins}W · {losses}L · {be}BE</p>
            </div>

            <div className="kpi-card">
              <div style={{ position:'absolute', top:0, right:0, width:48, height:48,
                background:'rgba(99,102,241,0.1)', borderRadius:'0 16px 0 48px' }} />
              <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Profit Factor</p>
              <p style={{ color:'#818cf8', fontSize:'2rem', fontWeight:900,
                margin:'0 0 0.2rem', lineHeight:1 }}>{pf}</p>
              <p style={{ color:'#334155', fontSize:'0.65rem', margin:0 }}>{total} trades</p>
            </div>

            <div className="kpi-card">
              <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Avg R:R</p>
              <p style={{ color:'#f8fafc', fontSize:'2rem', fontWeight:900,
                margin:'0 0 0.2rem', lineHeight:1 }}>{avgRR}R</p>
              <p style={{ color:'#334155', fontSize:'0.65rem', margin:0 }}>risk / reward</p>
            </div>

            <div className="kpi-card">
              <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Best Trade</p>
              <p style={{ color:'#10b981', fontSize:'2rem', fontWeight:900,
                margin:'0 0 0.2rem', lineHeight:1 }}>+{bestTrade?.pnl||0}</p>
              <p style={{ color:'#334155', fontSize:'0.65rem', margin:0 }}>
                {bestTrade?.symbol||'—'} · {bestTrade?.date||'—'}
              </p>
            </div>
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{
              background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:'1px solid #1e293b', borderRadius:'16px',
              padding:'1.25rem', marginBottom:'1rem',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'0.75rem' }}>
                <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                  textTransform:'uppercase', margin:0, fontWeight:600 }}>Equity Curve</p>
                <span style={{ color:pnlColor, fontSize:'0.82rem', fontWeight:800,
                  fontFamily:'monospace' }}>
                  {totalPnl>=0?'+':''}{totalPnl.toFixed(0)} pts
                </span>
              </div>
              <svg width="100%" height="70" viewBox={`0 0 ${equity.length} 70`}
                preserveAspectRatio="none" style={{ display:'block' }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnl>=0?'#10b981':'#ef4444'} stopOpacity="0.4"/>
                    <stop offset="100%" stopColor={totalPnl>=0?'#10b981':'#ef4444'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path
                  d={`M0,${70-((equity[0]-minEq)/(maxEq-minEq||1))*70} `+
                    equity.map((v,i)=>`L${i},${70-((v-minEq)/(maxEq-minEq||1))*70}`).join(' ')+
                    ` L${equity.length-1},70 L0,70 Z`}
                  fill="url(#g)" />
                <polyline
                  points={equity.map((v,i)=>`${i},${70-((v-minEq)/(maxEq-minEq||1))*70}`).join(' ')}
                  fill="none" stroke={totalPnl>=0?'#10b981':'#ef4444'}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Recent trades */}
          <div style={{
            background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
            border:'1px solid #1e293b', borderRadius:'16px', overflow:'hidden',
          }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #1e293b',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:0, fontWeight:600 }}>Recent Trades</p>
              <Link href="/dashboard/journal" style={{ color:'#6366f1', fontSize:'0.72rem',
                textDecoration:'none', fontWeight:700 }}>View all →</Link>
            </div>

            {trades.slice(0,6).map((t,i) => (
              <div key={t.id} className="trade-row" style={{
                padding:'0.85rem 1.25rem', borderBottom:'1px solid #0f172a',
                display:'flex', alignItems:'center', gap:'0.75rem',
              }}>
                <div style={{
                  width:34, height:34, borderRadius:'10px', flexShrink:0,
                  background: t.result==='WIN'?'rgba(16,185,129,0.12)':t.result==='LOSS'?'rgba(239,68,68,0.12)':'rgba(100,116,139,0.12)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1rem', color: t.result==='WIN'?'#10b981':t.result==='LOSS'?'#ef4444':'#94a3b8',
                }}>
                  {t.result==='WIN'?'↑':t.result==='LOSS'?'↓':'→'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:'0.4rem', alignItems:'center', marginBottom:'0.15rem' }}>
                    <span style={{ color:'#f8fafc', fontWeight:800, fontSize:'0.85rem' }}>{t.symbol}</span>
                    <span style={{
                      fontSize:'0.58rem', fontWeight:700, padding:'1px 5px', borderRadius:'4px',
                      letterSpacing:'0.05em',
                      background:t.direction==='LONG'?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',
                      color:t.direction==='LONG'?'#10b981':'#ef4444',
                    }}>{t.direction}</span>
                    {t.grade && <span style={{
                      fontSize:'0.58rem', fontWeight:700, padding:'1px 5px', borderRadius:'4px',
                      color:GRADE_COLOR[t.grade]||'#94a3b8',
                      background:`${GRADE_COLOR[t.grade]||'#94a3b8'}15`,
                    }}>{t.grade}</span>}
                  </div>
                  <p style={{ color:'#334155', fontSize:'0.65rem', margin:0 }}>
                    {t.session} · {t.date}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{
                    color:(t.pnl||0)>0?'#10b981':(t.pnl||0)<0?'#ef4444':'#94a3b8',
                    fontWeight:800, fontSize:'0.9rem', fontFamily:'monospace', margin:'0 0 0.1rem',
                  }}>{t.pnl!=null?`${t.pnl>0?'+':''}${t.pnl}`:'—'}</p>
                  <p style={{ color:'#1e293b', fontSize:'0.62rem', margin:0 }}>
                    {t.rr?`${t.rr}R`:'—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
