'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',           icon: '⬛', label: 'OVERVIEW'   },
  { href: '/dashboard/checklist', icon: '✓',  label: 'PRE-TRADE'  },
  { href: '/dashboard/journal',   icon: '📋', label: 'JOURNAL'    },
  { href: '/dashboard/analyzer',  icon: '🤖', label: 'AI CHART'   },
  { href: '/dashboard/stats',     icon: '📈', label: 'STATS'      },
  { href: '/dashboard/rules',     icon: '⚡', label: 'RULES'      },
]

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser]         = useState(null)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'TRADER'

  return (
    <div className="min-h-screen flex bg-bg">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-surface border-r border-border transition-all duration-300 ${open ? 'w-52' : 'w-16'} md:w-52`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
          <Link href="/" className={`font-display tracking-widest text-accent glow-accent transition-all ${open ? 'text-xl' : 'text-sm'} md:text-xl`}>
            {open ? 'TRADEPULSE' : 'TP'}
            <span className="hidden md:inline">TRADEPULSE</span>
          </Link>
          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="ml-auto text-dim hover:text-bright md:hidden">
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(n => {
            const active = pathname === n.href
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono tracking-widest transition-all group ${
                  active
                    ? 'bg-accent/10 border border-accent/20 text-accent'
                    : 'text-dim hover:text-bright hover:bg-s2 border border-transparent'
                }`}>
                <span className="text-base flex-shrink-0">{n.icon}</span>
                <span className={`${open ? 'block' : 'hidden'} md:block`}>{n.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className={`flex items-center gap-3 px-2 py-2 ${open ? '' : 'justify-center'} md:justify-start`}>
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-mono font-bold flex-shrink-0">
              {userName[0]?.toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${open ? 'block' : 'hidden'} md:block`}>
              <div className="text-bright text-xs font-mono truncate">{userName.toUpperCase()}</div>
              <button onClick={handleLogout} className="text-dim text-[10px] font-mono tracking-widest hover:text-danger transition-colors">
                LOGOUT →
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-52 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center px-6 gap-4 bg-surface/50 backdrop-blur sticky top-0 z-30">
          <button onClick={() => setOpen(!open)} className="md:hidden text-dim hover:text-bright">☰</button>
          <div className="text-xs text-dim font-mono tracking-widest flex items-center gap-2">
            <span className="text-accent">TRADEPULSE</span>
            <span>/</span>
            <span>{NAV.find(n => n.href === pathname)?.label || 'DASHBOARD'}</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-a3 animate-glow-pulse" />
              <span className="text-a3 text-[10px] font-mono tracking-widest">LIVE</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
