'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GRADE_COLOR = {
  'A++':'#eab308','A+':'#22c55e','A':'#86efac','B':'#3b82f6','C':'#f59e0b','F':'#ef4444'
}

export default function StatsPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setTrades(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ color:'#555', paddingTop:'2rem' }}>Loading stats…</div>

  const wins   = trades.filter(t => t.result==='WIN').length
  const losses = trades.filter(t => t.result==='LOSS').length
  const total  = trades.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = trades.reduce((s,t) => s+(t.pnl||0), 0)
  const rrT    = trades.filter(t => t.rr)
  const avgRR  = rrT.length ? (rrT.reduce((s,t)=>s+t.rr,0)/rrT.length).toFixed(2) : '—'

  // Equity curve
  let running = 0
  const equity = trades.map(t => { running += (t.pnl||0); return running })
  const maxEq  = Math.max(...equity, 1)
  const minEq  = Math.min(...equity, 0)

  // By session
  const sessions = ['London','NY','Overnight','Asian']
  const bySession = sessions.map(s => {
    const g = trades.filter(t => t.session===s)
    const w = g.filter(t => t.result==='WIN').length
    return { s, total:g.length, wins:w, wr:g.length?Math.round((w/g.length)*100):0 }
  }).filter(x => x.total > 0)

  // By grade
  const grades = ['A++','A+','A','B','C','F']
  const byGrade = grades.map(g => {
    const gr = trades.filter(t => t.grade===g)
    const w  = gr.filter(t => t.result==='WIN').length
    return { g, total:gr.length, wins:w, wr:gr.length?Math.round((w/gr.length)*100):0 }
  }).filter(x => x.total > 0)

  // Mistakes
  const mistakeMap = {}
  trades.forEach(t => (t.mistakes||[]).forEach(m => { mistakeMap[m]=(mistakeMap[m]||0)+1 }))
  const topMistakes = Object.entries(mistakeMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // By day
  const days = ['Mon','Tue','Wed','Thu','Fri']
  const byDay = days.map(d => {
    const g = trades.filter(t => {
      if (!t.date) return false
      return new Date(t.date).toLocaleDateString('en',{weekday:'short'}) === d
    })
    const w = g.filter(t => t.result==='WIN').length
    return { d, total:g.length, wr:g.length?Math.round((w/g.length)*100):0 }
  })

  const Card = ({ label, value, sub, color='#fff' }) => (
    <div style={{ background:'#101010', border:'1px solid #1f1f1f', borderRadius:'8px',
      padding:'1.25rem', flex:1, minWidth:120 }}>
      <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
        textTransform:'uppercase', margin:'0 0 0.4rem' }}>{label}</p>
      <p style={{ color, fontSize:'1.8rem', fontWeight:800, margin:'0 0 0.2rem',
        fontFamily:'monospace' }}>{value}</p>
      {sub && <p style={{ color:'#555', fontSize:'0.7rem', margin:0 }}>{sub}</p>}
    </div>
  )

  const BarRow = ({ label, value, max, color='#22c55e', note }) => (
    <div style={{ marginBottom:'0.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
        <span style={{ color:'#ccc', fontSize:'0.8rem' }}>{label}</span>
        <span style={{ color:'#888', fontSize:'0.75rem' }}>{note}</span>
      </div>
      <div style={{ background:'#1a1a1a', borderRadius:'4px', height:6, overflow:'hidden' }}>
        <div style={{ width:`${max>0?(value/max)*100:0}%`, height:'100%',
          background:color, borderRadius:'4px', transition:'width 0.4s' }} />
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <p style={{ color:'#888', fontSize:'0.7rem', letterSpacing:'0.2em',
          textTransform:'uppercase', margin:'0 0 0.3rem' }}>Analytics</p>
        <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900, margin:0 }}>Performance</h1>
      </div>

      {total === 0 ? (
        <p style={{ color:'#555' }}>No trades yet. Log your first trade in the Journal.</p>
      ) : (
        <>
          <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <Card label="Win Rate" value={`${winRate}%`}
              sub={`${wins}W · ${losses}L`}
              color={parseFloat(winRate)>=60?'#22c55e':parseFloat(winRate)>=45?'#f59e0b':'#ef4444'} />
            <Card label="Total P&L"
              value={`${totalPnl>0?'+':''}${totalPnl.toFixed(0)}`} sub="points"
              color={totalPnl>0?'#22c55e':totalPnl<0?'#ef4444':'#fff'} />
            <Card label="Avg RR"  value={avgRR} sub="risk/reward" />
            <Card label="Trades"  value={total} sub="logged" />
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{ background:'#101010', border:'1px solid #1f1f1f',
              borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' }}>
              <p style={{ color:'#888', fontSize:'0.65rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem' }}>Equity Curve</p>
              <div style={{ position:'relative', height:120 }}>
                <svg width="100%" height="120"
                  viewBox={`0 0 ${equity.length} 120`} preserveAspectRatio="none">
                  <path
                    d={`M 0,${120-((equity[0]-minEq)/(maxEq-minEq||1))*120} `+
                      equity.map((v,i)=>`L ${i},${120-((v-minEq)/(maxEq-minEq||1))*120}`).join(' ')+
                      ` L ${equity.length-1},120 L 0,120 Z`}
                    fill={totalPnl>=0?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'}
                  />
                  <polyline
                    points={equity.map((v,i)=>`${i},${120-((v-minEq)/(maxEq-minEq||1))*120}`).join(' ')}
                    fill="none"
                    stroke={totalPnl>=0?'#22c55e':'#ef4444'}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:'1rem', marginBottom:'1rem' }}>
            <div style={{ background:'#101010', border:'1px solid #1f1f1f',
              borderRadius:'8px', padding:'1.25rem' }}>
              <p style={{ color:'#888', fontSize:'0.65rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem' }}>By Session</p>
              {bySession.length===0
                ? <p style={{ color:'#555', fontSize:'0.8rem' }}>No data</p>
                : bySession.map(({ s, wr, total:t, wins:w }) => (
                  <BarRow key={s} label={s} value={wr} max={100}
                    note={`${w}/${t} · ${wr}%`}
                    color={wr>=60?'#22c55e':wr>=45?'#f59e0b':'#ef4444'} />
                ))}
            </div>
            <div style={{ background:'#101010', border:'1px solid #1f1f1f',
              borderRadius:'8px', padding:'1.25rem' }}>
              <p style={{ color:'#888', fontSize:'0.65rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem' }}>By Grade</p>
              {byGrade.length===0
                ? <p style={{ color:'#555', fontSize:'0.8rem' }}>No data</p>
                : byGrade.map(({ g, wr, total:t, wins:w }) => (
                  <BarRow key={g} label={g} value={wr} max={100}
                    note={`${w}/${t} · ${wr}%`} color={GRADE_COLOR[g]||'#888'} />
                ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={{ background:'#101010', border:'1px solid #1f1f1f',
              borderRadius:'8px', padding:'1.25rem' }}>
              <p style={{ color:'#888', fontSize:'0.65rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem' }}>By Day</p>
              {byDay.filter(d=>d.total>0).map(({ d, wr, total:t }) => (
                <BarRow key={d} label={d} value={wr} max={100}
                  note={`${t} trades · ${wr}%`}
                  color={wr>=60?'#22c55e':wr>=45?'#f59e0b':'#ef4444'} />
              ))}
              {byDay.every(d=>d.total===0) && <p style={{color:'#555',fontSize:'0.8rem'}}>No data</p>}
            </div>
            <div style={{ background:'#101010', border:'1px solid #1f1f1f',
              borderRadius:'8px', padding:'1.25rem' }}>
              <p style={{ color:'#888', fontSize:'0.65rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 1rem' }}>Top Mistakes</p>
              {topMistakes.length===0
                ? <p style={{ color:'#555', fontSize:'0.8rem' }}>No mistakes tagged yet.</p>
                : topMistakes.map(([m, count]) => (
                  <BarRow key={m} label={m} value={count}
                    max={topMistakes[0][1]} note={`${count}×`} color='#ef4444' />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
