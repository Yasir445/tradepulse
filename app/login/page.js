'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = '/dashboard'
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* bg glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up opacity-0-init">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-widest text-accent glow-accent">
            TRADEPULSE
          </Link>
          <p className="text-dim text-xs font-mono tracking-widest mt-2">WELCOME BACK TRADER</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-dim font-mono tracking-widest uppercase block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-bg border border-border rounded px-4 py-3 text-bright text-sm font-mono focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_1px_rgba(0,229,255,.2)] transition-all placeholder:text-dim/40"
              />
            </div>
            <div>
              <label className="text-xs text-dim font-mono tracking-widest uppercase block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-bg border border-border rounded px-4 py-3 text-bright text-sm font-mono focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_1px_rgba(0,229,255,.2)] transition-all placeholder:text-dim/40"
              />
            </div>

            {error && (
              <div className="text-danger text-xs font-mono tracking-wide bg-danger/5 border border-danger/20 rounded px-3 py-2">
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-accent text-bg font-mono font-bold text-xs tracking-[3px] uppercase rounded hover:bg-accent/90 transition-all hover:shadow-[0_0_30px_rgba(0,229,255,.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'LOGGING IN...' : 'LOG IN →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-dim text-xs font-mono tracking-wide">
              No account?{' '}
              <Link href="/signup" className="text-accent hover:text-bright transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
