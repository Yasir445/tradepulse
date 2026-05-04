'use client'
import { useState, useRef, useCallback } from 'react'

const GRADE_COLOR = {
  'A++':'#eab308','A+':'#22c55e','A':'#86efac','B':'#3b82f6','C':'#f59e0b','F':'#ef4444'
}

const SYSTEM = `You are an expert Quarterly Theory (QT) and ICT framework analyst for NQ/ES futures.

QT Reference:
- Q1=Accumulation, Q2=Manipulation, Q3=Distribution, Q4=Reversal
- SSMT = Sequential SMT divergence (NQ vs ES divergence at swing)
- TPD = Three-candle Pattern Divergence
- True Opens: Daily=12AM, London=1:30AM, NY=7:30AM EST
- Best entries: 9:00-10:30 NY (Q3ofQ3)
- Grade A++: Full confluence. A+: SSMT+TPD+True Open. A: SSMT+TPD. B: SSMT only. C: Partial. F: No setup.
- If only one asset shown, note SSMT cannot be confirmed.

Return ONLY valid JSON, no markdown, no backticks:
{
  "cycle": "detected cycle e.g. Q3 of Daily",
  "bias": "BULLISH or BEARISH",
  "ssmt_detected": true or false,
  "tpd_detected": true or false,
  "true_open_position": "description",
  "entry_zone": "description",
  "stop_loss": "description",
  "target": "description",
  "invalidation": "description",
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
    r.onload = () => {
      setImage(r.result.split(',')[1])
      setResult(null)
      setError('')
    }
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
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: [{
            role: 'user',
            content: [
              { type:'image', source:{ type:'base64', media_type:mimeType, data:image } },
              { type:'text',  text:'Analyze this chart using the QT framework. Return only JSON.' },
            ],
          }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'API error')
      const raw   = data.content?.find(b => b.type==='text')?.text || ''
      const clean = raw.replace(/```json|```/g,'').trim()
      setResult(JSON.parse(clean))
    } catch (e) {
      setError(e.message || 'Analysis failed.')
    }
    setLoading(false)
  }

  const Yes = ({ v }) => (
    <span style={{ fontSize:'0.72rem', fontWeight:800, padding:'2px 8px', borderRadius:'4px',
      background:v?'#052e16':'#1c0a0a', color:v?'#22c55e':'#ef4444' }}>
      {v ? 'YES' : 'NO'}
    </span>
  )

  return (
    <div style={{ maxWidth:780 }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <p style={{ color:'#888', fontSize:'0.7rem', letterSpacing:'0.2em',
          textTransform:'uppercase', margin:'0 0 0.3rem' }}>AI · Free</p>
        <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900, margin:0 }}>Chart Analyzer</h1>
        <p style={{ color:'#555', fontSize:'0.82rem', marginTop:'0.4rem' }}>
          Upload any chart screenshot → get a full QT framework breakdown.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border:`2px dashed ${drag?'#22c55e':image?'#22c55e55':'#2a2a2a'}`,
          borderRadius:'10px', padding:'2.5rem', textAlign:'center',
          cursor:'pointer', background:drag?'#052e1620':'#101010',
          transition:'all 0.2s', marginBottom:'1rem',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          onChange={onFile} style={{ display:'none' }} />
        {image ? (
          <div>
            <img src={`data:${mimeType};base64,${image}`} alt="Chart"
              style={{ maxHeight:280, maxWidth:'100%', borderRadius:'6px', objectFit:'contain' }} />
            <p style={{ color:'#22c55e', fontSize:'0.75rem', marginTop:'0.75rem', marginBottom:0 }}>
              ✓ Chart loaded — click to replace
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📤</div>
            <p style={{ color:'#888', fontSize:'0.85rem', margin:'0 0 0.3rem' }}>
              Drop chart screenshot here or click to upload
            </p>
            <p style={{ color:'#444', fontSize:'0.72rem', margin:0 }}>
              PNG, JPG · TradingView screenshots work best
            </p>
          </>
        )}
      </div>

      {image && (
        <button onClick={analyze} disabled={loading} style={{
          width:'100%', padding:'0.9rem',
          background:loading?'#1a1a1a':'#22c55e', border:'none',
          borderRadius:'8px', color:loading?'#555':'#000',
          fontWeight:800, fontSize:'0.85rem', letterSpacing:'0.2em',
          textTransform:'uppercase', cursor:loading?'not-allowed':'pointer',
          marginBottom:'1.5rem',
        }}>
          {loading ? '⚡ ANALYZING…' : '⚡ ANALYZE QT FRAMEWORK →'}
        </button>
      )}

      {error && (
        <div style={{ background:'#1c0a0a', border:'1px solid #ef444433',
          borderRadius:'8px', padding:'1rem', color:'#ef4444',
          fontSize:'0.82rem', marginBottom:'1.5rem' }}>{error}</div>
      )}

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Grade + Bias */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={{ background:'#101010',
              border:`1px solid ${GRADE_COLOR[result.grade]||'#1f1f1f'}33`,
              borderRadius:'8px', padding:'1.5rem', textAlign:'center' }}>
              <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem' }}>Setup Grade</p>
              <p style={{ color:GRADE_COLOR[result.grade]||'#fff', fontSize:'3rem',
                fontWeight:900, margin:'0 0 0.25rem' }}>{result.grade}</p>
              {result.grade_reasons.map((r,i) => (
                <p key={i} style={{ color:'#666', fontSize:'0.72rem', margin:'0.2rem 0' }}>• {r}</p>
              ))}
            </div>
            <div style={{ background:'#101010',
              border:`1px solid ${result.bias==='BULLISH'?'#22c55e33':'#ef444433'}`,
              borderRadius:'8px', padding:'1.5rem', textAlign:'center' }}>
              <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
                textTransform:'uppercase', margin:'0 0 0.5rem' }}>Bias</p>
              <p style={{ fontSize:'2rem', fontWeight:900, margin:'0 0 0.5rem',
                color:result.bias==='BULLISH'?'#22c55e':'#ef4444' }}>
                {result.bias==='BULLISH'?'▲':'▼'}
              </p>
              <p style={{ color:result.bias==='BULLISH'?'#22c55e':'#ef4444',
                fontWeight:800, fontSize:'0.9rem', margin:0 }}>{result.bias}</p>
              <p style={{ color:'#555', fontSize:'0.72rem', marginTop:'0.25rem' }}>
                {result.session}
              </p>
            </div>
          </div>

          {/* Confluence */}
          <div style={{ background:'#101010', border:'1px solid #1f1f1f',
            borderRadius:'8px', padding:'1.25rem' }}>
            <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 1rem' }}>Confluence Checks</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem',
              marginBottom:'0.75rem' }}>
              {[{label:'SSMT Detected',v:result.ssmt_detected},
                {label:'TPD Detected', v:result.tpd_detected}].map(({ label, v }) => (
                <div key={label} style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', padding:'0.6rem 0.75rem',
                  background:'#161616', borderRadius:'6px' }}>
                  <span style={{ color:'#ccc', fontSize:'0.8rem' }}>{label}</span>
                  <Yes v={v} />
                </div>
              ))}
            </div>
            {[{label:'True Open Position', v:result.true_open_position},
              {label:'Cycle', v:result.cycle}].map(({ label, v }) => (
              <div key={label} style={{ padding:'0.6rem 0.75rem', background:'#161616',
                borderRadius:'6px', marginBottom:'0.5rem' }}>
                <p style={{ color:'#888', fontSize:'0.6rem', letterSpacing:'0.1em',
                  textTransform:'uppercase', margin:'0 0 0.25rem' }}>{label}</p>
                <p style={{ color:'#ccc', fontSize:'0.82rem', margin:0 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Trade Plan */}
          <div style={{ background:'#101010', border:'1px solid #1f1f1f',
            borderRadius:'8px', padding:'1.25rem' }}>
            <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 1rem' }}>Trade Plan</p>
            {[
              {label:'Entry Zone',   v:result.entry_zone,   color:'#22c55e'},
              {label:'Stop Loss',    v:result.stop_loss,    color:'#ef4444'},
              {label:'Target / DOL', v:result.target,       color:'#3b82f6'},
              {label:'Invalidation', v:result.invalidation, color:'#888'},
            ].map(({ label, v, color }) => (
              <div key={label} style={{ display:'flex', gap:'1rem', padding:'0.6rem 0',
                borderBottom:'1px solid #1a1a1a', alignItems:'flex-start' }}>
                <span style={{ color:'#555', fontSize:'0.68rem', letterSpacing:'0.1em',
                  textTransform:'uppercase', flexShrink:0, width:90, paddingTop:2 }}>
                  {label}
                </span>
                <span style={{ color, fontSize:'0.85rem' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Observations */}
          <div style={{ background:'#101010', border:'1px solid #1f1f1f',
            borderRadius:'8px', padding:'1.25rem' }}>
            <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
              textTransform:'uppercase', margin:'0 0 0.75rem' }}>QT Observations</p>
            {result.key_observations.map((obs, i) => (
              <div key={i} style={{ display:'flex', gap:'0.75rem',
                marginBottom:'0.6rem', alignItems:'flex-start' }}>
                <span style={{ color:'#22c55e', fontSize:'0.7rem',
                  flexShrink:0, marginTop:2 }}>◆</span>
                <p style={{ color:'#ccc', fontSize:'0.82rem',
                  margin:0, lineHeight:1.5 }}>{obs}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <a href={`/dashboard/journal?grade=${result.grade}&direction=${result.bias==='BULLISH'?'LONG':'SHORT'}`}
              style={{ padding:'0.7rem 1.25rem', background:'#22c55e', borderRadius:'6px',
                color:'#000', fontWeight:800, fontSize:'0.78rem', letterSpacing:'0.1em',
                textTransform:'uppercase', textDecoration:'none' }}>
              Log This Trade →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
