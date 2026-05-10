'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [trades,   setTrades]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [adding,   setAdding]   = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newType,  setNewType]  = useState('funded')
  const [newBal,   setNewBal]   = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: accts } = await supabase.from('accounts').select('*')
      .eq('user_id', session.user.id).order('created_at')
    const { data: trds } = await supabase.from('trades').select('*')
      .eq('user_id', session.user.id)
    setAccounts(accts || [])
    setTrades(trds || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addAccount = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('accounts').insert({
      user_id: session.user.id,
      name: newName, type: newType,
      balance: newBal ? parseFloat(newBal) : 50000,
    })
    setNewName(''); setNewBal(''); setAdding(false)
    load()
  }

  const deleteAccount = async (id) => {
    if (!confirm('Delete this account and all its trades?')) return
    const supabase = createClient()
    await supabase.from('trades').delete().eq('account_id', id)
    await supabase.from('accounts').delete().eq('id', id)
    load()
  }

  const getAccountStats = (acctId) => {
    const t = trades.filter(x => x.account_id === acctId)
    const wins = t.filter(x => x.result === 'win').length
    const pnl  = t.reduce((s,x) => s+(x.pnl_dollar||0), 0)
    const wr   = t.length ? ((wins/t.length)*100).toFixed(1) : '0'
    return { total: t.length, wins, pnl, wr }
  }

  const inp = {
    width:'100%', background:'#080b0f', border:'1px solid #1e2a35',
    borderRadius:'3px', padding:'8px 10px', color:'#eaf4fb',
    fontFamily:'IBM Plex Mono, monospace', fontSize:'0.82rem',
    outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'1.25rem' }}>
        <div>
          <div style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'3px',
            textTransform:'uppercase', marginBottom:'3px' }}>Prop Firms & Personal</div>
          <div style={{ color:'#eaf4fb', fontSize:'1.4rem', fontWeight:900,
            letterSpacing:'2px' }}>ACCOUNTS</div>
        </div>
        <button onClick={() => setAdding(p => !p)} style={{
          padding:'7px 14px', background:'rgba(0,229,255,.1)',
          border:'1px solid rgba(0,229,255,.3)', borderRadius:'3px',
          color:'#00e5ff', fontFamily:'inherit', fontSize:'0.68rem',
          letterSpacing:'2px', cursor:'pointer',
        }}>+ ADD</button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background:'#0d1117', border:'1px solid rgba(0,229,255,.2)',
          borderRadius:'4px', padding:'14px', marginBottom:'1rem' }}>
          <div style={{ color:'#00e5ff', fontSize:'0.6rem', letterSpacing:'2px',
            marginBottom:'12px' }}>NEW ACCOUNT</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px',
            marginBottom:'10px' }}>
            <div>
              <div style={{ color:'#4a6274', fontSize:'0.58rem', letterSpacing:'2px',
                marginBottom:'4px' }}>NAME</div>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Think Capital" style={inp} />
            </div>
            <div>
              <div style={{ color:'#4a6274', fontSize:'0.58rem', letterSpacing:'2px',
                marginBottom:'4px' }}>TYPE</div>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                style={{ ...inp, cursor:'pointer' }}>
                <option value="funded">Funded / Prop</option>
                <option value="challenge">Challenge</option>
                <option value="personal">Personal</option>
                <option value="demo">Demo</option>
              </select>
            </div>
            <div>
              <div style={{ color:'#4a6274', fontSize:'0.58rem', letterSpacing:'2px',
                marginBottom:'4px' }}>ACCOUNT SIZE ($)</div>
              <input type="number" value={newBal} onChange={e => setNewBal(e.target.value)}
                placeholder="e.g. 100000" style={inp} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'7px' }}>
            <button onClick={addAccount} style={{
              padding:'7px 16px', background:'rgba(57,255,20,.1)',
              border:'1px solid rgba(57,255,20,.3)', borderRadius:'3px',
              color:'#39ff14', fontFamily:'inherit', fontSize:'0.68rem',
              letterSpacing:'2px', cursor:'pointer',
            }}>✓ SAVE</button>
            <button onClick={() => setAdding(false)} style={{
              padding:'7px 14px', background:'transparent',
              border:'1px solid #1e2a35', borderRadius:'3px',
              color:'#4a6274', fontFamily:'inherit', fontSize:'0.68rem',
              cursor:'pointer',
            }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div style={{ color:'#1e3a4a', fontSize:'0.72rem', textAlign:'center',
          padding:'2rem', letterSpacing:'2px' }}>LOADING…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {accounts.map(a => {
            const stats = getAccountStats(a.id)
            const pnlPct = a.balance ? ((stats.pnl / a.balance)*100).toFixed(2) : '0'
            const pnlColor = stats.pnl >= 0 ? '#39ff14' : '#ff2d55'
            const typeColor = a.type==='funded'?'#00e5ff':a.type==='challenge'?'#ffcc00':a.type==='demo'?'#4a6274':'#c084ff'
            const drawdownPct = a.balance ? ((Math.abs(Math.min(0,stats.pnl))/a.balance)*100).toFixed(2) : '0'
            const drawdownColor = parseFloat(drawdownPct) > 5 ? '#ff2d55' : parseFloat(drawdownPct) > 2 ? '#ffcc00' : '#39ff14'

            return (
              <div key={a.id} style={{
                background:'#0d1117', border:'1px solid #1e2a35',
                borderLeft:`3px solid ${typeColor}`,
                borderRadius:'4px', padding:'14px',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', marginBottom:'10px' }}>
                  <div>
                    <div style={{ color:'#eaf4fb', fontWeight:700, fontSize:'0.95rem',
                      marginBottom:'3px' }}>{a.name}</div>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                      <span style={{ fontSize:'0.58rem', padding:'2px 7px', borderRadius:'3px',
                        background:`${typeColor}15`, color:typeColor,
                        border:`1px solid ${typeColor}30`, letterSpacing:'1px',
                        textTransform:'uppercase' }}>{a.type}</span>
                      <span style={{ color:'#4a6274', fontSize:'0.62rem', fontFamily:'monospace' }}>
                        ${(a.balance||0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteAccount(a.id)} style={{
                    background:'transparent', border:'none', color:'#1e3a4a',
                    cursor:'pointer', fontSize:'0.75rem', padding:'2px 5px',
                  }}>✕</button>
                </div>

                {/* Stats grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px',
                  marginBottom:'10px' }}>
                  {[
                    { l:'Trades', v:stats.total, c:'#00e5ff' },
                    { l:'Win Rate', v:`${stats.wr}%`, c:parseFloat(stats.wr)>=60?'#39ff14':parseFloat(stats.wr)>=45?'#ffcc00':'#ff2d55' },
                    { l:'P&L $', v:`${stats.pnl>=0?'+$':'-$'}${Math.abs(stats.pnl).toFixed(0)}`, c:pnlColor },
                    { l:'P&L %', v:`${stats.pnl>=0?'+':''}${pnlPct}%`, c:pnlColor },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ background:'#080b0f', borderRadius:'3px',
                      padding:'7px', textAlign:'center' }}>
                      <div style={{ color:'#4a6274', fontSize:'0.5rem', letterSpacing:'1px',
                        textTransform:'uppercase', marginBottom:'3px' }}>{l}</div>
                      <div style={{ color:c, fontFamily:"'Bebas Neue',sans-serif",
                        fontSize:'1.1rem', letterSpacing:'2px' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Drawdown bar */}
                {a.balance > 0 && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      marginBottom:'3px' }}>
                      <span style={{ color:'#4a6274', fontSize:'0.55rem', letterSpacing:'1px' }}>
                        DRAWDOWN
                      </span>
                      <span style={{ color:drawdownColor, fontSize:'0.62rem', fontWeight:700 }}>
                        {drawdownPct}%
                      </span>
                    </div>
                    <div style={{ background:'#1e2a35', borderRadius:'2px', height:4 }}>
                      <div style={{
                        width:`${Math.min(parseFloat(drawdownPct)*2, 100)}%`,
                        height:'100%', background:drawdownColor,
                        borderRadius:'2px', transition:'width .4s',
                      }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      marginTop:'2px' }}>
                      <span style={{ color:'#1e3a4a', fontSize:'0.5rem' }}>0%</span>
                      <span style={{ color:parseFloat(drawdownPct)>5?'#ff2d55':'#1e3a4a',
                        fontSize:'0.5rem' }}>Max 5% daily</span>
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
