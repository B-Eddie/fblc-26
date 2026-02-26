'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { MapPin, Phone, Mail, Globe, ArrowLeft, Star } from 'lucide-react'
import RatingSubmissionForm from '@/components/RatingSubmissionForm'
import CouponsDisplay from '@/components/CouponsDisplay'
import BusinessFavoriteButton from '@/components/BusinessFavoriteButton'

type Business = {
  id: string
  name: string
  description: string
  category: string
  address: string
  city: string
  province: string
  postal_code: string
  phone: string | null
  email: string | null
  website: string | null
  image_url: string | null
  latitude: number
  longitude: number
}

type Coupon = {
  id: string
  title: string
  description: string
  discount_percent: number | null
  discount_amount: number | null
  coupon_code: string | null
  expiry_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type Rating = {
  id: string
  rating: number
  review: string | null
  profile: {
    full_name: string | null
  }
  created_at: string
}

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [userRating, setUserRating] = useState<Rating | null>(null)

  useEffect(() => {
    fetchBusinessDetails()
  }, [params.id])

  const fetchBusinessDetails = async () => {
    try {
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (businessError) throw businessError
      setBusiness(businessData)

      // Fetch coupons
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', params.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setCoupons(couponsData || [])

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('*, profile:profiles(full_name)')
        .eq('business_id', params.id)
        .order('created_at', { ascending: false })

      const ratingsList = (ratingsData as any) || []
      setRatings(ratingsList)

      if (ratingsList.length > 0) {
        const avg =
          ratingsList.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratingsList.length
        setAverageRating(avg)
      }

      // Check if user has favorited this business
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: favoriteData } = await supabase
          .from('business_favorites')
          .select('*')
          .eq('profile_id', user.id)
          .eq('business_id', params.id)
          .single()

        setIsFavorited(!!favoriteData)

        // Check if user has rated this business
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('*, profile:profiles(full_name)')
          .eq('profile_id', user.id)
          .eq('business_id', params.id)
          .single()

        if (userRatingData) {
          setUserRating(userRatingData)
        }
      }
    } catch (error) {
      console.error('Error fetching business details:', error)
    } finally {
      setLoading(false)
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Business not found</h1>
          <Link href="/browse" className="text-gray-400 hover:text-gray-300 transition">
            Back to Browse
          </Link>
        </div>
      </div>
    )
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
      </div>

      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
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
            <Link
              href="/browse"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse</span>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-2xl p-8 mb-8 backdrop-blur-sm"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block px-4 py-2 bg-gray-700/30 text-gray-300 text-sm font-semibold rounded-full mb-4 border border-gray-600/30">
                {business.category}
              </span>
              <h1 className="text-5xl font-bold mb-3 font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent">
                {business.name}
              </h1>
            </div>
            {averageRating > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2 bg-yellow-600/20 px-6 py-3 rounded-xl border border-yellow-600/30"
              >
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                <div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-yellow-400/80">
                    ({ratings.length} reviews)
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <p className="text-gray-300 text-lg mb-6 leading-relaxed">{business.description}</p>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-gray-300">
                  {business.address}, {business.city}
                </p>
              </div>
            </div>
            {business.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-gray-300 hover:text-gray-200 transition"
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}
            {business.email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-gray-300 hover:text-gray-200 transition break-all"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}
            {business.website && (
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Website</p>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-gray-200 transition truncate"
                  >
                    Visit
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center lg:justify-start">
              <BusinessFavoriteButton
                businessId={business.id}
                isInitiallyFavorited={isFavorited}
              />
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Coupons */}
            {coupons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm"
              >
                <CouponsDisplay coupons={coupons} />
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
              {ratings.length === 0 ? (
                <p className="text-gray-400">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-6">
                  {ratings.map((rating, index) => (
                    <motion.div
                      key={rating.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 pb-6 last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex gap-1">
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
                          <p className="text-sm text-gray-400 mt-2">
                            {rating.profile.full_name || 'Anonymous'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {rating.review && (
                        <p className="text-gray-300 leading-relaxed">{rating.review}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-24"
            >
              <RatingSubmissionForm
                businessId={business.id}
                onRatingAdded={fetchBusinessDetails}
                existingRating={userRating?.rating}
                existingReview={userRating?.review || undefined}
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
