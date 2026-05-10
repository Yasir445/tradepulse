'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CHECKLIST_STEPS = [
  { id:'c_4h_tpd',    label:'4H TPD Confirmed' },
  { id:'c_daily_smt', label:'Daily SMT on M15' },
  { id:'c_90m_smt',   label:'90M SMT on M5' },
  { id:'c_m5_tpd',    label:'M5 TPD Entry Trigger' },
  { id:'c_true_opens',label:'Both True Opens Aligned' },
]

const MISTAKES = [
  'Entered before Q2 complete', '90M SMT before Daily SMT', 'No M5 TPD trigger',
  'Price wrong side of True Opens', 'Stop not on swing high/low',
  'Moved SL to BE before retracement', 'FOMO — missing confluence', 'No Daily SMT',
  'Traded before news', 'Closed early', 'Overtraded / revenge', 'Sized up',
]

const GRADES = {
  5:{ g:'A++', c:'#ffcc00' }, 4:{ g:'A+', c:'#39ff14' }, 3:{ g:'A', c:'#00e5ff' },
  2:{ g:'B',  c:'#c084ff' }, 1:{ g:'C',  c:'#ff6b35' }, 0:{ g:'F', c:'#ff2d55' },
}

const MOODS = ['😤','😟','😐','😊','🎯']

const empty = {
  date: new Date().toLocaleDateString('en-GB'),
  instrument:'NQ', direction:'LONG', session:'NY',
  session_time:'', cycle_bias:'', pt_bias:'',
  entry:'', sl:'', tp:'', exit:'',
  result:'win', pnl:'', pnl_dollar:'', rr:'', risk_pct:'1', risk_dollar:'',
  grade:'A', narrative:'', mistakes:[], mood:3,
  c_4h_tpd:false, c_daily_smt:false, c_90m_smt:false, c_m5_tpd:false, c_true_opens:false,
  // Post-trade review
  ptr_exec_rating:'', ptr_emotion_rating:'',
  ptr_went_right:'', ptr_went_wrong:'', ptr_mistake_detail:'',
  ptr_ideal_trade:'', ptr_rule_violation:'', ptr_take_again:'',
  ptr_key_lesson:'', ptr_next_session:'',
}

const s = (color) => ({ // Input style helper
  width:'100%', background:'#080b0f', border:`1px solid #1e2a35`,
  borderRadius:'3px', padding:'8px 10px', color:'#eaf4fb',
  fontFamily:'IBM Plex Mono, monospace', fontSize:'0.82rem', outline:'none',
  boxSizing:'border-box', transition:'border-color .15s',
})

