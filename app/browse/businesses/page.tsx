"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Search, Filter, ArrowLeft } from "lucide-react";
import BusinessCard from "@/components/BusinessCard";

type Business = {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  image_url: string | null;
  averageRating?: number;
  couponCount?: number;
};

type Rating = {
  business_id: string;
  rating: number;
};

type Coupon = {
  business_id: string;
  is_active: boolean;
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

export default function BrowseBusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "coupons">("rating");
  const [checkingRole, setCheckingRole] = useState(true);

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
    fetchBusinesses();
  }, [checkingRole]);

  useEffect(() => {
    filterAndSort();
  }, [businesses, searchQuery, selectedCategory, sortBy]);

  const fetchBusinesses = async () => {
    try {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (businessError) throw businessError;

      // Fetch all ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("business_id, rating");

      // Fetch all active coupons
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("business_id, is_active")
        .eq("is_active", true);

      // Calculate averages and counts
      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      const couponsMap: Record<string, number> = {};

      ratingsData?.forEach((rating: Rating) => {
        if (!ratingsMap[rating.business_id]) {
          ratingsMap[rating.business_id] = { sum: 0, count: 0 };
        }
        ratingsMap[rating.business_id].sum += rating.rating;
        ratingsMap[rating.business_id].count += 1;
      });

      couponsData?.forEach((coupon: Coupon) => {
        if (!couponsMap[coupon.business_id]) {
          couponsMap[coupon.business_id] = 0;
        }
        couponsMap[coupon.business_id] += 1;
      });

      // Enrich business data with ratings and coupons
      const enrichedBusinesses = businessData.map((business: any) => ({
        ...business,
        averageRating:
          ratingsMap[business.id]?.count > 0
            ? ratingsMap[business.id].sum / ratingsMap[business.id].count
            : 0,
        couponCount: couponsMap[business.id] || 0,
      }));

      setBusinesses(enrichedBusinesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = [...businesses];

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (b) => b.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.city.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === "coupons") {
      filtered.sort((a, b) => (b.couponCount || 0) - (a.couponCount || 0));
    }

    setFilteredBusinesses(filtered);
  };

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
                <img src="/image.png" alt="Logo" className="w-12 h-12 object-contain" />
              </motion.div>
              <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Vertex
              </span>
            </Link>
            <Link
              href="/browse"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Opportunities</span>
            </Link>
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
            Discover Businesses
          </h1>
          <p className="text-gray-400 text-lg">
            Browse local businesses, view ratings, and find special deals
          </p>
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
                placeholder="Search by name, city, or description..."
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

          {/* Sort Option */}
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
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="coupons">Deals</option>
              </motion.select>
            </div>
          </motion.div>
        </motion.div>

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
              {filteredBusinesses.length}
            </span>{" "}
            {filteredBusinesses.length === 1 ? "business" : "businesses"}
          </p>
        </motion.div>

        {/* Businesses Grid */}
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
                className="w-12 h-12 border-4 border-gray-600/30 border-t-gray-600 rounded-full"
              />
            </div>
            <p className="mt-4 text-gray-400 text-lg">Loading businesses...</p>
          </motion.div>
        ) : filteredBusinesses.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-gray-900/40 border border-gray-800/60 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-gray-400 text-lg">
              No businesses found. Try adjusting your filters.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {filteredBusinesses.map((business, index) => (
              <BusinessCard
                key={business.id}
                business={business}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
