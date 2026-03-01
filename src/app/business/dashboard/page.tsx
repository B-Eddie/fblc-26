"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, Users, Clock, LogOut } from "lucide-react";
import FloatingNav from "@/components/FloatingNav";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchBusinessData(user.id);
  };

  const fetchBusinessData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const profile = profileData as any;
      setProfile(profile);

      if (profile?.role !== "business") {
        router.push("/dashboard");
        return;
      }

      // Fetch business
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("profile_id", userId)
        .single();

      const business = businessData as any;
      if (business) {
        setBusiness(business);

        // Fetch opportunities
        const { data: oppsData } = await supabase
          .from("opportunities")
          .select("*")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false });

        setOpportunities(oppsData || []);

        // Fetch applications for all opportunities
        if (oppsData && oppsData.length > 0) {
          const oppIds = (oppsData as any).map((opp: any) => opp.id);
          const { data: appsData } = await supabase
            .from("applications")
            .select(
              `
              *,
              profile:profiles(full_name, email),
              opportunity:opportunities(title)
            `,
            )
            .in("opportunity_id", oppIds)
            .order("created_at", { ascending: false });

          setApplications(appsData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: string,
  ) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus } as any)
        .eq("id", applicationId);

      if (error) throw error;

      // Refresh applications
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (error: any) {
      alert("Error updating status: " + error.message);
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md card-surface p-8"
        >
          <h1 className="text-3xl font-heading font-bold text-white mb-4">
            Set Up Your Business
          </h1>
          <p className="text-ink-muted mb-8 font-mono text-sm">
            You need to create a business profile before posting opportunities.
          </p>
          <Link
            href="/business/setup"
            className="btn-magnetic inline-block bg-white text-black px-8 py-3 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500"
          >
            <span className="relative z-10">Create Business Profile</span>
            <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    pending: "bg-[#1a1a1a] text-[#f59e0b] border-[#f59e0b]/30",
    accepted: "bg-[#1a1a1a] text-[#10b981] border-[#10b981]/30",
    rejected: "bg-[#1a1a1a] text-[#ef4444] border-[#ef4444]/30",
    completed: "bg-[#1a1a1a] text-[#4EA8F3] border-[#4EA8F3]/30",
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <FloatingNav />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />

        {/* Business Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 relative z-10"
        >
          <p className="font-mono text-[#4EA8F3] text-sm uppercase tracking-widest mb-6">Operations Hub</p>
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter text-white mb-6 leading-tight">
            Manage <br/>
            <span className="font-drama italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#4EA8F3] to-[#4EA8F3]/60">{business.name}</span>.
          </h1>
          <p className="text-ink-muted text-lg md:text-xl font-sans max-w-3xl leading-relaxed">
            {business.description}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            {
              icon: MapPin,
              label: "Active Opportunities",
              value: opportunities.length,
            },
            {
              icon: Users,
              label: "Total Applications",
              value: applications.length,
            },
            {
              icon: Clock,
              label: "Pending Reviews",
              value: applications.filter((app) => app.status === "pending").length,
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

        {/* Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="card-surface p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold font-heading text-white">
              Your Opportunities
            </h2>
            <Link
              href="/business/opportunities/new"
              className="btn-magnetic inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post New
              </span>
              <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-ink-muted mb-6 text-sm font-mono">
                You haven't posted any opportunities yet
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp, i) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 transition-all duration-300 hover:border-[#4EA8F3]/50 hover:shadow-[0_0_30px_rgba(78,168,243,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-white mb-1">
                      {opp.title}
                    </h3>
                    <p className="text-ink-muted text-sm mb-3 line-clamp-2">
                      {opp.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs font-mono text-ink-faint">
                      <span>{opp.hours_available} hours</span>
                      {opp.is_flexible && (
                        <span className="text-[#4EA8F3] border border-[#4EA8F3]/50 px-2 py-0.5 rounded-full">
                          Flexible
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/business/opportunities/${opp.id}/edit`}
                    className="px-5 py-2 border border-[#333] text-white text-xs font-mono uppercase tracking-wider rounded-full hover:border-[#4EA8F3] hover:text-[#4EA8F3] transition-colors whitespace-nowrap"
                  >
                    Edit Details
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="card-surface p-8"
        >
          <h2 className="text-2xl font-bold font-heading text-white mb-8">
            Recent Applications
          </h2>
          {applications.length === 0 ? (
            <motion.div className="text-center py-12">
              <p className="text-ink-muted text-sm font-mono">No applications yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 transition-all duration-300 hover:border-[#4EA8F3]/50 hover:shadow-[0_0_30px_rgba(78,168,243,0.15)] group"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-lg text-white mb-1">
                        {app.profile?.full_name || "Unknown Applicant"}
                      </h3>
                      <p className="text-sm font-mono text-ink-muted mb-3">
                        {app.profile?.email || "No email"}
                      </p>
                      <p className="text-xs font-mono text-ink-faint">
                        Applied to:{" "}
                        <span className="text-white">
                          {app.opportunity?.title || "Deleted opportunity"}
                        </span>
                      </p>
                      {app.message && (
                        <p className="text-sm text-ink-muted mt-3 italic border-l-2 border-[#333] pl-3">
                          "{app.message}"
                        </p>
                      )}
                    </div>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`px-3 py-1 border rounded-full text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${statusStyles[app.status] || statusStyles.pending}`}
                    >
                      {app.status}
                    </motion.span>
                  </div>

                  {app.status === "pending" && (
                    <div className="flex space-x-3 mt-6 pt-4 border-t border-[#222]">
                      <button
                        onClick={() => handleStatusUpdate(app.id, "accepted")}
                        className="px-5 py-2 bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30 text-xs font-mono uppercase tracking-wider rounded-full hover:bg-[#10b981]/10 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app.id, "rejected")}
                        className="px-5 py-2 bg-[#1a1a1a] text-[#ef4444] border border-[#ef4444]/30 text-xs font-mono uppercase tracking-wider rounded-full hover:bg-[#ef4444]/10 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {(app.status === "accepted" || app.status === "completed") && (
                    <div className="mt-6 pt-4 border-t border-[#222]">
                      <Link
                        href={`/business/dashboard/employee/${app.id}`}
                        className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-[#4EA8F3] transition-colors"
                      >
                        <span>Manage Employee →</span>
                      </Link>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
