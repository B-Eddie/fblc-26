'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Set Up Your Business</h1>
          <p className="text-gray-400 mb-6">You need to create a business profile before posting opportunities.</p>
          <Link
            href="/business/setup"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create Business Profile
          </Link>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400',
    accepted: 'bg-green-600/20 text-green-400',
    rejected: 'bg-red-600/20 text-red-400',
    completed: 'bg-blue-600/20 text-blue-400',
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold text-white">Vertex</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">{business.name}</h1>
          <p className="text-gray-400 mt-2">{business.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Opportunities</p>
                <p className="text-3xl font-bold text-white mt-1">{opportunities.length}</p>
              </div>
              <MapPin className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Applications</p>
                <p className="text-3xl font-bold text-white mt-1">{applications.length}</p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Reviews</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Opportunities</h2>
            <Link
              href="/business/opportunities/new"
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Post New Opportunity</span>
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You haven't posted any opportunities yet</p>
              <Link
                href="/business/opportunities/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Post Your First Opportunity
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div key={opp.id} className="border border-gray-800 rounded-lg p-4 hover:border-blue-600/50 transition bg-gray-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{opp.title}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{opp.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{opp.hours_available} hours</span>
                        {opp.is_flexible && <span className="text-green-400">Flexible</span>}
                      </div>
                    </div>
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Applications</h2>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{app.profile.full_name}</h3>
                      <p className="text-sm text-gray-400">{app.profile.email}</p>
                      <p className="text-sm text-gray-500 mt-1">Applied to: {app.opportunity.title}</p>
                      {app.message && (
                        <p className="text-sm text-gray-300 mt-2 italic">"{app.message}"</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex space-x-3 mt-3">
                      <button
                        onClick={() => handleStatusUpdate(app.id, 'accepted')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
