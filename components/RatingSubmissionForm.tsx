'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type RatingSubmissionFormProps = {
  businessId: string
  onRatingAdded?: () => void
  existingRating?: number
  existingReview?: string
}

export default function RatingSubmissionForm({
  businessId,
  onRatingAdded,
  existingRating,
  existingReview,
}: RatingSubmissionFormProps) {
  const [rating, setRating] = useState(existingRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState(existingReview || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Please log in to submit a rating')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      if (existingRating) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('ratings')
          .update({
            rating,
            review: review || null,
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', user.id)
          .eq('business_id', businessId)

        if (updateError) throw updateError
      } else {
        // Insert new rating
        const { error: insertError } = await supabase
          .from('ratings')
          .insert([
            {
              profile_id: user.id,
              business_id: businessId,
              rating,
              review: review || null,
            },
          ] as any)

        if (insertError) throw insertError
      }

      setSuccess(true)
      setRating(0)
      setReview('')
      setTimeout(() => {
        setSuccess(false)
        onRatingAdded?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error submitting rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-950 border border-gray-800 rounded-xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4">Leave a Review</h3>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Rate this business
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition"
            >
              <Star
                className={`w-8 h-8 transition ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-600'
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this business..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mb-4 p-3 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 text-sm"
        >
          ✓ Rating submitted successfully!
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-semibold transition"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
      </motion.button>
    </motion.div>
  )
}
