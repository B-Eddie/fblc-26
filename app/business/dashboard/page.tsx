'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, Users, Clock, LogOut } from 'lucide-react'

export default function BusinessDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchBusinessData(user.id)
  }

  const fetchBusinessData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const profile = (profileData as any)
      setProfile(profile)

      if (profile?.role !== 'business') {
        router.push('/dashboard')
        return
      }

      // Fetch business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('profile_id', userId)
        .single()

      const business = (businessData as any)
      if (business) {
        setBusiness(business)

        // Fetch opportunities
        const { data: oppsData } = await supabase
          .from('opportunities')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })

        setOpportunities(oppsData || [])

        // Fetch applications for all opportunities
        if (oppsData && oppsData.length > 0) {
          const oppIds = (oppsData as any).map((opp: any) => opp.id)
          const { data: appsData } = await supabase
            .from('applications')
            .select(`
              *,
              profile:profiles(full_name, email),
              opportunity:opportunities(title)
            `)
            .in('opportunity_id', oppIds)
            .order('created_at', { ascending: false })

          setApplications(appsData || [])
        }
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus } as any)
        .eq('id', applicationId)

      if (error) throw error

      // Refresh applications
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ))
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-gray-700/30 border-t-gray-700 rounded-full"
        />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md p-8 bg-gray-900/40 border border-gray-800/60 rounded-2xl backdrop-blur-sm"
        >
          <h1 className="text-3xl font-bold text-white mb-4">Set Up Your Business</h1>
          <p className="text-gray-400 mb-6">You need to create a business profile before posting opportunities.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/business/setup"
              className="inline-block px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
            >
              Create Business Profile
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
    accepted: 'bg-green-600/20 text-green-400 border border-green-600/30',
    rejected: 'bg-red-600/20 text-red-400 border border-red-600/30',
    completed: 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600/20 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-white font-bold text-xl">V</span>
              </motion.div>
              <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Vertex
              </span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </motion.button>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-3">
            {business.name}
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">{business.description}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            { icon: MapPin, label: 'Active Opportunities', value: opportunities.length, color: 'from-blue-600/20 to-blue-700/20 border-blue-600/30' },
            { icon: Users, label: 'Total Applications', value: applications.length, color: 'from-green-600/20 to-green-700/20 border-green-600/30' },
            { icon: Clock, label: 'Pending Reviews', value: applications.filter(app => app.status === 'pending').length, color: 'from-orange-600/20 to-orange-700/20 border-orange-600/30' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
              className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-6 backdrop-blur-sm hover:border-opacity-100 transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <stat.icon className="w-12 h-12 text-gray-400 opacity-50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 mb-8 backdrop-blur-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Opportunities</h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/business/opportunities/new"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Post New Opportunity</span>
              </Link>
            </motion.div>
          </div>

          {opportunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 mb-6 text-lg">You haven't posted any opportunities yet</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/business/opportunities/new"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                >
                  Post Your First Opportunity
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp, i) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="border border-gray-800/60 rounded-xl p-6 hover:border-gray-600/40 transition bg-gray-800/20 backdrop-blur-sm flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{opp.title}</h3>
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{opp.description}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>{opp.hours_available} hours</span>
                      {opp.is_flexible && <span className="text-green-400 font-medium">✓ Flexible</span>}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="px-6 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition whitespace-nowrap ml-4"
                    >
                      View Details
                    </Link>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Applications</h2>
          {applications.length === 0 ? (
            <motion.div className="text-center py-12">
              <p className="text-gray-400 text-lg">No applications yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border border-gray-800/60 rounded-xl p-6 bg-gray-800/20 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white">{app.profile.full_name}</h3>
                      <p className="text-sm text-gray-400">{app.profile.email}</p>
                      <p className="text-sm text-gray-500 mt-2">Applied to: <span className="text-gray-300">{app.opportunity.title}</span></p>
                      {app.message && (
                        <p className="text-sm text-gray-300 mt-3 italic border-l-2 border-gray-600 pl-3">"{app.message}"</p>
                      )}
                    </div>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${statusColors[app.status] || statusColors.pending}`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </motion.span>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-700/50">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(app.id, 'accepted')}
                        className="px-6 py-2 bg-green-600/20 text-green-400 border border-green-600/30 text-sm rounded-lg hover:bg-green-600/30 font-semibold transition"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                        className="px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/30 text-sm rounded-lg hover:bg-red-600/30 font-semibold transition"
                      >
                        Reject
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
