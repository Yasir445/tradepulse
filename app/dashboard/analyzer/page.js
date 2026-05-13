'use client'
import { useState, useRef, useCallback } from 'react'

const SYSTEM_PROMPT = `You are an expert Quarterly Theory (QT) and ICT framework analyst specializing in NQ/ES futures trading.

QT Framework Reference:
- Q1=Accumulation, Q2=Manipulation, Q3=Distribution, Q4=Reversal
- SSMT = Sequential SMT divergence between NQ and ES at swing high/low
- TPD = Three-candle Pattern Divergence — one asset makes new swing, other fails  
- True Opens: Daily=12AM EST, London=1:30AM, NY=7:30AM
- PSP = Power of Swing Point (large wick, small body)
- Two-stage SSMT = highest probability (Daily + 90M confirmation)
- Best entry window: 9:00-10:30 NY (Q3 of Q3)
- Grade A++: 5/5 confluence. A+: 4/5. A: 3/5. B: 2/5. C: 1/5. F: No setup.

Analyze the chart and return ONLY this exact JSON structure with no markdown or backticks:
{
  "cycle": "e.g. Q3 of Daily cycle",
  "bias": "BULLISH or BEARISH",
  "ssmt_detected": true or false,
  "tpd_detected": true or false,
  "psp_detected": true or false,
  "true_open_position": "description of price vs true opens",
  "confluence_score": 0 to 5,
  "grade": "A++ or A+ or A or B or C or F",
  "entry_zone": "specific entry description",
  "stop_loss": "SL placement and reasoning",
  "target": "target or DOL description",
  "invalidation": "what invalidates this setup",
  "grade_reasons": ["reason 1", "reason 2"],
  "key_observations": ["obs 1", "obs 2", "obs 3"],
  "mistakes_to_avoid": ["mistake 1", "mistake 2"],
  "session": "London or NY or Asian or Unknown",
  "summary": "2-3 sentence plain English analysis summary"
}`

