'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const INSTRUMENTS = ['NQ', 'ES', 'NQ + ES', 'Other']
const PROP_FIRMS  = ['Think Capital', 'FTMO', 'MCF / Profprim', 'The Funded Trader', 'My Forex Funds', 'Personal Account', 'Other']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [name, setName]             = useState('')
  const [instrument, setInstrument] = useState('')
  const [firm, setFirm]             = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, instrument, prop_firm: firm }
      }
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-a3/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up opacity-0-init">
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-widest text-accent glow-accent">
            TRADEPULSE
          </Link>
          <p className="text-dim text-xs font-mono tracking-widest mt-2">
            {step === 1 ? 'CREATE YOUR FREE ACCOUNT' : 'TRADER PROFILE (OPTIONAL)'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-all ${
                step >= s ? 'border-accent bg-accent/10 text-accent' : 'border-border text-dim'
              }`}>{s}</div>
              {s < 2 && <div className={`h-px flex-1 transition-all ${step > s ? 'bg-accent/40' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          <form onSubmit={handleSignup} className="space-y-5">

            {step === 1 && (
              <>
                <div>
                  <label className="text-xs text-dim font-mono tracking-widest uppercase block mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Yasir Ali"
                    className="w-full bg-bg border border-border rounded px-4 py-3 text-bright text-sm font-mono focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_1px_rgba(0,229,255,.2)] transition-all placeholder:text-dim/40"
                  />
                </div>
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
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full bg-bg border border-border rounded px-4 py-3 text-bright text-sm font-mono focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_1px_rgba(0,229,255,.2)] transition-all placeholder:text-dim/40"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-xs text-dim font-mono tracking-widest uppercase block mb-3">Instrument</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INSTRUMENTS.map(i => (
                      <button key={i} type="button"
                        onClick={() => setInstrument(i)}
                        className={`py-2.5 px-3 rounded border text-xs font-mono tracking-wide transition-all ${
                          instrument === i
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-dim hover:border-accent/40 hover:text-bright'
                        }`}>{i}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dim font-mono tracking-widest uppercase block mb-3">Prop Firm / Account</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROP_FIRMS.map(f => (
                      <button key={f} type="button"
                        onClick={() => setFirm(f)}
                        className={`py-2.5 px-3 rounded border text-xs font-mono tracking-wide transition-all text-left ${
                          firm === f
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-dim hover:border-accent/40 hover:text-bright'
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

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
              {loading ? 'CREATING ACCOUNT...' : step === 1 ? 'CONTINUE →' : 'START TRADING →'}
            </button>

            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}
                className="w-full py-2 text-dim text-xs font-mono tracking-widest hover:text-bright transition-colors">
                ← BACK
              </button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-dim text-xs font-mono tracking-wide">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:text-bright transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-dim/50 text-xs font-mono mt-6 tracking-wide">
          Free forever · No credit card · No BS
        </p>
      </div>
    </div>
  )
}
