'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const STEPS = [
  { id:'c_4h_tpd',     label:'4H TPD Confirmed',        desc:'NQ/ES 4H swing divergence' },
  { id:'c_daily_smt',  label:'Daily SMT on M15',         desc:'Sequential SMT — primary confluence' },
  { id:'c_90m_smt',    label:'90M SMT on M5',            desc:'After Daily SMT only' },
  { id:'c_m5_tpd',     label:'M5 TPD Entry Trigger',     desc:'CISD reversion level' },
  { id:'c_true_opens', label:'Both True Opens Aligned',   desc:'Daily 12AM + NY 7:30AM' },
]

const MISTAKES = [
  'Entered before Q2 complete','No Daily SMT','90M before Daily SMT',
  'No M5 TPD trigger','Wrong True Open side','Stop not on swing high/low',
  'Moved SL to BE early','FOMO entry','Traded before news',
  'Closed early','Overtraded','Sized up',
]

const GRADES = {
  5:{g:'A++',c:'#ffcc44'}, 4:{g:'A+',c:'#00ff88'}, 3:{g:'A',c:'#00d4ff'},
  2:{g:'B',c:'#a855f7'},   1:{g:'C',c:'#ff6b35'},   0:{g:'F',c:'#ff3366'},
}

const MOODS = [{e:'😤',l:'Revenge'},{e:'😟',l:'Anxious'},{e:'😐',l:'Neutral'},{e:'😊',l:'Focused'},{e:'🎯',l:'Zone'}]

const EMPTY = {
  date: new Date().toLocaleDateString('en-GB'),
  instrument:'NQ', direction:'LONG', session:'NY', session_time:'',
  cycle_bias:'', pt_bias:'', entry:'', sl:'', tp:'', exit:'',
  result:'win', pnl:'', pnl_dollar:'', rr:'', risk_pct:'1', risk_dollar:'',
  grade:'A', narrative:'', mistakes:[], mood:3, confluence:0,
  c_4h_tpd:false, c_daily_smt:false, c_90m_smt:false, c_m5_tpd:false, c_true_opens:false,
  screenshots:[],
  ptr_exec_rating:'', ptr_emotion_rating:'', ptr_went_right:'', ptr_went_wrong:'',
  ptr_mistake_detail:'', ptr_ideal_trade:'', ptr_rule_violation:'',
  ptr_take_again:'', ptr_key_lesson:'', ptr_next_session:'',
}

