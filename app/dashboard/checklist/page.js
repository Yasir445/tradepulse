'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id:'fourh_tpd', label:'4H TPD Confirmed',
    short:'4H TPD', icon:'📊',
    desc:'Three-candle TPD between NQ and ES at the 4H swing confirming directional bias.',
    detail:'NQ and ES must show divergence at the 4H swing. One makes a new high/low while the other fails → confirms expansion direction.',
  },
  {
    id:'daily_smt', label:'Daily SMT on M15',
    short:'Daily SMT', icon:'📈',
    desc:'Sequential SMT divergence on the Daily cycle, visible on the M15 chart.',
    detail:'NQ vs ES: one prints a new swing high/low on M15 while the other does not. NO Daily SMT = NO trade.',
  },
  {
    id:'ninety_smt', label:'90M SMT on M5',
    short:'90M SMT', icon:'⏱',
    desc:'90-minute cycle SMT confirming the Daily SMT — must occur AFTER daily SMT.',
    detail:'On M5, after Daily SMT prints, wait for 90M SMT in same direction. Two-stage SSMT = highest probability.',
  },
  {
    id:'m5_tpd', label:'M5 TPD Entry Trigger',
    short:'M5 TPD', icon:'🎯',
    desc:'Three-candle TPD on M5 at the CISD reversion level — your actual entry trigger.',
    detail:'M5 TPD fires at the CISD level from Daily TPD. PSP → CISD → M5 TPD chain. Stop on swing high/low.',
  },
  {
    id:'true_opens', label:'Both True Opens Aligned',
    short:'True Opens', icon:'🕐',
    desc:'Price on correct side of BOTH Daily TO (12AM) and NY TO (7:30AM).',
    detail:'Longs: price below both Daily TO and NY TO. Shorts: above both. Two true opens aligned = highest probability.',
  },
]

