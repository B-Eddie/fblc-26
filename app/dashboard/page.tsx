"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { Clock, Bookmark, CheckCircle, TrendingUp, LogOut } from "lucide-react";

const HoursProgressChart = dynamic(
  () => import("@/components/HoursProgressChart"),
  { ssr: false },
);

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [goalHours, setGoalHours] = useState(40);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      setChartSize({
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchDashboardData(user.id);
  };

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if ((profileData as any)?.role === "business") {
        router.replace("/business/dashboard");
        return;
      }

      setProfile(profileData);

      // Fetch applications with opportunity and business details
      const { data: appsData } = await supabase
        .from("applications")
        .select(
          `
          *,
          opportunity:opportunities (
            id,
            title,
            business:businesses (
              name,
              category
            )
          )
        `,
        )
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

      setApplications(appsData || []);

      // Calculate total hours
      const appsList = (appsData as any) || [];
      const completed = appsList.filter(
        (app: any) => app.status === "completed",
      );
      const total = completed.reduce(
        (sum: number, app: any) => sum + (app.hours_completed || 0),
        0,
      );
      setTotalHours(total);

      // Fetch bookmarks
      const { data: bookmarksData } = await supabase
        .from("bookmarks")
        .select(
          `
          *,
          opportunity:opportunities (
            id,
            title,
            hours_available,
            business:businesses (
              name,
              category,
              city
            )
          )
        `,
        )
        .eq("profile_id", userId);

      setBookmarks(bookmarksData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const chartData = [
    { month: "Completed", hours: totalHours },
    { month: "Remaining", hours: Math.max(0, goalHours - totalHours) },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30",
    accepted: "bg-green-600/20 text-green-400 border border-green-600/30",
    rejected: "bg-red-600/20 text-red-400 border border-red-600/30",
    completed: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-gray-700/30 border-t-gray-700 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Animated Background */}
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
            <div className="flex items-center space-x-4">
              <Link
                href="/browse"
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition font-medium"
              >
                Browse
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-3">
            Welcome back, {profile?.full_name || "Student"}!
          </h1>
          <p className="text-gray-400 text-lg">
            Track your volunteer hours and manage your applications
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              icon: Clock,
              label: "Total Hours",
              value: totalHours,
              color: "from-blue-600/20 to-blue-700/20 border-blue-600/30",
            },
            {
              icon: TrendingUp,
              label: "Goal Progress",
              value: `${Math.round((totalHours / goalHours) * 100)}%`,
              color: "from-green-600/20 to-green-700/20 border-green-600/30",
            },
            {
              icon: CheckCircle,
              label: "Applications",
              value: applications.length,
              color: "from-purple-600/20 to-purple-700/20 border-purple-600/30",
            },
            {
              icon: Bookmark,
              label: "Bookmarks",
              value: bookmarks.length,
              color: "from-orange-600/20 to-orange-700/20 border-orange-600/30",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
              className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-6 backdrop-blur-sm hover:border-opacity-100 transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-12 h-12 text-gray-400 opacity-50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Hours Progress</h2>
          <div ref={chartContainerRef} className="h-64 w-full min-h-[256px]">
            {chartSize.width > 0 && chartSize.height > 0 && (
              <HoursProgressChart
                data={chartData}
                width={chartSize.width}
                height={chartSize.height}
              />
            )}
          </div>
          <motion.div className="mt-6 p-4 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 rounded-xl">
            <p className="text-center text-gray-300">
              <span className="font-bold text-gray-200">
                {Math.max(0, goalHours - totalHours)} hours
              </span>{" "}
              remaining to reach your goal of {goalHours} hours
            </p>
          </motion.div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            My Applications
          </h2>
          {applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 mb-6 text-lg">
                You haven't applied to any opportunities yet
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/browse"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                >
                  Browse Opportunities
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border border-gray-800/60 rounded-xl p-6 hover:border-gray-600/40 transition bg-gray-800/20 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {app.opportunity ? (
                        <Link
                          href={
                            app.status === "accepted" ||
                            app.status === "completed"
                              ? `/dashboard/job/${app.id}`
                              : `/opportunities/${app.opportunity.id || ""}`
                          }
                          className="hover:text-gray-300 transition"
                        >
                          <h3 className="font-semibold text-lg text-white">
                            {app.opportunity.title || "Unknown"}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-lg text-white">
                          Opportunity no longer available
                        </h3>
                      )}
                      <p className="text-gray-400">
                        {app.opportunity?.business?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Category: {app.opportunity?.business?.category || "N/A"}
                      </p>
                      {app.hours_completed > 0 && (
                        <p className="text-sm text-blue-400 mt-2 font-medium">
                          ✓ Completed: {app.hours_completed} hours
                        </p>
                      )}
                      {(app.status === "accepted" || app.status === "completed") && (
                        <Link
                          href={`/dashboard/job/${app.id}`}
                          className="inline-flex items-center text-sm text-gray-400 hover:text-white mt-2 transition"
                        >
                          View Job Details →
                        </Link>
                      )}
                    </div>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${statusColors[app.status] || statusColors.pending}`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bookmarked Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Saved Opportunities
          </h2>
          {bookmarks.length === 0 ? (
            <motion.div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                No saved opportunities yet
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.filter((b) => b.opportunity).map((bookmark, i) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={`/opportunities/${bookmark.opportunity?.id}`}
                    className="border border-gray-800/60 rounded-xl p-6 hover:border-gray-600/40 transition bg-gray-800/20 backdrop-blur-sm h-full flex flex-col"
                  >
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {bookmark.opportunity?.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {bookmark.opportunity?.business?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-auto">
                      {bookmark.opportunity?.hours_available} hours •{" "}
                      {bookmark.opportunity?.business?.city}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