export default function JournalPage() {
  const params = useSearchParams()
  const [form,    setForm]    = useState(() => ({
    ...EMPTY,
    ...(params.get('grade')     && { grade:     params.get('grade') }),
    ...(params.get('direction') && { direction: params.get('direction') }),
  }))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [acctId,  setAcctId]  = useState(null)
  const [previews, setPreviews] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    setAcctId(localStorage.getItem('tp-active-account'))
    const h = (e) => setAcctId(e.detail?.id)
    window.addEventListener('account-changed', h)
    return () => window.removeEventListener('account-changed', h)
  }, [])

  const conf   = STEPS.filter(s => form[s.id]).length
  const grade  = GRADES[conf]

  const set = (k, v) => setForm(p => ({...p, [k]:v}))

  const toggleStep = (id) => {
    const next = !form[id]
    const newConf = STEPS.filter(s => s.id === id ? next : form[s.id]).length
    setForm(p => ({...p, [id]:next, confluence:newConf, grade:GRADES[newConf].g}))
  }

  const toggleMistake = (m) => setForm(p => ({
    ...p, mistakes: p.mistakes.includes(m) ? p.mistakes.filter(x=>x!==m) : [...p.mistakes, m]
  }))

  const calc = (f = form) => {
    const e=parseFloat(f.entry), sl=parseFloat(f.sl), tp=parseFloat(f.tp), ex=parseFloat(f.exit)
    const r$=parseFloat(f.risk_dollar)
    if (!e||!sl||!tp) return f
    const riskPts=Math.abs(e-sl), rewardPts=Math.abs(tp-e)
    const rr=riskPts>0?`1:${(rewardPts/riskPts).toFixed(1)}`:f.rr
    const pnlPts=ex?(f.direction==='LONG'?ex-e:e-ex):null
    const pnl$=pnlPts&&r$&&riskPts?((pnlPts/riskPts)*r$).toFixed(0):f.pnl_dollar
    return {...f, rr, pnl:pnlPts?.toFixed(1)||f.pnl, pnl_dollar:pnl$}
  }

  // Screenshot handling
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        setPreviews(p => [...p, { url: base64, name: file.name, type: file.type }])
        setForm(p => ({...p, screenshots: [...(p.screenshots||[]), base64]}))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeShot = (i) => {
    setPreviews(p => p.filter((_,idx) => idx !== i))
    setForm(p => ({...p, screenshots: (p.screenshots||[]).filter((_,idx) => idx !== i)}))
  }

  const save = async () => {
    if (!form.entry||!form.sl||!form.tp) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }
    const c = calc()
    await supabase.from('trades').insert({
      user_id:session.user.id, account_id:acctId,
      date:c.date, instrument:c.instrument, direction:c.direction,
      session:c.session, session_time:c.session_time, cycle_bias:c.cycle_bias, pt_bias:c.pt_bias,
      entry:parseFloat(c.entry)||null, sl:parseFloat(c.sl)||null,
      tp:parseFloat(c.tp)||null, exit:c.exit?parseFloat(c.exit):null,
      result:c.result,
      pnl:c.pnl?parseFloat(c.pnl):null, pnl_dollar:c.pnl_dollar?parseFloat(c.pnl_dollar):null,
      rr:c.rr||null, grade:c.grade,
      risk_pct:c.risk_pct?parseFloat(c.risk_pct):null,
      risk_dollar:c.risk_dollar?parseFloat(c.risk_dollar):null,
      c_4h_tpd:c.c_4h_tpd, c_daily_smt:c.c_daily_smt,
      c_90m_smt:c.c_90m_smt, c_m5_tpd:c.c_m5_tpd, c_true_opens:c.c_true_opens,
      confluence:conf, narrative:c.narrative, mistakes:c.mistakes, mood:c.mood,
      screenshots:c.screenshots||[],
      ptr_exec_rating:c.ptr_exec_rating?parseInt(c.ptr_exec_rating):null,
      ptr_emotion_rating:c.ptr_emotion_rating?parseInt(c.ptr_emotion_rating):null,
      ptr_went_right:c.ptr_went_right||null, ptr_went_wrong:c.ptr_went_wrong||null,
      ptr_mistake_detail:c.ptr_mistake_detail||null, ptr_ideal_trade:c.ptr_ideal_trade||null,
      ptr_rule_violation:c.ptr_rule_violation||null, ptr_take_again:c.ptr_take_again||null,
      ptr_key_lesson:c.ptr_key_lesson||null, ptr_next_session:c.ptr_next_session||null,
    })
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
    setForm(EMPTY); setPreviews([])
  }

  // Styled helpers
  const F = ({label, children, accent}) => (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:'0.58rem',letterSpacing:'0.18em',textTransform:'uppercase',
        color:accent||'var(--text-3)',fontFamily:'var(--font-mono)',marginBottom:5,fontWeight:600}}>
        {label}
      </div>
      {children}
    </div>
  )

  const inp = {
    width:'100%', background:'var(--bg-1)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', padding:'9px 12px', color:'var(--text-1)',
    fontFamily:'var(--font-mono)', fontSize:'0.82rem', boxSizing:'border-box',
    transition:'border-color 0.15s',
  }

  const Inp = ({id, type='text', placeholder='', step}) => (
    <input type={type} value={form[id]} placeholder={placeholder} step={step}
      onChange={e => set(id, e.target.value)} onBlur={() => setForm(calc)}
      style={inp} />
  )

  const Sel = ({id, opts}) => (
    <select value={form[id]} onChange={e => set(id, e.target.value)}
      style={{...inp, cursor:'pointer'}}>
      {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  const Tex = ({id, rows=3, placeholder, border}) => (
    <textarea value={form[id]} placeholder={placeholder} rows={rows}
      onChange={e => set(id, e.target.value)}
      style={{...inp, resize:'vertical', fontFamily:'inherit', lineHeight:1.7,
        ...(border && {borderLeft:`2px solid ${border}`})}} />
  )

  const Section = ({title, color='var(--cyan)', children}) => (
    <div style={{background:'var(--bg-2)', border:'1px solid var(--border)',
      borderRadius:8, padding:16, marginBottom:12}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:color,
          boxShadow:`0 0 8px ${color}`, flexShrink:0}} />
        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.62rem', letterSpacing:'0.2em',
          textTransform:'uppercase', color, fontWeight:700}}>{title}</div>
      </div>
      {children}
    </div>
  )

  const RatingRow = ({field, opts}) => (
    <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
      {opts.map(([v,l]) => (
        <button key={v} onClick={() => set(field, v)} style={{
          padding:'5px 10px', borderRadius:'var(--radius)', cursor:'pointer',
          fontFamily:'var(--font-mono)', fontSize:'0.65rem', transition:'all 0.15s',
          background: form[field]==v ? 'var(--cyan-dim)' : 'var(--bg-1)',
          border: `1px solid ${form[field]==v ? 'rgba(0,212,255,0.35)' : 'var(--border)'}`,
          color: form[field]==v ? 'var(--cyan)' : 'var(--text-3)',
        }}>{l}</button>
      ))}
    </div>
  )

  return (
    <div style={{maxWidth:820}}>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
            fontFamily:'var(--font-mono)', marginBottom:4}}>QT TRADE ENTRY</div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
            color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1}}>Journal</h1>
        </div>
        {saved && (
          <div style={{display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
            background:'var(--green-dim)', border:'1px solid rgba(0,255,136,0.3)',
            borderRadius:'var(--radius)', color:'var(--green)',
            fontFamily:'var(--font-mono)', fontSize:'0.68rem'}}>
            ✓ TRADE SAVED
          </div>
        )}
      </div>

      {/* ── SECTION 1: Trade Setup ── */}
      <Section title="Trade Setup">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <F label="Date">
            <input type="date"
              value={form.date.split('/').reverse().join('-')}
              onChange={e => {
                const d = new Date(e.target.value)
                set('date', d.toLocaleDateString('en-GB'))
              }} style={{...inp, cursor:'pointer'}} />
          </F>
          <F label="Instrument">
            <Sel id="instrument" opts={[['NQ','NQ'],['ES','ES'],['MNQ','MNQ'],['MES','MES'],['US30','US30']]} />
          </F>
          <F label="Direction">
            <div style={{display:'flex', gap:6}}>
              {['LONG','SHORT'].map(d => (
                <button key={d} onClick={() => set('direction',d)} style={{
                  flex:1, padding:'9px 8px', borderRadius:'var(--radius)',
                  cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'0.72rem',
                  letterSpacing:'0.1em', fontWeight:700, transition:'all 0.15s',
                  background: form.direction===d
                    ? (d==='LONG'?'rgba(0,255,136,0.12)':'rgba(255,51,102,0.12)')
                    : 'var(--bg-1)',
                  border: form.direction===d
                    ? `1px solid ${d==='LONG'?'rgba(0,255,136,0.4)':'rgba(255,51,102,0.4)'}`
                    : '1px solid var(--border)',
                  color: form.direction===d ? (d==='LONG'?'var(--green)':'var(--red)') : 'var(--text-3)',
                }}>{d==='LONG'?'▲ LONG':'▼ SHORT'}</button>
              ))}
            </div>
          </F>
          <F label="Session">
            <Sel id="session" opts={[['NY','NY'],['London','London'],['Asian','Asian'],['Overnight','Overnight']]} />
          </F>
          <F label="Entry Time (EST)"><Inp id="session_time" placeholder="09:35" /></F>
          <F label="Result">
            <Sel id="result" opts={[['win','✅ WIN'],['loss','❌ LOSS'],['breakeven','⚖️ BREAKEVEN']]} />
          </F>
          <F label="Entry Price"><Inp id="entry" type="number" placeholder="21500" /></F>
          <F label="Stop Loss"><Inp id="sl" type="number" placeholder="21450" /></F>
          <F label="Take Profit"><Inp id="tp" type="number" placeholder="21620" /></F>
          <F label="Exit Price"><Inp id="exit" type="number" placeholder="actual exit" /></F>
          <F label="Risk % of Account"><Inp id="risk_pct" type="number" placeholder="1" step="0.1" /></F>
          <F label="Risk $ Amount"><Inp id="risk_dollar" type="number" placeholder="500" /></F>
          <F label="P&L Points (auto)">
            <input value={form.pnl} readOnly={false} onChange={e=>set('pnl',e.target.value)}
              style={{...inp, color:'var(--cyan)'}} placeholder="auto-calc" />
          </F>
          <F label="P&L Dollar (auto)">
            <input value={form.pnl_dollar} onChange={e=>set('pnl_dollar',e.target.value)}
              style={{...inp, color:'var(--cyan)'}} placeholder="auto-calc" />
          </F>
          <F label="R:R Ratio (auto)">
            <input value={form.rr} readOnly style={{...inp, color:'var(--cyan)', cursor:'default'}} placeholder="auto" />
          </F>
          <F label="Grade (auto from checklist)">
            <div style={{padding:'9px 12px', background:'var(--bg-1)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontFamily:'var(--font-mono)', fontSize:'1.4rem', fontWeight:800,
                color:grade.c, textShadow:`0 0 10px ${grade.c}`}}>{grade.g}</span>
              <span style={{color:'var(--text-3)', fontSize:'0.65rem',
                fontFamily:'var(--font-mono)'}}>{conf}/5 confluence</span>
            </div>
          </F>
        </div>

        {/* Bias */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4}}>
          <F label="Cycle Bias">
            <Sel id="cycle_bias" opts={[
              ['','— Select —'],['Q1 Accumulation','Q1 Accumulation'],
              ['Q2 Manipulation','Q2 Manipulation'],['Q3 Distribution','Q3 Distribution'],
              ['Q4 Reversal','Q4 Reversal'],
            ]} />
          </F>
          <F label="Directional Bias">
            <div style={{display:'flex', gap:5}}>
              {[['bull','🐂 BULL'],['bear','🐻 BEAR'],['neutral','⚖️ NEUTRAL']].map(([v,l]) => (
                <button key={v} onClick={() => set('pt_bias',v)} style={{
                  flex:1, padding:'7px 4px', borderRadius:'var(--radius)', cursor:'pointer',
                  fontFamily:'var(--font-mono)', fontSize:'0.62rem', transition:'all 0.15s',
                  background: form.pt_bias===v ? 'var(--cyan-dim)' : 'var(--bg-1)',
                  border: `1px solid ${form.pt_bias===v ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                  color: form.pt_bias===v ? 'var(--cyan)' : 'var(--text-3)',
                }}>{l}</button>
              ))}
            </div>
          </F>
        </div>
      </Section>

      {/* ── SECTION 2: Screenshots ── */}
      <Section title="Trade Screenshots" color="var(--purple)">
        <input ref={fileRef} type="file" accept="image/*" multiple
          onChange={e => handleFiles(e.target.files)} style={{display:'none'}} />

        <div
          onDragOver={e => {e.preventDefault(); setDragOver(true)}}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files)}}
          onClick={() => fileRef.current?.click()}
          style={{
            border:`1px dashed ${dragOver?'var(--purple)':'var(--border)'}`,
            borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'center',
            cursor:'pointer', background: dragOver?'rgba(168,85,247,0.05)':'var(--bg-1)',
            transition:'all 0.2s', marginBottom: previews.length ? 12 : 0,
          }}>
          <div style={{fontSize:'1.5rem', marginBottom:6}}>📸</div>
          <div style={{color:'var(--text-2)', fontSize:'0.8rem', marginBottom:3}}>
            Drop screenshots here or click to upload
          </div>
          <div style={{color:'var(--text-3)', fontSize:'0.65rem', fontFamily:'var(--font-mono)'}}>
            Entry · Exit · HTF Bias · Execution — multiple files supported
          </div>
        </div>

        {previews.length > 0 && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginTop:10}}>
            {previews.map((p, i) => (
              <div key={i} style={{position:'relative', borderRadius:'var(--radius)',
                overflow:'hidden', border:'1px solid var(--border)'}}>
                <img src={p.url} alt={`screenshot ${i+1}`}
                  style={{width:'100%', height:120, objectFit:'cover', display:'block'}} />
                <div style={{position:'absolute', top:4, right:4}}>
                  <button onClick={e => {e.stopPropagation(); removeShot(i)}}
                    style={{background:'rgba(4,5,8,0.85)', border:'1px solid var(--border)',
                      borderRadius:4, color:'var(--red)', cursor:'pointer',
                      width:22, height:22, fontSize:'0.7rem', display:'flex',
                      alignItems:'center', justifyContent:'center'}}>✕</button>
                </div>
                <div style={{position:'absolute', bottom:0, left:0, right:0,
                  background:'linear-gradient(transparent, rgba(4,5,8,0.9))',
                  padding:'6px 6px 4px', fontSize:'0.52rem', color:'var(--text-3)',
                  fontFamily:'var(--font-mono)', letterSpacing:'0.05em'}}>
                  SCREENSHOT {i+1}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── SECTION 3: QT Checklist ── */}
      <Section title="QT Confluence Stack">
        <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:12}}>
          {STEPS.map((step, i) => (
            <div key={step.id} onClick={() => toggleStep(step.id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
              borderRadius:'var(--radius)', cursor:'pointer', userSelect:'none',
              background: form[step.id] ? 'rgba(0,255,136,0.05)' : 'var(--bg-1)',
              border: `1px solid ${form[step.id] ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
              transition:'all 0.15s',
            }}>
              <div style={{width:18, height:18, borderRadius:4, flexShrink:0,
                background: form[step.id] ? 'var(--green)' : 'transparent',
                border:`2px solid ${form[step.id]?'var(--green)':'var(--border)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.15s'}}>
                {form[step.id] && <span style={{color:'#000', fontSize:'0.65rem', fontWeight:900}}>✓</span>}
              </div>
              <span style={{fontFamily:'var(--font-mono)', fontSize:'0.62rem',
                color:'var(--text-3)', minWidth:20, fontWeight:700}}>0{i+1}</span>
              <div style={{flex:1}}>
                <div style={{color:form[step.id]?'var(--text-1)':'var(--text-2)',
                  fontSize:'0.82rem', fontWeight:form[step.id]?600:400}}>{step.label}</div>
                <div style={{color:'var(--text-4)', fontSize:'0.62rem',
                  fontFamily:'var(--font-mono)', marginTop:1}}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg-1)', borderRadius:4, height:5, overflow:'hidden'}}>
          <div style={{width:`${(conf/5)*100}%`, height:'100%',
            background:`linear-gradient(90deg, ${grade.c}, ${grade.c}99)`,
            transition:'width 0.4s ease', borderRadius:4}} />
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
          <span style={{color:'var(--text-3)', fontSize:'0.58rem',
            fontFamily:'var(--font-mono)'}}>{conf}/5 confirmed</span>
          <span style={{color:grade.c, fontWeight:700, fontSize:'0.72rem',
            fontFamily:'var(--font-mono)', textShadow:`0 0 8px ${grade.c}`}}>
            GRADE {grade.g}
          </span>
        </div>
      </Section>

      {/* ── SECTION 4: Notes & Mistakes ── */}
      <Section title="Trade Notes">
        <F label="Trade Narrative">
          <Tex id="narrative" rows={4}
            placeholder="Describe your trade: SMT location, TPD candles, True Open alignment, why you entered, what confirmed your bias…" />
        </F>
        <F label="Mistakes Tagged">
          <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
            {MISTAKES.map(m => {
              const sel = form.mistakes.includes(m)
              return (
                <button key={m} onClick={() => toggleMistake(m)} style={{
                  padding:'5px 9px', borderRadius:'var(--radius)', cursor:'pointer',
                  fontFamily:'var(--font-mono)', fontSize:'0.65rem', transition:'all 0.12s',
                  background: sel ? 'var(--red-dim)' : 'var(--bg-1)',
                  color: sel ? 'var(--red)' : 'var(--text-3)',
                  border: `1px solid ${sel?'rgba(255,51,102,0.3)':'var(--border)'}`,
                }}>{m}</button>
              )
            })}
          </div>
        </F>
        <F label="Emotional State">
          <div style={{display:'flex', gap:6}}>
            {MOODS.map(({e,l}, i) => (
              <button key={i} onClick={() => set('mood', i+1)} style={{
                flex:1, padding:'8px 4px', borderRadius:'var(--radius)',
                cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                background: form.mood===i+1 ? 'var(--cyan-dim)' : 'var(--bg-1)',
                border: `1px solid ${form.mood===i+1?'rgba(0,212,255,0.35)':'var(--border)'}`,
              }}>
                <div style={{fontSize:'1.1rem'}}>{e}</div>
                <div style={{fontSize:'0.48rem', color:form.mood===i+1?'var(--cyan)':'var(--text-4)',
                  marginTop:2, fontFamily:'var(--font-mono)', letterSpacing:'0.05em'}}>{l}</div>
              </button>
            ))}
          </div>
        </F>
      </Section>

      {/* ── SECTION 5: Post-Trade Review ── */}
      <Section title="Post-Trade Review" color="var(--orange)">
        <F label="Execution Rating" accent="var(--orange)">
          <RatingRow field="ptr_exec_rating" opts={[
            [1,'1—Poor'],[2,'2—Below'],[3,'3—Neutral'],[4,'4—Good'],[5,'5—Perfect']
          ]} />
        </F>
        <F label="Emotional Control" accent="var(--orange)">
          <RatingRow field="ptr_emotion_rating" opts={[
            [1,'1—Reactive'],[2,'2—Struggled'],[3,'3—Neutral'],[4,'4—Calm'],[5,'5—Ice']
          ]} />
        </F>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <F label="What Went Right">
            <Tex id="ptr_went_right" rows={3} border="var(--green)"
              placeholder="Entry timing, patience, SL placement…" />
          </F>
          <F label="What Went Wrong">
            <Tex id="ptr_went_wrong" rows={3} border="var(--red)"
              placeholder="Rushed entry, ignored rules…" />
          </F>
        </div>
        <F label="Mistake Analysis">
          <Tex id="ptr_mistake_detail" rows={3}
            placeholder="Why did the mistake happen? What was your mental state? What rule did you break?" />
        </F>
        <F label="Ideal Trade Version">
          <Tex id="ptr_ideal_trade" rows={3}
            placeholder="Perfect version of this trade: entry, management, exit…" />
        </F>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <F label="Rule Violation">
            <Sel id="ptr_rule_violation" opts={[
              ['','None'],['Entered before 4H TPD','Before 4H TPD'],
              ['90M before Daily SMT','90M before Daily SMT'],
              ['No M5 TPD','No M5 TPD'],['Wrong True Open side','Wrong True Open'],
              ['SL not on swing','SL not on swing'],['Moved SL to BE early','Early BE'],
              ['FOMO entry','FOMO entry'],['Traded before news','Before news'],
              ['Overtraded','Overtraded'],['Other','Other'],
            ]} />
          </F>
          <F label="Would Take Again?">
            <Sel id="ptr_take_again" opts={[
              ['','— Select —'],['yes','✅ Yes — Same setup'],
              ['yes-adjusted','⚡ Yes — With adjustments'],
              ['no','❌ No — Below standard'],['no-different','🚫 No — Market was different'],
            ]} />
          </F>
        </div>
        <F label="Key Lesson">
          <Tex id="ptr_key_lesson" rows={3}
            placeholder="The ONE most important lesson. How will you apply it next trade?" />
        </F>
        <F label="Next Session Plan">
          <Tex id="ptr_next_session" rows={3}
            placeholder="What will you do differently? Specific rules to reinforce?" />
        </F>
      </Section>

      {/* Actions */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <button onClick={save} disabled={saving} className="btn btn-success"
          style={{flex:1, justifyContent:'center', fontSize:'0.72rem', padding:'11px'}}>
          {saving ? '⏳ SAVING…' : '✓ SAVE TRADE'}
        </button>
        <button onClick={() => {setForm(EMPTY); setPreviews([])}}
          className="btn btn-ghost" style={{fontSize:'0.72rem', padding:'11px 16px'}}>
          ↺ CLEAR
        </button>
      </div>
    </div>
  )
}
