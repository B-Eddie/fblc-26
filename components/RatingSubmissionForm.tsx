"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RatingSubmissionFormProps = {
  businessId: string;
  onRatingAdded?: () => void;
  existingRating?: number;
  existingReview?: string;
};

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function RatingSubmissionForm({
  businessId,
  onRatingAdded,
  existingRating,
  existingReview,
}: RatingSubmissionFormProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(existingReview || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please log in to submit a rating");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      if (existingRating) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from("ratings")
          .update({
            rating,
            review: review || null,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", user.id)
          .eq("business_id", businessId);

        if (updateError) throw updateError;
      } else {
        // Insert new rating
        const { error: insertError } = await supabase.from("ratings").insert([
          {
            profile_id: user.id,
            business_id: businessId,
            rating,
            review: review || null,
          },
        ] as any);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setRating(0);
      setReview("");
      setTimeout(() => {
        setSuccess(false);
        onRatingAdded?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error submitting rating");
    } finally {
      setSubmitting(false);
    }
  };

  const currentRatingLabel = rating > 0 ? ratingLabels[rating] : null;
  const displayRating = hoverRating || rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-950 border border-gray-800 hover:border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">
          Share Your Experience
        </h3>
        <p className="text-sm text-gray-400">
          Help others make informed decisions
        </p>
      </div>

      {/* Star Rating Section */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-gray-300">
            How would you rate this?
          </label>
          <AnimatePresence mode="wait">
            {currentRatingLabel && (
              <motion.span
                key={rating}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full"
              >
                {currentRatingLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2.5 bg-gray-800/30 p-3 rounded-lg w-fit">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2, y: -4 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition relative group"
            >
              <Star
                className={`w-7 h-7 transition-all duration-200 ${
                  star <= displayRating
                    ? "fill-amber-400 text-amber-400 drop-shadow-lg"
                    : "text-gray-600 group-hover:text-gray-500"
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-gray-800/0 via-gray-800 to-gray-800/0 mb-6" />

      {/* Review Text Section */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Your thoughts{" "}
          <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What stood out to you? Share details about your experience..."
          maxLength={500}
          className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 focus:bg-gray-800/60 transition-all duration-200 resize-none"
          rows={4}
        />
        <div className="mt-2 text-right text-xs text-gray-500">
          {review.length}/500
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3.5 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2.5 text-green-400 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Review submitted successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: submitting ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-amber-500/25 disabled:shadow-none"
      >
        <motion.div
          animate={submitting ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: submitting ? Infinity : 0 }}
        >
          <Send className="w-4 h-4" />
        </motion.div>
        <span>{submitting ? "Submitting..." : "Submit Review"}</span>
      </motion.button>
    </motion.div>
  );
}
