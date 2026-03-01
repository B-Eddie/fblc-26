"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, Bookmark, Heart, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type OpportunityCardProps = {
  opportunity: {
    id: string;
    title: string;
    description: string;
    hours_available: number;
    is_flexible: boolean;
    perks: string | null;
    image_url?: string | null;
    business: {
      id: string;
      name: string;
      category: string;
      city: string;
      image_url: string | null;
    };
    averageRating?: number;
  };
  index?: number;
  isBookmarked?: boolean;
  onBookmarkToggle?: (opportunityId: string, e: React.MouseEvent) => void;
};

export default function OpportunityCard({
  opportunity,
  index = 0,
  isBookmarked: isBookmarkedProp = false,
  onBookmarkToggle,
}: OpportunityCardProps) {
  const [localBookmarked, setLocalBookmarked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isBookmarked = onBookmarkToggle != null ? isBookmarkedProp : localBookmarked;
  const imageSrc =
    (opportunity as any).image_url ??
    opportunity.image_url ??
    opportunity.business?.image_url ??
    null;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBookmarkToggle) {
      onBookmarkToggle(opportunity.id, e);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("profile_id", user.id).eq("opportunity_id", opportunity.id);
      setLocalBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert([{ profile_id: user.id, opportunity_id: opportunity.id }] as any);
      setLocalBookmarked(true);
    }
  };

  return (
    <Link href={`/opportunities/${opportunity.id}`} className="block h-full group">
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
            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt={opportunity.business.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                <div className="text-[#333] text-7xl font-drama font-bold opacity-30">
                  {opportunity.business.name.charAt(0)}
                </div>
              </div>
            )}
            
            {/* Top gradient overlay for image readability */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white font-mono text-[10px] uppercase tracking-widest rounded-full border border-white/10">
                {opportunity.business.category}
              </span>
              {opportunity.is_flexible && (
                <span className="px-3 py-1.5 bg-[#4EA8F3]/20 backdrop-blur-md text-[#4EA8F3] font-mono text-[10px] uppercase tracking-widest rounded-full border border-[#4EA8F3]/30">
                  Flexible
                </span>
              )}
            </div>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:border-[#4EA8F3] hover:bg-[#4EA8F3]/10 transition-all duration-300"
            >
              <Heart className={`w-4 h-4 transition-colors ${isBookmarked ? 'fill-[#4EA8F3] text-[#4EA8F3]' : 'text-white'}`} />
            </button>
          </motion.div>

          {/* Content Area */}
          <div className="px-6 py-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <p className="text-ink-muted font-mono text-[11px] uppercase tracking-widest">
                {opportunity.business.name}
              </p>
              {opportunity.averageRating ? (
                <div className="flex items-center gap-1.5 bg-[#111] px-2 py-1 rounded-md border border-[#222]">
                  <Star className="w-3 h-3 fill-[#4EA8F3] text-[#4EA8F3]" />
                  <span className="font-mono text-[10px] text-white font-medium">{opportunity.averageRating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            <h3 className="text-2xl font-heading font-bold tracking-tight text-white mb-4 line-clamp-2 group-hover:text-[#4EA8F3] transition-colors">
              {opportunity.title}
            </h3>

            <p className="text-ink-muted text-sm line-clamp-2 leading-relaxed flex-1 font-sans">
              {opportunity.description}
            </p>

            {/* Info Footer */}
            <div className="mt-8 pt-6 border-t border-[#222] flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-ink-faint" />
                  <span className="font-mono text-xs">{opportunity.hours_available}h</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4 text-ink-faint" />
                  <span className="font-mono text-xs">{opportunity.business.city}</span>
                </div>
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
