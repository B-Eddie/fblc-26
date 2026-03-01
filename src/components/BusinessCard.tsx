"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Ticket, ArrowUpRight } from "lucide-react";
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
  const [imageError, setImageError] = useState(false);

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
    <Link href={`/business/${business.id}`} className="block h-full group">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative h-full rounded-[2rem] bg-[#0a0a0a] border border-[#222] overflow-hidden hover:border-[#4EA8F3]/50 transition-colors duration-500"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#4EA8F3]/0 to-[#4EA8F3]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex flex-col h-full relative z-10 p-2">
          {/* Image Container with inner shadow and rounded corners */}
          <motion.div
            className="h-56 relative overflow-hidden rounded-[1.5rem] bg-[#111] border border-[#222]"
            whileHover={{ scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {business.image_url && !imageError ? (
              <img
                src={business.image_url}
                alt={business.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                <div className="text-[#333] text-7xl font-drama font-bold opacity-30">
                  {business.name.charAt(0)}
                </div>
              </div>
            )}

            {/* Top gradient overlay */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white font-mono text-[10px] uppercase tracking-widest rounded-full border border-white/10">
                {business.category}
              </span>
            </div>

            {/* Favorite Button */}
            <div className="absolute top-4 right-4 z-10">
              <BusinessFavoriteButton
                businessId={business.id}
                isInitiallyFavorited={isFavorited}
              />
            </div>

            {/* Coupon Badge */}
            {couponCount > 0 && (
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#4EA8F3]/20 backdrop-blur-md text-[#4EA8F3] font-mono text-[10px] uppercase tracking-widest font-bold rounded-full border border-[#4EA8F3]/30 flex items-center space-x-1.5 shadow-lg">
                <Ticket className="w-3.5 h-3.5" />
                <span>{couponCount} Deals</span>
              </div>
            )}
          </motion.div>

          {/* Content Area */}
          <div className="px-6 py-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-heading font-bold tracking-tight text-white line-clamp-2 group-hover:text-[#4EA8F3] transition-colors">
                {business.name}
              </h3>
              {averageRating > 0 && (
                <div className="flex items-center gap-1.5 bg-[#111] px-2 py-1 rounded-md border border-[#222]">
                  <Star className="w-3 h-3 fill-[#4EA8F3] text-[#4EA8F3]" />
                  <span className="font-mono text-[10px] text-white font-medium">{averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <p className="text-ink-muted text-sm line-clamp-2 leading-relaxed flex-1 font-sans">
              {business.description}
            </p>

            {/* Info Footer */}
            <div className="mt-8 pt-6 border-t border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-ink-faint" />
                <span className="font-mono text-xs">{business.city}</span>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-[#111] border border-[#333] flex items-center justify-center group-hover:bg-[#4EA8F3] group-hover:border-[#4EA8F3] transition-colors duration-300">
                <ArrowUpRight className="w-4 h-4 text-ink-muted group-hover:text-black transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
