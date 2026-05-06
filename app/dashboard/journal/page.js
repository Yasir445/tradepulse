'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const MISTAKES = [
  'Entered before Q2 complete','No Daily SMT','No 90M SMT',
  'Moved SL to BE early','FOMO entry','No TPD entry trigger',
  'Wrong True Open side','Chased price','Over-leveraged','Early exit',
]

const GRADE_COLOR = {
  'A++':'#eab308','A+':'#22c55e','A':'#86efac','B':'#3b82f6','C':'#f59e0b','F':'#ef4444'
}

const emptyForm = {
  symbol:'NQ', date: new Date().toISOString().slice(0,10),
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades])
  useEffect(() => { if (params.get('grade')) setModal(true) }, [params])

  const calcRR = (f = form) => {
    const entry = parseFloat(f.entry), sl = parseFloat(f.sl), tp = parseFloat(f.tp)
    if (!entry || !sl || !tp) return f
    const risk   = Math.abs(entry - sl)
    const reward = Math.abs(tp - entry)
    const rr     = risk > 0 ? (reward / risk).toFixed(2) : ''
    const exit   = parseFloat(f.exit)
    let pnl = f.pnl
    if (exit && !isNaN(exit)) {
      pnl = f.direction === 'LONG'
        ? ((exit - entry) * 20).toFixed(0)
        : ((entry - exit) * 20).toFixed(0)
    }
    return { ...f, rr, pnl }
  }

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const toggleMistake = (m) => setForm(p => ({
    ...p, mistakes: p.mistakes.includes(m)
      ? p.mistakes.filter(x => x !== m)
      : [...p.mistakes, m],
  }))

  const save = async () => {
    if (!form.entry || !form.sl || !form.tp) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const calculated = calcRR()
    await supabase.from('trades').insert({
      user_id:   user.id,
      symbol:    calculated.symbol,
      date:      calculated.date,
      session:   calculated.session,
      direction: calculated.direction,
      entry:     parseFloat(calculated.entry),
      sl:        parseFloat(calculated.sl),
      tp:        parseFloat(calculated.tp),
      exit:      calculated.exit ? parseFloat(calculated.exit) : null,
      result:    calculated.result,
      pnl:       calculated.pnl ? parseFloat(calculated.pnl) : null,
      rr:        calculated.rr  ? parseFloat(calculated.rr)  : null,
      grade:     calculated.grade,
      narrative: calculated.narrative,
      mistakes:  calculated.mistakes,
      mood:      calculated.mood,
    })
    setModal(false)
    setForm(emptyForm)
    await loadTrades()
    setSaving(false)
  }

  const F = ({ label, children }) => (
    <div>
      <label style={{ display:'block', color:'#888', fontSize:'0.6rem',
        letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.3rem' }}>
        {label}
      </label>
      {children}
    </div>
  )

  const inputStyle = {
    width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a',
    borderRadius:'6px', padding:'0.6rem 0.75rem', color:'#fff',
    fontSize:'0.88rem', outline:'none', boxSizing:'border-box',
  }

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

  const visible = filter === 'ALL' ? trades : trades.filter(t => t.result === filter)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <p style={{ color:'#888', fontSize:'0.7rem', letterSpacing:'0.2em',
            textTransform:'uppercase', margin:'0 0 0.3rem' }}>Cloud Journal</p>
          <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900, margin:0 }}>Trades</h1>
        </div>
        <button onClick={() => setModal(true)} style={{
          padding:'0.7rem 1.25rem', background:'#22c55e', border:'none',
          borderRadius:'6px', color:'#000', fontWeight:800, fontSize:'0.8rem',
          letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer',
        }}>+ Log Trade</button>
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {['ALL','WIN','LOSS'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'0.4rem 1rem', borderRadius:'5px', fontSize:'0.75rem', fontWeight:700,
            cursor:'pointer',
            background: filter===f ? '#fff' : 'transparent',
            color: filter===f ? '#000' : '#888',
            border: filter===f ? '1px solid #fff' : '1px solid #2a2a2a',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#101010', border:'1px solid #1f1f1f',
        borderRadius:'8px', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#555' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#555' }}>
            No trades yet. Hit + Log Trade to start.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Date','Sym','Dir','Entry','SL','TP','P&L','RR','Grade','Result'].map(h => (
                    <th key={h} style={{ padding:'0.65rem 0.9rem', textAlign:'left',
                      color:'#555', fontSize:'0.6rem', letterSpacing:'0.15em',
                      textTransform:'uppercase', borderBottom:'1px solid #1a1a1a',
                      whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(t => (
                  <tr key={t.id} style={{ borderBottom:'1px solid #141414' }}>
                    <td style={{ padding:'0.7rem 0.9rem', color:'#888',
                      fontFamily:'monospace', fontSize:'0.78rem', whiteSpace:'nowrap' }}>{t.date}</td>
                    <td style={{ padding:'0.7rem 0.9rem', color:'#fff',
                      fontWeight:700, fontSize:'0.82rem' }}>{t.symbol}</td>
                    <td style={{ padding:'0.7rem 0.9rem', fontSize:'0.78rem', fontWeight:700,
                      color:t.direction==='LONG'?'#22c55e':'#ef4444' }}>{t.direction}</td>
                    {['entry','sl','tp'].map(k => (
                      <td key={k} style={{ padding:'0.7rem 0.9rem', color:'#ccc',
                        fontFamily:'monospace', fontSize:'0.78rem' }}>{t[k]}</td>
                    ))}
                    <td style={{ padding:'0.7rem 0.9rem', fontFamily:'monospace',
                      fontSize:'0.82rem', fontWeight:700,
                      color:(t.pnl||0)>0?'#22c55e':(t.pnl||0)<0?'#ef4444':'#888' }}>
                      {t.pnl!=null?`${t.pnl>0?'+':''}${t.pnl}`:'—'}
                    </td>
                    <td style={{ padding:'0.7rem 0.9rem', color:'#888',
                      fontFamily:'monospace', fontSize:'0.78rem' }}>
                      {t.rr ? `${t.rr}R` : '—'}
                    </td>
                    <td style={{ padding:'0.7rem 0.9rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'2px 7px',
                        borderRadius:'4px', color:GRADE_COLOR[t.grade]||'#888',
                        border:`1px solid ${GRADE_COLOR[t.grade]||'#333'}` }}>
                        {t.grade||'—'}
                      </span>
                    </td>
                    <td style={{ padding:'0.7rem 0.9rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'2px 8px',
                        borderRadius:'4px',
                        background:t.result==='WIN'?'#052e16':t.result==='LOSS'?'#1c0a0a':'#1a1a1a',
                        color:t.result==='WIN'?'#22c55e':t.result==='LOSS'?'#ef4444':'#888' }}>
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:100, padding:'1rem' }}>
          <div style={{ background:'#111', border:'1px solid #222', borderRadius:'10px',
            width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:'1.75rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ color:'#fff', margin:0, fontSize:'1.1rem', fontWeight:800,
                letterSpacing:'0.1em', textTransform:'uppercase' }}>Log Trade</h2>
              <button onClick={() => setModal(false)} style={{ background:'transparent',
                border:'none', color:'#888', fontSize:'1.3rem', cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.9rem' }}>
              <F label="Date"><Input name="date" type="date" /></F>
              <F label="Symbol"><Select name="symbol" opts={['NQ','ES','MNQ','MES']} /></F>
              <F label="Session"><Select name="session" opts={['London','NY','Overnight','Asian']} /></F>
              <F label="Direction"><Select name="direction" opts={['LONG','SHORT']} /></F>
              <F label="Entry"><Input name="entry" type="number" placeholder="e.g. 21500" /></F>
              <F label="Stop Loss"><Input name="sl" type="number" placeholder="e.g. 21450" /></F>
              <F label="Take Profit"><Input name="tp" type="number" placeholder="e.g. 21600" /></F>
              <F label="Exit Price"><Input name="exit" type="number" placeholder="actual exit" /></F>
              <F label="Result"><Select name="result" opts={['WIN','LOSS','BE']} /></F>
              <F label="Grade"><Select name="grade" opts={['A++','A+','A','B','C','F']} /></F>
              <F label="P&L (auto-calc)"><Input name="pnl" type="number" placeholder="auto" /></F>
              <F label="RR (auto-calc)"><Input name="rr" type="number" placeholder="auto" /></F>
            </div>

            <div style={{ marginTop:'0.9rem' }}>
              <F label="Trade Narrative">
                <textarea value={form.narrative}
                  onChange={e => set('narrative', e.target.value)}
                  rows={3} placeholder="What did you see? Why did you take this trade?"
                  style={{ ...inputStyle, resize:'vertical', fontFamily:'inherit' }} />
              </F>
            </div>

            <div style={{ marginTop:'0.9rem' }}>
              <label style={{ display:'block', color:'#888', fontSize:'0.6rem',
                letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.5rem' }}>
                Mistakes Tagged
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                {MISTAKES.map(m => {
                  const sel = form.mistakes.includes(m)
                  return (
                    <button key={m} onClick={() => toggleMistake(m)} style={{
                      padding:'0.3rem 0.7rem', borderRadius:'4px', fontSize:'0.72rem',
                      cursor:'pointer',
                      background: sel ? '#1c0a0a' : 'transparent',
                      color: sel ? '#ef4444' : '#555',
                      border: sel ? '1px solid #ef444450' : '1px solid #2a2a2a',
                    }}>{m}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop:'0.9rem' }}>
              <label style={{ display:'block', color:'#888', fontSize:'0.6rem',
                letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.5rem' }}>
                Mood
              </label>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {[{v:1,e:'😤',l:'Revenge'},{v:2,e:'😟',l:'Anxious'},
                  {v:3,e:'😐',l:'Neutral'},{v:4,e:'😊',l:'Focused'},{v:5,e:'🎯',l:'Zone'}]
                  .map(({ v, e, l }) => (
                    <button key={v} onClick={() => set('mood', v)} style={{
                      flex:1, padding:'0.5rem 0.25rem', borderRadius:'6px',
                      cursor:'pointer', fontSize:'1.1rem', textAlign:'center',
                      background: form.mood===v ? '#1a2a1a' : '#1a1a1a',
                      border: form.mood===v ? '1px solid #22c55e' : '1px solid #2a2a2a',
                    }}>
                      <div>{e}</div>
                      <div style={{ fontSize:'0.55rem', color:'#888', marginTop:'2px' }}>{l}</div>
                    </button>
                  ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
              <button onClick={save} disabled={saving} style={{
                flex:1, padding:'0.8rem', background:'#22c55e', border:'none',
                borderRadius:'6px', color:'#000', fontWeight:800, fontSize:'0.82rem',
                letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer',
              }}>{saving ? 'SAVING…' : 'SAVE TRADE →'}</button>
              <button onClick={() => setModal(false)} style={{
                padding:'0.8rem 1.25rem', background:'transparent',
                border:'1px solid #2a2a2a', borderRadius:'6px',
                color:'#888', fontSize:'0.8rem', cursor:'pointer',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
