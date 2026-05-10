'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GC = { 'A++':'#ffcc00','A+':'#39ff14','A':'#00e5ff','B':'#c084ff','C':'#ff6b35','F':'#ff2d55' }

export default function StatsPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('all') // all | month | week

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const acctId = localStorage.getItem('tp-active-account')
    let q = supabase.from('trades').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (acctId) q = q.eq('account_id', acctId)
    const { data } = await q
    setTrades(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const h = () => { setLoading(true); load() }
    window.addEventListener('account-changed', h)
    return () => window.removeEventListener('account-changed', h)
  }, [load])

  // Filter by period
  const filtered = trades.filter(t => {
    if (period === 'all') return true
    if (!t.date) return false
    const parts = t.date.split('/')
    if (parts.length !== 3) return false
    const d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]))
    const now = new Date()
    if (period === 'week') {
      const diff = (now - d) / (1000*60*60*24)
      return diff <= 7
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  })

  const wins    = filtered.filter(t => t.result==='win').length
  const losses  = filtered.filter(t => t.result==='loss').length
  const be      = filtered.filter(t => t.result==='breakeven').length
  const total   = filtered.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = filtered.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const avgWin  = wins ? (filtered.filter(t=>t.result==='win').reduce((s,t)=>s+(t.pnl_dollar||0),0)/wins).toFixed(0) : '0'
  const avgLoss = losses ? Math.abs(filtered.filter(t=>t.result==='loss').reduce((s,t)=>s+(t.pnl_dollar||0),0)/losses).toFixed(0) : '0'
  const pf      = losses>0?(wins/losses).toFixed(2):wins>0?'∞':'0'
  const rrT     = filtered.filter(t=>t.rr)
  const avgRR   = rrT.length ? (rrT.reduce((s,t)=>s+parseFloat(t.rr?.split(':')[1]||0),0)/rrT.length).toFixed(2) : '—'

  // Equity curve
  let running = 0
  const equity = filtered.map(t => { running += (t.pnl_dollar||0); return running })
  const maxEq  = Math.max(...equity, 1), minEq = Math.min(...equity, 0)
  const pnlColor = totalPnl>=0?'#39ff14':'#ff2d55'
  const wrColor  = parseFloat(winRate)>=60?'#39ff14':parseFloat(winRate)>=45?'#ffcc00':'#ff2d55'

  // Best/worst
  const bestTrade  = filtered.reduce((b,t)=>(!b||(t.pnl_dollar||0)>(b.pnl_dollar||0))?t:b, null)
  const worstTrade = filtered.reduce((w,t)=>(!w||(t.pnl_dollar||0)<(w.pnl_dollar||0))?t:w, null)

  // Max drawdown
  let peak = 0, maxDD = 0, cur = 0
  filtered.forEach(t => {
    cur += (t.pnl_dollar||0)
    if (cur > peak) peak = cur
    const dd = peak - cur
    if (dd > maxDD) maxDD = dd
  })

  // Consecutive wins/losses
  let maxWinStreak = 0, maxLossStreak = 0, wS = 0, lS = 0
  filtered.forEach(t => {
    if (t.result==='win')  { wS++; lS=0; if(wS>maxWinStreak)  maxWinStreak=wS  }
    if (t.result==='loss') { lS++; wS=0; if(lS>maxLossStreak) maxLossStreak=lS }
    if (t.result==='breakeven') { wS=0; lS=0 }
  })

  // By session
  const sessions = ['NY','London','Asian','Overnight']
  const bySession = sessions.map(s => {
    const g = filtered.filter(t=>t.session===s)
    const w = g.filter(t=>t.result==='win').length
    const p = g.reduce((a,t)=>a+(t.pnl_dollar||0),0)
    return { s, total:g.length, wins:w, wr:g.length?Math.round((w/g.length)*100):0, pnl:p }
  }).filter(x=>x.total>0)

  // By grade
  const grades = ['A++','A+','A','B','C','F']
  const byGrade = grades.map(g => {
    const gr = filtered.filter(t=>t.grade===g)
    const w  = gr.filter(t=>t.result==='win').length
    return { g, total:gr.length, wins:w, wr:gr.length?Math.round((w/gr.length)*100):0 }
  }).filter(x=>x.total>0)

  // By day
  const days = ['Mon','Tue','Wed','Thu','Fri']
  const byDay = days.map(d => {
    const g = filtered.filter(t => {
      if (!t.date) return false
      const parts = t.date.split('/')
      if (parts.length !== 3) return false
      return new Date(parseInt(parts[2]),parseInt(parts[1])-1,parseInt(parts[0]))
        .toLocaleDateString('en',{weekday:'short'}) === d
    })
    const w = g.filter(t=>t.result==='win').length
    return { d, total:g.length, wr:g.length?Math.round((w/g.length)*100):0, pnl:g.reduce((a,t)=>a+(t.pnl_dollar||0),0) }
  })

  // By direction
  const longT  = filtered.filter(t=>t.direction==='LONG')
  const shortT = filtered.filter(t=>t.direction==='SHORT')
  const longW  = longT.filter(t=>t.result==='win').length
  const shortW = shortT.filter(t=>t.result==='win').length
  const longWR = longT.length ? Math.round((longW/longT.length)*100) : 0
  const shortWR= shortT.length ? Math.round((shortW/shortT.length)*100) : 0

  // Mistakes
  const mMap = {}
  filtered.forEach(t=>(t.mistakes||[]).forEach(m=>{mMap[m]=(mMap[m]||0)+1}))
  const topMistakes = Object.entries(mMap).sort((a,b)=>b[1]-a[1]).slice(0,6)

  // By confluence
  const confData = [0,1,2,3,4,5].map(c => {
    const g = filtered.filter(t=>(t.confluence||0)===c)
    const w = g.filter(t=>t.result==='win').length
    return { c, total:g.length, wr:g.length?Math.round((w/g.length)*100):0 }
  }).filter(x=>x.total>0)

  if (loading) return (
    <div style={{ color:'#1e3a4a', textAlign:'center', padding:'3rem',
      fontSize:'0.75rem', letterSpacing:'3px' }}>LOADING ANALYTICS…</div>
  )

  const Bar = ({ label, value, max, color='#00e5ff', note, sub }) => (
    <div style={{ marginBottom:'9px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
        <span style={{ color:'#c9d6df', fontSize:'0.72rem' }}>{label}</span>
        <div>
          <span style={{ color, fontWeight:700, fontSize:'0.72rem' }}>{note}</span>
          {sub && <span style={{ color:'#4a6274', fontSize:'0.6rem', marginLeft:'6px' }}>{sub}</span>}
        </div>
      </div>
      <div style={{ background:'#0d1117', borderRadius:'2px', height:5, overflow:'hidden' }}>
        <div style={{ width:`${max>0?(value/max)*100:0}%`, height:'100%',
          background:`linear-gradient(90deg,${color},${color}88)`,
          borderRadius:'2px', transition:'width .5s ease' }} />
      </div>
    </div>
  )

  const KCard = ({ label, value, sub, color='#eaf4fb' }) => (
    <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px', padding:'11px' }}>
      <div style={{ color:'#4a6274', fontSize:'0.52rem', letterSpacing:'2px',
        textTransform:'uppercase', marginBottom:'5px' }}>{label}</div>
      <div style={{ color, fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem',
        letterSpacing:'2px', lineHeight:1, marginBottom:'3px' }}>{value}</div>
      {sub && <div style={{ color:'#2a4a5a', fontSize:'0.58rem' }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
            textTransform:'uppercase', marginBottom:'3px' }}>Data-Driven Insights</div>
          <div style={{ color:'#eaf4fb', fontSize:'1.4rem', fontWeight:900,
            letterSpacing:'2px' }}>ANALYTICS</div>
        </div>
        <div style={{ display:'flex', gap:'5px' }}>
          {[['all','ALL TIME'],['month','THIS MONTH'],['week','THIS WEEK']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              padding:'5px 10px', borderRadius:'3px', fontFamily:'inherit',
              fontSize:'0.58rem', letterSpacing:'1px', cursor:'pointer',
              background: period===v ? 'rgba(0,229,255,.1)' : '#0d1117',
              border: period===v ? '1px solid rgba(0,229,255,.3)' : '1px solid #1e2a35',
              color: period===v ? '#00e5ff' : '#4a6274',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div style={{ border:'1px dashed #1e2a35', borderRadius:'4px', padding:'2.5rem',
          textAlign:'center', color:'#4a6274', fontSize:'0.72rem', letterSpacing:'2px' }}>
          NO TRADES IN THIS PERIOD
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px',
            marginBottom:'1rem' }}>
            <KCard label="Win Rate" value={`${winRate}%`} sub={`${wins}W ${losses}L ${be}BE`} color={wrColor} />
            <KCard label="Total P&L" value={`${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(0)}`} color={pnlColor} />
            <KCard label="Profit Factor" value={pf} sub={`${total} trades`} color='#c084ff' />
            <KCard label="Avg Winner" value={`+$${avgWin}`} color='#39ff14' />
            <KCard label="Avg Loser" value={`-$${avgLoss}`} color='#ff2d55' />
            <KCard label="Avg R:R" value={`1:${avgRR}`} color='#00e5ff' />
            <KCard label="Max DD" value={`-$${maxDD.toFixed(0)}`} color='#ff6b35' />
            <KCard label="Max Win Streak" value={maxWinStreak} color='#39ff14' />
            <KCard label="Max Loss Streak" value={maxLossStreak} color='#ff2d55' />
          </div>

          {/* Best/worst */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'1rem' }}>
            <div style={{ background:'rgba(57,255,20,.05)', border:'1px solid rgba(57,255,20,.2)',
              borderRadius:'4px', padding:'11px' }}>
              <div style={{ color:'#39ff14', fontSize:'0.55rem', letterSpacing:'2px', marginBottom:'5px' }}>
                BEST TRADE
              </div>
              <div style={{ color:'#39ff14', fontFamily:"'Bebas Neue',sans-serif",
                fontSize:'1.5rem', letterSpacing:'2px' }}>
                +${Math.abs(bestTrade?.pnl_dollar||0).toFixed(0)}
              </div>
              <div style={{ color:'#4a6274', fontSize:'0.62rem' }}>
                {bestTrade?.instrument} · {bestTrade?.date}
              </div>
            </div>
            <div style={{ background:'rgba(255,45,85,.05)', border:'1px solid rgba(255,45,85,.2)',
              borderRadius:'4px', padding:'11px' }}>
              <div style={{ color:'#ff2d55', fontSize:'0.55rem', letterSpacing:'2px', marginBottom:'5px' }}>
                WORST TRADE
              </div>
              <div style={{ color:'#ff2d55', fontFamily:"'Bebas Neue',sans-serif",
                fontSize:'1.5rem', letterSpacing:'2px' }}>
                -${Math.abs(worstTrade?.pnl_dollar||0).toFixed(0)}
              </div>
              <div style={{ color:'#4a6274', fontSize:'0.62rem' }}>
                {worstTrade?.instrument} · {worstTrade?.date}
              </div>
            </div>
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'14px', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
                  textTransform:'uppercase' }}>Equity Curve</div>
                <span style={{ color:pnlColor, fontFamily:'monospace', fontWeight:700,
                  fontSize:'0.78rem' }}>{totalPnl>=0?'+$':'-$'}{Math.abs(totalPnl).toFixed(0)}</span>
              </div>
              <svg width="100%" height="110" viewBox={`0 0 ${equity.length} 110`}
                preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={pnlColor} stopOpacity="0.35"/>
                    <stop offset="100%" stopColor={pnlColor} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" x2={equity.length}
                  y1={110-((0-minEq)/(maxEq-minEq||1))*110}
                  y2={110-((0-minEq)/(maxEq-minEq||1))*110}
                  stroke="#1e2a35" strokeWidth="0.5" strokeDasharray="3,3"/>
                <path d={`M0,${110-((equity[0]-minEq)/(maxEq-minEq||1))*110} `+
                  equity.map((v,i)=>`L${i},${110-((v-minEq)/(maxEq-minEq||1))*110}`).join(' ')+
                  ` L${equity.length-1},110 L0,110 Z`}
                  fill="url(#eg2)"/>
                <polyline
                  points={equity.map((v,i)=>`${i},${110-((v-minEq)/(maxEq-minEq||1))*110}`).join(' ')}
                  fill="none" stroke={pnlColor} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* Direction breakdown */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'1rem' }}>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>LONG vs SHORT</div>
              <Bar label="▲ LONG" value={longWR} max={100}
                color='#39ff14' note={`${longWR}%`} sub={`${longW}/${longT.length}`} />
              <Bar label="▼ SHORT" value={shortWR} max={100}
                color='#ff2d55' note={`${shortWR}%`} sub={`${shortW}/${shortT.length}`} />
            </div>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>BY CONFLUENCE</div>
              {confData.map(({ c, wr, total:t }) => (
                <Bar key={c} label={`${c}/5 ✓`} value={wr} max={100}
                  color={GC[['F','F','C','B','A','A+'][c]]||'#4a6274'}
                  note={`${wr}%`} sub={`${t}t`} />
              ))}
            </div>
          </div>

          {/* Session + Grade */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'1rem' }}>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>BY SESSION</div>
              {bySession.length===0
                ? <div style={{ color:'#1e3a4a', fontSize:'0.7rem' }}>No data</div>
                : bySession.map(({ s, wr, total:t, wins:w, pnl }) => (
                  <Bar key={s} label={s} value={wr} max={100}
                    color={wr>=60?'#39ff14':wr>=45?'#ffcc00':'#ff2d55'}
                    note={`${wr}%`} sub={`${w}/${t} · ${pnl>=0?'+':''}$${Math.abs(pnl).toFixed(0)}`} />
                ))}
            </div>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>BY GRADE</div>
              {byGrade.length===0
                ? <div style={{ color:'#1e3a4a', fontSize:'0.7rem' }}>No data</div>
                : byGrade.map(({ g, wr, total:t, wins:w }) => (
                  <Bar key={g} label={g} value={wr} max={100}
                    color={GC[g]||'#4a6274'} note={`${wr}%`} sub={`${w}/${t}`} />
                ))}
            </div>
          </div>

          {/* Day + Mistakes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>BY DAY</div>
              {byDay.filter(d=>d.total>0).length===0
                ? <div style={{ color:'#1e3a4a', fontSize:'0.7rem' }}>No data</div>
                : byDay.filter(d=>d.total>0).map(({ d, wr, total:t, pnl }) => (
                  <Bar key={d} label={d} value={wr} max={100}
                    color={wr>=60?'#39ff14':wr>=45?'#ffcc00':'#ff2d55'}
                    note={`${wr}%`} sub={`${t}t`} />
                ))}
            </div>
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'10px' }}>TOP MISTAKES</div>
              {topMistakes.length===0
                ? <div style={{ color:'#39ff14', fontSize:'0.7rem' }}>No mistakes tagged 🎯</div>
                : topMistakes.map(([m, count]) => (
                  <Bar key={m} label={m.length>22?m.slice(0,22)+'…':m}
                    value={count} max={topMistakes[0][1]}
                    color='#ff2d55' note={`${count}×`} />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
