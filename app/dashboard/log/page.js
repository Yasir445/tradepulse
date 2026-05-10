'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GRADE_COLOR = {
  'A++':'#ffcc00','A+':'#39ff14','A':'#00e5ff','B':'#c084ff','C':'#ff6b35','F':'#ff2d55'
}

export default function LogPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const [view,    setView]    = useState('table') // 'table' | 'calendar'
  const [month,   setMonth]   = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const acctId = localStorage.getItem('tp-active-account')
    let q = supabase.from('trades').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
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

  const visible = filter === 'ALL' ? trades
    : trades.filter(t => t.result === filter.toLowerCase())

  // Calendar data
  const [yr, mo] = month.split('-').map(Number)
  const daysInMonth = new Date(yr, mo, 0).getDate()
  const firstDay    = new Date(yr, mo-1, 1).getDay()

  const dayMap = {}
  trades.forEach(t => {
    if (!t.date) return
    const parts = t.date.split('/')
    if (parts.length !== 3) return
    const key = `${parts[2]}-${parts[1]}-${parts[0].padStart(2,'0')}`
    if (!dayMap[key]) dayMap[key] = { pnl:0, count:0, wins:0, losses:0 }
    dayMap[key].pnl    += (t.pnl_dollar || 0)
    dayMap[key].count  += 1
    dayMap[key].wins   += t.result === 'win' ? 1 : 0
    dayMap[key].losses += t.result === 'loss' ? 1 : 0
  })

  const totalPnl  = trades.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const wins      = trades.filter(t => t.result==='win').length
  const losses    = trades.filter(t => t.result==='loss').length
  const winRate   = trades.length ? ((wins/trades.length)*100).toFixed(1) : '0'
  const pnlColor  = totalPnl >= 0 ? '#39ff14' : '#ff2d55'

  const deleteTrade = async (id) => {
    if (!confirm('Delete this trade?')) return
    const supabase = createClient()
    await supabase.from('trades').delete().eq('id', id)
    setTrades(p => p.filter(t => t.id !== id))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
            textTransform:'uppercase', marginBottom:'3px' }}>Trade History</div>
          <div style={{ color:'#eaf4fb', fontSize:'1.4rem', fontWeight:900,
            letterSpacing:'2px' }}>LOG</div>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {['table','calendar'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'6px 12px', borderRadius:'3px', fontFamily:'inherit',
              fontSize:'0.62rem', letterSpacing:'2px', textTransform:'uppercase',
              cursor:'pointer', transition:'all .15s',
              background: view===v ? 'rgba(0,229,255,.1)' : '#0d1117',
              border: view===v ? '1px solid rgba(0,229,255,.3)' : '1px solid #1e2a35',
              color: view===v ? '#00e5ff' : '#4a6274',
            }}>{v==='table'?'≡ Table':'⊞ Calendar'}</button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px',
        marginBottom:'1rem' }}>
        {[
          { l:'Total',   v:trades.length,     c:'#00e5ff' },
          { l:'Win Rate', v:`${winRate}%`,     c:parseFloat(winRate)>=60?'#39ff14':parseFloat(winRate)>=45?'#ffcc00':'#ff2d55' },
          { l:'Wins',    v:wins,               c:'#39ff14' },
          { l:'P&L',     v:`${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(0)}`, c:pnlColor },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'#0d1117', border:'1px solid #1e2a35',
            borderRadius:'3px', padding:'8px', textAlign:'center' }}>
            <div style={{ color:c, fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'1.3rem', letterSpacing:'2px', lineHeight:1 }}>{v}</div>
            <div style={{ color:'#4a6274', fontSize:'0.52rem', letterSpacing:'2px',
              textTransform:'uppercase', marginTop:'2px' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'5px', marginBottom:'1rem', flexWrap:'wrap' }}>
        {['ALL','WIN','LOSS','BREAKEVEN'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'5px 12px', borderRadius:'3px', fontFamily:'inherit',
            fontSize:'0.62rem', letterSpacing:'2px', cursor:'pointer',
            background: filter===f
              ? (f==='WIN'?'rgba(57,255,20,.1)':f==='LOSS'?'rgba(255,45,85,.1)':f==='BREAKEVEN'?'rgba(255,204,0,.1)':'rgba(0,229,255,.1)')
              : '#0d1117',
            border: filter===f
              ? `1px solid ${f==='WIN'?'rgba(57,255,20,.4)':f==='LOSS'?'rgba(255,45,85,.4)':f==='BREAKEVEN'?'rgba(255,204,0,.4)':'rgba(0,229,255,.3)'}`
              : '1px solid #1e2a35',
            color: filter===f
              ? (f==='WIN'?'#39ff14':f==='LOSS'?'#ff2d55':f==='BREAKEVEN'?'#ffcc00':'#00e5ff')
              : '#4a6274',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft:'auto', color:'#4a6274', fontSize:'0.62rem',
          display:'flex', alignItems:'center' }}>{visible.length} trades</span>
      </div>

      {loading ? (
        <div style={{ color:'#1e3a4a', textAlign:'center', padding:'2rem',
          fontSize:'0.75rem', letterSpacing:'2px' }}>LOADING…</div>
      ) : view === 'calendar' ? (
        <>
          {/* Month nav */}
          <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'1rem' }}>
            <button onClick={() => {
              const d = new Date(yr, mo-2)
              setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
            }} style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'3px',
              color:'#4a6274', padding:'5px 10px', cursor:'pointer', fontFamily:'inherit',
              fontSize:'0.7rem' }}>←</button>
            <span style={{ color:'#eaf4fb', fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'1.2rem', letterSpacing:'3px', flex:1, textAlign:'center' }}>
              {new Date(yr, mo-1).toLocaleString('en',{month:'long',year:'numeric'}).toUpperCase()}
            </span>
            <button onClick={() => {
              const d = new Date(yr, mo)
              setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
            }} style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'3px',
              color:'#4a6274', padding:'5px 10px', cursor:'pointer', fontFamily:'inherit',
              fontSize:'0.7rem' }}>→</button>
          </div>

          {/* Calendar grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px',
            marginBottom:'0.5rem' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign:'center', color:'#4a6274', fontSize:'0.55rem',
                letterSpacing:'1px', padding:'4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px',
            marginBottom:'1.25rem' }}>
            {Array(firstDay).fill(null).map((_,i) => (
              <div key={`e${i}`} style={{ background:'transparent', minHeight:52 }} />
            ))}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const d    = i + 1
              const key  = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const data = dayMap[key]
              const bg   = !data ? '#0d1117'
                : data.pnl > 0 ? 'rgba(57,255,20,.08)'
                : data.pnl < 0 ? 'rgba(255,45,85,.08)'
                : 'rgba(255,204,0,.08)'
              const bc   = !data ? '#1e2a35'
                : data.pnl > 0 ? 'rgba(57,255,20,.3)'
                : data.pnl < 0 ? 'rgba(255,45,85,.3)'
                : 'rgba(255,204,0,.3)'
              const pc   = !data ? '#4a6274'
                : data.pnl > 0 ? '#39ff14'
                : data.pnl < 0 ? '#ff2d55'
                : '#ffcc00'
              const today = new Date()
              const isToday = today.getDate()===d && today.getMonth()===mo-1 && today.getFullYear()===yr
              return (
                <div key={d} style={{ background:bg, border:`1px solid ${isToday?'#00e5ff':bc}`,
                  borderRadius:'3px', padding:'5px', minHeight:52,
                  display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ color:isToday?'#00e5ff':'#4a6274', fontSize:'0.65rem',
                    fontWeight:isToday?700:400 }}>{d}</div>
                  {data && (
                    <>
                      <div style={{ color:pc, fontFamily:'monospace', fontSize:'0.62rem',
                        fontWeight:700, textAlign:'right' }}>
                        {data.pnl>=0?'+$':'-$'}{Math.abs(data.pnl).toFixed(0)}
                      </div>
                      <div style={{ color:'#4a6274', fontSize:'0.5rem', textAlign:'right' }}>
                        {data.count}t
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Table view */
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {visible.length === 0 ? (
            <div style={{ border:'1px dashed #1e2a35', borderRadius:'4px', padding:'2.5rem',
              textAlign:'center', color:'#4a6274', fontSize:'0.72rem', letterSpacing:'2px' }}>
              NO TRADES FOUND
            </div>
          ) : visible.map(t => (
            <div key={t.id} style={{
              background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
              padding:'11px 14px',
            }}>
              {/* Top row */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:'6px', flexWrap:'wrap', gap:'5px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem',
                    color:GRADE_COLOR[t.grade]||'#4a6274',
                    textShadow:`0 0 6px ${GRADE_COLOR[t.grade]||'transparent'}` }}>
                    {t.grade||'?'}
                  </span>
                  <span style={{ color:'#eaf4fb', fontWeight:700, fontSize:'0.82rem' }}>
                    {t.date} · {t.instrument}
                  </span>
                  <span style={{
                    fontSize:'0.62rem', padding:'2px 7px', borderRadius:'3px',
                    letterSpacing:'1px', fontWeight:600,
                    background:t.direction==='LONG'?'rgba(57,255,20,.1)':'rgba(255,45,85,.1)',
                    color:t.direction==='LONG'?'#39ff14':'#ff2d55',
                    border:`1px solid ${t.direction==='LONG'?'rgba(57,255,20,.3)':'rgba(255,45,85,.3)'}`,
                  }}>{t.direction==='LONG'?'▲ LONG':'▼ SHORT'}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{
                    fontSize:'0.68rem', padding:'2px 9px', borderRadius:'3px', letterSpacing:'1px',
                    background:t.result==='win'?'rgba(57,255,20,.1)':t.result==='loss'?'rgba(255,45,85,.1)':'rgba(255,204,0,.1)',
                    color:t.result==='win'?'#39ff14':t.result==='loss'?'#ff2d55':'#ffcc00',
                    border:`1px solid ${t.result==='win'?'rgba(57,255,20,.3)':t.result==='loss'?'rgba(255,45,85,.3)':'rgba(255,204,0,.3)'}`,
                    fontWeight:600,
                  }}>{t.result?.toUpperCase()}</span>
                  <span style={{ color:t.pnl_dollar>=0?'#39ff14':'#ff2d55',
                    fontFamily:'monospace', fontWeight:700, fontSize:'0.88rem' }}>
                    {t.pnl_dollar!=null?`${t.pnl_dollar>=0?'+$':'-$'}${Math.abs(t.pnl_dollar).toFixed(0)}`:'—'}
                  </span>
                  <button onClick={() => deleteTrade(t.id)} style={{
                    background:'transparent', border:'none', color:'#1e3a4a',
                    cursor:'pointer', fontSize:'0.75rem', padding:'2px 5px',
                  }}>✕</button>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                {[
                  { l:'Session', v:t.session },
                  { l:'Entry',   v:t.entry },
                  { l:'SL',      v:t.sl },
                  { l:'TP',      v:t.tp },
                  { l:'Exit',    v:t.exit||'—' },
                  { l:'R:R',     v:t.rr||'—' },
                  { l:'Pts',     v:t.pnl!=null?`${t.pnl>0?'+':''}${t.pnl}`:'—' },
                  { l:'Conf',    v:`${t.confluence||0}/5` },
                ].map(({ l, v }) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ color:'#4a6274', fontSize:'0.5rem', letterSpacing:'1px',
                      textTransform:'uppercase' }}>{l}</div>
                    <div style={{ color:'#c9d6df', fontFamily:'monospace',
                      fontSize:'0.72rem', marginTop:'1px' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Narrative preview */}
              {t.narrative && (
                <div style={{ marginTop:'7px', color:'#4a6274', fontSize:'0.68rem',
                  lineHeight:1.5, borderTop:'1px solid #1a2535', paddingTop:'7px',
                  fontStyle:'italic' }}>
                  {t.narrative.slice(0, 120)}{t.narrative.length > 120 ? '…' : ''}
                </div>
              )}

              {/* Mistakes */}
              {t.mistakes?.length > 0 && (
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'6px' }}>
                  {t.mistakes.map(m => (
                    <span key={m} style={{ fontSize:'0.58rem', padding:'2px 6px', borderRadius:'3px',
                      background:'rgba(255,45,85,.08)', color:'#ff2d55',
                      border:'1px solid rgba(255,45,85,.2)' }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
