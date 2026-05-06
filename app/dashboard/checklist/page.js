'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'fourh_tpd',
    label: '4H TPD in Direction',
    desc: 'Three-candle TPD between NQ and ES at the 4H swing confirming bias.',
    detail: 'NQ and ES must show divergence at the 4H swing. One makes a new high/low while the other fails → confirms expansion direction.',
  },
  {
    id: 'daily_smt',
    label: 'Daily SMT on M15',
    desc: 'Sequential SMT divergence on the Daily cycle visible on M15 after a swing.',
    detail: 'NQ vs ES: one prints a new swing high/low on M15 while the other does not. Primary confluence. NO Daily SMT = NO trade.',
  },
  {
    id: 'ninety_smt',
    label: '90M SMT on M5 (after Daily)',
    desc: '90-minute cycle SMT confirming the Daily SMT — must occur AFTER daily SMT.',
    detail: 'On M5, after Daily SMT prints, wait for 90M SMT in same direction. Two-stage SSMT = highest probability.',
  },
  {
    id: 'm5_tpd',
    label: 'M5 TPD Entry Trigger',
    desc: 'Three-candle TPD on M5 at the CISD of TPD reversion level — actual entry trigger.',
    detail: 'M5 TPD fires at the CISD level from Daily TPD. PSP → CISD → M5 TPD chain. Stop on swing high/low of TPD candle.',
  },
  {
    id: 'true_opens',
    label: 'Both True Opens Aligned',
    desc: 'Price on correct side of BOTH Daily TO (12AM) and session TO.',
    detail: 'Longs: price below both Daily TO and NY TO (7:30AM). Shorts: above both. Selling above TWO true opens = highest probability bearish.',
  },
]

const GRADES = {
  5: { grade:'A++', color:'#eab308', bg:'#1a1500', msg:'EXECUTE — FULL CONFLUENCE' },
  4: { grade:'A+',  color:'#22c55e', bg:'#052e16', msg:'STRONG SETUP — EXECUTE' },
  3: { grade:'A',   color:'#86efac', bg:'#041f10', msg:'GOOD SETUP — PROCEED WITH DISCIPLINE' },
  2: { grade:'B',   color:'#3b82f6', bg:'#0c1b38', msg:'PARTIAL CONFLUENCE — CAUTION' },
  1: { grade:'C',   color:'#f59e0b', bg:'#1c1000', msg:'WEAK SETUP — WAIT FOR MORE CONFLUENCE' },
  0: { grade:'F',   color:'#ef4444', bg:'#1c0a0a', msg:'NO TRADE — STAND ASIDE' },
}

