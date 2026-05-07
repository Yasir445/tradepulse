'use client'
import { useState, useRef, useCallback } from 'react'

const GRADE_COLOR = {
  'A++':'#f59e0b','A+':'#10b981','A':'#34d399','B':'#6366f1','C':'#f97316','F':'#ef4444'
}

const SYSTEM = `You are an expert Quarterly Theory (QT) and ICT framework analyst for NQ/ES futures.

QT Reference:
- Q1=Accumulation, Q2=Manipulation, Q3=Distribution, Q4=Reversal
- SSMT = Sequential SMT divergence (NQ vs ES divergence at swing high/low)
- TPD = Three-candle Pattern Divergence — one asset makes new swing, other fails
- True Opens: Daily=12AM EST, London=1:30AM, NY=7:30AM
- Best entries: 9:00-10:30 NY (Q3ofQ3)
- Two-stage SSMT = highest probability setup
- Grade A++: Full confluence (5/5). A+: 4/5. A: 3/5. B: 2/5. C: 1/5. F: No setup.
- If only one asset shown, note SSMT cannot be fully confirmed.

Analyze this chart and return ONLY valid JSON with no markdown, no backticks:
{
  "cycle": "detected cycle e.g. Q3 of Daily",
  "bias": "BULLISH or BEARISH",
  "ssmt_detected": true or false,
  "tpd_detected": true or false,
  "true_open_position": "e.g. Price below Daily TO + NY TO — bullish",
  "entry_zone": "specific price zone or candle description",
  "stop_loss": "where to place SL",
  "target": "DOL or target level",
  "invalidation": "what invalidates the setup",
  "grade": "A++ or A+ or A or B or C or F",
  "grade_reasons": ["reason 1", "reason 2"],
  "key_observations": ["obs 1", "obs 2", "obs 3"],
  "session": "London or NY or Asian or Unknown"
}`

