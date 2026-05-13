'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GC = {'A++':'#ffcc44','A+':'#00ff88','A':'#00d4ff','B':'#a855f7','C':'#ff6b35','F':'#ff3366'}

function Skeleton({ h=80 }) {
  return <div className="skeleton" style={{height:h, borderRadius:8}} />
}

export default function LogPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState('table')
  const [filter,  setFilter]  = useState('ALL')
  const [month,   setMonth]   = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [expanded, setExpanded] = useState(null)
  const [imgModal, setImgModal] = useState(null)

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

  const deleteTrade = async (id) => {
    if (!confirm('Delete this trade?')) return
    const supabase = createClient()
    await supabase.from('trades').delete().eq('id', id)
    setTrades(p => p.filter(t => t.id !== id))
  }

  const visible = filter === 'ALL' ? trades
    : trades.filter(t => t.result === filter.toLowerCase())

  // Stats
  const wins    = trades.filter(t => t.result==='win').length
  const losses  = trades.filter(t => t.result==='loss').length
  const total   = trades.length
  const winRate = total ? ((wins/total)*100).toFixed(1) : '0'
  const totalPnl = trades.reduce((s,t) => s+(t.pnl_dollar||0), 0)
  const pnlColor = totalPnl>=0 ? 'var(--green)' : 'var(--red)'

  // Calendar
  const [yr, mo] = month.split('-').map(Number)
  const daysInMonth = new Date(yr, mo, 0).getDate()
  const firstDay    = new Date(yr, mo-1, 1).getDay()

  const dayMap = {}
  trades.forEach(t => {
    if (!t.date) return
    const parts = t.date.split('/')
    if (parts.length !== 3) return
    const key = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
    if (!dayMap[key]) dayMap[key] = { pnl:0, count:0, wins:0, losses:0, trades:[] }
    dayMap[key].pnl    += (t.pnl_dollar || 0)
    dayMap[key].count  += 1
    dayMap[key].wins   += t.result === 'win' ? 1 : 0
    dayMap[key].losses += t.result === 'loss' ? 1 : 0
    dayMap[key].trades.push(t)
  })

  return (
    <div>
      {/* Image modal */}
      {imgModal && (
        <div onClick={() => setImgModal(null)} style={{
          position:'fixed', inset:0, background:'rgba(4,5,8,0.95)',
          zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
          padding:'1rem', cursor:'pointer',
        }}>
          <img src={imgModal} style={{maxHeight:'90vh', maxWidth:'95vw',
            borderRadius:'var(--radius-lg)', border:'1px solid var(--border)'}} />
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem'}}>
        <div>
          <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
            fontFamily:'var(--font-mono)', marginBottom:4}}>TRADE HISTORY</div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
            color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1}}>Log</h1>
        </div>
        <div style={{display:'flex', gap:6}}>
          {['table','calendar'].map(v => (
            <button key={v} onClick={() => setView(v)} className="btn" style={{
              background: view===v ? 'var(--cyan-dim)' : 'var(--bg-2)',
              borderColor: view===v ? 'rgba(0,212,255,0.3)' : 'var(--border)',
              color: view===v ? 'var(--cyan)' : 'var(--text-3)',
              fontSize:'0.62rem',
            }}>{v==='table'?'≡ TABLE':'⊞ CALENDAR'}</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8,
        marginBottom:'1rem'}}>
        {[
          {l:'Total Trades', v:total,          c:'var(--cyan)'},
          {l:'Win Rate',     v:`${winRate}%`,  c:parseFloat(winRate)>=60?'var(--green)':parseFloat(winRate)>=45?'var(--gold)':'var(--red)'},
          {l:'Total P&L',    v:`${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(0)}`, c:pnlColor},
          {l:'W/L',          v:`${wins}/${losses}`, c:'var(--text-2)'},
        ].map(({l,v,c}) => (
          <div key={l} style={{background:'var(--bg-2)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'10px', textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'1.2rem', fontWeight:700,
              color:c, lineHeight:1, marginBottom:4}}>{v}</div>
            <div style={{fontSize:'0.52rem', color:'var(--text-3)',
              letterSpacing:'0.15em', textTransform:'uppercase',
              fontFamily:'var(--font-mono)'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:5, marginBottom:'1rem', flexWrap:'wrap'}}>
        {['ALL','WIN','LOSS','BREAKEVEN'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn" style={{
            background: filter===f
              ? (f==='WIN'?'var(--green-dim)':f==='LOSS'?'var(--red-dim)':f==='BREAKEVEN'?'var(--gold-dim)':'var(--cyan-dim)')
              : 'var(--bg-2)',
            borderColor: filter===f
              ? (f==='WIN'?'rgba(0,255,136,0.3)':f==='LOSS'?'rgba(255,51,102,0.3)':f==='BREAKEVEN'?'rgba(255,204,68,0.3)':'rgba(0,212,255,0.3)')
              : 'var(--border)',
            color: filter===f
              ? (f==='WIN'?'var(--green)':f==='LOSS'?'var(--red)':f==='BREAKEVEN'?'var(--gold)':'var(--cyan)')
              : 'var(--text-3)',
            fontSize:'0.62rem',
          }}>{f}</button>
        ))}
        <span style={{marginLeft:'auto', color:'var(--text-3)', fontSize:'0.62rem',
          display:'flex', alignItems:'center', fontFamily:'var(--font-mono)'}}>
          {visible.length} trades
        </span>
      </div>

      {loading ? (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} h={90} />)}
        </div>
      ) : view === 'calendar' ? (
        <>
          {/* Month nav */}
          <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:'1rem'}}>
            <button onClick={() => {
              const d = new Date(yr, mo-2)
              setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
            }} className="btn btn-ghost" style={{fontSize:'0.7rem', padding:'6px 10px'}}>←</button>
            <span style={{fontFamily:'var(--font-mono)', color:'var(--text-1)',
              fontSize:'0.88rem', fontWeight:700, flex:1, textAlign:'center',
              letterSpacing:'0.1em', textTransform:'uppercase'}}>
              {new Date(yr, mo-1).toLocaleString('en',{month:'long',year:'numeric'})}
            </span>
            <button onClick={() => {
              const d = new Date(yr, mo)
              setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
            }} className="btn btn-ghost" style={{fontSize:'0.7rem', padding:'6px 10px'}}>→</button>
          </div>

          {/* Day headers */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{textAlign:'center', color:'var(--text-3)',
                fontSize:'0.55rem', letterSpacing:'0.1em',
                fontFamily:'var(--font-mono)', padding:'4px 0'}}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4}}>
            {Array(firstDay).fill(null).map((_,i) => (
              <div key={`e${i}`} style={{minHeight:58}} />
            ))}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const d    = i + 1
              const key  = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const data = dayMap[key]
              const today = new Date()
              const isToday = today.getDate()===d && today.getMonth()===mo-1 && today.getFullYear()===yr

              const bg = !data ? 'var(--bg-2)'
                : data.pnl > 0 ? 'rgba(0,255,136,0.06)'
                : data.pnl < 0 ? 'rgba(255,51,102,0.06)'
                : 'rgba(255,204,68,0.06)'
              const bc = !data ? 'var(--border)'
                : data.pnl > 0 ? 'rgba(0,255,136,0.25)'
                : data.pnl < 0 ? 'rgba(255,51,102,0.25)'
                : 'rgba(255,204,68,0.25)'
              const pc = !data ? 'var(--text-4)'
                : data.pnl > 0 ? 'var(--green)'
                : data.pnl < 0 ? 'var(--red)'
                : 'var(--gold)'

              return (
                <div key={d} style={{
                  background: bg,
                  border:`1px solid ${isToday?'var(--cyan)':bc}`,
                  borderRadius:'var(--radius)', padding:'5px',
                  minHeight:58, display:'flex', flexDirection:'column',
                  justifyContent:'space-between', cursor: data?'pointer':'default',
                  transition:'border-color 0.15s',
                }}>
                  <div style={{color:isToday?'var(--cyan)':'var(--text-3)',
                    fontSize:'0.65rem', fontFamily:'var(--font-mono)',
                    fontWeight:isToday?700:400}}>{d}</div>
                  {data && (
                    <div>
                      <div style={{color:pc, fontFamily:'var(--font-mono)',
                        fontSize:'0.6rem', fontWeight:700, textAlign:'right'}}>
                        {data.pnl>=0?'+$':'-$'}{Math.abs(data.pnl).toFixed(0)}
                      </div>
                      <div style={{color:'var(--text-4)', fontSize:'0.5rem',
                        textAlign:'right', fontFamily:'var(--font-mono)'}}>
                        {data.count}t
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Table view */
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {visible.length === 0 ? (
            <div style={{background:'var(--bg-2)', border:'1px dashed var(--border)',
              borderRadius:'var(--radius-lg)', padding:'3rem', textAlign:'center',
              color:'var(--text-3)', fontSize:'0.82rem', fontFamily:'var(--font-mono)',
              letterSpacing:'0.1em'}}>
              NO TRADES FOUND
            </div>
          ) : visible.map(t => (
            <div key={t.id} style={{
              background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', overflow:'hidden',
              transition:'border-color 0.15s',
            }}>
              {/* Trade row header */}
              <div style={{display:'flex', alignItems:'center', gap:10,
                padding:'11px 14px', cursor:'pointer'}}
                onClick={() => setExpanded(expanded===t.id ? null : t.id)}>

                {/* Grade */}
                <div style={{fontFamily:'var(--font-mono)', fontSize:'1.2rem',
                  fontWeight:800, color:GC[t.grade]||'var(--text-3)',
                  textShadow:`0 0 8px ${GC[t.grade]||'transparent'}`,
                  minWidth:32, flexShrink:0}}>{t.grade||'?'}</div>

                {/* Main info */}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:6,
                    flexWrap:'wrap', marginBottom:3}}>
                    <span style={{fontFamily:'var(--font-mono)', fontWeight:700,
                      fontSize:'0.85rem', color:'var(--text-1)'}}>{t.instrument}</span>
                    <span className={`badge badge-${t.direction==='LONG'?'win':'loss'}`}
                      style={{fontSize:'0.6rem'}}>
                      {t.direction==='LONG'?'▲ LONG':'▼ SHORT'}
                    </span>
                    <span className={`badge badge-${t.result==='win'?'win':t.result==='loss'?'loss':'be'}`}
                      style={{fontSize:'0.6rem'}}>
                      {t.result?.toUpperCase()}
                    </span>
                    {t.confluence > 0 && (
                      <span style={{fontSize:'0.58rem', color:'var(--text-3)',
                        fontFamily:'var(--font-mono)'}}>{t.confluence}/5 ✓</span>
                    )}
                  </div>
                  <div style={{fontSize:'0.62rem', color:'var(--text-3)',
                    fontFamily:'var(--font-mono)'}}>
                    {t.date} · {t.session} · RR {t.rr||'—'}
                  </div>
                </div>

                {/* P&L */}
                <div style={{textAlign:'right', flexShrink:0}}>
                  <div style={{fontFamily:'var(--font-mono)', fontWeight:800,
                    fontSize:'0.95rem',
                    color:(t.pnl_dollar||0)>=0?'var(--green)':'var(--red)'}}>
                    {t.pnl_dollar!=null
                      ?`${t.pnl_dollar>=0?'+$':'-$'}${Math.abs(t.pnl_dollar).toFixed(0)}`
                      :'—'}
                  </div>
                  <div style={{fontSize:'0.62rem', color:'var(--text-3)',
                    fontFamily:'var(--font-mono)'}}>
                    {t.pnl!=null?`${t.pnl>0?'+':''}${parseFloat(t.pnl).toFixed(1)}pts`:''}
                  </div>
                </div>

                {/* Expand + Delete */}
                <div style={{display:'flex', gap:4, flexShrink:0}}>
                  <button onClick={e => {e.stopPropagation(); deleteTrade(t.id)}}
                    style={{background:'transparent', border:'none', color:'var(--text-4)',
                      cursor:'pointer', fontSize:'0.75rem', padding:'2px 4px',
                      transition:'color 0.15s'}}
                    onMouseEnter={e=>e.target.style.color='var(--red)'}
                    onMouseLeave={e=>e.target.style.color='var(--text-4)'}>✕</button>
                  <span style={{color:'var(--text-4)', fontSize:'0.75rem',
                    transition:'transform 0.2s',
                    display:'inline-block',
                    transform: expanded===t.id ? 'rotate(180deg)' : 'rotate(0)'}}>▾</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === t.id && (
                <div style={{borderTop:'1px solid var(--border)',
                  padding:'12px 14px', background:'var(--bg-1)'}}>

                  {/* Level grid */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                    gap:8, marginBottom:12}}>
                    {[
                      {l:'Entry',  v:t.entry},
                      {l:'SL',     v:t.sl,   c:'var(--red)'},
                      {l:'TP',     v:t.tp,   c:'var(--green)'},
                      {l:'Exit',   v:t.exit||'—'},
                    ].map(({l,v,c}) => (
                      <div key={l} style={{background:'var(--bg-2)',
                        borderRadius:'var(--radius)', padding:'7px',
                        textAlign:'center', border:'1px solid var(--border)'}}>
                        <div style={{fontSize:'0.52rem', color:'var(--text-3)',
                          letterSpacing:'0.1em', textTransform:'uppercase',
                          fontFamily:'var(--font-mono)', marginBottom:3}}>{l}</div>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem',
                          fontWeight:600, color:c||'var(--text-1)'}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Screenshots */}
                  {t.screenshots?.length > 0 && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:'0.55rem', letterSpacing:'0.15em',
                        color:'var(--text-3)', fontFamily:'var(--font-mono)',
                        marginBottom:6, textTransform:'uppercase'}}>Screenshots</div>
                      <div style={{display:'grid',
                        gridTemplateColumns:'repeat(3,1fr)', gap:6}}>
                        {t.screenshots.map((s,i) => (
                          <img key={i} src={s}
                            style={{width:'100%', height:80, objectFit:'cover',
                              borderRadius:'var(--radius)',
                              border:'1px solid var(--border)', cursor:'pointer'}}
                            onClick={() => setImgModal(s)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Narrative */}
                  {t.narrative && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:'0.55rem', letterSpacing:'0.15em',
                        color:'var(--text-3)', fontFamily:'var(--font-mono)',
                        marginBottom:5, textTransform:'uppercase'}}>Narrative</div>
                      <div style={{color:'var(--text-2)', fontSize:'0.78rem',
                        lineHeight:1.7, fontStyle:'italic',
                        borderLeft:'2px solid var(--border)', paddingLeft:10}}>
                        {t.narrative}
                      </div>
                    </div>
                  )}

                  {/* Key lesson */}
                  {t.ptr_key_lesson && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:'0.55rem', letterSpacing:'0.15em',
                        color:'var(--gold)', fontFamily:'var(--font-mono)',
                        marginBottom:5, textTransform:'uppercase'}}>Key Lesson</div>
                      <div style={{color:'var(--text-1)', fontSize:'0.78rem',
                        lineHeight:1.7, borderLeft:'2px solid var(--gold)',
                        paddingLeft:10}}>
                        {t.ptr_key_lesson}
                      </div>
                    </div>
                  )}

                  {/* Mistakes */}
                  {t.mistakes?.length > 0 && (
                    <div>
                      <div style={{fontSize:'0.55rem', letterSpacing:'0.15em',
                        color:'var(--text-3)', fontFamily:'var(--font-mono)',
                        marginBottom:5, textTransform:'uppercase'}}>Mistakes</div>
                      <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                        {t.mistakes.map(m => (
                          <span key={m} className="badge badge-loss"
                            style={{fontSize:'0.6rem'}}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
