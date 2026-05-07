'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GRADE_COLOR = {
  'A++':'#f59e0b','A+':'#10b981','A':'#34d399','B':'#6366f1','C':'#f97316','F':'#ef4444'
}

export default function StatsPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return
    const { data } = await supabase
      .from('trades').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setTrades(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', paddingTop:'1rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background:'#1a1a2e', borderRadius:'16px', height:100,
          animation:'pulse 1.5s infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )

  const wins    = trades.filter(t => t.result==='WIN').length
  const losses  = trades.filter(t => t.result==='LOSS').length
  const be      = trades.filter(t => t.result==='BE').length
  const total   = trades.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = trades.reduce((s,t) => s+(t.pnl||0), 0)
  const rrT     = trades.filter(t => t.rr)
  const avgRR   = rrT.length ? (rrT.reduce((s,t)=>s+(t.rr||0),0)/rrT.length).toFixed(2) : '0'
  const avgWin  = wins ? (trades.filter(t=>t.result==='WIN').reduce((s,t)=>s+(t.pnl||0),0)/wins).toFixed(0) : '0'
  const avgLoss = losses ? (trades.filter(t=>t.result==='LOSS').reduce((s,t)=>s+(t.pnl||0),0)/losses).toFixed(0) : '0'
  const pf      = losses>0?(wins/losses).toFixed(2):wins>0?'∞':'0'
  const bestDay = trades.reduce((b,t)=>(!b||(t.pnl||0)>(b.pnl||0))?t:b, null)
  const worstDay = trades.reduce((w,t)=>(!w||(t.pnl||0)<(w.pnl||0))?t:w, null)

  // Equity curve
  let running = 0
  const equity = trades.map(t => { running += (t.pnl||0); return running })
  const maxEq  = Math.max(...equity, 1), minEq = Math.min(...equity, 0)
  const pnlColor = totalPnl>0?'#10b981':totalPnl<0?'#ef4444':'#94a3b8'
  const wrColor  = parseFloat(winRate)>=60?'#10b981':parseFloat(winRate)>=45?'#f97316':'#ef4444'

  // By session
  const sessions = ['London','NY','Overnight','Asian']
  const bySession = sessions.map(s => {
    const g = trades.filter(t => t.session===s)
    const w = g.filter(t => t.result==='WIN').length
    return { s, total:g.length, wins:w, wr:g.length?Math.round((w/g.length)*100):0,
      pnl:g.reduce((a,t)=>a+(t.pnl||0),0) }
  }).filter(x => x.total>0)

  // By grade
  const grades = ['A++','A+','A','B','C','F']
  const byGrade = grades.map(g => {
    const gr = trades.filter(t => t.grade===g)
    const w  = gr.filter(t => t.result==='WIN').length
    return { g, total:gr.length, wins:w, wr:gr.length?Math.round((w/gr.length)*100):0 }
  }).filter(x => x.total>0)

  // Mistakes
  const mistakeMap = {}
  trades.forEach(t => (t.mistakes||[]).forEach(m => { mistakeMap[m]=(mistakeMap[m]||0)+1 }))
  const topMistakes = Object.entries(mistakeMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // By day
  const days = ['Mon','Tue','Wed','Thu','Fri']
  const byDay = days.map(d => {
    const g = trades.filter(t => {
      if (!t.date) return false
      return new Date(t.date).toLocaleDateString('en',{weekday:'short'})===d
    })
    const w = g.filter(t=>t.result==='WIN').length
    return { d, total:g.length, wr:g.length?Math.round((w/g.length)*100):0,
      pnl:g.reduce((a,t)=>a+(t.pnl||0),0) }
  })

  const StatCard = ({ label, value, sub, color='#f8fafc', accent='rgba(99,102,241,0.1)' }) => (
    <div style={{
      background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
      border:'1px solid #1e293b', borderRadius:'14px', padding:'1.1rem',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, right:0, width:40, height:40,
        background:accent, borderRadius:'0 14px 0 40px' }} />
      <p style={{ color:'#475569', fontSize:'0.58rem', letterSpacing:'0.2em',
        textTransform:'uppercase', margin:'0 0 0.4rem', fontWeight:600 }}>{label}</p>
      <p style={{ color, fontSize:'1.75rem', fontWeight:900, margin:'0 0 0.2rem', lineHeight:1 }}>
        {value}
      </p>
      {sub && <p style={{ color:'#334155', fontSize:'0.62rem', margin:0 }}>{sub}</p>}
    </div>
  )

  const BarRow = ({ label, value, max, color='#6366f1', note, sub }) => (
    <div style={{ marginBottom:'0.9rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
        <span style={{ color:'#94a3b8', fontSize:'0.78rem', fontWeight:600 }}>{label}</span>
        <div style={{ textAlign:'right' }}>
          <span style={{ color, fontSize:'0.78rem', fontWeight:800 }}>{note}</span>
          {sub && <span style={{ color:'#334155', fontSize:'0.65rem', marginLeft:'0.4rem' }}>{sub}</span>}
        </div>
      </div>
      <div style={{ background:'#0f172a', borderRadius:'6px', height:8, overflow:'hidden' }}>
        <div style={{
          width:`${max>0?(value/max)*100:0}%`, height:'100%',
          background:`linear-gradient(90deg, ${color}, ${color}99)`,
          borderRadius:'6px', transition:'width 0.5s ease',
        }} />
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #1e293b' }}>
        <p style={{ color:'#6366f1', fontSize:'0.65rem', letterSpacing:'0.25em',
          textTransform:'uppercase', margin:'0 0 0.25rem', fontWeight:700 }}>Data-Driven</p>
        <h1 style={{ color:'#f8fafc', fontSize:'1.75rem', fontWeight:900,
          margin:0, letterSpacing:'-0.03em' }}>Analytics</h1>
      </div>

      {total===0 ? (
        <div style={{
          background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
          border:'1px solid #1e293b', borderRadius:'20px',
          padding:'3rem', textAlign:'center',
        }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📊</div>
          <p style={{ color:'#475569', fontSize:'0.9rem', fontWeight:600, margin:'0 0 0.25rem' }}>
            No data yet
          </p>
          <p style={{ color:'#334155', fontSize:'0.78rem', margin:0 }}>
            Log trades to see your performance analytics
          </p>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
            <StatCard label="Win Rate" value={`${winRate}%`}
              sub={`${wins}W · ${losses}L · ${be}BE`} color={wrColor}
              accent={`${wrColor}15`} />
            <StatCard label="Total P&L"
              value={`${totalPnl>=0?'+':''}${totalPnl.toFixed(0)}`}
              sub="points" color={pnlColor} accent={`${pnlColor}15`} />
            <StatCard label="Profit Factor" value={pf} sub={`${total} trades`}
              color='#818cf8' />
            <StatCard label="Avg R:R" value={`${avgRR}R`} sub="risk/reward" />
          </div>

          {/* Avg win/loss */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
            <StatCard label="Avg Winner" value={`+${avgWin}`} sub="points per win"
              color='#10b981' accent='rgba(16,185,129,0.1)' />
            <StatCard label="Avg Loser" value={avgLoss} sub="points per loss"
              color='#ef4444' accent='rgba(239,68,68,0.1)' />
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
                <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                  textTransform:'uppercase', margin:0, fontWeight:600 }}>Equity Curve</p>
                <span style={{ color:pnlColor, fontSize:'0.82rem',
                  fontWeight:800, fontFamily:'monospace' }}>
                  {totalPnl>=0?'+':''}{totalPnl.toFixed(0)} pts
                </span>
              </div>
              <svg width="100%" height="100" viewBox={`0 0 ${equity.length} 100`}
                preserveAspectRatio="none" style={{ display:'block' }}>
                <defs>
                  <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnl>=0?'#10b981':'#ef4444'} stopOpacity="0.4"/>
                    <stop offset="100%" stopColor={totalPnl>=0?'#10b981':'#ef4444'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" x2={equity.length}
                  y1={100-((0-minEq)/(maxEq-minEq||1))*100}
                  y2={100-((0-minEq)/(maxEq-minEq||1))*100}
                  stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                <path
                  d={`M0,${100-((equity[0]-minEq)/(maxEq-minEq||1))*100} `+
                    equity.map((v,i)=>`L${i},${100-((v-minEq)/(maxEq-minEq||1))*100}`).join(' ')+
                    ` L${equity.length-1},100 L0,100 Z`}
                  fill="url(#eqg)" />
                <polyline
                  points={equity.map((v,i)=>`${i},${100-((v-minEq)/(maxEq-minEq||1))*100}`).join(' ')}
                  fill="none" stroke={totalPnl>=0?'#10b981':'#ef4444'}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Session + Grade */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
            <div style={{ background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem' }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>By Session</p>
              {bySession.length===0
                ? <p style={{ color:'#334155', fontSize:'0.78rem' }}>No data</p>
                : bySession.map(({ s, wr, total:t, wins:w, pnl }) => (
                  <BarRow key={s} label={s} value={wr} max={100}
                    note={`${wr}%`} sub={`${w}/${t}`}
                    color={wr>=60?'#10b981':wr>=45?'#f97316':'#ef4444'} />
                ))}
            </div>
            <div style={{ background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem' }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>By Grade</p>
              {byGrade.length===0
                ? <p style={{ color:'#334155', fontSize:'0.78rem' }}>No data</p>
                : byGrade.map(({ g, wr, total:t, wins:w }) => (
                  <BarRow key={g} label={g} value={wr} max={100}
                    note={`${wr}%`} sub={`${w}/${t}`}
                    color={GRADE_COLOR[g]||'#94a3b8'} />
                ))}
            </div>
          </div>

          {/* Day + Mistakes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div style={{ background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem' }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>By Day</p>
              {byDay.filter(d=>d.total>0).length===0
                ? <p style={{ color:'#334155', fontSize:'0.78rem' }}>No data</p>
                : byDay.filter(d=>d.total>0).map(({ d, wr, total:t }) => (
                  <BarRow key={d} label={d} value={wr} max={100}
                    note={`${wr}%`} sub={`${t}t`}
                    color={wr>=60?'#10b981':wr>=45?'#f97316':'#ef4444'} />
                ))}
            </div>
            <div style={{ background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem' }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>Top Mistakes</p>
              {topMistakes.length===0
                ? <p style={{ color:'#334155', fontSize:'0.78rem' }}>No mistakes tagged yet 🎯</p>
                : topMistakes.map(([m, count]) => (
                  <BarRow key={m} label={m} value={count}
                    max={topMistakes[0][1]} note={`${count}×`}
                    color='#ef4444' />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
