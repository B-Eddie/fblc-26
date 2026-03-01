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
      
      if (!oppData?.business) {
        setOpportunity(null);
        setLoading(false);
        return;
      }
      
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#333] border-t-[#4EA8F3] rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#333] border-t-[#4EA8F3]"></div>
          <p className="mt-4 text-ink-muted font-mono">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center card-surface p-12">
          <h1 className="text-2xl font-bold font-heading text-white mb-4">
            Opportunity not found
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
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain filter grayscale brightness-200" />
              </div>
              <span className="text-xl font-bold font-heading tracking-tight text-white">Vertex</span>
            </Link>
            <Link
              href="/browse"
              className="flex items-center space-x-2 text-sm font-medium text-ink-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.1] pointer-events-none" />
        
        {/* Business Header */}
        <div className="relative z-10 card-surface p-8 mb-8 backdrop-blur-sm bg-[#0a0a0a]/90">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <span className="inline-block px-3 py-1.5 bg-[#4EA8F3]/10 text-[#4EA8F3] border border-[#4EA8F3]/30 font-mono text-[10px] uppercase tracking-widest rounded-full mb-6">
                {opportunity.business.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight text-white mb-4 leading-tight">
                {opportunity.title}
              </h1>
              <Link
                href={`/business/${opportunity.business.id}`}
                className="inline-flex items-center space-x-2 text-lg font-mono uppercase tracking-widest text-ink-muted hover:text-[#4EA8F3] transition-colors"
              >
                <span>{opportunity.business.name}</span>
                <span className="text-[#4EA8F3]">→</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {averageRating > 0 && (
                <div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#333]">
                  <Star className="w-5 h-5 fill-[#4EA8F3] text-[#4EA8F3]" />
                  <span className="text-xl font-bold font-heading text-white">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#2a2a2a] text-ink-muted font-mono text-sm">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-white" />
              <span>{opportunity.hours_available} hours available</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-white" />
              <span>
                {opportunity.business.city}, {opportunity.business.province}
              </span>
            </div>
            {opportunity.is_flexible && (
              <div className="flex items-center space-x-3">
                <span className="bg-[#4EA8F3]/10 text-[#4EA8F3] border border-[#4EA8F3]/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold">
                  Flexible Schedule
                </span>
              </div>
            )}
          </div>
        </div>

        {(opportunity as any).image_url && (
          <div className="rounded-[2rem] overflow-hidden border border-[#2a2a2a] mb-8 h-64 md:h-96">
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
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                About This Opportunity
              </h2>
              <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>

            {/* Requirements */}
            {opportunity.requirements && (
              <div className="card-surface p-8">
                <h2 className="text-2xl font-bold font-heading text-white mb-6">
                  Requirements
                </h2>
                <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                  {opportunity.requirements}
                </p>
              </div>
            )}

            {/* Perks */}
            {opportunity.perks && (
              <div className="card-surface p-8">
                <h2 className="text-2xl font-bold font-heading text-white mb-6">
                  Perks & Benefits
                </h2>
                <p className="text-ink-muted leading-relaxed">
                  ✨ {opportunity.perks}
                </p>
              </div>
            )}

            {/* Coupons */}
            {coupons.length > 0 && (
              <div className="card-surface p-8">
                <CouponsDisplay coupons={coupons} />
              </div>
            )}

            {/* Ratings */}
            <div className="card-surface p-8">
              <div className="mb-10">
                <h2 className="text-2xl font-bold font-heading text-white mb-2">
                  Reviews & Ratings
                </h2>
                <p className="text-ink-muted text-sm font-mono mb-8">
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
                <div className="mt-10 pt-10 border-t border-[#2a2a2a]">
                  <h3 className="text-xl font-bold font-heading text-white mb-8">
                    What Others Are Saying
                  </h3>
                  <div className="space-y-6">
                    {ratings.map((rating) => (
                      <div
                        key={rating.id}
                        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#444] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold font-heading text-white text-lg">
                                {rating.profile?.full_name || "Anonymous"}
                              </span>
                              <span className="text-ink-faint">•</span>
                              <span className="font-mono text-xs text-ink-muted">
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
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.rating
                                      ? "fill-[#4EA8F3] text-[#4EA8F3]"
                                      : "text-[#333]"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {rating.review && (
                          <p className="text-ink-muted leading-relaxed text-sm">
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
            <div className="card-surface p-6 sticky top-24">
              <h3 className="text-xl font-bold font-heading text-white mb-6">Apply Now</h3>

              {hasApplied ? (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
                  <p className="text-[#4EA8F3] font-bold font-heading text-lg mb-2">
                    You've already applied!
                  </p>
                  <Link
                    href="/dashboard"
                    className="text-ink-muted hover:text-white text-sm inline-block transition-colors"
                  >
                    View in dashboard →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-ink-muted text-sm leading-relaxed">
                    Interested in this opportunity? Submit a full application with your details, resume, and more.
                  </p>
                  <Link
                    href={`/opportunities/${params.id}/apply`}
                    className="btn-magnetic w-full flex bg-white text-black px-6 py-4 rounded-full text-base font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      <span>Submit Application</span>
                    </span>
                    <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
                  </Link>
                </div>
              )}

              {/* Business Contact Info */}
              <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                <h4 className="font-bold font-heading text-white mb-4">
                  Contact Information
                </h4>
                <div className="space-y-4 text-sm text-ink-muted font-mono">
                  {opportunity.business.phone && (
                    <p className="flex items-center gap-3">
                      <span className="text-white">📞</span> {opportunity.business.phone}
                    </p>
                  )}
                  {opportunity.business.email && (
                    <p className="flex items-center gap-3">
                      <span className="text-white">✉️</span> {opportunity.business.email}
                    </p>
                  )}
                  {opportunity.business.website && (
                    <a
                      href={opportunity.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:text-[#4EA8F3] transition-colors"
                    >
                      <span className="text-white">🌐</span> Visit Website
                    </a>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-white">📍</span>
                    <div>
                      <p>{opportunity.business.address}</p>
                      <p>
                        {opportunity.business.city}, {opportunity.business.province}{" "}
                        {opportunity.business.postal_code}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/business/${opportunity.business.id}`}
                    className="block hover:text-[#4EA8F3] transition-colors font-bold mt-6 uppercase tracking-wider text-xs"
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
