'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const GC = {'A++':'#ffcc44','A+':'#00ff88','A':'#00d4ff','B':'#a855f7','C':'#ff6b35','F':'#ff3366'}

function RatingDots({ value, max=5, color='var(--cyan)' }) {
  return (
    <div style={{display:'flex', gap:3}}>
      {Array(max).fill(0).map((_,i) => (
        <div key={i} style={{
          width:7, height:7, borderRadius:'50%',
          background: i < value ? color : 'var(--border)',
          boxShadow: i < value ? `0 0 4px ${color}` : 'none',
          transition:'all 0.2s',
        }} />
      ))}
    </div>
  )
}

function Skeleton({ h=80 }) {
  return <div className="skeleton" style={{height:h, borderRadius:8}} />
}

export default function ReviewPage() {
  const [trades,   setTrades]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter,   setFilter]   = useState('all')
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

  const hasReview = t => !!(t.ptr_key_lesson || t.ptr_went_right || t.ptr_went_wrong)
  const needsReview = trades.filter(t => !hasReview(t)).length

  const visible = trades.filter(t => {
    if (filter === 'needs') return !hasReview(t)
    if (filter === 'done')  return hasReview(t)
    return true
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
            fontFamily:'var(--font-mono)', marginBottom:4}}>POST-TRADE ANALYSIS</div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
            color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1}}>Review</h1>
        </div>
        {needsReview > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
            background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.2)',
            borderRadius:'var(--radius)', color:'var(--orange)',
            fontFamily:'var(--font-mono)', fontSize:'0.65rem'}}>
            ⚠ {needsReview} trades need review
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex', gap:6, marginBottom:'1rem'}}>
        {[['all','ALL'],['needs','NEEDS REVIEW'],['done','REVIEWED']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} className="btn" style={{
            background: filter===v ? 'var(--cyan-dim)' : 'var(--bg-2)',
            borderColor: filter===v ? 'rgba(0,212,255,0.3)' : 'var(--border)',
            color: filter===v ? 'var(--cyan)' : 'var(--text-3)',
            fontSize:'0.62rem',
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {[1,2,3].map(i => <Skeleton key={i} h={90} />)}
        </div>
      ) : (
        <div style={{
          display: selected ? 'grid' : 'block',
          gridTemplateColumns: selected ? '1fr 1fr' : undefined,
          gap: selected ? '1rem' : undefined,
          alignItems: 'start',
        }}>
          {/* Trade list */}
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {visible.length === 0 ? (
              <div style={{background:'var(--bg-2)', border:'1px dashed var(--border)',
                borderRadius:'var(--radius-lg)', padding:'3rem', textAlign:'center',
                color:'var(--text-3)', fontSize:'0.82rem', fontFamily:'var(--font-mono)'}}>
                {filter==='needs'?'ALL TRADES REVIEWED ✓':'NO TRADES FOUND'}
              </div>
            ) : visible.map(t => {
              const reviewed = hasReview(t)
              const isActive = selected?.id === t.id

              return (
                <div key={t.id}
                  onClick={() => setSelected(isActive ? null : t)}
                  style={{
                    background: isActive ? 'rgba(0,212,255,0.04)' : 'var(--bg-2)',
                    border:`1px solid ${isActive?'rgba(0,212,255,0.25)':'var(--border)'}`,
                    borderLeft:`3px solid ${reviewed?'var(--green)':'var(--orange)'}`,
                    borderRadius:'var(--radius-lg)', padding:'11px 14px',
                    cursor:'pointer', transition:'all 0.15s',
                  }}>
                  <div style={{display:'flex', alignItems:'center', gap:10,
                    flexWrap:'wrap'}}>
                    {/* Grade */}
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'1.1rem',
                      fontWeight:800, color:GC[t.grade]||'var(--text-3)',
                      textShadow:`0 0 8px ${GC[t.grade]||'transparent'}`,
                      flexShrink:0, minWidth:28}}>{t.grade||'?'}</div>

                    {/* Info */}
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', alignItems:'center', gap:6,
                        marginBottom:3, flexWrap:'wrap'}}>
                        <span style={{fontFamily:'var(--font-mono)', fontWeight:700,
                          fontSize:'0.82rem', color:'var(--text-1)'}}>
                          {t.date} · {t.instrument}
                        </span>
                        <span className={`badge badge-${t.direction==='LONG'?'win':'loss'}`}
                          style={{fontSize:'0.58rem'}}>
                          {t.direction==='LONG'?'▲':'▼'} {t.direction}
                        </span>
                        <span className={`badge badge-${reviewed?'win':'be'}`}
                          style={{fontSize:'0.58rem'}}>
                          {reviewed?'✓ REVIEWED':'⚠ PENDING'}
                        </span>
                      </div>
                      {/* Rating preview */}
                      {reviewed && (
                        <div style={{display:'flex', gap:12, alignItems:'center'}}>
                          <div>
                            <div style={{fontSize:'0.5rem', color:'var(--text-4)',
                              fontFamily:'var(--font-mono)', marginBottom:2}}>EXEC</div>
                            <RatingDots value={t.ptr_exec_rating||0} color='var(--cyan)' />
                          </div>
                          <div>
                            <div style={{fontSize:'0.5rem', color:'var(--text-4)',
                              fontFamily:'var(--font-mono)', marginBottom:2}}>EMOTION</div>
                            <RatingDots value={t.ptr_emotion_rating||0} color='var(--purple)' />
                          </div>
                          {t.ptr_key_lesson && (
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{fontSize:'0.5rem', color:'var(--text-4)',
                                fontFamily:'var(--font-mono)', marginBottom:2}}>KEY LESSON</div>
                              <div style={{color:'var(--text-3)', fontSize:'0.65rem',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                {t.ptr_key_lesson.slice(0,60)}{t.ptr_key_lesson.length>60?'…':''}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* P&L */}
                    <div style={{textAlign:'right', flexShrink:0}}>
                      <div style={{fontFamily:'var(--font-mono)', fontWeight:800,
                        fontSize:'0.9rem',
                        color:(t.pnl_dollar||0)>=0?'var(--green)':'var(--red)'}}>
                        {t.pnl_dollar!=null
                          ?`${t.pnl_dollar>=0?'+$':'-$'}${Math.abs(t.pnl_dollar).toFixed(0)}`
                          :'—'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{position:'sticky', top:'1.5rem', alignSelf:'start',
              background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', overflow:'hidden',
              maxHeight:'85vh', overflowY:'auto'}}>

              {/* Panel header */}
              <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                position:'sticky', top:0, background:'var(--bg-2)', zIndex:1}}>
                <div style={{fontSize:'0.62rem', letterSpacing:'0.15em',
                  color:'var(--cyan)', fontFamily:'var(--font-mono)',
                  fontWeight:700}}>FULL REVIEW</div>
                <button onClick={() => setSelected(null)} style={{background:'transparent',
                  border:'none', color:'var(--text-3)', cursor:'pointer',
                  fontSize:'0.9rem', padding:'2px 6px'}}>✕</button>
              </div>

              <div style={{padding:'14px'}}>
                {/* Trade summary */}
                <div style={{background:'var(--bg-1)', borderRadius:'var(--radius)',
                  padding:'12px', marginBottom:12,
                  display:'flex', alignItems:'center', gap:10}}>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:'1.8rem',
                    fontWeight:800, color:GC[selected.grade]||'var(--text-3)',
                    textShadow:`0 0 12px ${GC[selected.grade]||'transparent'}`,
                    flexShrink:0}}>{selected.grade||'?'}</div>
                  <div>
                    <div style={{color:'var(--text-1)', fontWeight:700, fontSize:'0.88rem',
                      marginBottom:2}}>
                      {selected.date} · {selected.instrument} · {selected.direction}
                    </div>
                    <div style={{color:'var(--text-3)', fontSize:'0.62rem',
                      fontFamily:'var(--font-mono)'}}>
                      {selected.session} · R:R {selected.rr||'—'} · {selected.confluence||0}/5 conf
                    </div>
                  </div>
                  <div style={{marginLeft:'auto', textAlign:'right'}}>
                    <div style={{fontFamily:'var(--font-mono)', fontWeight:800, fontSize:'1rem',
                      color:(selected.pnl_dollar||0)>=0?'var(--green)':'var(--red)'}}>
                      {selected.pnl_dollar!=null
                        ?`${selected.pnl_dollar>=0?'+$':'-$'}${Math.abs(selected.pnl_dollar).toFixed(0)}`
                        :'—'}
                    </div>
                    <span className={`badge badge-${selected.result==='win'?'win':selected.result==='loss'?'loss':'be'}`}
                      style={{fontSize:'0.55rem'}}>
                      {selected.result?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Ratings */}
                {(selected.ptr_exec_rating || selected.ptr_emotion_rating) && (
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
                    marginBottom:12}}>
                    {[
                      {l:'EXECUTION',  v:selected.ptr_exec_rating,    c:'var(--cyan)'},
                      {l:'EMOTIONAL',  v:selected.ptr_emotion_rating, c:'var(--purple)'},
                    ].map(({l,v,c}) => (
                      <div key={l} style={{background:'var(--bg-1)', borderRadius:'var(--radius)',
                        padding:'9px'}}>
                        <div style={{fontSize:'0.52rem', letterSpacing:'0.15em', color:'var(--text-3)',
                          fontFamily:'var(--font-mono)', marginBottom:6}}>{l}</div>
                        <RatingDots value={v||0} color={c} />
                        <div style={{color:c, fontSize:'0.72rem', fontWeight:700,
                          fontFamily:'var(--font-mono)', marginTop:4}}>{v||0}/5</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Screenshots */}
                {selected.screenshots?.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:'0.55rem', letterSpacing:'0.15em', color:'var(--text-3)',
                      fontFamily:'var(--font-mono)', marginBottom:6,
                      textTransform:'uppercase'}}>SCREENSHOTS</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6}}>
                      {selected.screenshots.map((s,i) => (
                        <img key={i} src={s} onClick={() => setImgModal(s)}
                          style={{width:'100%', height:90, objectFit:'cover',
                            borderRadius:'var(--radius)', border:'1px solid var(--border)',
                            cursor:'pointer'}} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Review fields */}
                {[
                  {k:'ptr_went_right',     l:'WHAT WENT RIGHT',     c:'var(--green)'},
                  {k:'ptr_went_wrong',     l:'WHAT WENT WRONG',     c:'var(--red)'},
                  {k:'ptr_mistake_detail', l:'MISTAKE ANALYSIS',    c:'var(--orange)'},
                  {k:'ptr_ideal_trade',    l:'IDEAL TRADE',         c:'var(--cyan)'},
                  {k:'ptr_key_lesson',     l:'KEY LESSON',          c:'var(--gold)'},
                  {k:'ptr_next_session',   l:'NEXT SESSION PLAN',   c:'var(--cyan)'},
                  {k:'ptr_rule_violation', l:'RULE VIOLATION',      c:'var(--red)'},
                  {k:'ptr_take_again',     l:'WOULD TAKE AGAIN',    c:'var(--purple)'},
                ].filter(f => selected[f.k]).map(({k,l,c}) => (
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{fontSize:'0.52rem', letterSpacing:'0.15em',
                      color:c, fontFamily:'var(--font-mono)', fontWeight:700,
                      marginBottom:5, textTransform:'uppercase'}}>{l}</div>
                    <div style={{color:'var(--text-1)', fontSize:'0.78rem', lineHeight:1.7,
                      borderLeft:`2px solid ${c}`, paddingLeft:10,
                      background:'var(--bg-1)', borderRadius:'0 var(--radius) var(--radius) 0',
                      padding:'8px 10px'}}>
                      {selected[k]}
                    </div>
                  </div>
                ))}

                {/* Narrative */}
                {selected.narrative && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:'0.52rem', letterSpacing:'0.15em', color:'var(--text-3)',
                      fontFamily:'var(--font-mono)', fontWeight:700, marginBottom:5,
                      textTransform:'uppercase'}}>TRADE NARRATIVE</div>
                    <div style={{color:'var(--text-2)', fontSize:'0.78rem', lineHeight:1.7,
                      borderLeft:'2px solid var(--border)', paddingLeft:10, fontStyle:'italic'}}>
                      {selected.narrative}
                    </div>
                  </div>
                )}

                {/* Mistakes */}
                {selected.mistakes?.length > 0 && (
                  <div>
                    <div style={{fontSize:'0.52rem', letterSpacing:'0.15em', color:'var(--text-3)',
                      fontFamily:'var(--font-mono)', fontWeight:700, marginBottom:5,
                      textTransform:'uppercase'}}>MISTAKES TAGGED</div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                      {selected.mistakes.map(m => (
                        <span key={m} className="badge badge-loss" style={{fontSize:'0.62rem'}}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!hasReview(selected) && (
                  <div style={{marginTop:12, padding:'10px', background:'rgba(255,107,53,0.06)',
                    border:'1px solid rgba(255,107,53,0.2)', borderRadius:'var(--radius)',
                    color:'var(--orange)', fontSize:'0.72rem', textAlign:'center',
                    fontFamily:'var(--font-mono)'}}>
                    ⚠ No review yet — go to Journal to add post-trade review
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