export default function AnalyzerPage() {
  const [image,    setImage]    = useState(null)
  const [mimeType, setMimeType] = useState('image/png')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [drag,     setDrag]     = useState(false)
  const fileRef = useRef(null)

  const loadFile = (file) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setMimeType(file.type)
    const r = new FileReader()
    r.onload = () => { setImage(r.result.split(',')[1]); setResult(null); setError('') }
    r.readAsDataURL(file)
  }

  const onFile = e => { if (e.target.files?.[0]) loadFile(e.target.files[0]) }
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0])
  }, [])

  const analyze = async () => {
    if (!image) return
    setLoading(true); setError(''); setResult(null)
    try {
      // Use our own API route to avoid CORS
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType, system: SYSTEM }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.')
    }
    setLoading(false)
  }

  const Yes = ({ v }) => (
    <span style={{
      fontSize:'0.68rem', fontWeight:800, padding:'2px 8px', borderRadius:'5px',
      background:v?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',
      color:v?'#10b981':'#ef4444',
    }}>{v?'✓ YES':'✗ NO'}</span>
  )

  return (
    <div>
      <style>{`
        .upload-zone { transition: all 0.2s ease; }
        .upload-zone:hover { border-color: #4f46e5 !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #1e293b' }}>
        <p style={{ color:'#6366f1', fontSize:'0.65rem', letterSpacing:'0.25em',
          textTransform:'uppercase', margin:'0 0 0.25rem', fontWeight:700 }}>
          Powered by Claude AI
        </p>
        <h1 style={{ color:'#f8fafc', fontSize:'1.75rem', fontWeight:900,
          margin:'0 0 0.3rem', letterSpacing:'-0.03em' }}>Chart Analyzer</h1>
        <p style={{ color:'#475569', fontSize:'0.8rem', margin:0 }}>
          Upload any TradingView screenshot → get instant QT framework analysis
        </p>
      </div>

      {/* Upload zone */}
      <div
        className="upload-zone"
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border:`2px dashed ${drag?'#6366f1':image?'rgba(16,185,129,0.5)':'#1e293b'}`,
          borderRadius:'16px', padding:'2rem', textAlign:'center', cursor:'pointer',
          background:drag?'rgba(99,102,241,0.05)':'linear-gradient(135deg, #0f172a, #1a1a2e)',
          marginBottom:'1rem', transition:'all 0.2s',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          onChange={onFile} style={{ display:'none' }} />

        {image ? (
          <div>
            <img src={`data:${mimeType};base64,${image}`} alt="Chart"
              style={{ maxHeight:240, maxWidth:'100%', borderRadius:'10px',
                objectFit:'contain', border:'1px solid #1e293b' }} />
            <p style={{ color:'#10b981', fontSize:'0.72rem', marginTop:'0.75rem',
              marginBottom:0, fontWeight:600 }}>
              ✓ Chart loaded — click to replace
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              width:56, height:56, borderRadius:'14px', margin:'0 auto 1rem',
              background:'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.1))',
              border:'1px solid rgba(99,102,241,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.5rem',
            }}>📊</div>
            <p style={{ color:'#94a3b8', fontSize:'0.85rem', margin:'0 0 0.3rem', fontWeight:600 }}>
              Drop chart screenshot here
            </p>
            <p style={{ color:'#334155', fontSize:'0.72rem', margin:0 }}>
              PNG, JPG · TradingView screenshots work best
            </p>
          </div>
        )}
      </div>

      {image && (
        <button onClick={analyze} disabled={loading} style={{
          width:'100%', padding:'0.9rem',
          background: loading ? '#1e293b' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border:'none', borderRadius:'12px',
          color: loading ? '#475569' : '#fff',
          fontWeight:800, fontSize:'0.85rem', letterSpacing:'0.15em',
          textTransform:'uppercase', cursor:loading?'not-allowed':'pointer',
          marginBottom:'1.25rem',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(79,70,229,0.4)',
          transition:'all 0.2s',
        }}>
          {loading ? '⚡ ANALYZING WITH CLAUDE AI…' : '⚡ ANALYZE QT FRAMEWORK →'}
        </button>
      )}

      {error && (
        <div style={{
          background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:'12px', padding:'1rem', color:'#ef4444',
          fontSize:'0.82rem', marginBottom:'1.25rem',
        }}>⚠️ {error}</div>
      )}

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {/* Grade + Bias hero */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div style={{
              background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:`1px solid ${GRADE_COLOR[result.grade]||'#1e293b'}33`,
              borderRadius:'16px', padding:'1.5rem', textAlign:'center',
            }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Setup Grade</p>
              <div style={{
                width:64, height:64, borderRadius:'16px', margin:'0 auto 0.75rem',
                background:`${GRADE_COLOR[result.grade]||'#94a3b8'}15`,
                border:`2px solid ${GRADE_COLOR[result.grade]||'#94a3b8'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ color:GRADE_COLOR[result.grade]||'#f8fafc',
                  fontSize:'1.5rem', fontWeight:900 }}>{result.grade}</span>
              </div>
              {result.grade_reasons.map((r,i) => (
                <p key={i} style={{ color:'#475569', fontSize:'0.65rem',
                  margin:'0.2rem 0', textAlign:'left' }}>• {r}</p>
              ))}
            </div>

            <div style={{
              background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
              border:`1px solid ${result.bias==='BULLISH'?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`,
              borderRadius:'16px', padding:'1.5rem', textAlign:'center',
            }}>
              <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem', fontWeight:600 }}>Bias</p>
              <div style={{
                width:64, height:64, borderRadius:'16px', margin:'0 auto 0.75rem',
                background:result.bias==='BULLISH'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',
                border:`2px solid ${result.bias==='BULLISH'?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.75rem',
              }}>
                {result.bias==='BULLISH'?'▲':'▼'}
              </div>
              <p style={{ color:result.bias==='BULLISH'?'#10b981':'#ef4444',
                fontWeight:800, fontSize:'0.9rem', margin:'0 0 0.25rem' }}>{result.bias}</p>
              <p style={{ color:'#475569', fontSize:'0.68rem', margin:0 }}>{result.session}</p>
            </div>
          </div>

          {/* Confluence */}
          <div style={{
            background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
            border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem',
          }}>
            <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>Confluence Checks</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
              {[{label:'SSMT',v:result.ssmt_detected},{label:'TPD',v:result.tpd_detected}]
                .map(({label,v}) => (
                <div key={label} style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', padding:'0.6rem 0.75rem',
                  background:'#0f172a', borderRadius:'8px' }}>
                  <span style={{ color:'#94a3b8', fontSize:'0.78rem', fontWeight:600 }}>{label}</span>
                  <Yes v={v} />
                </div>
              ))}
            </div>
            {[{label:'True Open',v:result.true_open_position},{label:'Cycle',v:result.cycle}]
              .map(({label,v}) => (
              <div key={label} style={{ padding:'0.6rem 0.75rem', background:'#0f172a',
                borderRadius:'8px', marginBottom:'0.5rem' }}>
                <p style={{ color:'#475569', fontSize:'0.58rem', letterSpacing:'0.1em',
                  textTransform:'uppercase', margin:'0 0 0.2rem', fontWeight:600 }}>{label}</p>
                <p style={{ color:'#94a3b8', fontSize:'0.8rem', margin:0 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Trade Plan */}
          <div style={{
            background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
            border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem',
          }}>
            <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 1rem', fontWeight:600 }}>Trade Plan</p>
            {[
              {label:'Entry Zone',   v:result.entry_zone,   color:'#10b981'},
              {label:'Stop Loss',    v:result.stop_loss,    color:'#ef4444'},
              {label:'Target / DOL', v:result.target,       color:'#6366f1'},
              {label:'Invalidation', v:result.invalidation, color:'#475569'},
            ].map(({label,v,color}) => (
              <div key={label} style={{ display:'flex', gap:'1rem', padding:'0.65rem 0',
                borderBottom:'1px solid #0f172a', alignItems:'flex-start' }}>
                <span style={{ color:'#334155', fontSize:'0.62rem', letterSpacing:'0.1em',
                  textTransform:'uppercase', flexShrink:0, width:84,
                  paddingTop:2, fontWeight:600 }}>{label}</span>
                <span style={{ color, fontSize:'0.82rem', lineHeight:1.5 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Observations */}
          <div style={{
            background:'linear-gradient(135deg, #0f172a, #1a1a2e)',
            border:'1px solid #1e293b', borderRadius:'16px', padding:'1.25rem',
          }}>
            <p style={{ color:'#475569', fontSize:'0.6rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 0.75rem', fontWeight:600 }}>
              QT Observations
            </p>
            {result.key_observations.map((obs,i) => (
              <div key={i} style={{ display:'flex', gap:'0.75rem',
                marginBottom:'0.6rem', alignItems:'flex-start' }}>
                <span style={{ color:'#6366f1', fontSize:'0.7rem',
                  flexShrink:0, marginTop:2 }}>◆</span>
                <p style={{ color:'#94a3b8', fontSize:'0.8rem',
                  margin:0, lineHeight:1.6 }}>{obs}</p>
              </div>
            ))}
          </div>

          <a href={`/dashboard/journal?grade=${result.grade}&direction=${result.bias==='BULLISH'?'LONG':'SHORT'}`}
            style={{
              display:'block', textAlign:'center',
              padding:'0.85rem',
              background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius:'12px', color:'#fff', fontWeight:800,
              fontSize:'0.82rem', letterSpacing:'0.1em',
              textTransform:'uppercase', textDecoration:'none',
              boxShadow:'0 4px 16px rgba(79,70,229,0.35)',
            }}>
            Log This Trade →
          </a>
        </div>
      )}
    </div>
  )
}
