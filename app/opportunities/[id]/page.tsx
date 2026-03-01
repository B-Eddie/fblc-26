"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MapPin, Clock, Star, Bookmark, ArrowLeft, Send } from "lucide-react";
import RatingSubmissionForm from "@/components/RatingSubmissionForm";
import CouponsDisplay from "@/components/CouponsDisplay";
import BusinessFavoriteButton from "@/components/BusinessFavoriteButton";

export default function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const redirectBusinessUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingRole(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if ((profile as any)?.role === "business") {
        router.replace("/business/dashboard");
        return;
      }
      setCheckingRole(false);
    };
    redirectBusinessUser();
  }, [router]);

  useEffect(() => {
    if (checkingRole) return;
    fetchOpportunity();
  }, [params.id, checkingRole]);

  const fetchOpportunity = async () => {
    try {
      // Fetch opportunity with business details
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select(
          `
          *,
          business:businesses (
            *
          )
        `,
        )
        .eq("id", params.id)
        .single();

      if (oppError) throw oppError;
      setOpportunity(oppData);

      // Fetch coupons
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .eq("business_id", oppData.business.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setCoupons(couponsData || []);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("*, profile:profiles(full_name)")
        .eq("business_id", oppData.business.id)
        .order("created_at", { ascending: false });

      const ratingsList = (ratingsData as any) || [];
      if (ratingsList.length > 0) {
        setRatings(ratingsList);
        const avg =
          ratingsList.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratingsList.length;
        setAverageRating(avg);
      }

      // Check if user has applied
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: appData } = await supabase
          .from("applications")
          .select("*")
          .eq("profile_id", user.id)
          .eq("opportunity_id", params.id)
          .single();

        if (appData) setHasApplied(true);

        // Check if user has favorited this business
        const { data: favoriteData } = await supabase
          .from("business_favorites")
          .select("*")
          .eq("profile_id", user.id)
          .eq("business_id", oppData.business.id)
          .single();

        setIsFavorited(!!favoriteData);

        // Check if user has rated this business
        const { data: userRatingData } = await supabase
          .from("ratings")
          .select("*, profile:profiles(full_name)")
          .eq("profile_id", user.id)
          .eq("business_id", oppData.business.id)
          .single();

        if (userRatingData) {
          setUserRating(userRatingData);
        }
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700/30 border-t-gray-700"></div>
          <p className="mt-4 text-gray-400">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Opportunity not found
          </h1>
          <Link
            href="/browse"
            className="text-gray-400 hover:text-gray-300 transition"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/image.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-2xl font-bold text-white">Vertex</span>
            </Link>
            <Link
              href="/browse"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Header */}
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-gray-600/20 text-gray-300 text-sm font-semibold rounded-full mb-3">
                {opportunity.business.category}
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">
                {opportunity.title}
              </h1>
              <Link
                href={`/business/${opportunity.business.id}`}
                className="text-xl text-gray-300 hover:text-gray-100 transition"
              >
                {opportunity.business.name} →
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {averageRating > 0 && (
                <div className="flex items-center space-x-2 bg-yellow-600/20 px-4 py-2 rounded-lg border border-yellow-600/30">
                  <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-400">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              <BusinessFavoriteButton
                businessId={opportunity.business.id}
                isInitiallyFavorited={isFavorited}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>{opportunity.hours_available} hours available</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span>
                {opportunity.business.city}, {opportunity.business.province}
              </span>
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

        {(opportunity as any).image_url && (
          <div className="rounded-xl overflow-hidden border border-gray-800/60 mb-8 h-64 md:h-80">
            <img
              src={(opportunity as any).image_url}
              alt={opportunity.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                About This Opportunity
              </h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>

            {/* Requirements */}
            {opportunity.requirements && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Requirements
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {opportunity.requirements}
                </p>
              </div>
            )}

            {/* Perks */}
            {opportunity.perks && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Perks & Benefits
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  ✨ {opportunity.perks}
                </p>
              </div>
            )}

            {/* Coupons */}
            {coupons.length > 0 && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <CouponsDisplay coupons={coupons} />
              </div>
            )}

            {/* Ratings */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Reviews & Ratings
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {ratings.length > 0
                    ? `${ratings.length} review${ratings.length !== 1 ? "s" : ""} from students`
                    : "Be the first to share your experience"}
                </p>

                {/* Review Submission Form */}
                <RatingSubmissionForm
                  businessId={opportunity.business.id}
                  onRatingAdded={fetchOpportunity}
                  existingRating={userRating?.rating}
                  existingReview={userRating?.review || undefined}
                />
              </div>

              {/* Reviews List */}
              {ratings.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    What Others Are Saying
                  </h3>
                  <div className="space-y-6">
                    {ratings.map((rating) => (
                      <div
                        key={rating.id}
                        className="bg-gray-900/40 border border-gray-800/50 rounded-lg p-5 hover:border-gray-700/60 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">
                                {rating.profile.full_name}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(rating.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {rating.review && (
                          <p className="text-gray-300 leading-relaxed">
                            {rating.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Card */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">Apply Now</h3>

              {hasApplied ? (
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-medium">
                    You've already applied!
                  </p>
                  <Link
                    href="/dashboard"
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition"
                  >
                    View in dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Interested in this opportunity? Submit a full application with your details, resume, and more.
                  </p>
                  <Link
                    href={`/opportunities/${params.id}/apply`}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </Link>
                </div>
              )}

              {/* Business Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="font-semibold text-white mb-3">
                  Contact Information
                </h4>
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
                      className="text-gray-400 hover:text-gray-300 block transition"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                  <p>📍 {opportunity.business.address}</p>
                  <p>
                    {opportunity.business.city}, {opportunity.business.province}{" "}
                    {opportunity.business.postal_code}
                  </p>
                  <Link
                    href={`/business/${opportunity.business.id}`}
                    className="text-gray-400 hover:text-gray-300 block transition font-semibold mt-3"
                  >
                    View Business Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