export default function AnalyzerPage() {
  const [image,    setImage]    = useState(null)
  const [mimeType, setMimeType] = useState('image/png')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [drag,     setDrag]     = useState(false)
  const [provider, setProvider] = useState('gemini')
  const [zoomed,   setZoomed]   = useState(false)
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
        body: JSON.stringify({ image, mimeType, system: SYSTEM_PROMPT, provider }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e.message || 'Analysis failed. Check your API keys in Vercel.')
    }
    setLoading(false)
  }

  const GC = { 'A++':'#ffcc44','A+':'#00ff88','A':'#00d4ff','B':'#a855f7','C':'#ff6b35','F':'#ff3366' }

  const ResultChip = ({ label, value, ok }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 10px', background:'var(--bg-1)', borderRadius:'var(--radius)',
      border:'1px solid var(--border)', marginBottom:6 }}>
      <span style={{ color:'var(--text-2)', fontSize:'0.75rem', fontFamily:'var(--font-mono)' }}>{label}</span>
      <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'2px 8px',
        borderRadius:3, fontFamily:'var(--font-mono)',
        background: ok===true?'var(--green-dim)':ok===false?'var(--red-dim)':'var(--cyan-dim)',
        color: ok===true?'var(--green)':ok===false?'var(--red)':'var(--cyan)',
        border: `1px solid ${ok===true?'rgba(0,255,136,0.2)':ok===false?'rgba(255,51,102,0.2)':'rgba(0,212,255,0.2)'}`,
      }}>{value}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
          fontFamily:'var(--font-mono)', marginBottom:4 }}>AI POWERED</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
          color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1, marginBottom:6 }}>
          QT Chart Analyzer
        </h1>
        <p style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>
          Upload any TradingView screenshot for instant QT framework breakdown
        </p>
      </div>

      {/* Provider selector */}
      <div style={{ display:'flex', gap:6, marginBottom:'1rem' }}>
        {[['gemini','⚡ Gemini (Free)'],['anthropic','◎ Claude (Paid)']].map(([v,l]) => (
          <button key={v} onClick={() => setProvider(v)} style={{
            padding:'6px 12px', borderRadius:'var(--radius)', cursor:'pointer',
            fontFamily:'var(--font-mono)', fontSize:'0.62rem', letterSpacing:'0.1em',
            background: provider===v ? 'var(--cyan-dim)' : 'var(--bg-2)',
            border: `1px solid ${provider===v ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
            color: provider===v ? 'var(--cyan)' : 'var(--text-3)',
            transition:'all 0.15s',
          }}>{l}</button>
        ))}
        <div style={{ marginLeft:'auto', fontSize:'0.6rem', color:'var(--text-3)',
          fontFamily:'var(--font-mono)', display:'flex', alignItems:'center' }}>
          {provider === 'gemini' ? 'Requires GEMINI_API_KEY in Vercel' : 'Requires ANTHROPIC_API_KEY in Vercel'}
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onClick={() => !image && fileRef.current?.click()}
        style={{
          border:`1px dashed ${drag?'var(--cyan)':image?'rgba(0,255,136,0.4)':'var(--border)'}`,
          borderRadius:'var(--radius-lg)', padding: image ? '12px' : '2rem',
          textAlign: image ? 'left' : 'center',
          cursor: image ? 'default' : 'pointer',
          background: drag ? 'var(--cyan-dim)' : 'var(--bg-2)',
          marginBottom:'1rem', transition:'all 0.2s', position:'relative',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          onChange={onFile} style={{ display:'none' }} />

        {image ? (
          <div>
            <div style={{ position:'relative' }}>
              <img src={`data:${mimeType};base64,${image}`} alt="Chart"
                style={{ maxHeight:280, maxWidth:'100%', borderRadius:'var(--radius)',
                  objectFit:'contain', border:'1px solid var(--border)',
                  cursor:'pointer', display:'block', margin:'0 auto' }}
                onClick={() => setZoomed(true)} />
              {zoomed && (
                <div onClick={() => setZoomed(false)} style={{
                  position:'fixed', inset:0, background:'rgba(4,5,8,0.95)',
                  zIndex:200, display:'flex', alignItems:'center',
                  justifyContent:'center', padding:'1rem', cursor:'pointer',
                }}>
                  <img src={`data:${mimeType};base64,${image}`}
                    style={{ maxHeight:'90vh', maxWidth:'95vw',
                      borderRadius:'var(--radius)', border:'1px solid var(--border)' }} />
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8, justifyContent:'center' }}>
              <button onClick={() => fileRef.current?.click()}
                className="btn btn-ghost" style={{ fontSize:'0.62rem' }}>
                ↑ REPLACE
              </button>
              <button onClick={() => { setImage(null); setResult(null) }}
                className="btn btn-ghost" style={{ fontSize:'0.62rem', color:'var(--red)' }}>
                ✕ REMOVE
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.6rem' }}>📊</div>
            <div style={{ color:'var(--text-2)', fontSize:'0.85rem', marginBottom:4 }}>
              Drop your TradingView screenshot here
            </div>
            <div style={{ color:'var(--text-3)', fontSize:'0.65rem',
              fontFamily:'var(--font-mono)' }}>
              PNG · JPG · WEBP · Click or drag to upload
            </div>
          </>
        )}
      </div>

      {image && (
        <button onClick={analyze} disabled={loading} style={{
          width:'100%', padding:'11px',
          background: loading ? 'var(--bg-2)' : 'var(--cyan-dim)',
          border:`1px solid ${loading?'var(--border)':'rgba(0,212,255,0.4)'}`,
          borderRadius:'var(--radius-lg)',
          color: loading ? 'var(--text-3)' : 'var(--cyan)',
          fontFamily:'var(--font-mono)', fontSize:'0.78rem', letterSpacing:'0.15em',
          textTransform:'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom:'1rem', transition:'all 0.2s',
          boxShadow: loading ? 'none' : '0 0 20px var(--cyan-glow)',
        }}>
          {loading ? '⚡ ANALYZING WITH AI…' : '⚡ ANALYZE QT FRAMEWORK →'}
        </button>
      )}

      {error && (
        <div style={{ background:'var(--red-dim)', border:'1px solid rgba(255,51,102,0.2)',
          borderRadius:'var(--radius)', padding:'10px 14px', color:'var(--red)',
          fontSize:'0.78rem', fontFamily:'var(--font-mono)', marginBottom:'1rem' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* Grade + Bias hero */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'var(--bg-2)', border:`1px solid ${GC[result.grade]||'var(--border)'}33`,
              borderRadius:'var(--radius-lg)', padding:'1.25rem', textAlign:'center',
              position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, ${GC[result.grade]||'transparent'}, transparent)` }} />
              <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', marginBottom:10 }}>SETUP GRADE</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'3rem', fontWeight:800,
                color:GC[result.grade]||'var(--text-1)', lineHeight:1,
                textShadow:`0 0 20px ${GC[result.grade]||'transparent'}`,
                marginBottom:8 }}>{result.grade}</div>
              {result.grade_reasons?.map((r,i) => (
                <div key={i} style={{ color:'var(--text-3)', fontSize:'0.65rem',
                  margin:'3px 0', textAlign:'left' }}>• {r}</div>
              ))}
            </div>

            <div style={{ background:'var(--bg-2)',
              border:`1px solid ${result.bias==='BULLISH'?'rgba(0,255,136,0.2)':'rgba(255,51,102,0.2)'}`,
              borderRadius:'var(--radius-lg)', padding:'1.25rem', textAlign:'center',
              position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, ${result.bias==='BULLISH'?'var(--green)':'var(--red)'}, transparent)` }} />
              <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', marginBottom:10 }}>BIAS</div>
              <div style={{ fontSize:'2.5rem', marginBottom:6 }}>
                {result.bias==='BULLISH'?'▲':'▼'}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:'0.9rem',
                color:result.bias==='BULLISH'?'var(--green)':'var(--red)',
                marginBottom:4 }}>{result.bias}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-3)',
                fontFamily:'var(--font-mono)' }}>{result.session}</div>
              <div style={{ marginTop:10, display:'flex', justifyContent:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem',
                  color:'var(--text-2)' }}>
                  Confluence: {result.confluence_score}/5
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
              <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', marginBottom:8 }}>AI SUMMARY</div>
              <div style={{ color:'var(--text-1)', fontSize:'0.82rem', lineHeight:1.7 }}>
                {result.summary}
              </div>
            </div>
          )}

          {/* Confluence checks */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
              fontFamily:'var(--font-mono)', marginBottom:10 }}>CONFLUENCE STACK</div>
            <ResultChip label="SSMT Detected"    value={result.ssmt_detected?'✓ YES':'✗ NO'} ok={result.ssmt_detected} />
            <ResultChip label="TPD Detected"     value={result.tpd_detected?'✓ YES':'✗ NO'} ok={result.tpd_detected} />
            <ResultChip label="PSP Detected"     value={result.psp_detected?'✓ YES':'✗ NO'} ok={result.psp_detected} />
            <ResultChip label="True Open Pos."   value={result.true_open_position} />
            <ResultChip label="Cycle Position"   value={result.cycle} />
          </div>

          {/* Trade plan */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
              fontFamily:'var(--font-mono)', marginBottom:10 }}>TRADE PLAN</div>
            {[
              { l:'ENTRY ZONE',   v:result.entry_zone,   c:'var(--green)' },
              { l:'STOP LOSS',    v:result.stop_loss,    c:'var(--red)' },
              { l:'TARGET / DOL', v:result.target,       c:'var(--cyan)' },
              { l:'INVALIDATION', v:result.invalidation, c:'var(--text-3)' },
            ].filter(x=>x.v).map(({l,v,c}) => (
              <div key={l} style={{ display:'flex', gap:'1rem', padding:'7px 0',
                borderBottom:'1px solid var(--bg-1)', alignItems:'flex-start' }}>
                <span style={{ color:'var(--text-4)', fontSize:'0.58rem',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  flexShrink:0, width:80, fontFamily:'var(--font-mono)',
                  paddingTop:1, fontWeight:600 }}>{l}</span>
                <span style={{ color:c, fontSize:'0.8rem', lineHeight:1.5 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Observations */}
          {result.key_observations?.length > 0 && (
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
              <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
                fontFamily:'var(--font-mono)', marginBottom:8 }}>QT OBSERVATIONS</div>
              {result.key_observations.map((o,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ color:'var(--cyan)', fontSize:'0.6rem', flexShrink:0, marginTop:2 }}>◆</span>
                  <span style={{ color:'var(--text-1)', fontSize:'0.8rem', lineHeight:1.5 }}>{o}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mistakes to avoid */}
          {result.mistakes_to_avoid?.length > 0 && (
            <div style={{ background:'var(--red-dim)', border:'1px solid rgba(255,51,102,0.15)',
              borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
              <div style={{ fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--red)',
                fontFamily:'var(--font-mono)', marginBottom:8 }}>MISTAKES TO AVOID</div>
              {result.mistakes_to_avoid.map((m,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:5 }}>
                  <span style={{ color:'var(--red)', fontSize:'0.6rem', flexShrink:0, marginTop:2 }}>⚠</span>
                  <span style={{ color:'var(--text-1)', fontSize:'0.8rem', lineHeight:1.5 }}>{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log button */}
          <a href={`/dashboard/journal?grade=${result.grade}&direction=${result.bias==='BULLISH'?'LONG':'SHORT'}`}
            className="btn btn-success" style={{ justifyContent:'center', fontSize:'0.72rem',
              padding:'11px', display:'flex', letterSpacing:'0.15em' }}>
            ✦ LOG THIS TRADE
          </a>
        </div>
      )}
    </div>
  )
}
