'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type BusinessFavoriteButtonProps = {
  businessId: string
  isInitiallyFavorited?: boolean
}

export default function BusinessFavoriteButton({
  businessId,
  isInitiallyFavorited = false,
}: BusinessFavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in to save favorites')
      return
    }

    setIsLoading(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from('business_favorites')
          .delete()
          .eq('profile_id', user.id)
          .eq('business_id', businessId)
        setIsFavorited(false)
      } else {
        // Add to favorites
        await supabase
          .from('business_favorites')
          .insert([
            {
              profile_id: user.id,
              business_id: businessId,
            },
          ] as any)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className="focus:outline-none transition"
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`w-6 h-6 transition ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      />
    </motion.button>
  )
}
