'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Clock, Star, Bookmark, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type OpportunityCardProps = {
  opportunity: {
    id: string
    title: string
    description: string
    hours_available: number
    is_flexible: boolean
    perks: string | null
    image_url?: string | null
    business: {
      id: string
      name: string
      category: string
      city: string
      image_url: string | null
    }
    averageRating?: number
  }
  index?: number
}

export default function OpportunityCard({ opportunity, index = 0 }: OpportunityCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in to bookmark opportunities')
      return
    }

    if (isBookmarked) {
      // Remove bookmark
      await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', user.id)
        .eq('opportunity_id', opportunity.id)
      setIsBookmarked(false)
    } else {
      // Add bookmark
      await supabase
        .from('bookmarks')
        .insert([{
          profile_id: user.id,
          opportunity_id: opportunity.id,
        }] as any)
      setIsBookmarked(true)
    }
  }

  return (
    <Link href={`/opportunities/${opportunity.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
        whileHover={{ y: -8 }}
        className="group h-full"
      >
        <div className="relative bg-gray-900/40 border border-gray-800/60 rounded-2xl hover:border-gray-600/40 transition-all duration-300 overflow-hidden h-full flex flex-col backdrop-blur-sm">
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300 pointer-events-none" />

          {/* Image Container */}
          <motion.div
            className="h-48 bg-gray-800/50 relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            {(opportunity.image_url || opportunity.business.image_url) ? (
              <img 
                src={opportunity.image_url || opportunity.business.image_url || ""} 
                alt={opportunity.business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600/20 via-gray-700/20 to-gray-600/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="text-gray-400 text-6xl font-bold opacity-30"
                >
                  {opportunity.business.name.charAt(0)}
                </motion.div>
              </div>
            )}

            {/* Category Badge */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 left-3 px-3 py-1 bg-gray-600/80 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-gray-500/30"
            >
              {opportunity.business.category}
            </motion.span>

            {/* Bookmark Button */}
            <motion.button
              onClick={handleBookmark}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-3 right-3 p-2 bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm rounded-full hover:shadow-lg hover:shadow-gray-600/50 transition border border-gray-500/30"
            >
              {isBookmarked ? (
                <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
              ) : (
                <Bookmark className="w-5 h-5 text-white" />
              )}
            </motion.button>

            {/* Flexibility Badge */}
            {opportunity.is_flexible && (
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-3 right-16 px-3 py-1 bg-gray-600/80 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-gray-500/30"
              >
                Flexible
              </motion.span>
            )}
          </motion.div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col relative z-10">
            {/* Title */}
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition"
            >
              {opportunity.title}
            </motion.h3>

            {/* Business Name */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-gray-400 font-medium mb-3 text-sm"
            >
              {opportunity.business.name}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1"
            >
              {opportunity.description}
            </motion.p>

            {/* Info Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-between text-sm text-gray-400 mb-4"
            >
              <div className="flex items-center space-x-1 hover:text-purple-400 transition">
                <Clock className="w-4 h-4" />
                <span>{opportunity.hours_available} hrs</span>
              </div>
              <div className="flex items-center space-x-1 hover:text-blue-400 transition">
                <MapPin className="w-4 h-4" />
                <span>{opportunity.business.city}</span>
              </div>
            </motion.div>

            {/* Rating and Rating Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between pt-4 border-t border-gray-800/50"
            >
              <motion.div
                className="flex items-center space-x-1"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotateZ: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-4 h-4 fill-purple-400 text-purple-400" />
                </motion.div>
                <span className="text-sm font-medium text-gray-300">
                  {opportunity.averageRating ? opportunity.averageRating.toFixed(1) : 'New'}
                </span>
              </motion.div>
            </motion.div>

            {/* Perks */}
            {opportunity.perks && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-3 text-xs text-gray-300 font-medium bg-gray-600/10 px-3 py-2 rounded-lg border border-gray-500/20"
              >
                ✨ {opportunity.perks}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
