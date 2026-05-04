'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',            label: 'Overview',   icon: '⬡' },
  { href: '/dashboard/checklist',  label: 'Checklist',  icon: '✓' },
  { href: '/dashboard/journal',    label: 'Journal',    icon: '≡' },
  { href: '/dashboard/stats',      label: 'Stats',      icon: '◈' },
  { href: '/dashboard/analyzer',   label: 'AI Analyze', icon: '◎' },
]

export default function DashboardLayout({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
      else { setUser(user); setLoading(false) }
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e',
        animation:'pulse 1s infinite' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex' }}>

      {/* Sidebar */}
      <aside className="sidebar" style={{
        width:220, minHeight:'100vh', background:'#0d0d0d',
        borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column',
        padding:'1.5rem 0', position:'fixed', top:0, left:0, bottom:0, zIndex:50,
      }}>
        <div style={{ padding:'0 1.25rem 2rem' }}>
          <span style={{ color:'#fff', fontWeight:900, letterSpacing:'0.25em', fontSize:'0.95rem' }}>
            TRADEPULSE
          </span>
          <span style={{ marginLeft:'0.5rem', background:'#22c55e', color:'#000',
            fontSize:'0.5rem', fontWeight:800, padding:'1px 5px', borderRadius:'3px',
            letterSpacing:'0.1em', verticalAlign:'middle' }}>LIVE</span>
        </div>

        <div style={{ padding:'0 1.25rem 1.5rem', borderBottom:'1px solid #1a1a1a', marginBottom:'1rem' }}>
          <p style={{ color:'#888', fontSize:'0.6rem', letterSpacing:'0.15em',
            textTransform:'uppercase', margin:'0 0 0.25rem' }}>Trader</p>
          <p style={{ color:'#fff', fontSize:'0.8rem', margin:0,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.email}
          </p>
        </div>

        <nav style={{ flex:1, padding:'0 0.75rem' }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'0.65rem 0.75rem', borderRadius:'6px', marginBottom:'2px',
                color: active ? '#fff' : '#888',
                background: active ? '#1a1a1a' : 'transparent',
                textDecoration:'none', fontSize:'0.85rem',
                fontWeight: active ? 700 : 400, transition:'all 0.15s',
              }}>
                <span style={{ fontSize:'1rem', color: active ? '#22c55e' : '#555' }}>{icon}</span>
                {label}
                {active && <span style={{ marginLeft:'auto', width:4, height:4,
                  borderRadius:'50%', background:'#22c55e' }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #1a1a1a' }}>
          <button onClick={handleLogout} style={{
            width:'100%', background:'transparent', border:'1px solid #1f1f1f',
            borderRadius:'6px', color:'#888', padding:'0.6rem', fontSize:'0.75rem',
            letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer',
          }}>Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft:220, flex:1, padding:'2rem' }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{
        display:'none', position:'fixed', bottom:0, left:0, right:0,
        background:'#0d0d0d', borderTop:'1px solid #1a1a1a',
        padding:'0.5rem 0', zIndex:50,
      }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
              padding:'0.4rem 0.5rem', color: active ? '#22c55e' : '#555',
              textDecoration:'none', fontSize:'0.6rem', letterSpacing:'0.1em',
              textTransform:'uppercase', flex:1,
            }}>
              <span style={{ fontSize:'1.1rem' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media(max-width:768px){
          .sidebar       { display:none !important; }
          .main-content  { margin-left:0 !important; padding:1rem 1rem 5rem !important; }
          .mobile-nav    { display:flex !important; }
        }
      `}</style>
    </div>
  )
}