const GRADES = {
  5:{ grade:'A++', color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', msg:'EXECUTE — FULL CONFLUENCE', emoji:'🔥' },
  4:{ grade:'A+',  color:'#10b981', bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.2)',  msg:'STRONG SETUP — EXECUTE', emoji:'✅' },
  3:{ grade:'A',   color:'#34d399', bg:'rgba(52,211,153,0.08)',  border:'rgba(52,211,153,0.2)',  msg:'GOOD SETUP — PROCEED', emoji:'👍' },
  2:{ grade:'B',   color:'#6366f1', bg:'rgba(99,102,241,0.08)',  border:'rgba(99,102,241,0.2)',  msg:'PARTIAL CONFLUENCE — CAUTION', emoji:'⚠️' },
  1:{ grade:'C',   color:'#f97316', bg:'rgba(249,115,22,0.08)',  border:'rgba(249,115,22,0.2)',  msg:'WEAK SETUP — WAIT', emoji:'🔶' },
  0:{ grade:'F',   color:'#ef4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   msg:'NO TRADE — STAND ASIDE', emoji:'🚫' },
}

export default function ChecklistPage() {
  const [checked,   setChecked]   = useState({})
  const [expanded,  setExpanded]  = useState(null)
  const [symbol,    setSymbol]    = useState('NQ')
  const [direction, setDirection] = useState('LONG')
  const router = useRouter()

  const count     = STEPS.filter(s => checked[s.id]).length
  const gradeInfo = GRADES[count]
  const toggle    = (id) => setChecked(p => ({ ...p, [id]: !p[id] }))
  const reset     = () => setChecked({})

  const goToJournal = () => {
    router.push(`/dashboard/journal?grade=${gradeInfo.grade}&symbol=${symbol}&direction=${direction}`)
  }

  return (
    <div>
      <style>{`
        .step-card { transition: all 0.2s ease; }
        .step-card:hover { border-color: #2d3748 !important; }
        .tog-btn { transition: all 0.15s ease; }
        .tog-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #1e293b' }}>
        <p style={{ color:'#6366f1', fontSize:'0.65rem', letterSpacing:'0.25em',
          textTransform:'uppercase', margin:'0 0 0.25rem', fontWeight:700 }}>QT Framework</p>
        <h1 style={{ color:'#f8fafc', fontSize:'1.75rem', fontWeight:900, margin:0, letterSpacing:'-0.03em' }}>
          Pre-Trade Checklist
        </h1>
      </div>

      {/* Symbol + Direction */}
      <div style={{
        background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
        border:'1px solid #1e293b', borderRadius:'16px',
        padding:'1.25rem', marginBottom:'1.25rem',
        display:'flex', gap:'1.5rem', flexWrap:'wrap',
      }}>
        <div>
          <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.15em',
            textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Instrument</p>
          <div style={{ display:'flex', gap:'0.4rem' }}>
            {['NQ','ES','MNQ','MES'].map(s => (
              <button key={s} className="tog-btn" onClick={() => setSymbol(s)} style={{
                padding:'0.45rem 0.75rem', borderRadius:'8px', fontSize:'0.78rem',
                fontWeight:700, cursor:'pointer',
                background: symbol===s ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#0f172a',
                color: symbol===s ? '#fff' : '#475569',
                border: symbol===s ? '1px solid rgba(99,102,241,0.4)' : '1px solid #1e293b',
                boxShadow: symbol===s ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.15em',
            textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Direction</p>
          <div style={{ display:'flex', gap:'0.4rem' }}>
            {['LONG','SHORT'].map(d => (
              <button key={d} className="tog-btn" onClick={() => setDirection(d)} style={{
                padding:'0.45rem 0.9rem', borderRadius:'8px', fontSize:'0.78rem',
                fontWeight:700, cursor:'pointer',
                background: direction===d
                  ? (d==='LONG'?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#dc2626,#ef4444)')
                  : '#0f172a',
                color: direction===d ? '#fff' : '#475569',
                border: direction===d
                  ? `1px solid ${d==='LONG'?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`
                  : '1px solid #1e293b',
                boxShadow: direction===d
                  ? `0 4px 12px ${d==='LONG'?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`
                  : 'none',
              }}>{d==='LONG'?'▲ LONG':'▼ SHORT'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
          <span style={{ color:'#64748b', fontSize:'0.65rem', letterSpacing:'0.1em',
            textTransform:'uppercase', fontWeight:600 }}>Confluence Stack</span>
          <span style={{ color: gradeInfo.color, fontWeight:800, fontSize:'0.75rem' }}>
            {count}/5 · {gradeInfo.grade}
          </span>
        </div>
        <div style={{ background:'#1e293b', borderRadius:'4px', height:6, overflow:'hidden' }}>
          <div style={{
            width:`${(count/5)*100}%`, height:'100%',
            background:`linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}cc)`,
            borderRadius:'4px', transition:'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1.25rem' }}>
        {STEPS.map((step, i) => {
          const done = !!checked[step.id]
          const open = expanded === step.id
          return (
            <div key={step.id} className="step-card" style={{
              background: done
                ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))'
                : 'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:`1px solid ${done?'rgba(16,185,129,0.25)':'#1e293b'}`,
              borderRadius:'14px', overflow:'hidden',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'1rem 1.1rem', cursor:'pointer' }}
                onClick={() => toggle(step.id)}>
                {/* Checkbox */}
                <div style={{
                  width:24, height:24, borderRadius:'7px', flexShrink:0,
                  background: done ? 'linear-gradient(135deg,#059669,#10b981)' : '#0f172a',
                  border:`2px solid ${done?'#10b981':'#1e293b'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s', boxShadow: done ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                }}>
                  {done && <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:900 }}>✓</span>}
                </div>

                <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{step.icon}</span>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.15rem' }}>
                    <p style={{ margin:0, color:done?'#f8fafc':'#94a3b8',
                      fontWeight:done?800:600, fontSize:'0.85rem' }}>{step.label}</p>
                    <span style={{
                      fontSize:'0.58rem', color:done?'#10b981':'#334155',
                      letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700,
                      background:done?'rgba(16,185,129,0.12)':'#0f172a',
                      padding:'1px 5px', borderRadius:'4px',
                      border:`1px solid ${done?'rgba(16,185,129,0.2)':'#1e293b'}`,
                    }}>0{i+1}</span>
                  </div>
                  <p style={{ margin:0, color:'#334155', fontSize:'0.67rem', lineHeight:1.4 }}>{step.desc}</p>
                </div>

                <button onClick={e => { e.stopPropagation(); setExpanded(open?null:step.id) }}
                  style={{ background:'transparent', border:'none', color:'#334155',
                    cursor:'pointer', fontSize:'1rem', flexShrink:0,
                    transition:'transform 0.2s', transform:open?'rotate(180deg)':'rotate(0)' }}>▾</button>
              </div>
              {open && (
                <div style={{ padding:'0 1.1rem 1rem', paddingLeft:'3.75rem',
                  borderTop:'1px solid #1a1a2a' }}>
                  <p style={{ color:'#64748b', fontSize:'0.78rem', lineHeight:1.7,
                    margin:'0.75rem 0 0' }}>{step.detail}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grade result */}
      <div style={{
        background: gradeInfo.bg,
        border:`1px solid ${gradeInfo.border}`,
        borderRadius:'16px', padding:'1.25rem', marginBottom:'1.25rem',
        display:'flex', alignItems:'center', gap:'1.25rem',
      }}>
        <div style={{
          width:64, height:64, borderRadius:'14px',
          background:`${gradeInfo.color}15`,
          border:`2px solid ${gradeInfo.color}`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          flexDirection:'column', gap:'2px',
        }}>
          <span style={{ fontSize:'1.1rem' }}>{gradeInfo.emoji}</span>
          <span style={{ color:gradeInfo.color, fontWeight:900, fontSize:'1rem' }}>
            {gradeInfo.grade}
          </span>
        </div>
        <div>
          <p style={{ color:'#64748b', fontSize:'0.6rem', letterSpacing:'0.2em',
            textTransform:'uppercase', margin:'0 0 0.25rem', fontWeight:600 }}>
            Setup Grade · {count}/5
          </p>
          <p style={{ color:gradeInfo.color, fontWeight:800, fontSize:'0.95rem',
            margin:0, letterSpacing:'0.03em' }}>{gradeInfo.msg}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        <button onClick={goToJournal} style={{
          padding:'0.85rem 1.75rem',
          background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border:'none', borderRadius:'10px', color:'#fff',
          fontWeight:800, fontSize:'0.82rem', letterSpacing:'0.1em',
          textTransform:'uppercase', cursor:'pointer',
          boxShadow:'0 4px 16px rgba(79,70,229,0.35)',
        }}>Log This Trade →</button>
        <button onClick={reset} style={{
          padding:'0.85rem 1.25rem', background:'transparent',
          border:'1px solid #1e293b', borderRadius:'10px', color:'#475569',
          fontSize:'0.8rem', cursor:'pointer',
        }}>Reset</button>
      </div>
    </div>
  )
}
