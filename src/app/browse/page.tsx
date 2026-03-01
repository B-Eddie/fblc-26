"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { MapPin, Search, Filter, ArrowRight, Bookmark } from "lucide-react";
import OpportunityCard from "@/components/OpportunityCard";
import FloatingNav from "@/components/FloatingNav";

// Dynamically import the map component (client-side only)
const OpportunityMap = dynamic(() => import("@/components/OpportunityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[#0a0a0a] rounded-2xl flex items-center justify-center border border-[#2a2a2a]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-8 h-8 border-2 border-[#333] border-t-[#4EA8F3] rounded-full" />
      </motion.div>
    </div>
  ),
});

type Opportunity = {
  id: string;
  title: string;
  description: string;
  hours_available: number;
  is_flexible: boolean;
  perks: string | null;
  image_url: string | null;
  business: {
    id: string;
    name: string;
    category: string;
    city: string;
    latitude: number;
    longitude: number;
    image_url: string | null;
  };
  averageRating?: number;
};

const categories = [
  "All",
  "Food",
  "Retail",
  "Services",
  "Healthcare",
  "Education",
  "Other",
];

export default function BrowsePage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    Opportunity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "flexible">(
    "rating",
  );
  const [showMap, setShowMap] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => {
    const redirectBusinessUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    fetchOpportunities();
    fetchBookmarks();
  }, [checkingRole]);

  useEffect(() => {
    filterOpportunities();
  }, [
    opportunities,
    searchQuery,
    selectedCategory,
    sortBy,
    showBookmarksOnly,
    bookmarkedIds,
  ]);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          `
          id,
          title,
          description,
          requirements,
          hours_available,
          start_date,
          end_date,
          is_flexible,
          perks,
          image_url,
          business_id,
          created_at,
          updated_at,
          business:businesses (
            id,
            name,
            category,
            city,
            latitude,
            longitude,
            image_url
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch ratings for each business
      const oppsWithRatings = await Promise.all(
        (data || []).map(async (opp: any) => {
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("business_id", opp.business.id);

          const ratingsList = (ratings as any) || [];
          const averageRating =
            ratingsList.length > 0
              ? ratingsList.reduce((sum: number, r: any) => sum + r.rating, 0) /
                ratingsList.length
              : 0;

          return {
            ...opp,
            averageRating,
          };
        }),
      );

      setOpportunities(oppsWithRatings);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBookmarkedIds(new Set());
        return;
      }

      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("opportunity_id")
        .eq("profile_id", user.id);

      const ids = new Set((bookmarks || []).map((b: any) => b.opportunity_id));
      setBookmarkedIds(ids);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const handleBookmarkToggle = async (
    opportunityId: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in to bookmark opportunities");
      return;
    }

    if (bookmarkedIds.has(opportunityId)) {
      // Remove bookmark
      await supabase
        .from("bookmarks")
        .delete()
        .eq("profile_id", user.id)
        .eq("opportunity_id", opportunityId);

      const newIds = new Set(bookmarkedIds);
      newIds.delete(opportunityId);
      setBookmarkedIds(newIds);
    } else {
      // Add bookmark
      await supabase.from("bookmarks").insert([
        {
          profile_id: user.id,
          opportunity_id: opportunityId,
        },
      ] as any);

      setBookmarkedIds(new Set(bookmarkedIds).add(opportunityId));
    }
  };

  const filterOpportunities = () => {
    let filtered = [...opportunities];

    // Filter by bookmarks
    if (showBookmarksOnly) {
      filtered = filtered.filter((opp) => bookmarkedIds.has(opp.id));
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (opp) =>
          opp.business.category.toLowerCase() ===
          selectedCategory.toLowerCase(),
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    if (sortBy === "rating") {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === "flexible") {
      filtered.sort(
        (a, b) => (b.is_flexible ? 1 : 0) - (a.is_flexible ? 1 : 0),
      );
    }

    setFilteredOpportunities(filtered);
  };

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#333] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <FloatingNav />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 relative z-10"
        >
          <p className="font-mono text-[#4EA8F3] text-sm uppercase tracking-widest mb-6">Discovery Protocol</p>
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter text-white mb-6 leading-tight">
            Find <span className="font-drama italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">meaningful</span> <br/>
            <span className="text-[#4EA8F3]">local work.</span>
          </h1>
          <p className="text-ink-muted text-lg md:text-xl font-sans max-w-2xl leading-relaxed">
            Scan for legitimate local opportunities. Real effort, tangible impact, zero friction.
          </p>
        </motion.div>

        {/* Business Discovery Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-12 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4EA8F3]/20 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <Link href="/browse/businesses">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-[2rem] p-8 hover:border-[#4EA8F3]/50 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#4EA8F3] opacity-5 blur-[100px] pointer-events-none" />
              <div className="relative z-10 mb-4 md:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#4EA8F3] pulse-dot" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#4EA8F3]">Business Directory</span>
                </div>
                <h3 className="text-2xl font-bold font-heading text-white group-hover:text-[#4EA8F3] transition-colors">
                  Explore Local Businesses
                </h3>
                <p className="text-ink-muted text-sm mt-2 max-w-md">
                  View ratings, read student reviews, and unlock exclusive community deals.
                </p>
              </div>
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#111] border border-[#333] flex items-center justify-center group-hover:bg-[#4EA8F3] group-hover:border-[#4EA8F3] transition-all duration-500 flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-white group-hover:text-black transition-colors" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-12 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#4EA8F3] rounded-[1.5rem] opacity-0 group-focus-within:opacity-10 blur-md transition duration-500 pointer-events-none" />
            <div className="relative flex items-center bg-[#0a0a0a] border border-[#222] rounded-[1.5rem] p-2 transition-colors duration-300 group-focus-within:border-[#4EA8F3]/50">
              <div className="pl-4 pr-2">
                <Search className="text-ink-faint w-5 h-5 group-focus-within:text-[#4EA8F3] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Scan for roles, businesses, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 bg-transparent text-white placeholder-ink-faint focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <motion.div className="flex flex-wrap gap-2">
            {categories.map((category, i) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`px-5 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-colors border ${
                  selectedCategory === category
                    ? "bg-white text-black border-white"
                    : "bg-[#0a0a0a] text-ink-muted border-[#2a2a2a] hover:border-[#4EA8F3] hover:text-white"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          {/* Sort and View Options */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[#222]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-ink-faint" />
              <span className="text-sm font-mono text-ink-muted uppercase tracking-wider">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                <option value="flexible">Most Flexible</option>
                <option value="distance">Closest</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors border ${
                  showBookmarksOnly
                    ? "bg-[#4EA8F3] text-black border-[#4EA8F3]"
                    : "bg-[#0a0a0a] text-white border-[#2a2a2a] hover:border-[#4EA8F3]"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{showBookmarksOnly ? "All" : "Bookmarks"}</span>
              </motion.button>
              <motion.button
                onClick={() => setShowMap(!showMap)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors border ${
                  showMap
                    ? "bg-[#4EA8F3] text-black border-[#4EA8F3]"
                    : "bg-[#0a0a0a] text-white border-[#2a2a2a] hover:border-[#4EA8F3]"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>{showMap ? "Hide Map" : "Show Map"}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Map View */}
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 card-surface overflow-hidden"
          >
            <OpportunityMap opportunities={filteredOpportunities} />
          </motion.div>
        )}

        {/* Results Counter */}
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
            <div className="w-2 h-2 rounded-full bg-[#4EA8F3] pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              <span className="text-white font-bold">{filteredOpportunities.length}</span>{" "}
              {filteredOpportunities.length === 1 ? "match found" : "matches found"}
            </span>
          </div>
        </motion.div>

        {/* Opportunities Grid */}
        {loading ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-[#333] border-t-[#4EA8F3] rounded-full"
              />
            </div>
          </motion.div>
        ) : filteredOpportunities.length === 0 ? (
          <motion.div
            className="text-center py-20 card-surface"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-ink-muted font-mono">
              No opportunities found. Try adjusting your filters.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {filteredOpportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                isBookmarked={bookmarkedIds.has(opportunity.id)}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
