'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href:'/dashboard',           label:'Overview',   icon:'⊡', desc:'Stats & trades' },
  { href:'/dashboard/checklist', label:'Checklist',  icon:'✓', desc:'QT pre-trade' },
  { href:'/dashboard/journal',   label:'Journal',    icon:'≡', desc:'Trade log' },
  { href:'/dashboard/stats',     label:'Analytics',  icon:'◈', desc:'Performance' },
  { href:'/dashboard/analyzer',  label:'AI Analyze', icon:'◎', desc:'Chart AI' },
]

export default function DashboardLayout({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
      else { setUser(session.user); setLoading(false) }
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem' }}>
      <div style={{
        width:40, height:40, borderRadius:'12px',
        background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
        animation:'spin 2s linear infinite',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'1.2rem',
      }}>⚡</div>
      <p style={{ color:'#334155', fontSize:'0.75rem', letterSpacing:'0.2em',
        textTransform:'uppercase' }}>Loading TradePulse</p>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .nav-link { transition: all 0.15s ease; }
        .nav-link:hover { background: #1e293b !important; }
        @media(max-width:768px) {
          .sidebar { display: none !important; }
          .main-wrap { margin-left: 0 !important; padding-bottom: 5rem !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar" style={{
        width:240, minHeight:'100vh', background:'#0d0d16',
        borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:50,
      }}>
        {/* Logo */}
        <div style={{ padding:'1.5rem 1.25rem 1.25rem', borderBottom:'1px solid #1a1a2a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{
              width:32, height:32, borderRadius:'10px',
              background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1rem', flexShrink:0,
            }}>⚡</div>
            <div>
              <p style={{ color:'#f8fafc', fontWeight:900, fontSize:'0.9rem',
                margin:0, letterSpacing:'0.05em' }}>TradePulse</p>
              <p style={{ color:'#334155', fontSize:'0.58rem', margin:0,
                letterSpacing:'0.15em', textTransform:'uppercase' }}>QT Journal</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #1a1a2a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:'0.75rem', fontWeight:800,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'T'}
            </div>
            <div style={{ overflow:'hidden' }}>
              <p style={{ color:'#94a3b8', fontSize:'0.6rem', letterSpacing:'0.1em',
                textTransform:'uppercase', margin:'0 0 0.1rem' }}>Trader</p>
              <p style={{ color:'#f8fafc', fontSize:'0.75rem', margin:0,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.75rem 0.75rem' }}>
          <p style={{ color:'#1e293b', fontSize:'0.58rem', letterSpacing:'0.2em',
            textTransform:'uppercase', padding:'0 0.5rem', margin:'0 0 0.5rem',
            fontWeight:600 }}>Navigation</p>
          {NAV.map(({ href, label, icon, desc }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="nav-link" style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'0.7rem 0.75rem', borderRadius:'10px', marginBottom:'2px',
                background: active ? 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.1))' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                textDecoration:'none', transition:'all 0.15s',
              }}>
                <span style={{
                  width:28, height:28, borderRadius:'8px', flexShrink:0,
                  background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#1a1a2a',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.85rem', color: active ? '#fff' : '#475569',
                }}>{icon}</span>
                <div>
                  <p style={{ color: active ? '#f8fafc' : '#94a3b8', fontWeight: active ? 700 : 500,
                    fontSize:'0.82rem', margin:0 }}>{label}</p>
                  <p style={{ color:'#334155', fontSize:'0.6rem', margin:0 }}>{desc}</p>
                </div>
                {active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%',
                  background:'#6366f1' }} />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #1a1a2a' }}>
          <div style={{
            background:'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.05))',
            border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px',
            padding:'0.75rem', marginBottom:'0.75rem',
          }}>
            <p style={{ color:'#6366f1', fontSize:'0.62rem', letterSpacing:'0.1em',
              textTransform:'uppercase', margin:'0 0 0.2rem', fontWeight:700 }}>QT Framework</p>
            <p style={{ color:'#475569', fontSize:'0.68rem', margin:0 }}>
              Daye · Jacob · 2024
            </p>
          </div>
          <button onClick={handleLogout} style={{
            width:'100%', background:'transparent', border:'1px solid #1e293b',
            borderRadius:'8px', color:'#475569', padding:'0.6rem',
            fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase',
            cursor:'pointer', transition:'all 0.15s',
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-wrap" style={{
        marginLeft:240, flex:1, padding:'1.75rem',
        minHeight:'100vh', background:'#0a0a0f',
      }}>
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="mobile-nav" style={{
        display:'none', position:'fixed', bottom:0, left:0, right:0,
        background:'#0d0d16', borderTop:'1px solid #1e1e2e',
        padding:'0.5rem 0', zIndex:50,
      }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
              padding:'0.4rem 0', flex:1, textDecoration:'none',
              color: active ? '#6366f1' : '#334155',
            }}>
              <span style={{
                width:28, height:28, borderRadius:'8px',
                background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.9rem', color: active ? '#fff' : '#475569',
              }}>{icon}</span>
              <span style={{ fontSize:'0.55rem', letterSpacing:'0.05em',
                textTransform:'uppercase', fontWeight: active ? 700 : 500 }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