export default function ChecklistPage() {
  const [checked,   setChecked]   = useState({})
  const [expanded,  setExpanded]  = useState(null)
  const [symbol,    setSymbol]    = useState('NQ')
  const [direction, setDirection] = useState('LONG')
  const router = useRouter()

  const count     = STEPS.filter(s => checked[s.id]).length
  const gradeInfo = GRADES[count]

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }))
  const reset  = () => setChecked({})

  const goToJournal = () => {
    const params = new URLSearchParams({
      grade: gradeInfo.grade, symbol, direction,
    })
    router.push(`/dashboard/journal?${params.toString()}`)
  }

  return (
    <div style={{ maxWidth:700 }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <p style={{ color:'#888', fontSize:'0.7rem', letterSpacing:'0.2em',
          textTransform:'uppercase', margin:'0 0 0.3rem' }}>Pre-Trade</p>
        <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900, margin:0 }}>Checklist</h1>
      </div>

      {/* Symbol + Direction */}
      <div style={{ background:'#101010', border:'1px solid #1f1f1f', borderRadius:'8px',
        padding:'1.25rem', marginBottom:'1.5rem', display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
        <div>
          <p style={{ color:'#888', fontSize:'0.6rem', letterSpacing:'0.15em',
            textTransform:'uppercase', margin:'0 0 0.4rem' }}>Symbol</p>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {['NQ','ES'].map(s => (
              <button key={s} onClick={() => setSymbol(s)} style={{
                padding:'0.4rem 0.9rem', borderRadius:'5px', fontSize:'0.8rem',
                fontWeight:700, cursor:'pointer',
                background: symbol===s ? '#fff' : '#161616',
                color: symbol===s ? '#000' : '#888',
                border: symbol===s ? '1px solid #fff' : '1px solid #2a2a2a',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:'#888', fontSize:'0.6rem', letterSpacing:'0.15em',
            textTransform:'uppercase', margin:'0 0 0.4rem' }}>Direction</p>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {['LONG','SHORT'].map(d => (
              <button key={d} onClick={() => setDirection(d)} style={{
                padding:'0.4rem 0.9rem', borderRadius:'5px', fontSize:'0.8rem',
                fontWeight:700, cursor:'pointer',
                background: direction===d ? (d==='LONG'?'#22c55e':'#ef4444') : '#161616',
                color: direction===d ? '#000' : '#888',
                border: direction===d
                  ? `1px solid ${d==='LONG'?'#22c55e':'#ef4444'}`
                  : '1px solid #2a2a2a',
              }}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {STEPS.map((step, i) => {
          const done = !!checked[step.id]
          const open = expanded === step.id
          return (
            <div key={step.id} style={{
              background:'#101010',
              border:`1px solid ${done?'#1a3a1a':'#1f1f1f'}`,
              borderRadius:'8px', overflow:'hidden', transition:'border-color 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem',
                padding:'1rem 1.25rem', cursor:'pointer' }}
                onClick={() => toggle(step.id)}>
                <div style={{
                  width:22, height:22, borderRadius:'4px', flexShrink:0,
                  border:`2px solid ${done?'#22c55e':'#2a2a2a'}`,
                  background: done ? '#22c55e' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.15s',
                }}>
                  {done && <span style={{ color:'#000', fontSize:'0.7rem', fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ color:done?'#22c55e':'#333', fontSize:'0.7rem',
                  fontFamily:'monospace', fontWeight:700, flexShrink:0 }}>0{i+1}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, color:done?'#fff':'#ccc',
                    fontWeight:done?700:400, fontSize:'0.9rem' }}>{step.label}</p>
                  <p style={{ margin:'0.15rem 0 0', color:'#555', fontSize:'0.72rem' }}>{step.desc}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setExpanded(open?null:step.id) }}
                  style={{ background:'transparent', border:'none', color:'#555',
                    cursor:'pointer', fontSize:'1rem', transition:'transform 0.2s',
                    transform: open?'rotate(180deg)':'rotate(0)' }}>▾</button>
              </div>
              {open && (
                <div style={{ padding:'0.75rem 1.25rem 1rem 3.75rem',
                  borderTop:'1px solid #1a1a1a' }}>
                  <p style={{ color:'#888', fontSize:'0.8rem', lineHeight:1.6, margin:0 }}>
                    {step.detail}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grade */}
      <div style={{
        background: gradeInfo.bg,
        border:`1px solid ${gradeInfo.color}33`,
        borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem',
        display:'flex', alignItems:'center', gap:'1.5rem',
      }}>
        <div style={{ width:72, height:72, borderRadius:'10px',
          border:`2px solid ${gradeInfo.color}`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:gradeInfo.color, fontWeight:900, fontSize:'1.6rem' }}>
            {gradeInfo.grade}
          </span>
        </div>
        <div>
          <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
            textTransform:'uppercase', margin:'0 0 0.3rem' }}>
            Setup Grade · {count}/5 confluence
          </p>
          <p style={{ color:gradeInfo.color, fontWeight:800, fontSize:'1rem',
            letterSpacing:'0.05em', margin:0 }}>{gradeInfo.msg}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        <button onClick={goToJournal} style={{
          padding:'0.75rem 1.5rem', background:'#22c55e', border:'none',
          borderRadius:'6px', color:'#000', fontWeight:800, fontSize:'0.82rem',
          letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer',
        }}>Log This Trade →</button>
        <button onClick={reset} style={{
          padding:'0.75rem 1.25rem', background:'transparent',
          border:'1px solid #2a2a2a', borderRadius:'6px', color:'#888',
          fontSize:'0.8rem', cursor:'pointer',
        }}>Reset</button>
      </div>
    </div>
  )
}
