'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

function Skeleton({ h=100 }) {
  return <div className="skeleton" style={{height:h, borderRadius:8}} />
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [trades,   setTrades]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [adding,   setAdding]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({name:'', type:'funded', balance:''})

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: accts }, { data: trds }] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', session.user.id).order('created_at'),
      supabase.from('trades').select('id,account_id,result,pnl_dollar,confluence,grade').eq('user_id', session.user.id),
    ])
    setAccounts(accts || [])
    setTrades(trds || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addAccount = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('accounts').insert({
      user_id: session.user.id,
      name: form.name.trim(),
      type: form.type,
      balance: form.balance ? parseFloat(form.balance) : 50000,
    })
    setForm({name:'', type:'funded', balance:''})
    setAdding(false)
    setSaving(false)
    load()
  }

  const deleteAccount = async (id) => {
    if (!confirm('Delete this account and all its trades?')) return
    const supabase = createClient()
    await supabase.from('trades').delete().eq('account_id', id)
    await supabase.from('accounts').delete().eq('id', id)
    load()
  }

  const getStats = (acctId) => {
    const t = trades.filter(x => x.account_id === acctId)
    const wins = t.filter(x => x.result==='win').length
    const losses = t.filter(x => x.result==='loss').length
    const pnl = t.reduce((s,x) => s+(x.pnl_dollar||0), 0)
    const wr = t.length ? ((wins/t.length)*100).toFixed(1) : '0'
    const bestGrade = ['A++','A+','A','B','C','F'].find(g => t.some(x=>x.grade===g)) || '—'
    return { total:t.length, wins, losses, pnl, wr, bestGrade }
  }

  const inp = {
    width:'100%', background:'var(--bg-1)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', padding:'9px 12px', color:'var(--text-1)',
    fontFamily:'var(--font-mono)', fontSize:'0.82rem', boxSizing:'border-box',
  }

  const typeColor = (type) => ({
    funded:'var(--cyan)', challenge:'var(--gold)',
    personal:'var(--purple)', demo:'var(--text-3)',
  }[type] || 'var(--text-3)')

  return (
    <div style={{maxWidth:680}}>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--text-3)',
            fontFamily:'var(--font-mono)', marginBottom:4}}>PROP FIRMS & PERSONAL</div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800,
            color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1}}>Accounts</h1>
        </div>
        <button onClick={() => setAdding(p=>!p)} className="btn btn-primary"
          style={{fontSize:'0.65rem'}}>
          {adding ? '✕ CANCEL' : '+ ADD ACCOUNT'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{background:'var(--bg-2)', border:'1px solid rgba(0,212,255,0.2)',
          borderRadius:'var(--radius-lg)', padding:'16px', marginBottom:'1rem'}}
          className="slide-in">
          <div style={{fontSize:'0.62rem', letterSpacing:'0.15em', color:'var(--cyan)',
            fontFamily:'var(--font-mono)', fontWeight:700, marginBottom:12}}>
            NEW ACCOUNT
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10,
            marginBottom:12}}>
            <div>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.1em',
                fontFamily:'var(--font-mono)', marginBottom:5}}>ACCOUNT NAME</div>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                placeholder="e.g. Think Capital" style={inp} />
            </div>
            <div>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.1em',
                fontFamily:'var(--font-mono)', marginBottom:5}}>TYPE</div>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                style={{...inp, cursor:'pointer'}}>
                <option value="funded">Funded / Prop</option>
                <option value="challenge">Challenge</option>
                <option value="personal">Personal</option>
                <option value="demo">Demo</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:'0.58rem', color:'var(--text-3)', letterSpacing:'0.1em',
                fontFamily:'var(--font-mono)', marginBottom:5}}>ACCOUNT SIZE ($)</div>
              <input type="number" value={form.balance}
                onChange={e=>setForm(p=>({...p,balance:e.target.value}))}
                placeholder="100000" style={inp} />
            </div>
          </div>
          <button onClick={addAccount} disabled={saving} className="btn btn-success"
            style={{fontSize:'0.65rem'}}>
            {saving ? '⏳ SAVING…' : '✓ SAVE ACCOUNT'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {[1,2,3].map(i => <Skeleton key={i} />)}
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {accounts.map(a => {
            const stats    = getStats(a.id)
            const pnlPct   = a.balance ? ((stats.pnl/a.balance)*100).toFixed(2) : '0'
            const pnlColor = stats.pnl>=0 ? 'var(--green)' : 'var(--red)'
            const ddPct    = a.balance ? (Math.abs(Math.min(0,stats.pnl))/a.balance*100).toFixed(2) : '0'
            const ddColor  = parseFloat(ddPct)>5?'var(--red)':parseFloat(ddPct)>2?'var(--gold)':'var(--green)'
            const tc       = typeColor(a.type)

            return (
              <div key={a.id} style={{
                background:'var(--bg-2)', border:'1px solid var(--border)',
                borderLeft:`3px solid ${tc}`,
                borderRadius:'var(--radius-lg)', padding:'14px',
                transition:'border-color 0.15s',
              }}>
                {/* Account header */}
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', marginBottom:12}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:8,
                      marginBottom:4}}>
                      <span style={{color:'var(--text-1)', fontWeight:700,
                        fontSize:'0.95rem'}}>{a.name}</span>
                      <span className="badge" style={{
                        background:`${tc}15`, color:tc,
                        border:`1px solid ${tc}30`, fontSize:'0.55rem',
                        letterSpacing:'0.15em',
                      }}>{a.type.toUpperCase()}</span>
                    </div>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'0.65rem',
                      color:'var(--text-3)'}}>
                      Account Size: ${(a.balance||0).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => deleteAccount(a.id)}
                    style={{background:'transparent', border:'none', color:'var(--text-4)',
                      cursor:'pointer', fontSize:'0.78rem', padding:'2px 6px',
                      transition:'color 0.15s'}}
                    onMouseEnter={e=>e.target.style.color='var(--red)'}
                    onMouseLeave={e=>e.target.style.color='var(--text-4)'}>✕</button>
                </div>

                {/* Stats grid */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                  gap:7, marginBottom:12}}>
                  {[
                    {l:'Trades',   v:stats.total,    c:'var(--cyan)'},
                    {l:'Win Rate', v:`${stats.wr}%`, c:parseFloat(stats.wr)>=60?'var(--green)':parseFloat(stats.wr)>=45?'var(--gold)':'var(--red)'},
                    {l:'P&L $',    v:`${stats.pnl>=0?'+$':'-$'}${Math.abs(stats.pnl).toFixed(0)}`, c:pnlColor},
                    {l:'P&L %',    v:`${stats.pnl>=0?'+':''}${pnlPct}%`, c:pnlColor},
                  ].map(({l,v,c}) => (
                    <div key={l} style={{background:'var(--bg-1)', borderRadius:'var(--radius)',
                      padding:'8px', textAlign:'center',
                      border:'1px solid var(--border)'}}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:'1rem',
                        fontWeight:700, color:c, lineHeight:1, marginBottom:3}}>{v}</div>
                      <div style={{fontSize:'0.5rem', color:'var(--text-3)',
                        letterSpacing:'0.1em', textTransform:'uppercase',
                        fontFamily:'var(--font-mono)'}}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Balance progress */}
                {a.balance > 0 && (
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between',
                      marginBottom:4}}>
                      <span style={{fontSize:'0.55rem', color:'var(--text-3)',
                        fontFamily:'var(--font-mono)', letterSpacing:'0.1em',
                        textTransform:'uppercase'}}>Account Balance</span>
                      <span style={{fontFamily:'var(--font-mono)', fontSize:'0.65rem',
                        color:'var(--text-2)'}}>
                        ${Math.max(0, a.balance+stats.pnl).toLocaleString()} / ${a.balance.toLocaleString()}
                      </span>
                    </div>
                    <div style={{background:'var(--bg-1)', borderRadius:3, height:5,
                      overflow:'hidden', marginBottom:8}}>
                      <div style={{
                        width:`${Math.max(0,Math.min(100,((a.balance+stats.pnl)/a.balance)*100))}%`,
                        height:'100%', background:pnlColor,
                        borderRadius:3, transition:'width 0.5s',
                      }} />
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between',
                      marginBottom:3}}>
                      <span style={{fontSize:'0.55rem', color:'var(--text-3)',
                        fontFamily:'var(--font-mono)', letterSpacing:'0.1em',
                        textTransform:'uppercase'}}>Drawdown</span>
                      <span style={{fontFamily:'var(--font-mono)', fontSize:'0.65rem',
                        color:ddColor, fontWeight:700}}>{ddPct}%</span>
                    </div>
                    <div style={{background:'var(--bg-1)', borderRadius:3, height:4,
                      overflow:'hidden'}}>
                      <div style={{
                        width:`${Math.min(parseFloat(ddPct)*4, 100)}%`,
                        height:'100%', background:ddColor,
                        borderRadius:3, transition:'width 0.5s',
                      }} />
                    </div>
                    <div style={{display:'flex', justifyContent:'flex-end', marginTop:2}}>
                      <span style={{fontSize:'0.5rem', color:parseFloat(ddPct)>5?'var(--red)':'var(--text-4)',
                        fontFamily:'var(--font-mono)'}}>Max 5% daily risk</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
