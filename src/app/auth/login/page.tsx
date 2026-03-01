'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCheckingAuth(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if ((profile as any)?.role === 'business') {
        router.replace('/business/dashboard')
      } else {
        router.replace('/dashboard')
      }
    }
    redirectIfLoggedIn()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check user role and redirect accordingly
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

      if (selectError) throw selectError

      if ((profile as any)?.role === 'business') {
        router.push('/business/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link href="/" className="inline-flex items-center space-x-3 mb-8 hover:opacity-80 transition">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain filter grayscale brightness-200" />
              <span className="text-3xl font-bold font-heading text-white tracking-tight">Vertex</span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-4xl font-bold font-heading text-white tracking-tight">
              Welcome <span className="font-drama italic font-normal text-[#4EA8F3]">Back</span>
            </h1>
            <p className="text-ink-muted mt-3 font-mono text-sm uppercase tracking-widest">System Authentication</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="card-surface p-8 backdrop-blur-xl bg-[#0a0a0a]/80 border-[#222]">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-950/40 border border-red-800/60 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                placeholder="you@example.com"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-magnetic w-full flex bg-white text-black py-4 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <span className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full mr-2"
                  />
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Log In
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
              </span>
              <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-ink-muted text-sm font-mono">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-white hover:text-[#4EA8F3] font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
