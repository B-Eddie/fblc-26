'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MapPin, Clock, Star, Bookmark, ArrowLeft, Send } from 'lucide-react'

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<any>(null)
  const [ratings, setRatings] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOpportunity()
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      // Fetch opportunity with business details
      const { data: oppData, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          business:businesses (
            *
          )
        `)
        .eq('id', params.id)
        .single()

      if (oppError) throw oppError
      setOpportunity(oppData)

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('*, profile:profiles(full_name)')
        .eq('business_id', oppData.business.id)
        .order('created_at', { ascending: false })

      const ratingsList = (ratingsData as any) || []
      if (ratingsList.length > 0) {
        setRatings(ratingsList)
        const avg = ratingsList.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingsList.length
        setAverageRating(avg)
      }

      // Check if user has applied
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: appData } = await supabase
          .from('applications')
          .select('*')
          .eq('profile_id', user.id)
          .eq('opportunity_id', params.id)
          .single()

        if (appData) setHasApplied(true)
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('applications')
        .insert([{
          profile_id: user.id,
          opportunity_id: params.id,
          message: applicationMessage,
          status: 'pending',
        }] as any)

      if (error) throw error

      alert('Application submitted successfully!')
      setHasApplied(true)
      setApplicationMessage('')
    } catch (error: any) {
      alert('Error submitting application: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-400">Loading opportunity...</p>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Opportunity not found</h1>
          <Link href="/browse" className="text-blue-400 hover:text-blue-300 transition">
            Back to Browse
          </Link>
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold text-white">Vertex</span>
            </Link>
            <Link href="/browse" className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Header */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-semibold rounded-full mb-3">
                {opportunity.business.category}
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">{opportunity.title}</h1>
              <p className="text-xl text-gray-300">{opportunity.business.name}</p>
            </div>
            {averageRating > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-600/20 px-4 py-2 rounded-lg border border-yellow-600/30">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-400">{averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>{opportunity.hours_available} hours available</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{opportunity.business.city}, {opportunity.business.province}</span>
            </div>
            {opportunity.is_flexible && (
              <div className="flex items-center space-x-2">
                <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-600/30">
                  Flexible Schedule
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">About This Opportunity</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
            </div>

            {/* Requirements */}
            {opportunity.requirements && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Requirements</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{opportunity.requirements}</p>
              </div>
            )}

            {/* Perks */}
            {opportunity.perks && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Perks & Benefits</h2>
                <p className="text-gray-300 leading-relaxed">✨ {opportunity.perks}</p>
              </div>
            )}

            {/* Ratings */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Reviews</h2>
              {ratings.length === 0 ? (
                <p className="text-gray-400">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border-b border-gray-800 pb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400">{rating.profile.full_name}</span>
                      </div>
                      {rating.review && <p className="text-gray-300">{rating.review}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Apply Card */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">Apply Now</h3>
              
              {hasApplied ? (
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-medium">You've already applied!</p>
                  <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition">
                    View in dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Why are you interested in this opportunity? (optional)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </div>
              )}

              {/* Business Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="font-semibold text-white mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  {opportunity.business.phone && (
                    <p>📞 {opportunity.business.phone}</p>
                  )}
                  {opportunity.business.email && (
                    <p>✉️ {opportunity.business.email}</p>
                  )}
                  {opportunity.business.website && (
                    <a 
                      href={opportunity.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 block transition"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                  <p>📍 {opportunity.business.address}</p>
                  <p>{opportunity.business.city}, {opportunity.business.province} {opportunity.business.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
