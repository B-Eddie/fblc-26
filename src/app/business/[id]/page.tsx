"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { MapPin, Phone, Mail, Globe, ArrowLeft, Star } from "lucide-react";
import RatingSubmissionForm from "@/components/RatingSubmissionForm";
import CouponsDisplay from "@/components/CouponsDisplay";
import BusinessFavoriteButton from "@/components/BusinessFavoriteButton";

type Business = {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
};

type Coupon = {
  id: string;
  title: string;
  description: string;
  discount_percent: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Rating = {
  id: string;
  rating: number;
  review: string | null;
  profile: {
    full_name: string | null;
  };
  created_at: string;
};

export default function BusinessDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState<Rating | null>(null);

  useEffect(() => {
    fetchBusinessDetails();
  }, [params.id]);

  const fetchBusinessDetails = async () => {
    try {
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", params.id)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Fetch coupons
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .eq("business_id", params.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setCoupons(couponsData || []);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("*, profile:profiles(full_name)")
        .eq("business_id", params.id)
        .order("created_at", { ascending: false });

      const ratingsList = (ratingsData as any) || [];
      setRatings(ratingsList);

      if (ratingsList.length > 0) {
        const avg =
          ratingsList.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratingsList.length;
        setAverageRating(avg);
      }

      // Check if user has favorited this business
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: favoriteData } = await supabase
          .from("business_favorites")
          .select("*")
          .eq("profile_id", user.id)
          .eq("business_id", params.id)
          .single();

        setIsFavorited(!!favoriteData);

        // Check if user has rated this business
        const { data: userRatingData } = await supabase
          .from("ratings")
          .select("*, profile:profiles(full_name)")
          .eq("profile_id", user.id)
          .eq("business_id", params.id)
          .single();

        if (userRatingData) {
          setUserRating(userRatingData);
        }
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-[#333] border-t-[#4EA8F3] rounded-full"
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center card-surface p-12">
          <h1 className="text-2xl font-bold font-heading text-white mb-4">
            Business not found
          </h1>
          <Link
            href="/browse"
            className="text-ink-muted hover:text-white transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">

      {/* Header */}
      <header className="border-b border-[#222] sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <motion.div
                className="w-8 h-8 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain filter grayscale brightness-200" />
              </motion.div>
              <span className="text-xl font-bold font-heading tracking-tight text-white">
                Vertex
              </span>
            </Link>
            <Link
              href="/browse/businesses"
              className="flex items-center space-x-2 text-sm font-medium text-ink-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.1] pointer-events-none" />

        {/* Business Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 card-surface p-8 mb-12 backdrop-blur-sm bg-[#0a0a0a]/90"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <span className="inline-block px-3 py-1.5 bg-[#4EA8F3]/10 border border-[#4EA8F3]/30 text-[#4EA8F3] text-[10px] font-mono uppercase tracking-widest rounded-full mb-6">
                {business.category}
              </span>
              <h1 className="text-4xl md:text-7xl font-bold mb-4 font-heading tracking-tight text-white leading-tight">
                {business.name}
              </h1>
            </div>
            {averageRating > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-3 bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-[#333]"
              >
                <Star className="w-5 h-5 fill-[#4EA8F3] text-[#4EA8F3]" />
                <div>
                  <div className="text-2xl font-bold font-heading text-white">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                    {ratings.length} reviews
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <p className="text-ink-muted text-lg mb-8 leading-relaxed max-w-4xl">
            {business.description}
          </p>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[#2a2a2a]">
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Location</p>
                <p className="text-white text-sm">
                  {business.address}, {business.city}
                </p>
              </div>
            </div>
            {business.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Phone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-white hover:text-[#4EA8F3] text-sm transition-colors"
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}
            {business.email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Email</p>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-white hover:text-[#4EA8F3] text-sm transition-colors break-all"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}
            {business.website && (
              <div className="flex items-start space-x-3">
                <Globe className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Website</p>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#4EA8F3] text-sm transition-colors truncate"
                  >
                    Visit Site
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center lg:col-span-4 mt-2">
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
                className="card-surface p-8"
              >
                <CouponsDisplay coupons={coupons} />
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-surface p-8"
            >
              <h2 className="text-2xl font-bold font-heading text-white mb-6">Reviews</h2>
              {ratings.length === 0 ? (
                <p className="text-ink-muted font-mono">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <div className="space-y-6">
                  {ratings.map((rating, index) => (
                    <motion.div
                      key={rating.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-[#2a2a2a] pb-6 last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rating.rating
                                    ? "fill-[#4EA8F3] text-[#4EA8F3]"
                                    : "text-[#333]"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm font-bold text-white">
                            {rating.profile.full_name || "Anonymous"}
                          </p>
                        </div>
                        <p className="text-xs font-mono text-ink-faint">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {rating.review && (
                        <p className="text-ink-muted text-sm leading-relaxed mt-3">
                          {rating.review}
                        </p>
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
  );
}
