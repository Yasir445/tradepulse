'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GC = {'A++':'#ffcc44','A+':'#00ff88','A':'#00d4ff','B':'#a855f7','C':'#ff6b35','F':'#ff3366'}

function Skeleton({ h=80 }) {
  return <div className="skeleton" style={{height:h, borderRadius:8}} />
}

function BarChart({ data, valueKey, labelKey, colorFn, height=120 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:4, height}}>
      {data.map((d, i) => {
        const pct = (d[valueKey]/max)*100
        const color = colorFn ? colorFn(d) : 'var(--cyan)'
        return (
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'0.5rem',
              color:'var(--text-3)'}}>{d[valueKey]}%</div>
            <div style={{width:'100%', background:`${color}20`,
              borderRadius:'3px 3px 0 0', height:`${pct}%`,
              minHeight:pct>0?4:0, position:'relative', overflow:'hidden',
              transition:'height 0.5s ease'}}>
              <div style={{position:'absolute', bottom:0, left:0, right:0,
                height:`${Math.min(pct,100)}%`,
                background:`linear-gradient(180deg, ${color}, ${color}88)`,
                borderRadius:'3px 3px 0 0'}} />
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'0.5rem',
              color:'var(--text-3)', textAlign:'center', letterSpacing:'0.05em'}}>
              {d[labelKey]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, sub, color='var(--text-1)', accent, size='normal' }) {
  return (
    <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
      borderRadius:8, padding: size==='large'?'18px':'12px',
      position:'relative', overflow:'hidden'}}>
      {accent && (
        <div style={{position:'absolute', top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg, ${accent}, transparent)`}} />
      )}
      <div style={{fontSize:'0.55rem', letterSpacing:'0.2em', color:'var(--text-3)',
        fontFamily:'var(--font-mono)', textTransform:'uppercase',
        marginBottom:size==='large'?10:6}}>{label}</div>
      <div style={{fontFamily:'var(--font-mono)', fontWeight:800, color,
        fontSize:size==='large'?'2rem':'1.4rem', lineHeight:1,
        marginBottom:4}}>{value}</div>
      {sub && <div style={{fontSize:'0.6rem', color:'var(--text-3)',
        fontFamily:'var(--font-mono)'}}>{sub}</div>}
    </div>
  )
}

export default function StatsPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('all')

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

  // Period filter
  const filtered = trades.filter(t => {
    if (period === 'all') return true
    if (!t.date) return false
    const parts = t.date.split('/')
    if (parts.length !== 3) return false
    const d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]))
    const now = new Date()
    if (period === 'week') return (now - d)/(1000*60*60*24) <= 7
    if (period === 'month') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()
    return true
  })

  const wins    = filtered.filter(t => t.result==='win').length
  const losses  = filtered.filter(t => t.result==='loss').length
  const be      = filtered.filter(t => t.result==='breakeven').length
  const total   = filtered.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = filtered.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const avgWin  = wins ? (filtered.filter(t=>t.result==='win').reduce((s,t)=>s+(t.pnl_dollar||0),0)/wins) : 0
  const avgLoss = losses ? Math.abs(filtered.filter(t=>t.result==='loss').reduce((s,t)=>s+(t.pnl_dollar||0),0)/losses) : 0
  const pf      = avgLoss > 0 ? (avgWin/avgLoss).toFixed(2) : wins > 0 ? '∞' : '0'

  // Equity
  let running = 0
  const equity = filtered.map(t => { running += (t.pnl_dollar||0); return running })
  const maxEq  = Math.max(...equity, 1), minEq = Math.min(...equity, 0)
  const pnlColor = totalPnl>=0 ? 'var(--green)' : 'var(--red)'
  const wrColor  = parseFloat(winRate)>=60?'var(--green)':parseFloat(winRate)>=45?'var(--gold)':'var(--red)'

  // Max drawdown
  let peak=0, maxDD=0, cur=0
  filtered.forEach(t => {
    cur += (t.pnl_dollar||0)
    if (cur>peak) peak=cur
    const dd=peak-cur
    if (dd>maxDD) maxDD=dd
  })

  // Streaks
  let maxWS=0, maxLS=0, wS=0, lS=0
  filtered.forEach(t => {
    if (t.result==='win')  { wS++; lS=0; if(wS>maxWS) maxWS=wS }
    if (t.result==='loss') { lS++; wS=0; if(lS>maxLS) maxLS=lS }
    if (t.result==='breakeven') { wS=0; lS=0 }
  })

  // By session
  const sessions = ['NY','London','Asian','Overnight']
  const bySession = sessions.map(s => {
    const g = filtered.filter(t=>t.session===s)
    const w = g.filter(t=>t.result==='win').length
    return { s, total:g.length, wins:w, wr:g.length?Math.round((w/g.length)*100):0,
      pnl:g.reduce((a,t)=>a+(t.pnl_dollar||0),0) }
  }).filter(x=>x.total>0)

  // By grade
  const byGrade = ['A++','A+','A','B','C','F'].map(g => {
    const gr = filtered.filter(t=>t.grade===g)
    const w  = gr.filter(t=>t.result==='win').length
    return { g, total:gr.length, wins:w, wr:gr.length?Math.round((w/gr.length)*100):0 }
  }).filter(x=>x.total>0)

  // By day
  const byDay = ['Mon','Tue','Wed','Thu','Fri'].map(d => {
    const g = filtered.filter(t => {
      if (!t.date) return false
      const p = t.date.split('/')
      if (p.length!==3) return false
      return new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]))
        .toLocaleDateString('en',{weekday:'short'})===d
    })
    const w = g.filter(t=>t.result==='win').length
    return { d, total:g.length, wr:g.length?Math.round((w/g.length)*100):0,
      pnl:g.reduce((a,t)=>a+(t.pnl_dollar||0),0) }
  })

  // Mistakes
  const mMap = {}
  filtered.forEach(t=>(t.mistakes||[]).forEach(m=>{mMap[m]=(mMap[m]||0)+1}))
  const topMistakes = Object.entries(mMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // Confluence performance
  const byConf = [0,1,2,3,4,5].map(c => {
    const g = filtered.filter(t=>(t.confluence||0)===c)
    const w = g.filter(t=>t.result==='win').length
    return { c, label:`${c}/5`, total:g.length, wr:g.length?Math.round((w/g.length)*100):0 }
  }).filter(x=>x.total>0)

  const Bar = ({ label, value, max, color, note, subNote }) => (
    <div style={{marginBottom:9}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
        <span style={{color:'var(--text-2)', fontSize:'0.72rem'}}>{label}</span>
        <div>
          <span style={{color, fontWeight:700, fontSize:'0.72rem',
            fontFamily:'var(--font-mono)'}}>{note}</span>
          {subNote && <span style={{color:'var(--text-3)', fontSize:'0.6rem',
            marginLeft:6, fontFamily:'var(--font-mono)'}}>{subNote}</span>}
        </div>
      </div>
      <div style={{background:'var(--bg-1)', borderRadius:3, height:5, overflow:'hidden'}}>
        <div style={{width:`${max>0?(value/max)*100:0}%`, height:'100%',
          background:`linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius:3, transition:'width 0.5s ease'}} />
      </div>
    </div>
  )

  if (loading) return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      {[1,2,3,4].map(i => <Skeleton key={i} h={i===1?200:120} />)}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem'}}>
        <div>
          <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
            fontFamily:'var(--font-mono)', marginBottom:4}}>DATA-DRIVEN INSIGHTS</div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
            color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1}}>Analytics</h1>
        </div>
        <div style={{display:'flex', gap:6}}>
          {[['all','ALL TIME'],['month','THIS MONTH'],['week','THIS WEEK']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} className="btn" style={{
              background: period===v ? 'var(--cyan-dim)' : 'var(--bg-2)',
              borderColor: period===v ? 'rgba(0,212,255,0.3)' : 'var(--border)',
              color: period===v ? 'var(--cyan)' : 'var(--text-3)',
              fontSize:'0.6rem',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div style={{background:'var(--bg-2)', border:'1px dashed var(--border)',
          borderRadius:'var(--radius-lg)', padding:'3rem', textAlign:'center',
          color:'var(--text-3)', fontSize:'0.82rem', fontFamily:'var(--font-mono)'}}>
          NO TRADES IN THIS PERIOD
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8,
            marginBottom:10}}>
            <StatCard label="Win Rate"      value={`${winRate}%`} sub={`${wins}W · ${losses}L · ${be}BE`} color={wrColor} accent={wrColor} />
            <StatCard label="Total P&L"     value={`${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(0)}`} color={pnlColor} accent={pnlColor} />
            <StatCard label="Profit Factor" value={pf} sub="avg win / avg loss" accent="var(--purple)" />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8,
            marginBottom:10}}>
            <StatCard label="Avg Winner"      value={`+$${avgWin.toFixed(0)}`}   color="var(--green)" />
            <StatCard label="Avg Loser"       value={`-$${avgLoss.toFixed(0)}`}  color="var(--red)" />
            <StatCard label="Max Drawdown"    value={`-$${maxDD.toFixed(0)}`}    color="var(--orange)" />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
            marginBottom:10}}>
            <StatCard label="Max Win Streak"  value={maxWS} sub="consecutive wins" color="var(--green)" />
            <StatCard label="Max Loss Streak" value={maxLS} sub="consecutive losses" color="var(--red)" />
          </div>

          {/* Equity curve */}
          {equity.length > 1 && (
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'14px', marginBottom:10}}>
              <div style={{display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:10}}>
                <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                  fontFamily:'var(--font-mono)', textTransform:'uppercase'}}>Equity Curve</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem',
                  fontWeight:700, color:pnlColor}}>
                  {totalPnl>=0?'+$':'-$'}{Math.abs(totalPnl).toFixed(0)}
                </div>
              </div>
              <svg width="100%" height="120" viewBox={`0 0 ${equity.length} 120`}
                preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnl>=0?'#00ff88':'#ff3366'} stopOpacity="0.35"/>
                    <stop offset="100%" stopColor={totalPnl>=0?'#00ff88':'#ff3366'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" x2={equity.length}
                  y1={120-((0-minEq)/(maxEq-minEq||1))*120}
                  y2={120-((0-minEq)/(maxEq-minEq||1))*120}
                  stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3"/>
                <path d={`M0,${120-((equity[0]-minEq)/(maxEq-minEq||1))*120} `+
                  equity.map((v,i)=>`L${i},${120-((v-minEq)/(maxEq-minEq||1))*120}`).join(' ')+
                  ` L${equity.length-1},120 L0,120 Z`}
                  fill="url(#eqg)"/>
                <polyline
                  points={equity.map((v,i)=>`${i},${120-((v-minEq)/(maxEq-minEq||1))*120}`).join(' ')}
                  fill="none" stroke={totalPnl>=0?'#00ff88':'#ff3366'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Day of week bar chart */}
          {byDay.filter(d=>d.total>0).length > 0 && (
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'14px', marginBottom:10}}>
              <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:12}}>
                Win Rate by Day
              </div>
              <BarChart
                data={byDay.filter(d=>d.total>0)}
                valueKey="wr" labelKey="d" height={100}
                colorFn={d=>d.wr>=60?'var(--green)':d.wr>=45?'var(--gold)':'var(--red)'}
              />
            </div>
          )}

          {/* Session + Grade */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px'}}>
              <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:10}}>
                By Session
              </div>
              {bySession.length===0
                ? <div style={{color:'var(--text-4)', fontSize:'0.72rem'}}>No data</div>
                : bySession.map(({s,wr,total:t,wins:w,pnl}) => (
                  <Bar key={s} label={s} value={wr} max={100} note={`${wr}%`}
                    subNote={`${w}/${t}`}
                    color={wr>=60?'var(--green)':wr>=45?'var(--gold)':'var(--red)'} />
                ))}
            </div>
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px'}}>
              <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:10}}>
                By Grade
              </div>
              {byGrade.length===0
                ? <div style={{color:'var(--text-4)', fontSize:'0.72rem'}}>No data</div>
                : byGrade.map(({g,wr,total:t,wins:w}) => (
                  <Bar key={g} label={g} value={wr} max={100} note={`${wr}%`}
                    subNote={`${w}/${t}`} color={GC[g]||'var(--text-3)'} />
                ))}
            </div>
          </div>

          {/* Confluence + Mistakes */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px'}}>
              <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:10}}>
                By Confluence
              </div>
              {byConf.length===0
                ? <div style={{color:'var(--text-4)', fontSize:'0.72rem'}}>No data</div>
                : byConf.map(({label,wr,total:t,wins:w}) => (
                  <Bar key={label} label={label} value={wr} max={100}
                    note={`${wr}%`} subNote={`${t}t`}
                    color={wr>=60?'var(--green)':wr>=45?'var(--gold)':'var(--red)'} />
                ))}
            </div>
            <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px'}}>
              <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:10}}>
                Top Mistakes
              </div>
              {topMistakes.length===0
                ? <div style={{color:'var(--green)', fontSize:'0.72rem',
                    fontFamily:'var(--font-mono)'}}>No mistakes tagged 🎯</div>
                : topMistakes.map(([m,count]) => (
                  <Bar key={m} label={m.length>22?m.slice(0,22)+'…':m}
                    value={count} max={topMistakes[0][1]}
                    note={`${count}×`} color="var(--red)" />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
