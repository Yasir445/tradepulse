'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const MISTAKES = [
  'Entered before Q2 complete','No Daily SMT','No 90M SMT',
  'Moved SL to BE early','FOMO entry','No TPD trigger',
  'Wrong True Open side','Chased price','Over-leveraged','Early exit',
]

const GRADE_COLOR = {
  'A++':'#f59e0b','A+':'#10b981','A':'#34d399','B':'#6366f1','C':'#f97316','F':'#ef4444'
}

const emptyForm = {
  symbol:'NQ', date:new Date().toISOString().slice(0,10),
  session:'NY', direction:'LONG',
  entry:'', sl:'', tp:'', exit:'', result:'WIN',
  pnl:'', rr:'', grade:'A', narrative:'', mistakes:[], mood:3,
}

export default function JournalPage() {
  const params  = useSearchParams()
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('ALL')
  const [form,    setForm]    = useState(() => ({
    ...emptyForm,
    ...(params.get('grade')     && { grade:     params.get('grade') }),
    ...(params.get('symbol')    && { symbol:    params.get('symbol') }),
    ...(params.get('direction') && { direction: params.get('direction') }),
  }))

  const loadTrades = useCallback(async () => {
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
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades])
  useEffect(() => { if (params.get('grade')) setModal(true) }, [params])

  const calcRR = (f = form) => {
    const entry=parseFloat(f.entry), sl=parseFloat(f.sl), tp=parseFloat(f.tp)
    if (!entry||!sl||!tp) return f
    const risk=Math.abs(entry-sl), reward=Math.abs(tp-entry)
    const rr=risk>0?(reward/risk).toFixed(2):''
    const exit=parseFloat(f.exit)
    let pnl=f.pnl
    if (exit&&!isNaN(exit)) {
      pnl=f.direction==='LONG'?((exit-entry)*20).toFixed(0):((entry-exit)*20).toFixed(0)
    }
    return {...f, rr, pnl}
  }

  const set = (key, val) => setForm(p => ({...p, [key]:val}))
  const toggleMistake = (m) => setForm(p => ({
    ...p, mistakes:p.mistakes.includes(m)?p.mistakes.filter(x=>x!==m):[...p.mistakes,m],
  }))

  const save = async () => {
    if (!form.entry||!form.sl||!form.tp) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    const c = calcRR()
    await supabase.from('trades').insert({
      user_id:user.id, symbol:c.symbol, date:c.date, session:c.session,
      direction:c.direction, entry:parseFloat(c.entry), sl:parseFloat(c.sl),
      tp:parseFloat(c.tp), exit:c.exit?parseFloat(c.exit):null,
      result:c.result, pnl:c.pnl?parseFloat(c.pnl):null,
      rr:c.rr?parseFloat(c.rr):null, grade:c.grade,
      narrative:c.narrative, mistakes:c.mistakes, mood:c.mood,
    })
    setModal(false); setForm(emptyForm)
    await loadTrades(); setSaving(false)
  }

  const inputStyle = {
    width:'100%', background:'#0f172a', border:'1px solid #1e293b',
    borderRadius:'8px', padding:'0.65rem 0.75rem', color:'#f8fafc',
    fontSize:'0.88rem', outline:'none', boxSizing:'border-box',
    transition:'border-color 0.15s',
  }

  const F = ({ label, children }) => (
    <div>
      <label style={{ display:'block', color:'#475569', fontSize:'0.6rem',
        letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.35rem',
        fontWeight:600 }}>{label}</label>
      {children}
    </div>
  )

  const Input = ({ name, type='text', placeholder='' }) => (
    <input type={type} value={form[name]} placeholder={placeholder}
      onChange={e => set(name, e.target.value)}
      onBlur={() => setForm(calcRR)}
      style={inputStyle} />
  )

  const Select = ({ name, opts }) => (
    <select value={form[name]} onChange={e => set(name, e.target.value)} style={inputStyle}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  )

  const visible = filter==='ALL' ? trades : trades.filter(t => t.result===filter)

  return (
    <div>
      <style>{`
        .trade-row:hover { background: rgba(30,41,59,0.5) !important; }
        input:focus, select:focus, textarea:focus { border-color: #4f46e5 !important; outline: none; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #1e293b',
        flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <p style={{ color:'#6366f1', fontSize:'0.65rem', letterSpacing:'0.25em',
            textTransform:'uppercase', margin:'0 0 0.25rem', fontWeight:700 }}>Cloud Sync</p>
          <h1 style={{ color:'#f8fafc', fontSize:'1.75rem', fontWeight:900,
            margin:0, letterSpacing:'-0.03em' }}>Trade Journal</h1>
        </div>
        <button onClick={() => setModal(true)} style={{
          padding:'0.75rem 1.5rem',
          background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border:'none', borderRadius:'10px', color:'#fff',
          fontWeight:800, fontSize:'0.82rem', letterSpacing:'0.1em',
          textTransform:'uppercase', cursor:'pointer',
          boxShadow:'0 4px 16px rgba(79,70,229,0.35)',
        }}>+ Log Trade</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.25rem' }}>
        {['ALL','WIN','LOSS','BE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'0.4rem 0.9rem', borderRadius:'8px', fontSize:'0.72rem',
            fontWeight:700, cursor:'pointer', transition:'all 0.15s',
            background: filter===f
              ? (f==='WIN'?'linear-gradient(135deg,#059669,#10b981)':f==='LOSS'?'linear-gradient(135deg,#dc2626,#ef4444)':f==='BE'?'linear-gradient(135deg,#1e293b,#1e293b)':'linear-gradient(135deg,#4f46e5,#7c3aed)')
              : '#0f172a',
            color: filter===f ? '#fff' : '#475569',
            border: filter===f ? '1px solid transparent' : '1px solid #1e293b',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft:'auto', color:'#334155', fontSize:'0.72rem',
          display:'flex', alignItems:'center' }}>{visible.length} trades</span>
      </div>

      {/* Table */}
      <div style={{
        background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
        border:'1px solid #1e293b', borderRadius:'16px', overflow:'hidden',
      }}>
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}>
            <div style={{ color:'#334155', fontSize:'0.85rem' }}>Loading trades…</div>
          </div>
        ) : visible.length===0 ? (
          <div style={{ padding:'3.5rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📝</div>
            <p style={{ color:'#475569', fontSize:'0.9rem', margin:'0 0 0.5rem', fontWeight:600 }}>
              No trades {filter!=='ALL'?`with result: ${filter}`:'yet'}
            </p>
            <p style={{ color:'#334155', fontSize:'0.78rem', margin:0 }}>
              Tap + Log Trade to add your first trade
            </p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#0a0a14' }}>
                  {['Date','Symbol','Dir','Entry','SL','TP','P&L','RR','Grade','Result'].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left',
                      color:'#334155', fontSize:'0.6rem', letterSpacing:'0.15em',
                      textTransform:'uppercase', borderBottom:'1px solid #1e293b',
                      whiteSpace:'nowrap', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t,i) => (
                  <tr key={t.id} className="trade-row" style={{
                    borderBottom: i<visible.length-1?'1px solid #0f172a':'none',
                    transition:'background 0.1s',
                  }}>
                    <td style={{ padding:'0.8rem 1rem', color:'#475569',
                      fontFamily:'monospace', fontSize:'0.75rem', whiteSpace:'nowrap' }}>{t.date}</td>
                    <td style={{ padding:'0.8rem 1rem', color:'#f8fafc',
                      fontWeight:800, fontSize:'0.85rem' }}>{t.symbol}</td>
                    <td style={{ padding:'0.8rem 1rem' }}>
                      <span style={{
                        fontSize:'0.65rem', fontWeight:700, padding:'2px 7px',
                        borderRadius:'5px',
                        background:t.direction==='LONG'?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',
                        color:t.direction==='LONG'?'#10b981':'#ef4444',
                      }}>{t.direction==='LONG'?'▲ L':'▼ S'}</span>
                    </td>
                    {['entry','sl','tp'].map(k => (
                      <td key={k} style={{ padding:'0.8rem 1rem', color:'#64748b',
                        fontFamily:'monospace', fontSize:'0.78rem' }}>{t[k]}</td>
                    ))}
                    <td style={{ padding:'0.8rem 1rem', fontFamily:'monospace',
                      fontSize:'0.85rem', fontWeight:800,
                      color:(t.pnl||0)>0?'#10b981':(t.pnl||0)<0?'#ef4444':'#94a3b8' }}>
                      {t.pnl!=null?`${t.pnl>0?'+':''}${t.pnl}`:'—'}
                    </td>
                    <td style={{ padding:'0.8rem 1rem', color:'#64748b',
                      fontFamily:'monospace', fontSize:'0.78rem' }}>
                      {t.rr?`${t.rr}R`:'—'}
                    </td>
                    <td style={{ padding:'0.8rem 1rem' }}>
                      <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px',
                        borderRadius:'5px', color:GRADE_COLOR[t.grade]||'#94a3b8',
                        background:`${GRADE_COLOR[t.grade]||'#94a3b8'}12` }}>
                        {t.grade||'—'}
                      </span>
                    </td>
                    <td style={{ padding:'0.8rem 1rem' }}>
                      <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px',
                        borderRadius:'5px',
                        background:t.result==='WIN'?'rgba(16,185,129,0.12)':t.result==='LOSS'?'rgba(239,68,68,0.12)':'rgba(100,116,139,0.12)',
                        color:t.result==='WIN'?'#10b981':t.result==='LOSS'?'#ef4444':'#94a3b8' }}>
                        {t.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:100, padding:'1rem' }}>
          <div style={{
            background:'linear-gradient(135deg, #0d0d16, #0f172a)',
            border:'1px solid #1e293b', borderRadius:'20px',
            width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto',
            padding:'1.75rem', boxShadow:'0 25px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'1.5rem' }}>
              <div>
                <h2 style={{ color:'#f8fafc', margin:'0 0 0.2rem', fontSize:'1.1rem',
                  fontWeight:900 }}>Log Trade</h2>
                <p style={{ color:'#334155', margin:0, fontSize:'0.72rem' }}>
                  Add to your QT journal
                </p>
              </div>
              <button onClick={() => setModal(false)} style={{
                background:'#1e293b', border:'none', color:'#94a3b8',
                fontSize:'1rem', cursor:'pointer', width:32, height:32,
                borderRadius:'8px', display:'flex', alignItems:'center',
                justifyContent:'center',
              }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
              <F label="Date"><Input name="date" type="date" /></F>
              <F label="Symbol"><Select name="symbol" opts={['NQ','ES','MNQ','MES']} /></F>
              <F label="Session"><Select name="session" opts={['London','NY','Overnight','Asian']} /></F>
              <F label="Direction"><Select name="direction" opts={['LONG','SHORT']} /></F>
              <F label="Entry Price"><Input name="entry" type="number" placeholder="21500" /></F>
              <F label="Stop Loss"><Input name="sl" type="number" placeholder="21450" /></F>
              <F label="Take Profit"><Input name="tp" type="number" placeholder="21600" /></F>
              <F label="Exit Price"><Input name="exit" type="number" placeholder="actual exit" /></F>
              <F label="Result"><Select name="result" opts={['WIN','LOSS','BE']} /></F>
              <F label="Grade"><Select name="grade" opts={['A++','A+','A','B','C','F']} /></F>
              <F label="P&L (pts)"><Input name="pnl" type="number" placeholder="auto-calc" /></F>
              <F label="R:R"><Input name="rr" type="number" placeholder="auto-calc" /></F>
            </div>

            <div style={{ marginTop:'0.85rem' }}>
              <F label="Trade Narrative">
                <textarea value={form.narrative}
                  onChange={e => set('narrative', e.target.value)}
                  rows={3} placeholder="What did you see? SSMT? TPD? True Open alignment?"
                  style={{ ...inputStyle, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }} />
              </F>
            </div>

            <div style={{ marginTop:'0.85rem' }}>
              <label style={{ display:'block', color:'#475569', fontSize:'0.6rem',
                letterSpacing:'0.15em', textTransform:'uppercase',
                marginBottom:'0.5rem', fontWeight:600 }}>Mistakes Tagged</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                {MISTAKES.map(m => {
                  const sel = form.mistakes.includes(m)
                  return (
                    <button key={m} onClick={() => toggleMistake(m)} style={{
                      padding:'0.3rem 0.65rem', borderRadius:'6px', fontSize:'0.7rem',
                      cursor:'pointer', transition:'all 0.1s',
                      background:sel?'rgba(239,68,68,0.1)':'#0f172a',
                      color:sel?'#ef4444':'#475569',
                      border:sel?'1px solid rgba(239,68,68,0.3)':'1px solid #1e293b',
                    }}>{m}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop:'0.85rem' }}>
              <label style={{ display:'block', color:'#475569', fontSize:'0.6rem',
                letterSpacing:'0.15em', textTransform:'uppercase',
                marginBottom:'0.5rem', fontWeight:600 }}>Emotional State</label>
              <div style={{ display:'flex', gap:'0.4rem' }}>
                {[{v:1,e:'😤',l:'Revenge'},{v:2,e:'😟',l:'Anxious'},
                  {v:3,e:'😐',l:'Neutral'},{v:4,e:'😊',l:'Focused'},{v:5,e:'🎯',l:'Zone'}]
                  .map(({v,e,l}) => (
                    <button key={v} onClick={() => set('mood',v)} style={{
                      flex:1, padding:'0.5rem 0.1rem', borderRadius:'8px',
                      cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                      background:form.mood===v?'rgba(99,102,241,0.15)':'#0f172a',
                      border:form.mood===v?'1px solid rgba(99,102,241,0.4)':'1px solid #1e293b',
                    }}>
                      <div style={{ fontSize:'1.2rem' }}>{e}</div>
                      <div style={{ fontSize:'0.52rem', color:form.mood===v?'#818cf8':'#334155',
                        marginTop:'2px', fontWeight:600 }}>{l}</div>
                    </button>
                  ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
              <button onClick={save} disabled={saving} style={{
                flex:1, padding:'0.85rem',
                background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border:'none', borderRadius:'10px', color:'#fff',
                fontWeight:800, fontSize:'0.82rem', letterSpacing:'0.1em',
                textTransform:'uppercase', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(79,70,229,0.35)',
                opacity:saving?0.7:1,
              }}>{saving?'SAVING…':'SAVE TRADE →'}</button>
              <button onClick={() => setModal(false)} style={{
                padding:'0.85rem 1.25rem', background:'transparent',
                border:'1px solid #1e293b', borderRadius:'10px',
                color:'#475569', fontSize:'0.8rem', cursor:'pointer',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
