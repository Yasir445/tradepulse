'use client'
import { useState, useRef, useCallback } from 'react'

const SYSTEM = `You are an expert Quarterly Theory (QT) and ICT framework analyst for NQ/ES futures.

QT Framework:
- Q1=Accumulation, Q2=Manipulation, Q3=Distribution, Q4=Reversal (AMD cycle)
- SSMT = Sequential SMT divergence between NQ and ES at swing high/low
- TPD = Three-candle Pattern Divergence — one makes new swing, other fails
- True Opens: Daily=12AM EST, London=1:30AM, NY=7:30AM
- PSP = Power of Swing Point (large wick, small body candle)
- Two-stage SSMT = highest probability (Daily + 90M)
- Best entries: 9:00-10:30 NY (Q3 of Q3)
- Grade A++: 5/5 confluence. A+: 4/5. A: 3/5. B: 2/5. C: 1/5. F: No valid setup.

If only one chart/asset shown, note SSMT cannot be fully confirmed — requires NQ vs ES comparison.

Analyze this chart and return ONLY valid JSON. No markdown, no backticks, no explanation outside JSON:
{
  "cycle": "detected cycle position e.g. Q3 of Daily, Q2 of 90M",
  "bias": "BULLISH or BEARISH",
  "ssmt_detected": true or false,
  "tpd_detected": true or false,
  "psp_detected": true or false,
  "true_open_position": "e.g. Price below Daily TO and NY TO — bullish alignment",
  "confluence_score": 0 to 5,
  "entry_zone": "specific description of entry area",
  "stop_loss": "where to place SL and why",
  "target": "DOL or key target level",
  "invalidation": "what price action would invalidate this setup",
  "grade": "A++ or A+ or A or B or C or F",
  "grade_reasons": ["reason 1", "reason 2", "reason 3"],
  "mistakes_to_avoid": ["mistake 1", "mistake 2"],
  "key_observations": ["obs 1", "obs 2", "obs 3", "obs 4"],
  "session": "London or NY or Asian or Unknown",
  "summary": "2-3 sentence plain English summary of the setup"
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
    if (!file.type.startsWith('image/')) { setError('Image files only.'); return }
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
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType, system: SYSTEM }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e.message || 'Analysis failed. Check your API key in Vercel settings.')
    }
    setLoading(false)
  }

  const GC = { 'A++':'#ffcc00','A+':'#39ff14','A':'#00e5ff','B':'#c084ff','C':'#ff6b35','F':'#ff2d55' }

  const Chip = ({ v, color }) => (
    <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:'3px',
      background:`${color}12`, color, border:`1px solid ${color}30`,
      letterSpacing:'1px', fontWeight:600 }}>{v}</span>
  )

  const Field = ({ label, value, color='#c9d6df', borderColor }) => value ? (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
        textTransform:'uppercase', marginBottom:'4px', fontWeight:600 }}>{label}</div>
      <div style={{ color, fontSize:'0.78rem', lineHeight:1.6,
        background:'#0d1117', borderRadius:'3px', padding:'8px 10px',
        borderLeft: borderColor ? `2px solid ${borderColor}` : '2px solid #1e2a35' }}>
        {value}
      </div>
    </div>
  ) : null

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom:'1.25rem' }}>
        <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
          textTransform:'uppercase', marginBottom:'3px' }}>Powered by Claude AI</div>
        <div style={{ color:'#eaf4fb', fontSize:'1.4rem', fontWeight:900,
          letterSpacing:'2px' }}>QT CHART ANALYZER</div>
        <div style={{ color:'#4a6274', fontSize:'0.72rem', marginTop:'5px' }}>
          Upload any TradingView screenshot → instant QT framework breakdown
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border:`1px dashed ${drag?'#00e5ff':image?'rgba(57,255,20,.4)':'#1e2a35'}`,
          borderRadius:'4px', padding:'1.75rem', textAlign:'center', cursor:'pointer',
          background: drag ? 'rgba(0,229,255,.03)' : '#0d1117',
          marginBottom:'1rem', transition:'all .2s',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          onChange={onFile} style={{ display:'none' }} />

        {image ? (
          <div>
            <img src={`data:${mimeType};base64,${image}`} alt="Chart"
              style={{ maxHeight:260, maxWidth:'100%', borderRadius:'3px',
                objectFit:'contain', border:'1px solid #1e2a35' }} />
            <div style={{ color:'#39ff14', fontSize:'0.65rem', marginTop:'8px',
              letterSpacing:'2px' }}>✓ CHART LOADED — CLICK TO REPLACE</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:'2rem', marginBottom:'0.6rem', color:'#1e3a4a' }}>📊</div>
            <div style={{ color:'#4a6274', fontSize:'0.78rem', marginBottom:'4px' }}>
              Drop chart screenshot here or click to upload
            </div>
            <div style={{ color:'#1e3a4a', fontSize:'0.65rem' }}>
              PNG · JPG · TradingView screenshots work best
            </div>
          </div>
        )}
      </div>

      {image && (
        <button onClick={analyze} disabled={loading} style={{
          width:'100%', padding:'11px',
          background: loading ? 'rgba(0,229,255,.04)' : 'rgba(0,229,255,.1)',
          border: `1px solid ${loading ? '#1e2a35' : 'rgba(0,229,255,.4)'}`,
          borderRadius:'4px', color: loading ? '#1e3a4a' : '#00e5ff',
          fontFamily:'IBM Plex Mono, monospace', fontSize:'0.8rem',
          letterSpacing:'3px', textTransform:'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom:'1rem', transition:'all .2s',
        }}>
          {loading ? '⚡ ANALYZING WITH CLAUDE AI…' : '⚡ ANALYZE QT FRAMEWORK →'}
        </button>
      )}

      {error && (
        <div style={{ background:'rgba(255,45,85,.08)', border:'1px solid rgba(255,45,85,.2)',
          borderRadius:'4px', padding:'10px 14px', color:'#ff2d55',
          fontSize:'0.75rem', marginBottom:'1rem', letterSpacing:'1px' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>

          {/* Grade + Bias hero */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'10px',
            background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
            padding:'14px', alignItems:'center' }}>
            <div style={{
              width:72, height:72, borderRadius:'4px', flexShrink:0,
              background:`${GC[result.grade]||'#4a6274'}12`,
              border:`2px solid ${GC[result.grade]||'#4a6274'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:'2px',
            }}>
              <span style={{ color:GC[result.grade]||'#eaf4fb', fontFamily:"'Bebas Neue',sans-serif",
                fontSize:'2rem', lineHeight:1,
                textShadow:`0 0 12px ${GC[result.grade]||'transparent'}` }}>{result.grade}</span>
            </div>
            <div>
              <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap',
                marginBottom:'7px' }}>
                <Chip v={result.bias} color={result.bias==='BULLISH'?'#39ff14':'#ff2d55'} />
                <Chip v={result.session} color='#00e5ff' />
                <Chip v={`${result.confluence_score||0}/5 CONFLUENCE`} color='#c084ff' />
              </div>
              <div style={{ color:'#c9d6df', fontSize:'0.78rem', lineHeight:1.6 }}>
                {result.summary}
              </div>
            </div>
          </div>

          {/* Confluence checks */}
          <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
            borderRadius:'4px', padding:'12px' }}>
            <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
              textTransform:'uppercase', marginBottom:'10px' }}>CONFLUENCE STACK</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
              {[
                { l:'SSMT', v:result.ssmt_detected },
                { l:'TPD',  v:result.tpd_detected },
                { l:'PSP',  v:result.psp_detected },
              ].map(({ l, v }) => (
                <div key={l} style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', padding:'7px 9px',
                  background:'#080b0f', borderRadius:'3px' }}>
                  <span style={{ color:'#c9d6df', fontSize:'0.72rem', fontWeight:600 }}>{l}</span>
                  <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'2px 7px',
                    borderRadius:'3px',
                    background:v?'rgba(57,255,20,.1)':'rgba(255,45,85,.08)',
                    color:v?'#39ff14':'#ff2d55',
                    border:`1px solid ${v?'rgba(57,255,20,.25)':'rgba(255,45,85,.2)'}` }}>
                    {v?'✓ YES':'✗ NO'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'7px', background:'#080b0f', borderRadius:'3px',
              padding:'8px 10px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'1px',
                marginBottom:'3px' }}>TRUE OPEN POSITION</div>
              <div style={{ color:'#c9d6df', fontSize:'0.78rem' }}>{result.true_open_position}</div>
            </div>
            <div style={{ marginTop:'6px', background:'#080b0f', borderRadius:'3px',
              padding:'8px 10px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'1px',
                marginBottom:'3px' }}>CYCLE POSITION</div>
              <div style={{ color:'#c9d6df', fontSize:'0.78rem' }}>{result.cycle}</div>
            </div>
          </div>

          {/* Trade plan */}
          <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
            borderRadius:'4px', padding:'12px' }}>
            <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
              textTransform:'uppercase', marginBottom:'10px' }}>TRADE PLAN</div>
            {[
              { l:'ENTRY ZONE',   v:result.entry_zone,   c:'#39ff14' },
              { l:'STOP LOSS',    v:result.stop_loss,    c:'#ff2d55' },
              { l:'TARGET / DOL', v:result.target,       c:'#00e5ff' },
              { l:'INVALIDATION', v:result.invalidation, c:'#4a6274' },
            ].map(({ l, v, c }) => v && (
              <div key={l} style={{ display:'flex', gap:'10px', padding:'7px 0',
                borderBottom:'1px solid #0a1018', alignItems:'flex-start' }}>
                <span style={{ color:'#2a4a5a', fontSize:'0.58rem', letterSpacing:'1px',
                  textTransform:'uppercase', flexShrink:0, width:88,
                  paddingTop:2, fontWeight:600 }}>{l}</span>
                <span style={{ color:c, fontSize:'0.8rem', lineHeight:1.5 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Grade reasons */}
          {result.grade_reasons?.length > 0 && (
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'8px' }}>GRADE RATIONALE</div>
              {result.grade_reasons.map((r,i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'5px',
                  alignItems:'flex-start' }}>
                  <span style={{ color:GC[result.grade]||'#4a6274',
                    fontSize:'0.6rem', flexShrink:0, marginTop:2 }}>◆</span>
                  <span style={{ color:'#c9d6df', fontSize:'0.78rem', lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Key observations */}
          {result.key_observations?.length > 0 && (
            <div style={{ background:'#0d1117', border:'1px solid #1e2a35',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'8px' }}>QT OBSERVATIONS</div>
              {result.key_observations.map((obs,i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px',
                  alignItems:'flex-start' }}>
                  <span style={{ color:'#00e5ff', fontSize:'0.6rem', flexShrink:0,
                    marginTop:2 }}>→</span>
                  <span style={{ color:'#c9d6df', fontSize:'0.78rem', lineHeight:1.5 }}>{obs}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mistakes to avoid */}
          {result.mistakes_to_avoid?.length > 0 && (
            <div style={{ background:'rgba(255,45,85,.04)', border:'1px solid rgba(255,45,85,.15)',
              borderRadius:'4px', padding:'12px' }}>
              <div style={{ color:'#ff2d55', fontSize:'0.55rem', letterSpacing:'2px',
                textTransform:'uppercase', marginBottom:'8px' }}>MISTAKES TO AVOID</div>
              {result.mistakes_to_avoid.map((m,i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'5px',
                  alignItems:'flex-start' }}>
                  <span style={{ color:'#ff2d55', fontSize:'0.6rem',
                    flexShrink:0, marginTop:2 }}>⚠</span>
                  <span style={{ color:'#c9d6df', fontSize:'0.78rem', lineHeight:1.5 }}>{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log button */}
          <a href={`/dashboard/journal?grade=${result.grade}&direction=${result.bias==='BULLISH'?'LONG':'SHORT'}`}
            style={{
              display:'block', textAlign:'center', padding:'11px',
              background:'rgba(57,255,20,.1)', border:'1px solid rgba(57,255,20,.3)',
              borderRadius:'4px', color:'#39ff14', fontFamily:'IBM Plex Mono, monospace',
              fontWeight:700, fontSize:'0.78rem', letterSpacing:'3px',
              textTransform:'uppercase', textDecoration:'none',
            }}>
            ✓ LOG THIS TRADE
          </a>
        </div>
      )}
    </div>
  )
}
