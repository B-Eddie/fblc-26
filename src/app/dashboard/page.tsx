"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import {
  Clock,
  Bookmark,
  CheckCircle,
  TrendingUp,
  LogOut,
  MapPin,
} from "lucide-react";
import FloatingNav from "@/components/FloatingNav";

const HoursProgressChart = dynamic(
  () => import("@/components/HoursProgressChart"),
  { ssr: false },
);

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<any[]>([]);
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

      // Fetch signature requests
      const { data: sigReqData } = await supabase
        .from("signature_requests")
        .select(
          `
          *,
          application:applications (
            id,
            opportunity:opportunities (
              id,
              title,
              business:businesses (
                name
              )
            )
          )
        `,
        )
        .eq("volunteer_id", userId);

      setSignatureRequests(sigReqData || []);
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

  const statusStyles: Record<string, string> = {
    pending: "bg-[#1a1a1a] text-[#f59e0b] border-[#f59e0b]/30",
    accepted: "bg-[#1a1a1a] text-[#10b981] border-[#10b981]/30",
    rejected: "bg-[#1a1a1a] text-[#ef4444] border-[#ef4444]/30",
    completed: "bg-[#1a1a1a] text-[#4EA8F3] border-[#4EA8F3]/30",
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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <FloatingNav />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 relative z-10"
        >
          <p className="font-mono text-[#4EA8F3] text-sm uppercase tracking-widest mb-6">
            Telemetry Feed
          </p>
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter text-white mb-6 leading-tight">
            Welcome back, <br />
            <span className="font-drama italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#4EA8F3] to-[#4EA8F3]/60 pr-2">
              {profile?.full_name || "Student"}
            </span>
            .
          </h1>
          <p className="text-ink-muted text-lg md:text-xl font-sans max-w-2xl leading-relaxed">
            Monitor your contribution metrics and ongoing application status.
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
            },
            {
              icon: TrendingUp,
              label: "Goal Progress",
              value: `${Math.round((totalHours / goalHours) * 100)}%`,
            },
            {
              icon: CheckCircle,
              label: "Applications",
              value: applications.length,
            },
            {
              icon: Bookmark,
              label: "Bookmarks",
              value: bookmarks.length,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
              className="card-surface p-6 transition-all duration-300 hover:border-[#4EA8F3]/50 hover:shadow-[0_0_30px_rgba(78,168,243,0.15)] group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-2 group-hover:text-white transition-colors">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold font-heading text-white group-hover:text-[#4EA8F3] transition-colors">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8 text-[#333] group-hover:text-[#4EA8F3]/50 transition-colors" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="card-surface p-8 mb-8"
        >
          <h2 className="text-2xl font-bold font-heading text-white mb-6">
            Hours Progress
          </h2>
          <div ref={chartContainerRef} className="h-64 w-full min-h-[256px]">
            {chartSize.width > 0 && chartSize.height > 0 && (
              <HoursProgressChart
                data={chartData}
                width={chartSize.width}
                height={chartSize.height}
              />
            )}
          </div>
          <motion.div className="mt-6 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#4EA8F3] pulse-dot" />
            <p className="text-ink-muted font-mono text-sm">
              <span className="font-bold text-white">
                {Math.max(0, goalHours - totalHours)} hours
              </span>{" "}
              remaining to reach your goal of {goalHours} hours
            </p>
          </motion.div>
        </motion.div>

        {/* Signed Forms */}
        {signatureRequests.filter(
          (s) => s.status === "signed" && s.signed_pdf_url,
        ).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="card-surface p-8 mb-8"
          >
            <h2 className="text-2xl font-bold font-heading text-white mb-2">
              Signed Forms
            </h2>
            <p className="text-ink-muted text-sm mb-8 max-w-xl">
              Your supervisor has signed these forms. Add your signatures to
              finalize, then download.
            </p>
            <div className="divide-y divide-[#1a1a1a]">
              {signatureRequests
                .filter((s) => s.status === "signed" && s.signed_pdf_url)
                .map((sig) => {
                  const app = sig.application;
                  const opp = app?.opportunity;
                  const biz = opp?.business;
                  return (
                    <div key={sig.id} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold font-heading text-white">
                            {opp?.title || "Volunteer Opportunity"}
                          </h3>
                          <p className="text-xs font-mono text-ink-muted mt-1">
                            {biz?.name || "Business"} ·{" "}
                            {parseFloat(sig.total_hours).toFixed(1)} hrs
                            {sig.signed_at && (
                              <span className="text-[#10b981]">
                                {" "}
                                · Signed{" "}
                                {new Date(sig.signed_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <a
                          href={sig.signed_pdf_url}
                          download={`signed-volunteer-hours.pdf`}
                          className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-white transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                      <PDFSigner
                        role="volunteer"
                        pdfUrl={sig.signed_pdf_url}
                        volunteerName={profile?.full_name || ""}
                        supervisorName={biz?.name || ""}
                        totalHours={parseFloat(sig.total_hours) || 0}
                        opportunityTitle={opp?.title || ""}
                        applicationId={sig.application_id}
                        signatureRequestId={sig.id}
                      />
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="card-surface p-8 mb-8"
        >
          <h2 className="text-2xl font-bold font-heading text-white mb-6">
            My Applications
          </h2>
          {applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-ink-muted mb-6 text-lg">
                You haven't applied to any opportunities yet
              </p>
              <Link
                href="/browse"
                className="btn-magnetic inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Browse Opportunities
                </span>
                <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 transition-all duration-300 hover:border-[#4EA8F3]/50 hover:shadow-[0_0_30px_rgba(78,168,243,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="flex-1">
                    {app.opportunity ? (
                      <Link
                        href={
                          app.status === "accepted" ||
                          app.status === "completed"
                            ? `/dashboard/job/${app.id}`
                            : `/opportunities/${app.opportunity.id || ""}`
                        }
                        className="hover:text-[#4EA8F3] transition-colors"
                      >
                        <h3 className="font-heading font-bold text-lg text-white mb-1">
                          {app.opportunity.title || "Unknown"}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="font-heading font-bold text-lg text-white mb-1">
                        Opportunity no longer available
                      </h3>
                    )}
                    <p className="text-ink-muted text-sm font-mono uppercase tracking-wider mb-2">
                      {app.opportunity?.business?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Category: {app.opportunity?.business?.category || "N/A"}
                    </p>
                    {app.hours_completed > 0 && (
                      <p className="text-xs text-[#4EA8F3] mt-2 font-mono">
                        ✓ Completed: {app.hours_completed} hours
                      </p>
                    )}
                    {(app.status === "accepted" ||
                      app.status === "completed") && (
                      <Link
                        href={`/dashboard/job/${app.id}`}
                        className="inline-flex items-center text-xs font-mono text-ink-muted hover:text-[#4EA8F3] mt-3 transition-colors"
                      >
                        View Job Details →
                      </Link>
                    )}
                  </div>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`px-3 py-1 border rounded-full text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${statusStyles[app.status] || statusStyles.pending}`}
                  >
                    {app.status}
                  </motion.span>
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
          className="card-surface p-8"
        >
          <h2 className="text-2xl font-bold font-heading text-white mb-6">
            Saved Opportunities
          </h2>
          {bookmarks.length === 0 ? (
            <motion.div className="text-center py-12">
              <p className="text-ink-muted text-lg">
                No saved opportunities yet
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks
                .filter((b) => b.opportunity)
                .map((bookmark, i) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/opportunities/${bookmark.opportunity?.id}`}
                      className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 transition-all duration-300 hover:border-[#4EA8F3]/50 hover:shadow-[0_0_30px_rgba(78,168,243,0.15)] flex flex-col h-full group"
                    >
                      <h3 className="font-heading font-bold text-white mb-2 line-clamp-2">
                        {bookmark.opportunity?.title}
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-4">
                        {bookmark.opportunity?.business?.name}
                      </p>
                      <div className="flex items-center space-x-3 mt-auto font-mono text-xs text-ink-faint">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {bookmark.opportunity?.hours_available} hrs
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{bookmark.opportunity?.business?.city}</span>
                        </span>
                      </div>
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
