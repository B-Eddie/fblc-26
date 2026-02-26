'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Clock, Bookmark, CheckCircle, TrendingUp, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)
  const [goalHours, setGoalHours] = useState(40)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchDashboardData(user.id)
  }

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(profileData)

      // Fetch applications with opportunity and business details
      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities (
            title,
            business:businesses (
              name,
              category
            )
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      setApplications(appsData || [])

      // Calculate total hours
      const appsList = (appsData as any) || []
      const completed = appsList.filter((app: any) => app.status === 'completed')
      const total = completed.reduce((sum: number, app: any) => sum + (app.hours_completed || 0), 0)
      setTotalHours(total)

      // Fetch bookmarks
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select(`
          *,
          opportunity:opportunities (
            id,
            title,
            hours_available,
            business:businesses (
              name,
              category,
              city
            )
          )
        `)
        .eq('profile_id', userId)

      setBookmarks(bookmarksData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const chartData = [
    { month: 'Completed', hours: totalHours },
    { month: 'Remaining', hours: Math.max(0, goalHours - totalHours) },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400',
    accepted: 'bg-green-600/20 text-green-400',
    rejected: 'bg-red-600/20 text-red-400',
    completed: 'bg-blue-600/20 text-blue-400',
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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold text-white">Vertex</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="px-4 py-2 text-gray-400 hover:text-white transition">
                Browse
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            Welcome back, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-gray-400 mt-2">Track your volunteer hours and manage your applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Hours</p>
                <p className="text-3xl font-bold text-white mt-1">{totalHours}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Goal Progress</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {Math.round((totalHours / goalHours) * 100)}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Applications</p>
                <p className="text-3xl font-bold text-white mt-1">{applications.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Bookmarks</p>
                <p className="text-3xl font-bold text-white mt-1">{bookmarks.length}</p>
              </div>
              <Bookmark className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Hours Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <p className="text-center text-gray-300">
              <span className="font-bold text-blue-400">{Math.max(0, goalHours - totalHours)} hours</span> remaining to reach your goal of {goalHours} hours
            </p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Applications</h2>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You haven't applied to any opportunities yet</p>
              <Link href="/browse" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-800 rounded-lg p-4 hover:border-blue-600/50 transition bg-gray-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{app.opportunity.title}</h3>
                      <p className="text-gray-400">{app.opportunity.business.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Category: {app.opportunity.business.category}
                      </p>
                      {app.hours_completed > 0 && (
                        <p className="text-sm text-blue-400 mt-1 font-medium">
                          Completed: {app.hours_completed} hours
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[app.status]}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarked Opportunities */}
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Saved Opportunities</h2>
          {bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No saved opportunities yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <Link
                  key={bookmark.id}
                  href={`/opportunities/${bookmark.opportunity.id}`}
                  className="border border-gray-800 rounded-lg p-4 hover:border-blue-600/50 transition bg-gray-900/50"
                >
                  <h3 className="font-semibold text-white">{bookmark.opportunity.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{bookmark.opportunity.business.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {bookmark.opportunity.hours_available} hours • {bookmark.opportunity.business.city}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
