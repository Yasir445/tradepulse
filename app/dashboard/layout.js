'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href:'/dashboard',           label:'Overview',  icon:'⊡' },
  { href:'/dashboard/journal',   label:'Journal',   icon:'✎' },
  { href:'/dashboard/log',       label:'Log',       icon:'≡' },
  { href:'/dashboard/stats',     label:'Stats',     icon:'◈' },
  { href:'/dashboard/review',    label:'Review',    icon:'◉' },
  { href:'/dashboard/analyzer',  label:'AI',        icon:'◎' },
  { href:'/dashboard/accounts',  label:'Accounts',  icon:'⬡' },
]

export default function DashboardLayout({ children }) {
  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [account,  setAccount]  = useState(null)
  const [accounts, setAccounts] = useState([])
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUser(session.user)

      let { data: accts } = await supabase
        .from('accounts').select('*')
        .eq('user_id', session.user.id).order('created_at')

      if (!accts || accts.length === 0) {
        const { data: created } = await supabase.from('accounts').insert([
          { user_id: session.user.id, name: 'Think Capital', type: 'funded', balance: 100000 },
          { user_id: session.user.id, name: 'MCF / Profprim', type: 'funded', balance: 50000 },
          { user_id: session.user.id, name: 'Personal', type: 'personal', balance: 10000 },
        ]).select()
        accts = created || []
      }

      setAccounts(accts)
      const saved  = typeof window !== 'undefined' ? localStorage.getItem('tp-active-account') : null
      const active = accts.find(a => a.id === saved) || accts[0]
      setAccount(active)
      setLoading(false)
    }
    init()
  }, [router])

  const switchAccount = (acct) => {
    setAccount(acct)
    localStorage.setItem('tp-active-account', acct.id)
    window.dispatchEvent(new CustomEvent('account-changed', { detail: acct }))
  }

  const logout = async () => {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080b0f', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'#00e5ff', fontFamily:'monospace', fontSize:'1.5rem',
          letterSpacing:'4px', marginBottom:'0.5rem' }}>TRADEPULSE</div>
        <div style={{ color:'#1e3a4a', fontSize:'0.62rem', letterSpacing:'3px' }}>LOADING…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#080b0f', display:'flex',
      fontFamily:"'IBM Plex Mono', monospace", color:'#c9d6df' }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#080b0f}
        ::-webkit-scrollbar-thumb{background:#1e2a35;border-radius:2px}
        .nav-lnk:hover{background:rgba(0,229,255,0.05)!important;color:#c9d6df!important}
        input,select,textarea{color-scheme:dark}
        @media(max-width:768px){
          .sidebar{display:none!important}
          .main-wrap{margin-left:0!important;padding-bottom:5.5rem!important}
          .mob-nav{display:flex!important}
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar" style={{
        width:200, minHeight:'100vh', background:'#0d1117',
        borderRight:'1px solid #1e2a35', display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:50,
      }}>
        <div style={{ padding:'1.25rem 1rem', borderBottom:'1px solid #1e2a35' }}>
          <div style={{ color:'#00e5ff', fontWeight:900, fontSize:'1rem', letterSpacing:'3px' }}>
            TRADE<span style={{ color:'#39ff14' }}>PULSE</span>
          </div>
          <div style={{ color:'#4a6274', fontSize:'0.52rem', letterSpacing:'2px', marginTop:'2px' }}>
            QT JOURNAL v12
          </div>
        </div>

        {/* Account switcher */}
        <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #1e2a35' }}>
          <div style={{ color:'#4a6274', fontSize:'0.52rem', letterSpacing:'2px',
            textTransform:'uppercase', marginBottom:'0.4rem' }}>Account</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
            {accounts.map(a => (
              <button key={a.id} onClick={() => switchAccount(a)} style={{
                padding:'4px 8px', borderRadius:'3px', fontSize:'0.6rem', cursor:'pointer',
                textAlign:'left', fontFamily:'inherit', letterSpacing:'1px',
                background: account?.id===a.id ? 'rgba(0,229,255,0.1)' : 'transparent',
                border: account?.id===a.id ? '1px solid rgba(0,229,255,0.25)' : '1px solid transparent',
                color: account?.id===a.id ? '#00e5ff' : '#4a6274', transition:'all 0.15s',
              }}>{a.name}</button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.5rem' }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className="nav-lnk" style={{
                display:'flex', alignItems:'center', gap:'0.6rem',
                padding:'0.5rem 0.6rem', borderRadius:'3px', marginBottom:'2px',
                background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
                textDecoration:'none', color: active ? '#00e5ff' : '#4a6274',
                fontSize:'0.68rem', letterSpacing:'2px', transition:'all 0.15s',
              }}>
                <span style={{ fontSize:'0.85rem', width:16 }}>{icon}</span>
                {label.toUpperCase()}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding:'0.75rem 1rem', borderTop:'1px solid #1e2a35' }}>
          <div style={{ color:'#2a4a5a', fontSize:'0.55rem', overflow:'hidden',
            textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'0.5rem' }}>
            {user?.email}
          </div>
          <button onClick={logout} style={{
            width:'100%', background:'transparent', border:'1px solid #1e2a35',
            borderRadius:'3px', color:'#4a6274', padding:'5px', cursor:'pointer',
            fontSize:'0.55rem', letterSpacing:'2px', fontFamily:'inherit',
          }}>SIGN OUT</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-wrap" style={{
        marginLeft:200, flex:1, padding:'1.5rem', minHeight:'100vh',
      }}>
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="mob-nav" style={{
        display:'none', position:'fixed', bottom:0, left:0, right:0,
        background:'#0d1117', borderTop:'1px solid #1e2a35',
        zIndex:50, padding:'0.3rem 0',
      }}>
        {NAV.slice(0,6).map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
              padding:'0.3rem 0', flex:1, textDecoration:'none',
              color: active ? '#00e5ff' : '#1e3a4a',
            }}>
              <span style={{ fontSize:'1rem' }}>{icon}</span>
              <span style={{ fontSize:'0.45rem', letterSpacing:'1px',
                textTransform:'uppercase' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
