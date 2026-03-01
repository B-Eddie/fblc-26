"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { MapPin, Search, Filter, Bookmark } from "lucide-react";
import OpportunityCard from "@/components/OpportunityCard";

// Dynamically import the map component (client-side only)
const OpportunityMap = dynamic(() => import("@/components/OpportunityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-800/50 rounded-xl flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-8 h-8 border-2 border-purple-600/30 border-t-purple-600 rounded-full" />
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
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600/20 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src="/image.png"
                  alt="Logo"
                  className="w-12 h-12 object-contain"
                />
              </motion.div>
              <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Vertex
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition font-medium"
              >
                Dashboard
              </Link>
              {!session && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/auth/login"
                    className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                  >
                    Log In
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-3 font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent">
            Browse Opportunities
          </h1>
          <p className="text-gray-400 text-lg">
            Discover amazing volunteer opportunities in your area
          </p>
        </motion.div>

        {/* Business Discovery Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/browse/businesses">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition">
                    Discover Local Businesses & Deals
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Browse businesses, view ratings, reviews, and find special
                    coupons
                  </p>
                </div>
                <motion.div whileHover={{ x: 5 }} className="text-2xl">
                  →
                </motion.div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-700/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition duration-300" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, business, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800/60 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <motion.div className="flex flex-wrap gap-2">
            {categories.map((category, i) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`px-6 py-2 rounded-full font-medium transition whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg shadow-gray-600/50"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700/50 backdrop-blur-sm"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          {/* Sort and View Options */}
          <motion.div
            className="flex justify-between items-center flex-wrap gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-300">
                Sort by:
              </label>
              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:ring-2 focus:ring-gray-600 transition backdrop-blur-sm cursor-pointer"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="rating">Highest Rated</option>
                <option value="flexible">Most Flexible</option>
                <option value="distance">Closest</option>
              </motion.select>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition ${
                  showBookmarksOnly
                    ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg shadow-gray-600/50"
                    : "bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm"
                }`}
              >
                <Bookmark className="w-5 h-5" />
                <span>
                  {showBookmarksOnly ? "All Opportunities" : "Bookmarks"}
                </span>
              </motion.button>
              <motion.button
                onClick={() => setShowMap(!showMap)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition ${
                  showMap
                    ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg shadow-gray-600/50"
                    : "bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm"
                }`}
              >
                <MapPin className="w-5 h-5" />
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
            className="mb-8 bg-gray-900/40 rounded-2xl border border-gray-800/60 overflow-hidden backdrop-blur-sm"
          >
            <OpportunityMap opportunities={filteredOpportunities} />
          </motion.div>
        )}

        {/* Results Counter */}
        <motion.div
          className="mb-6 flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-400">
            Found{" "}
            <span className="font-semibold text-white">
              {filteredOpportunities.length}
            </span>{" "}
            {filteredOpportunities.length === 1
              ? "opportunity"
              : "opportunities"}
          </p>
        </motion.div>

        {/* Opportunities Grid */}
        {loading ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full"
              />
            </div>
            <p className="mt-4 text-gray-400 text-lg">
              Loading opportunities...
            </p>
          </motion.div>
        ) : filteredOpportunities.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-gray-900/40 border border-gray-800/60 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-gray-400 text-lg">
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
