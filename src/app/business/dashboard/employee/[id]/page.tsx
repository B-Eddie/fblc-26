"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import PDFSigner from "@/components/PDFSigner";
import {
  ArrowLeft,
  Clock,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  AlertCircle,
  User,
  Mail,
  PenTool,
  UserCheck,
  UserX,
  Briefcase,
} from "lucide-react";

export default function EmployeeManagementPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [application, setApplication] = useState<any>(null);
  const [hourLogs, setHourLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  // Form states
  const [newMessage, setNewMessage] = useState("");
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [updatingHour, setUpdatingHour] = useState<string | null>(null);
  const [signingRequest, setSigningRequest] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "details" | "hours" | "messages" | "signature"
  >("details");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setCurrentUser(user);
    fetchEmployeeData(user.id);
  };

  const fetchEmployeeData = async (userId: string) => {
    try {
      // First get the business for this user
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("profile_id", userId)
        .single();

      if (!businessData) {
        router.push("/business/dashboard");
        return;
      }
      setBusiness(businessData as any);

      // Fetch application with volunteer profile and opportunity details
      const { data: appData, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          profile:profiles (id, full_name, email),
          opportunity:opportunities (
            *,
            business:businesses (*)
          )
        `,
        )
        .eq("id", params.id)
        .single();

      if (error || !appData) {
        router.push("/business/dashboard");
        return;
      }

      // Verify this application belongs to the business's opportunities
      const app = appData as any;
      if (app.opportunity?.business_id !== (businessData as any).id) {
        router.push("/business/dashboard");
        return;
      }

      setApplication(app);

      // Fetch hour logs
      const { data: logsData } = await supabase
        .from("hour_logs")
        .select("*")
        .eq("application_id", params.id)
        .order("date", { ascending: false });

      setHourLogs(logsData || []);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*, sender:profiles(full_name)")
        .eq("application_id", params.id)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);

      // Fetch signature requests
      const { data: sigData } = await supabase
        .from("signature_requests")
        .select("*")
        .eq("application_id", params.id)
        .order("created_at", { ascending: false });

      setSignatureRequests(sigData || []);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateHourStatus = async (
    logId: string,
    newStatus: "approved" | "rejected",
  ) => {
    setUpdatingHour(logId);
    try {
      const { error } = await supabase
        .from("hour_logs")
        .update({ status: newStatus } as any)
        .eq("id", logId);

      if (error) throw error;
      setHourLogs(
        hourLogs.map((log) =>
          log.id === logId ? { ...log, status: newStatus } : log,
        ),
      );
    } catch (error: any) {
      alert("Error updating hour log: " + error.message);
    } finally {
      setUpdatingHour(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    setSubmittingMessage(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          application_id: params.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        } as any)
        .select("*, sender:profiles(full_name)")
        .single();

      if (error) throw error;
      setMessages([...messages, data]);
      setNewMessage("");
    } catch (error: any) {
      alert("Error sending message: " + error.message);
    } finally {
      setSubmittingMessage(false);
    }
  };

  const signSignatureRequest = async (
    requestId: string,
    _signedPdfBytes?: Uint8Array,
  ) => {
    setSigningRequest(requestId);
    try {
      const { error } = await supabase
        .from("signature_requests")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signed_by: currentUser?.id,
        } as any)
        .eq("id", requestId);

      if (error) throw error;
      setSignatureRequests(
        signatureRequests.map((sig) =>
          sig.id === requestId
            ? {
                ...sig,
                status: "signed",
                signed_at: new Date().toISOString(),
              }
            : sig,
        ),
      );
      setSigningRequest(null);
    } catch (error: any) {
      alert("Error signing request: " + error.message);
      setSigningRequest(null);
    }
  };

  const updateApplicationStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus } as any)
        .eq("id", params.id);

      if (error) throw error;
      setApplication({ ...application, status: newStatus });
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    }
  };

  const totalLoggedHours = hourLogs.reduce(
    (sum, log) => sum + parseFloat(log.hours),
    0,
  );
  const approvedHours = hourLogs
    .filter((log) => log.status === "approved")
    .reduce((sum, log) => sum + parseFloat(log.hours), 0);
  const pendingHours = hourLogs
    .filter((log) => log.status === "pending")
    .reduce((sum, log) => sum + parseFloat(log.hours), 0);

  const statusColors: Record<string, string> = {
    pending: "bg-[#1a1a1a] text-[#f59e0b] border border-[#f59e0b]/30",
    approved: "bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30",
    rejected: "bg-[#1a1a1a] text-[#ef4444] border border-[#ef4444]/30",
    signed: "bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30",
    accepted: "bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30",
    completed: "bg-[#1a1a1a] text-[#4EA8F3] border border-[#4EA8F3]/30",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-gray-700/30 border-t-gray-700 rounded-full"
        />
      </div>
    );
  }

  if (!application) return null;

  const volunteer = application.profile;
  const opportunity = application.opportunity;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">

      {/* Header */}
      <header className="border-b border-[#222] sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </motion.div>
              <span className="text-xl font-bold font-heading tracking-tight text-white">
                Pilot
              </span>
            </Link>
            <Link
              href="/business/dashboard"
              className="flex items-center space-x-2 text-sm font-medium text-ink-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Employee Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-white mb-3">
                {volunteer?.full_name}
              </h1>
              <div className="flex items-center space-x-3 text-ink-muted font-mono text-sm uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                <span className="font-bold text-white">{opportunity?.title}</span>
                <span className="text-ink-faint">•</span>
                <Mail className="w-4 h-4" />
                <span>{volunteer?.email}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.span
                className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${statusColors[application.status] || statusColors.pending}`}
              >
                {application.status}
              </motion.span>
              {application.status === "accepted" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateApplicationStatus("completed")}
                  className="flex items-center space-x-2 px-5 py-2 bg-[#1a1a1a] text-[#4EA8F3] border border-[#4EA8F3]/30 rounded-full text-xs font-mono uppercase tracking-wider font-bold hover:border-[#4EA8F3] transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Complete</span>
                </motion.button>
              )}
              {application.status === "pending" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateApplicationStatus("accepted")}
                    className="flex items-center space-x-2 px-5 py-2 bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30 rounded-full text-xs font-mono uppercase tracking-wider font-bold hover:border-[#10b981] transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Hire</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateApplicationStatus("rejected")}
                    className="flex items-center space-x-2 px-5 py-2 bg-[#1a1a1a] text-[#ef4444] border border-[#ef4444]/30 rounded-full text-xs font-mono uppercase tracking-wider font-bold hover:border-[#ef4444] transition"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Reject</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
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
              label: "Total Logged",
              value: `${totalLoggedHours.toFixed(1)}h`,
            },
            {
              icon: CheckCircle,
              label: "Approved",
              value: `${approvedHours.toFixed(1)}h`,
            },
            {
              icon: AlertCircle,
              label: "Pending",
              value: `${pendingHours.toFixed(1)}h`,
            },
            {
              icon: FileText,
              label: "Signatures",
              value: signatureRequests.filter((s) => s.status === "signed")
                .length,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
              className="card-surface p-6 hover:border-[#4EA8F3] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold font-heading text-white">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8 text-[#333]" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex space-x-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-1.5 mb-8"
        >
          {(
            [
              { id: "details", label: "Volunteer Info", icon: User },
              { id: "hours", label: "Approve Hours", icon: Clock },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "signature", label: "Sign Form", icon: PenTool },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1a1a1a] text-white shadow-sm border border-[#333]"
                  : "text-ink-muted hover:text-white border border-transparent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}

        {/* === DETAILS TAB === */}
        {activeTab === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Volunteer Profile */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Volunteer Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                  <div className="w-14 h-14 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-2xl font-bold font-heading text-white">
                    {volunteer?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg font-heading">
                      {volunteer?.full_name}
                    </p>
                    <p className="text-ink-muted text-sm font-mono">{volunteer?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                  <Calendar className="w-6 h-6 text-ink-faint" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Applied</p>
                    <p className="text-white font-medium">
                      {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {application.message && (
                <div className="mt-6 p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">
                    Application Message
                  </p>
                  <p className="text-ink-muted italic leading-relaxed">
                    &quot;{application.message}&quot;
                  </p>
                </div>
              )}

              {/* Extended Application Details */}
              {((application as any).phone_number || (application as any).availability || (application as any).resume_url || (application as any).reference_letter_url) && (
                <div className="mt-6 space-y-4">
                  {(application as any).phone_number && (
                    <div className="p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">Phone Number</p>
                      <p className="text-white">{(application as any).phone_number}</p>
                    </div>
                  )}
                  {(application as any).availability && (
                    <div className="p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">Availability</p>
                      <p className="text-white whitespace-pre-wrap">{(application as any).availability}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {(application as any).resume_url && (
                      <a
                        href={(application as any).resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 border border-[#2a2a2a] rounded-full text-ink-muted hover:text-white hover:border-[#4EA8F3] transition text-sm font-mono"
                      >
                        <FileText className="w-4 h-4" />
                        View Resume
                      </a>
                    )}
                    {(application as any).reference_letter_url && (
                      <a
                        href={(application as any).reference_letter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 border border-[#2a2a2a] rounded-full text-ink-muted hover:text-white hover:border-[#4EA8F3] transition text-sm font-mono"
                      >
                        <FileText className="w-4 h-4" />
                        View Reference Letter
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Question Answers */}
              {(() => {
                const customAnswers = (application as any).custom_answers;
                const customQuestions: any[] = Array.isArray((opportunity as any)?.custom_questions) ? (opportunity as any).custom_questions : [];
                if (!customAnswers || !customQuestions.length) return null;
                const answeredQuestions = customQuestions.filter((q: any) => customAnswers[q.id]);
                if (!answeredQuestions.length) return null;
                return (
                  <div className="mt-6">
                    <h4 className="text-md font-bold font-heading text-white mb-3">Custom Question Responses</h4>
                    <div className="space-y-3">
                      {answeredQuestions.map((q: any) => (
                        <div key={q.id} className="p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">{q.question}</p>
                          {q.type === "file" ? (
                            <a
                              href={customAnswers[q.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[#4EA8F3] hover:text-white text-sm transition font-mono"
                            >
                              <FileText className="w-4 h-4" />
                              View Uploaded File
                            </a>
                          ) : (
                            <p className="text-white whitespace-pre-wrap">{customAnswers[q.id]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Opportunity Details */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Opportunity Details
              </h2>
              <h3 className="text-lg font-bold font-heading text-white mb-2">
                {opportunity?.title}
              </h3>
              <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                {opportunity?.description}
              </p>
              {opportunity?.requirements && (
                <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                  <h4 className="text-md font-bold font-heading text-white mb-2">
                    Requirements
                  </h4>
                  <p className="text-ink-muted whitespace-pre-wrap">
                    {opportunity.requirements}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[#2a2a2a] text-sm font-mono text-ink-muted">
                <span className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ink-faint" />
                  <span>{opportunity?.hours_available} hours available</span>
                </span>
                {opportunity?.is_flexible && (
                  <span className="text-[#4EA8F3] font-bold border border-[#4EA8F3]/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                    Flexible Schedule
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* === HOURS TAB === */}
        {activeTab === "hours" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pending Hours */}
            {hourLogs.filter((l) => l.status === "pending").length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#f59e0b]/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold font-heading text-white mb-2">
                  Pending Approval
                </h2>
                <p className="text-ink-muted text-sm font-mono mb-6">
                  Review and approve or reject the volunteer&apos;s submitted
                  hours.
                </p>
                <div className="space-y-3">
                  {hourLogs
                    .filter((log) => log.status === "pending")
                    .map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-5 border border-[#2a2a2a] rounded-2xl bg-[#111] hover:border-[#444] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-bold font-heading text-lg">
                              {parseFloat(log.hours).toFixed(1)} hours
                            </span>
                            <span className="text-ink-faint">•</span>
                            <span className="text-ink-muted text-xs font-mono uppercase tracking-wider">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                              {log.description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              updateHourStatus(log.id, "approved")
                            }
                            disabled={updatingHour === log.id}
                            className="flex items-center space-x-1 px-5 py-2 bg-[#1a1a1a] text-[#10b981] border border-[#10b981]/30 rounded-full text-xs font-mono uppercase tracking-wider font-bold hover:border-[#10b981] transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              updateHourStatus(log.id, "rejected")
                            }
                            disabled={updatingHour === log.id}
                            className="flex items-center space-x-1 px-5 py-2 bg-[#1a1a1a] text-[#ef4444] border border-[#ef4444]/30 rounded-full text-xs font-mono uppercase tracking-wider font-bold hover:border-[#ef4444] transition disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}

            {/* All Hour Logs */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                All Hour Logs
              </h2>
              {hourLogs.length === 0 ? (
                <p className="text-ink-muted font-mono text-center py-8">
                  No hours have been logged by this volunteer yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {hourLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a] hover:border-[#444] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-bold font-heading">
                            {parseFloat(log.hours).toFixed(1)} hours
                          </span>
                          <span className="text-ink-faint">•</span>
                          <span className="text-ink-muted text-xs font-mono uppercase tracking-wider">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${statusColors[log.status]}`}
                        >
                          {log.status}
                        </span>
                        {log.status !== "pending" && (
                          <div className="flex space-x-1 ml-2">
                            {log.status !== "approved" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateHourStatus(log.id, "approved")
                                }
                                disabled={updatingHour === log.id}
                                className="p-1.5 text-[#10b981] hover:bg-[#10b981]/10 rounded-full transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                            {log.status !== "rejected" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateHourStatus(log.id, "rejected")
                                }
                                disabled={updatingHour === log.id}
                                className="p-1.5 text-[#ef4444] hover:bg-[#ef4444]/10 rounded-full transition disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* === MESSAGES TAB === */}
        {activeTab === "messages" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface overflow-hidden flex flex-col h-[600px]"
          >
            <div className="p-6 border-b border-[#2a2a2a] bg-[#0a0a0a]">
              <h2 className="text-xl font-bold font-heading text-white">
                Messages with {volunteer?.full_name}
              </h2>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-ink-muted font-mono text-sm">
                    No messages yet. Start a conversation with your volunteer.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                        msg.sender_id === currentUser?.id
                          ? "bg-[#1a1a1a] text-white border border-[#333] rounded-tr-sm"
                          : "bg-[#0a0a0a] text-white border border-[#2a2a2a] rounded-tl-sm"
                      }`}
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">
                        {msg.sender?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className="text-[10px] text-ink-faint mt-3 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#2a2a2a]">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={submittingMessage || !newMessage.trim()}
                  className="px-4 py-3 bg-white text-black rounded-full hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow duration-500 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* === SIGNATURE / PDF SIGNING TAB === */}
        {activeTab === "signature" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pending Signature Requests */}
            {signatureRequests.filter((s) => s.status === "pending").length >
              0 && (
              <div className="bg-[#0a0a0a] border border-[#f59e0b]/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold font-heading text-white mb-2">
                  Pending Signature Requests
                </h2>
                <p className="text-ink-muted text-sm font-mono mb-6">
                  The volunteer has requested you to sign their community
                  involvement hours form.
                </p>
                <div className="space-y-4">
                  {signatureRequests
                    .filter((sig) => sig.status === "pending")
                    .map((sig) => (
                      <div
                        key={sig.id}
                        className="border border-[#2a2a2a] rounded-2xl p-6 bg-[#111]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white font-bold font-heading text-lg">
                              {parseFloat(sig.total_hours).toFixed(1)} hours
                            </p>
                            <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                              Requested{" "}
                              {new Date(sig.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-[#1a1a1a] text-[#f59e0b] border border-[#f59e0b]/30">
                            Awaiting Signature
                          </span>
                        </div>

                        {/* PDF Signer Component */}
                        {signingRequest !== sig.id ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSigningRequest(sig.id)}
                            className="btn-magnetic flex bg-white text-black px-6 py-3 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow duration-500"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <PenTool className="w-4 h-4" />
                              <span>Open PDF &amp; Sign</span>
                            </span>
                            <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
                          </motion.button>
                        ) : (
                          <div className="mt-4">
                            <PDFSigner
                              volunteerName={volunteer?.full_name || "Volunteer"}
                              supervisorName={
                                business?.name || "Business Supervisor"
                              }
                              totalHours={parseFloat(sig.total_hours)}
                              opportunityTitle={
                                opportunity?.title || "Volunteer Opportunity"
                              }
                              applicationId={params.id}
                              signatureRequestId={sig.id}
                              onSigned={(pdfBytes) => {
                                signSignatureRequest(sig.id, pdfBytes);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick Sign (no request needed) */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-2">
                Sign Volunteer Hours Form
              </h2>
              <p className="text-ink-muted text-sm font-mono mb-6">
                You can also sign the community involvement hours form directly
                without waiting for a request. This will embed your signature
                into the official PDF.
              </p>
              <PDFSigner
                volunteerName={volunteer?.full_name || "Volunteer"}
                supervisorName={business?.name || "Business Supervisor"}
                totalHours={approvedHours}
                opportunityTitle={
                  opportunity?.title || "Volunteer Opportunity"
                }
                applicationId={params.id}
              />
            </div>

            {/* Signature History */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Signature History
              </h2>
              {signatureRequests.length === 0 ? (
                <p className="text-ink-muted font-mono text-center py-8">
                  No signature requests have been made.
                </p>
              ) : (
                <div className="space-y-3">
                  {signatureRequests.map((sig, i) => (
                    <motion.div
                      key={sig.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a] hover:border-[#444] transition-colors"
                    >
                      <div>
                        <p className="text-white font-bold font-heading">
                          {parseFloat(sig.total_hours).toFixed(1)} hours
                        </p>
                        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                          Requested{" "}
                          {new Date(sig.created_at).toLocaleDateString()}
                        </p>
                        {sig.signed_at && (
                          <p className="text-xs font-mono uppercase tracking-wider text-[#10b981] mt-1">
                            Signed{" "}
                            {new Date(sig.signed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${statusColors[sig.status]}`}
                      >
                        {sig.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