export default function JournalPage() {
  const params = useSearchParams()
  const [form,   setForm]   = useState(() => ({
    ...empty,
    ...(params.get('grade')     && { grade:     params.get('grade') }),
    ...(params.get('direction') && { direction: params.get('direction') }),
  }))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [account, setAccount] = useState(null)

  useEffect(() => {
    const getAcct = () => {
      const saved = localStorage.getItem('tp-active-account')
      return saved
    }
    setAccount(getAcct())

    const handleChange = (e) => setAccount(e.detail?.id)
    window.addEventListener('account-changed', handleChange)
    return () => window.removeEventListener('account-changed', handleChange)
  }, [])

  // Auto-calc confluence
  const confluence = CHECKLIST_STEPS.filter(c => form[c.id]).length
  const gradeInfo  = GRADES[confluence] || GRADES[0]

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleCheck = (id) => {
    const newVal = !form[id]
    const newConf = CHECKLIST_STEPS.filter(c => c.id === id ? newVal : form[c.id]).length
    setForm(p => ({ ...p, [id]: newVal, confluence: newConf, grade: GRADES[newConf].g }))
  }

  const toggleMistake = (m) => setForm(p => ({
    ...p, mistakes: p.mistakes.includes(m)
      ? p.mistakes.filter(x => x !== m)
      : [...p.mistakes, m],
  }))

  const autoCalc = () => {
    const entry = parseFloat(form.entry), sl = parseFloat(form.sl), tp = parseFloat(form.tp)
    const exit  = parseFloat(form.exit), risk$ = parseFloat(form.risk_dollar)
    if (!entry || !sl || !tp) return
    const riskPts   = Math.abs(entry - sl)
    const rewardPts = Math.abs(tp - entry)
    const rrRatio   = riskPts > 0 ? (rewardPts / riskPts).toFixed(1) : ''
    const rr        = rrRatio ? `1:${rrRatio}` : ''
    const pnlPts    = exit ? (form.direction === 'LONG' ? exit - entry : entry - exit) : null
    const pnl$      = (pnlPts && risk$ && riskPts) ? ((pnlPts / riskPts) * risk$).toFixed(0) : ''
    setForm(p => ({ ...p, rr, pnl: pnlPts?.toFixed(1) || p.pnl, pnl_dollar: pnl$ || p.pnl_dollar }))
  }

  const save = async () => {
    if (!form.entry || !form.sl || !form.tp) return alert('Entry, SL and TP are required.')
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('trades').insert({
      user_id:      session.user.id,
      account_id:   account,
      date:         form.date,
      instrument:   form.instrument,
      direction:    form.direction,
      session:      form.session,
      session_time: form.session_time,
      cycle_bias:   form.cycle_bias,
      pt_bias:      form.pt_bias,
      entry:        parseFloat(form.entry),
      sl:           parseFloat(form.sl),
      tp:           parseFloat(form.tp),
      exit:         form.exit ? parseFloat(form.exit) : null,
      result:       form.result,
      pnl:          form.pnl ? parseFloat(form.pnl) : null,
      pnl_dollar:   form.pnl_dollar ? parseFloat(form.pnl_dollar) : null,
      rr:           form.rr || null,
      grade:        form.grade,
      risk_pct:     form.risk_pct ? parseFloat(form.risk_pct) : null,
      risk_dollar:  form.risk_dollar ? parseFloat(form.risk_dollar) : null,
      c_4h_tpd:     form.c_4h_tpd,
      c_daily_smt:  form.c_daily_smt,
      c_90m_smt:    form.c_90m_smt,
      c_m5_tpd:     form.c_m5_tpd,
      c_true_opens: form.c_true_opens,
      confluence:   confluence,
      narrative:    form.narrative,
      mistakes:     form.mistakes,
      mood:         form.mood,
      ptr_exec_rating:    form.ptr_exec_rating ? parseInt(form.ptr_exec_rating) : null,
      ptr_emotion_rating: form.ptr_emotion_rating ? parseInt(form.ptr_emotion_rating) : null,
      ptr_went_right:     form.ptr_went_right || null,
      ptr_went_wrong:     form.ptr_went_wrong || null,
      ptr_mistake_detail: form.ptr_mistake_detail || null,
      ptr_ideal_trade:    form.ptr_ideal_trade || null,
      ptr_rule_violation: form.ptr_rule_violation || null,
      ptr_take_again:     form.ptr_take_again || null,
      ptr_key_lesson:     form.ptr_key_lesson || null,
      ptr_next_session:   form.ptr_next_session || null,
    })

    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
    setForm(empty)
  }

  const Label = ({ children, color='#4a6274' }) => (
    <div style={{ fontSize:'0.62rem', letterSpacing:'2px', textTransform:'uppercase',
      color, marginBottom:'5px', fontWeight:600 }}>{children}</div>
  )

  const FG = ({ label, children, accent }) => (
    <div style={{ marginBottom:'10px' }}>
      <Label color={accent}>{label}</Label>
      {children}
    </div>
  )

  const Inp = ({ id, type='text', placeholder='', min, step }) => (
    <input type={type} value={form[id]} placeholder={placeholder}
      min={min} step={step}
      onChange={e => set(id, e.target.value)}
      onBlur={autoCalc}
      style={s()} />
  )

  const Sel = ({ id, opts }) => (
    <select value={form[id]} onChange={e => set(id, e.target.value)}
      style={{ ...s(), cursor:'pointer' }}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  const Tex = ({ id, placeholder, rows=3, borderColor }) => (
    <textarea value={form[id]} placeholder={placeholder} rows={rows}
      onChange={e => set(id, e.target.value)}
      style={{ ...s(), resize:'vertical', fontFamily:'inherit', lineHeight:'1.7',
        ...(borderColor && { borderLeft:`2px solid ${borderColor}` }) }} />
  )

  const PtrRating = ({ field, opts }) => (
    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => set(field, v)} style={{
          padding:'5px 10px', background: form[field]==v ? 'rgba(0,229,255,.12)' : '#0d1117',
          border: form[field]==v ? '1px solid var(--accent,#00e5ff)' : '1px solid #1e2a35',
          borderRadius:'3px', color: form[field]==v ? '#00e5ff' : '#4a6274',
          fontFamily:'inherit', fontSize:'0.68rem', cursor:'pointer', transition:'all .15s',
        }}>{l}</button>
      ))}
    </div>
  )

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:'1.25rem' }}>
        <div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
            textTransform:'uppercase', marginBottom:'3px' }}>QT Trade Entry</div>
          <div style={{ color:'#eaf4fb', fontSize:'1.4rem', fontWeight:900,
            letterSpacing:'2px' }}>JOURNAL</div>
        </div>
        {saved && <div style={{ color:'#39ff14', fontSize:'0.72rem', letterSpacing:'2px' }}>
          ✓ TRADE SAVED
        </div>}
      </div>

      {/* ── SECTION 1: Trade Setup ── */}
      <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
        padding:'16px', marginBottom:'12px' }}>
        <div style={{ color:'#00e5ff', fontSize:'0.62rem', letterSpacing:'3px',
          textTransform:'uppercase', marginBottom:'14px', display:'flex',
          alignItems:'center', gap:'8px', fontWeight:700 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#00e5ff',
            boxShadow:'0 0 8px #00e5ff' }} />
          TRADE SETUP
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <FG label="Date">
            <input type="date" value={form.date.split('/').reverse().join('-')}
              onChange={e => {
                const d = new Date(e.target.value)
                set('date', d.toLocaleDateString('en-GB'))
              }}
              style={{ ...s(), cursor:'pointer' }} />
          </FG>
          <FG label="Instrument">
            <Sel id="instrument" opts={[['NQ','NQ'],['ES','ES'],['MNQ','MNQ'],['MES','MES'],['US30','US30']]} />
          </FG>
          <FG label="Direction">
            <div style={{ display:'flex', gap:'6px' }}>
              {['LONG','SHORT'].map(d => (
                <button key={d} onClick={() => set('direction', d)} style={{
                  flex:1, padding:'8px', borderRadius:'3px', fontFamily:'inherit',
                  fontSize:'0.72rem', cursor:'pointer', letterSpacing:'2px',
                  fontWeight: form.direction===d ? 700 : 400,
                  background: form.direction===d
                    ? (d==='LONG'?'rgba(57,255,20,.15)':'rgba(255,45,85,.15)')
                    : '#080b0f',
                  border: form.direction===d
                    ? `1px solid ${d==='LONG'?'#39ff14':'#ff2d55'}`
                    : '1px solid #1e2a35',
                  color: form.direction===d ? (d==='LONG'?'#39ff14':'#ff2d55') : '#4a6274',
                }}>{d==='LONG'?'▲ LONG':'▼ SHORT'}</button>
              ))}
            </div>
          </FG>
          <FG label="Session">
            <Sel id="session" opts={[['NY','NY'],['London','London'],['Asian','Asian'],['Overnight','Overnight']]} />
          </FG>
          <FG label="Entry Time (EST)"><Inp id="session_time" placeholder="e.g. 09:35" /></FG>
          <FG label="Result">
            <Sel id="result" opts={[['win','✅ WIN'],['loss','❌ LOSS'],['breakeven','⚖️ BREAKEVEN']]} />
          </FG>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'4px' }}>
          <FG label="Entry Price"><Inp id="entry" type="number" placeholder="e.g. 21500" /></FG>
          <FG label="Stop Loss"><Inp id="sl" type="number" placeholder="e.g. 21450" /></FG>
          <FG label="Take Profit"><Inp id="tp" type="number" placeholder="e.g. 21620" /></FG>
          <FG label="Exit Price"><Inp id="exit" type="number" placeholder="actual exit" /></FG>
          <FG label="Risk % of Account"><Inp id="risk_pct" type="number" placeholder="e.g. 1" step="0.1" /></FG>
          <FG label="Risk $ Amount"><Inp id="risk_dollar" type="number" placeholder="e.g. 500" /></FG>
          <FG label="P&L (pts, auto-calc)"><Inp id="pnl" type="number" placeholder="auto" /></FG>
          <FG label="P&L ($, auto-calc)"><Inp id="pnl_dollar" type="number" placeholder="auto" /></FG>
          <FG label="R:R (auto-calc)">
            <input value={form.rr} readOnly placeholder="auto"
              style={{ ...s(), color:'#00e5ff', cursor:'default' }} />
          </FG>
          <FG label="Grade (auto from checklist)">
            <div style={{
              padding:'8px 10px', background:'#080b0f', border:'1px solid #1e2a35',
              borderRadius:'3px', display:'flex', alignItems:'center', gap:'8px',
            }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem',
                color:gradeInfo.c, textShadow:`0 0 8px ${gradeInfo.c}` }}>{gradeInfo.g}</span>
              <span style={{ color:'#4a6274', fontSize:'0.65rem' }}>{confluence}/5 confluence</span>
            </div>
          </FG>
        </div>

        {/* Bias */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'4px' }}>
          <FG label="Cycle Bias">
            <Sel id="cycle_bias" opts={[['','— Select —'],['Q1 Acc','Q1 Accumulation'],['Q2 Manip','Q2 Manipulation'],['Q3 Dist','Q3 Distribution'],['Q4 Rev','Q4 Reversal']]} />
          </FG>
          <FG label="Price Action Bias">
            <div style={{ display:'flex', gap:'6px' }}>
              {[['bull','🐂 BULL'],['bear','🐻 BEAR'],['neutral','⚖️ NEUTRAL']].map(([v,l]) => (
                <button key={v} onClick={() => set('pt_bias', v)} style={{
                  flex:1, padding:'6px 4px', borderRadius:'3px', fontFamily:'inherit',
                  fontSize:'0.6rem', cursor:'pointer', letterSpacing:'1px',
                  background: form.pt_bias===v ? 'rgba(0,229,255,.08)' : '#080b0f',
                  border: form.pt_bias===v ? '1px solid rgba(0,229,255,.3)' : '1px solid #1e2a35',
                  color: form.pt_bias===v ? '#00e5ff' : '#4a6274',
                }}>{l}</button>
              ))}
            </div>
          </FG>
        </div>
      </div>

      {/* ── SECTION 2: QT Checklist ── */}
      <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
        padding:'16px', marginBottom:'12px' }}>
        <div style={{ color:'#00e5ff', fontSize:'0.62rem', letterSpacing:'3px',
          textTransform:'uppercase', marginBottom:'14px', display:'flex',
          alignItems:'center', gap:'8px', fontWeight:700 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#00e5ff',
            boxShadow:'0 0 8px #00e5ff' }} />
          QT CONFLUENCE STACK
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'12px' }}>
          {CHECKLIST_STEPS.map((step, i) => (
            <div key={step.id} onClick={() => toggleCheck(step.id)} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'9px 12px', borderRadius:'3px', cursor:'pointer',
              background: form[step.id] ? 'rgba(57,255,20,.06)' : '#080b0f',
              border: form[step.id] ? '1px solid rgba(57,255,20,.25)' : '1px solid #1e2a35',
              transition:'all .15s', userSelect:'none',
            }}>
              <div style={{
                width:18, height:18, borderRadius:'3px', flexShrink:0,
                background: form[step.id] ? '#39ff14' : 'transparent',
                border:`2px solid ${form[step.id] ? '#39ff14' : '#1e2a35'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .15s',
              }}>
                {form[step.id] && <span style={{ color:'#000', fontSize:'0.7rem', fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ color:'#4a6274', fontSize:'0.62rem', fontFamily:'monospace',
                fontWeight:700, minWidth:20 }}>0{i+1}</span>
              <span style={{ color:form[step.id]?'#eaf4fb':'#4a6274', fontSize:'0.8rem',
                fontWeight:form[step.id]?600:400 }}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ background:'#1e2a35', borderRadius:'3px', height:5, overflow:'hidden' }}>
          <div style={{ width:`${(confluence/5)*100}%`, height:'100%',
            background:`linear-gradient(90deg,${gradeInfo.c},${gradeInfo.c}88)`,
            transition:'width .4s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
          <span style={{ color:'#4a6274', fontSize:'0.58rem' }}>{confluence}/5 steps confirmed</span>
          <span style={{ color:gradeInfo.c, fontWeight:700, fontSize:'0.7rem' }}>GRADE {gradeInfo.g}</span>
        </div>
      </div>

      {/* ── SECTION 3: Notes & Mistakes ── */}
      <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
        padding:'16px', marginBottom:'12px' }}>
        <div style={{ color:'#00e5ff', fontSize:'0.62rem', letterSpacing:'3px',
          textTransform:'uppercase', marginBottom:'14px', display:'flex',
          alignItems:'center', gap:'8px', fontWeight:700 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#00e5ff',
            boxShadow:'0 0 8px #00e5ff' }} />
          TRADE NOTES
        </div>

        <FG label="Trade Narrative">
          <Tex id="narrative" placeholder="Describe your trade: what did you see, why did you take it, what confirmed your bias? SMT location, TPD candles, True Open alignment..." rows={4} />
        </FG>

        <FG label="Mistakes Tagged">
          <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
            {MISTAKES.map(m => {
              const sel = form.mistakes.includes(m)
              return (
                <button key={m} onClick={() => toggleMistake(m)} style={{
                  padding:'6px 10px', borderRadius:'3px', fontSize:'0.7rem', cursor:'pointer',
                  fontFamily:'inherit', transition:'all .12s',
                  background: sel ? 'rgba(255,45,85,.08)' : '#080b0f',
                  color: sel ? '#ff2d55' : '#4a6274',
                  border: sel ? '1px solid rgba(255,45,85,.3)' : '1px solid #1e2a35',
                }}>{m}</button>
              )
            })}
          </div>
        </FG>

        <FG label="Emotional State">
          <div style={{ display:'flex', gap:'6px' }}>
            {MOODS.map((e, i) => (
              <button key={i} onClick={() => set('mood', i+1)} style={{
                flex:1, padding:'8px 4px', borderRadius:'3px', cursor:'pointer',
                textAlign:'center', fontSize:'1.1rem', background:'#080b0f',
                border: form.mood===i+1 ? '1px solid rgba(0,229,255,.4)' : '1px solid #1e2a35',
                transition:'all .15s',
              }}>
                <div>{e}</div>
                <div style={{ fontSize:'0.48rem', color:form.mood===i+1?'#00e5ff':'#1e3a4a',
                  marginTop:'3px', letterSpacing:'1px', fontFamily:'monospace' }}>
                  {['Revenge','Anxious','Neutral','Focused','Zone'][i]}
                </div>
              </button>
            ))}
          </div>
        </FG>
      </div>

      {/* ── SECTION 4: Post-Trade Review ── */}
      <div style={{ background:'#0d1117', border:'1px solid #1e2a35', borderRadius:'4px',
        borderLeft:'3px solid #ff6b35', padding:'16px', marginBottom:'12px' }}>
        <div style={{ color:'#ff6b35', fontSize:'0.62rem', letterSpacing:'3px',
          textTransform:'uppercase', marginBottom:'14px', display:'flex',
          alignItems:'center', gap:'8px', fontWeight:700 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35',
            boxShadow:'0 0 8px #ff6b35' }} />
          POST-TRADE REVIEW
        </div>

        <FG label="Execution Rating" accent="#ff6b35">
          <PtrRating field="ptr_exec_rating" opts={[
            [1,'1 — Poor'],[2,'2 — Below Avg'],[3,'3 — Neutral'],[4,'4 — Good'],[5,'5 — Perfect'],
          ]} />
        </FG>

        <FG label="Emotional Control" accent="#ff6b35">
          <PtrRating field="ptr_emotion_rating" opts={[
            [1,'1 — Reactive'],[2,'2 — Struggled'],[3,'3 — Neutral'],[4,'4 — Calm'],[5,'5 — Ice-cold'],
          ]} />
        </FG>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <FG label="What Went RIGHT">
            <Tex id="ptr_went_right" placeholder="Entry timing, patience, SL placement..." rows={3} borderColor="#39ff14" />
          </FG>
          <FG label="What Went WRONG">
            <Tex id="ptr_went_wrong" placeholder="Rushed entry, wrong SL, ignored rules..." rows={3} borderColor="#ff2d55" />
          </FG>
        </div>

        <FG label="Detailed Mistake Analysis">
          <Tex id="ptr_mistake_detail" rows={4}
            placeholder="Break down every mistake: Why did it happen? What was your mental state? What rule did you break? What was the cost?" />
        </FG>

        <FG label="Ideal Trade (what should have happened)">
          <Tex id="ptr_ideal_trade" rows={3}
            placeholder="Describe the perfect version of this trade: entry, SL, management, exit..." />
        </FG>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <FG label="Rule Violation">
            <Sel id="ptr_rule_violation" opts={[
              ['','None'],
              ['Entered before 4H TPD','Entered before 4H TPD'],
              ['90M before Daily SMT','90M before Daily SMT'],
              ['No M5 TPD','No M5 TPD'],
              ['Wrong True Open side','Wrong True Open side'],
              ['SL not on swing','SL not on swing'],
              ['Moved SL to BE early','Moved SL to BE early'],
              ['FOMO entry','FOMO entry'],
              ['Traded before news','Traded before news'],
              ['Closed early','Closed early'],
              ['Overtraded','Overtraded'],
              ['Other','Other (see notes)'],
            ]} />
          </FG>
          <FG label="Would You Take Again?">
            <Sel id="ptr_take_again" opts={[
              ['','-- Select --'],
              ['yes','✅ Yes — Same setup'],
              ['yes-adjusted','⚡ Yes — With adjustments'],
              ['no','❌ No — Below standard'],
              ['no-different','🚫 No — Market different'],
            ]} />
          </FG>
        </div>

        <FG label="Key Lesson (detailed)">
          <Tex id="ptr_key_lesson" rows={3}
            placeholder="What is the ONE most important lesson? How will you apply it specifically next trade?" />
        </FG>

        <FG label="Next Session Plan">
          <Tex id="ptr_next_session" rows={3}
            placeholder="What will you do differently? Specific setups to watch, rules to reinforce, behaviours to avoid?" />
        </FG>
      </div>

      {/* Save */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
        <button onClick={save} disabled={saving} style={{
          padding:'11px 24px', background:saving?'rgba(57,255,20,.05)':'rgba(57,255,20,.12)',
          border:'1px solid rgba(57,255,20,.4)', borderRadius:'3px',
          color:saving?'#1e3a4a':'#39ff14', fontFamily:'inherit', fontSize:'0.78rem',
          letterSpacing:'2px', cursor:saving?'not-allowed':'pointer', transition:'all .15s',
        }}>{saving ? 'SAVING…' : '✓ SAVE TRADE'}</button>
        <button onClick={() => setForm(empty)} style={{
          padding:'11px 18px', background:'rgba(0,229,255,.08)', border:'1px solid rgba(0,229,255,.2)',
          borderRadius:'3px', color:'#00e5ff', fontFamily:'inherit', fontSize:'0.78rem',
          letterSpacing:'2px', cursor:'pointer',
        }}>↺ CLEAR</button>
      </div>
    </div>
  )
}
