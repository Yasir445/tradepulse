'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const GRADE_COLOR = {
  'A++':'#eab308','A+':'#22c55e','A':'#86efac','B':'#3b82f6','C':'#f59e0b','F':'#ef4444'
}

export default function DashboardPage() {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
const user = session?.user
      if (!user) return
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const wins    = trades.filter(t => t.result === 'WIN').length
  const losses  = trades.filter(t => t.result === 'LOSS').length
  const total   = trades.length
  const winRate = total ? Math.round((wins / total) * 100) : 0
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const rrTrades = trades.filter(t => t.rr)
  const avgRR   = rrTrades.length
    ? (rrTrades.reduce((s,t)=>s+t.rr,0)/rrTrades.length).toFixed(2) : '—'
  let streak = 0
  for (const t of trades) { if (t.result==='WIN') streak++; else break }

  const Card = ({ label, value, sub, color='#fff' }) => (
    <div style={{ background:'#101010', border:'1px solid #1f1f1f',
      borderRadius:'8px', padding:'1.25rem', flex:1, minWidth:130 }}>
      <p style={{ color:'#888', fontSize:'0.62rem', letterSpacing:'0.2em',
        textTransform:'uppercase', margin:'0 0 0.4rem' }}>{label}</p>
      <p style={{ color, fontSize:'1.9rem', fontWeight:800, margin:'0 0 0.2rem',
        fontFamily:'monospace' }}>{value}</p>
      {sub && <p style={{ color:'#555', fontSize:'0.7rem', margin:0 }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <p style={{ color:'#888', fontSize:'0.7rem', letterSpacing:'0.2em',
          textTransform:'uppercase', margin:'0 0 0.3rem' }}>Dashboard</p>
        <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900, margin:0 }}>Overview</h1>
      </div>

      {/* Quick actions */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'2rem', flexWrap:'wrap' }}>
        {[
          { href:'/dashboard/checklist', label:'Run Pre-Trade Check', primary:true },
          { href:'/dashboard/journal',   label:'Log New Trade',       primary:false },
          { href:'/dashboard/analyzer',  label:'Analyze Chart →',    primary:false },
        ].map(({ href, label, primary }) => (
          <Link key={href} href={href} style={{
            padding:'0.7rem 1.25rem', background: primary ? '#22c55e' : 'transparent',
            border:`1px solid ${primary ? '#22c55e' : '#2a2a2a'}`,
            borderRadius:'6px', color: primary ? '#000' : '#fff',
            textDecoration:'none', fontSize:'0.8rem',
            fontWeight: primary ? 800 : 500, transition:'all 0.15s',
          }}>{label}</Link>
        ))}
      </div>

      {loading ? (
        <p style={{ color:'#555', fontSize:'0.85rem' }}>Loading…</p>
      ) : (
        <>
          <div style={{ display:'flex', gap:'1rem', marginBottom:'2rem', flexWrap:'wrap' }}>
            <Card label="Win Rate" value={`${winRate}%`}
              sub={`${wins}W · ${losses}L · ${total} trades`}
              color={winRate>=60?'#22c55e':winRate>=45?'#f59e0b':'#ef4444'} />
            <Card label="Total P&L"
              value={`${totalPnl>0?'+':''}${totalPnl.toFixed(0)}`} sub="points"
              color={totalPnl>0?'#22c55e':totalPnl<0?'#ef4444':'#fff'} />
            <Card label="Avg RR"     value={avgRR}  sub="risk/reward" />
            <Card label="Win Streak" value={streak} sub="current"
              color={streak>=3?'#22c55e':'#fff'} />
          </div>

          {/* Recent trades table */}
          <div style={{ background:'#101010', border:'1px solid #1f1f1f',
            borderRadius:'8px', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #1a1a1a',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ color:'#fff', fontWeight:700, fontSize:'0.85rem',
                letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>Recent Trades</p>
              <Link href="/dashboard/journal" style={{ color:'#888', fontSize:'0.75rem',
                textDecoration:'none' }}>View all →</Link>
            </div>

            {trades.length === 0 ? (
              <div style={{ padding:'3rem', textAlign:'center' }}>
                <p style={{ color:'#555', fontSize:'0.9rem', margin:'0 0 1rem' }}>No trades yet.</p>
                <Link href="/dashboard/checklist" style={{ color:'#22c55e',
                  fontSize:'0.8rem', textDecoration:'none' }}>
                  Run your first pre-trade check →
                </Link>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Date','Symbol','Dir','Result','P&L','Grade'].map(h => (
                        <th key={h} style={{ padding:'0.6rem 1rem', textAlign:'left',
                          color:'#555', fontSize:'0.62rem', letterSpacing:'0.15em',
                          textTransform:'uppercase', borderBottom:'1px solid #1a1a1a' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0,8).map(t => (
                      <tr key={t.id} style={{ borderBottom:'1px solid #141414' }}>
                        <td style={{ padding:'0.7rem 1rem', color:'#888',
                          fontSize:'0.78rem', fontFamily:'monospace' }}>{t.date}</td>
                        <td style={{ padding:'0.7rem 1rem', color:'#fff',
                          fontWeight:700, fontSize:'0.85rem' }}>{t.symbol}</td>
                        <td style={{ padding:'0.7rem 1rem', fontSize:'0.8rem', fontWeight:700,
                          color:t.direction==='LONG'?'#22c55e':'#ef4444' }}>{t.direction}</td>
                        <td style={{ padding:'0.7rem 1rem' }}>
                          <span style={{ fontSize:'0.7rem', fontWeight:800, padding:'2px 8px',
                            borderRadius:'4px',
                            background:t.result==='WIN'?'#052e16':t.result==='LOSS'?'#1c0a0a':'#1a1a1a',
                            color:t.result==='WIN'?'#22c55e':t.result==='LOSS'?'#ef4444':'#888',
                          }}>{t.result}</span>
                        </td>
                        <td style={{ padding:'0.7rem 1rem', fontFamily:'monospace',
                          fontSize:'0.85rem', fontWeight:700,
                          color:(t.pnl||0)>0?'#22c55e':(t.pnl||0)<0?'#ef4444':'#888' }}>
                          {t.pnl!=null?`${t.pnl>0?'+':''}${t.pnl}`:'—'}
                        </td>
                        <td style={{ padding:'0.7rem 1rem' }}>
                          <span style={{ fontSize:'0.7rem', fontWeight:800, padding:'2px 8px',
                            borderRadius:'4px', color:GRADE_COLOR[t.grade]||'#888',
                            border:`1px solid ${GRADE_COLOR[t.grade]||'#333'}` }}>
                            {t.grade||'—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
