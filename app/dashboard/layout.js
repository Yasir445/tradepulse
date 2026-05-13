'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',           icon: '◈', label: 'Overview'  },
  { href: '/dashboard/journal',   icon: '✦', label: 'Journal'   },
  { href: '/dashboard/log',       icon: '≡',  label: 'Log'       },
  { href: '/dashboard/stats',     icon: '⬡',  label: 'Analytics' },
  { href: '/dashboard/review',    icon: '◎',  label: 'Review'    },
  { href: '/dashboard/analyzer',  icon: '⚡',  label: 'AI'        },
  { href: '/dashboard/accounts',  icon: '⊛',  label: 'Accounts'  },
]

const MOBILE_NAV = NAV.slice(0, 6)

export default function DashboardLayout({ children }) {
  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [account,  setAccount]  = useState(null)
  const [accounts, setAccounts] = useState([])
  const [time,     setTime]     = useState('')
  const [sideOpen, setSideOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const tick = () => {
      const ny = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      setTime(ny)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUser(session.user)

      let { data: accts } = await supabase.from('accounts').select('*')
        .eq('user_id', session.user.id).order('created_at')

      if (!accts || accts.length === 0) {
        const { data: created } = await supabase.from('accounts').insert([
          { user_id: session.user.id, name: 'Think Capital',  type: 'funded',   balance: 100000 },
          { user_id: session.user.id, name: 'MCF / Profprim', type: 'funded',   balance: 50000  },
          { user_id: session.user.id, name: 'Personal',       type: 'personal', balance: 10000  },
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

  const switchAccount = (a) => {
    setAccount(a)
    localStorage.setItem('tp-active-account', a.id)
    window.dispatchEvent(new CustomEvent('account-changed', { detail: a }))
    setSideOpen(false)
  }

  const logout = async () => {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', color: 'var(--cyan)',
        fontSize: '1.5rem', letterSpacing: '0.3em', fontWeight: 800,
      }}>TRADEPULSE</div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)',
            animation: 'pulse-dot 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        .nav-item { transition: all 0.15s ease; }
        .nav-item:hover { color: var(--text-1) !important; background: var(--bg-3) !important; }
        .acct-btn:hover { border-color: var(--border-2) !important; color: var(--text-2) !important; }
        @media(max-width:900px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; position: fixed !important; z-index: 100 !important; }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mob-nav { display: flex !important; }
          .main-content { padding-bottom: 5.5rem !important; }
        }
      `}</style>

      {/* Sidebar overlay on mobile */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(4,5,8,0.8)',
          zIndex: 99, display: 'none',
        }} className="mob-overlay" />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sideOpen ? ' open' : ''}`} style={{
        width: 220, minHeight: '100vh', background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--cyan), #0080ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', flexShrink: 0,
              boxShadow: '0 0 12px var(--cyan-glow)',
            }}>⚡</div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1rem', letterSpacing: '0.05em', color: 'var(--text-1)',
            }}>TradePulse</span>
          </div>
          <div style={{
            fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)', paddingLeft: '36px',
          }}>QT JOURNAL v12</div>
        </div>

        {/* Time + market status */}
        <div style={{
          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)',
              fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>{time}</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-3)', letterSpacing: '0.15em' }}>
              NEW YORK EST
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            {['NQ','ES'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--green)', animation: 'pulse-dot 2s infinite',
                  boxShadow: '0 0 4px var(--green)' }} />
                <span style={{ fontSize: '0.55rem', color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account switcher */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>ACTIVE ACCOUNT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {accounts.map(a => (
              <button key={a.id} className="acct-btn" onClick={() => switchAccount(a)} style={{
                padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
                textAlign: 'left', background: account?.id === a.id ? 'var(--cyan-dim)' : 'transparent',
                border: `1px solid ${account?.id === a.id ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                color: account?.id === a.id ? 'var(--cyan)' : 'var(--text-3)',
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.05em',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {account?.id === a.id && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%',
                      background: 'var(--cyan)', flexShrink: 0 }} />
                  )}
                  {a.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.5rem' }}>
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className="nav-item" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '2px',
                color: active ? 'var(--cyan)' : 'var(--text-3)',
                background: active ? 'var(--cyan-dim)' : 'transparent',
                border: `1px solid ${active ? 'rgba(0,212,255,0.15)' : 'transparent'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                <span style={{ fontSize: '0.9rem', width: 18, textAlign: 'center',
                  color: active ? 'var(--cyan)' : 'var(--text-4)' }}>{icon}</span>
                {label}
                {active && <div style={{ marginLeft: 'auto', width: 4, height: 4,
                  borderRadius: '50%', background: 'var(--cyan)',
                  boxShadow: '0 0 6px var(--cyan)' }} />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--cyan), #0080ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontSize: '0.7rem', fontWeight: 800,
            }}>{user?.email?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-3)', letterSpacing: '0.15em' }}>
                QT TRADER
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%',
            justifyContent: 'center', fontSize: '0.58rem' }}>
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{
        marginLeft: 220, flex: 1, minHeight: '100vh',
        padding: '1.75rem', background: 'var(--bg)',
      }}>
        <div className="fade-up">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mob-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
        zIndex: 50, padding: '0.4rem 0', backdropFilter: 'blur(10px)',
      }}>
        {MOBILE_NAV.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '0.35rem 0', flex: 1,
              color: active ? 'var(--cyan)' : 'var(--text-4)',
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: '1.05rem' }}>{icon}</span>
              <span style={{ fontSize: '0.45rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
              {active && <div style={{ width: 3, height: 3, borderRadius: '50%',
                background: 'var(--cyan)', boxShadow: '0 0 4px var(--cyan)' }} />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
