"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Ticket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BusinessFavoriteButton from "./BusinessFavoriteButton";

type BusinessCardProps = {
  business: {
    id: string;
    name: string;
    description: string;
    category: string;
    city: string;
    image_url: string | null;
  };
  index?: number;
};

export default function BusinessCard({
  business,
  index = 0,
}: BusinessCardProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [couponCount, setCouponCount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, [business.id]);

  const fetchBusinessData = async () => {
    try {
      // Fetch ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select("rating")
        .eq("business_id", business.id);

      if (ratings && ratings.length > 0) {
        const avg =
          ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratings.length;
        setAverageRating(avg);
      }

      // Fetch active coupons
      const { data: coupons } = await supabase
        .from("coupons")
        .select("id")
        .eq("business_id", business.id)
        .eq("is_active", true);

      setCouponCount(coupons?.length || 0);

      // Check if favorited
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: fav } = await supabase
          .from("business_favorites")
          .select("id")
          .eq("profile_id", user.id)
          .eq("business_id", business.id)
          .single();

        setIsFavorited(!!fav);
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    }
  };

  return (
    <Link href={`/business/${business.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
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
            {business.image_url ? (
              <img
                src={business.image_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600/20 via-gray-700/20 to-gray-600/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="text-gray-400 text-6xl font-bold opacity-30"
                >
                  {business.name.charAt(0)}
                </motion.div>
              </div>
            )}

            {/* Category Badge */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="absolute top-4 left-4 px-3 py-1 bg-gray-900/80 text-gray-300 text-xs font-semibold rounded-full border border-gray-700/50 backdrop-blur-sm"
            >
              {business.category}
            </motion.span>

            {/* Favorite Button */}
            <div className="absolute top-4 right-4 z-10 pointer-events-auto">
              <BusinessFavoriteButton
                businessId={business.id}
                isInitiallyFavorited={isFavorited}
              />
            </div>

            {/* Coupon Badge */}
            {couponCount > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 right-4 px-2 py-1 bg-purple-600/80 text-purple-100 text-xs font-semibold rounded flex items-center space-x-1 backdrop-blur-sm"
              >
                <Ticket className="w-3 h-3" />
                <span>{couponCount}</span>
              </motion.span>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col relative z-10">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-gray-100 transition">
                {business.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {business.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/40">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{business.city}</span>
              </div>

              {averageRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-400">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
