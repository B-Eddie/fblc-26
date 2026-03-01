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
    pending: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30",
    approved: "bg-green-600/20 text-green-400 border border-green-600/30",
    rejected: "bg-red-600/20 text-red-400 border border-red-600/30",
    signed: "bg-green-600/20 text-green-400 border border-green-600/30",
    accepted: "bg-green-600/20 text-green-400 border border-green-600/30",
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

  if (!application) return null;

  const volunteer = application.profile;
  const opportunity = application.opportunity;

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
            <Link
              href="/business/dashboard"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition"
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
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-2">
                {volunteer?.full_name}
              </h1>
              <div className="flex items-center space-x-3 text-gray-400">
                <Briefcase className="w-5 h-5" />
                <span className="text-lg">{opportunity?.title}</span>
                <span className="text-gray-600">•</span>
                <Mail className="w-4 h-4" />
                <span>{volunteer?.email}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[application.status] || statusColors.pending}`}
              >
                {application.status.charAt(0).toUpperCase() +
                  application.status.slice(1)}
              </motion.span>
              {application.status === "accepted" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateApplicationStatus("completed")}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition"
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
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm font-medium hover:bg-green-600/30 transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Hire</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateApplicationStatus("rejected")}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition"
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
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: Clock,
              label: "Total Logged",
              value: `${totalLoggedHours.toFixed(1)}h`,
              color: "from-blue-600/20 to-blue-700/20 border-blue-600/30",
            },
            {
              icon: CheckCircle,
              label: "Approved",
              value: `${approvedHours.toFixed(1)}h`,
              color: "from-green-600/20 to-green-700/20 border-green-600/30",
            },
            {
              icon: AlertCircle,
              label: "Pending Review",
              value: `${pendingHours.toFixed(1)}h`,
              color: "from-yellow-600/20 to-yellow-700/20 border-yellow-600/30",
            },
            {
              icon: FileText,
              label: "Signatures",
              value: signatureRequests.filter((s) => s.status === "signed")
                .length,
              color: "from-purple-600/20 to-purple-700/20 border-purple-600/30",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
              className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-10 h-10 text-gray-400 opacity-50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex space-x-1 bg-gray-900/40 border border-gray-800/60 rounded-xl p-1 mb-8"
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
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-gray-700/60 text-white"
                  : "text-gray-400 hover:text-gray-200"
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
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Volunteer Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4 p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {volunteer?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {volunteer?.full_name}
                    </p>
                    <p className="text-gray-400 text-sm">{volunteer?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                  <Calendar className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Applied</p>
                    <p className="text-white font-medium">
                      {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {application.message && (
                <div className="mt-6 p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                  <p className="text-sm text-gray-400 mb-1">
                    Application Message
                  </p>
                  <p className="text-gray-200 italic">
                    &quot;{application.message}&quot;
                  </p>
                </div>
              )}

              {/* Extended Application Details */}
              {((application as any).phone_number || (application as any).availability || (application as any).resume_url || (application as any).reference_letter_url) && (
                <div className="mt-6 space-y-4">
                  {(application as any).phone_number && (
                    <div className="p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                      <p className="text-sm text-gray-400 mb-1">Phone Number</p>
                      <p className="text-gray-200">{(application as any).phone_number}</p>
                    </div>
                  )}
                  {(application as any).availability && (
                    <div className="p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                      <p className="text-sm text-gray-400 mb-1">Availability</p>
                      <p className="text-gray-200 whitespace-pre-wrap">{(application as any).availability}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {(application as any).resume_url && (
                      <a
                        href={(application as any).resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition text-sm"
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition text-sm"
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
                    <h4 className="text-md font-semibold text-white mb-3">Custom Question Responses</h4>
                    <div className="space-y-3">
                      {answeredQuestions.map((q: any) => (
                        <div key={q.id} className="p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                          <p className="text-sm text-gray-400 mb-1">{q.question}</p>
                          {q.type === "file" ? (
                            <a
                              href={customAnswers[q.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition"
                            >
                              <FileText className="w-4 h-4" />
                              View Uploaded File
                            </a>
                          ) : (
                            <p className="text-gray-200 whitespace-pre-wrap">{customAnswers[q.id]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Opportunity Details */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Opportunity Details
              </h2>
              <h3 className="text-lg font-semibold text-white mb-2">
                {opportunity?.title}
              </h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {opportunity?.description}
              </p>
              {opportunity?.requirements && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-white mb-1">
                    Requirements
                  </h4>
                  <p className="text-gray-400 whitespace-pre-wrap">
                    {opportunity.requirements}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{opportunity?.hours_available} hours available</span>
                </span>
                {opportunity?.is_flexible && (
                  <span className="text-green-400 font-medium">
                    ✓ Flexible Schedule
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
              <div className="bg-yellow-600/5 border border-yellow-600/30 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Pending Approval
                </h2>
                <p className="text-gray-400 text-sm mb-6">
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
                        className="flex items-center justify-between p-4 border border-gray-800/60 rounded-xl bg-gray-800/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-semibold text-lg">
                              {parseFloat(log.hours).toFixed(1)} hours
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400 text-sm">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-sm text-gray-400 mt-1">
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
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm font-medium hover:bg-green-600/30 transition disabled:opacity-50"
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
                            className="flex items-center space-x-1 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition disabled:opacity-50"
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
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                All Hour Logs
              </h2>
              {hourLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
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
                      className="flex items-center justify-between p-4 border border-gray-800/60 rounded-xl bg-gray-800/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-semibold">
                            {parseFloat(log.hours).toFixed(1)} hours
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-gray-400 mt-1">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[log.status]}`}
                        >
                          {log.status.charAt(0).toUpperCase() +
                            log.status.slice(1)}
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
                                className="p-1.5 text-green-400 hover:bg-green-600/20 rounded-lg transition disabled:opacity-50"
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
                                className="p-1.5 text-red-400 hover:bg-red-600/20 rounded-lg transition disabled:opacity-50"
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
            className="bg-gray-900/40 border border-gray-800/60 rounded-2xl backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800/60">
              <h2 className="text-2xl font-bold text-white">
                Messages with {volunteer?.full_name}
              </h2>
            </div>

            {/* Messages List */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  No messages yet. Start a conversation with your volunteer.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_id === currentUser?.id
                          ? "bg-gray-700/60 text-white"
                          : "bg-gray-800/60 text-gray-200 border border-gray-700/40"
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-1">
                        {msg.sender?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800/60">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={submittingMessage || !newMessage.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
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
              <div className="bg-yellow-600/5 border border-yellow-600/30 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Pending Signature Requests
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  The volunteer has requested you to sign their community
                  involvement hours form.
                </p>
                <div className="space-y-4">
                  {signatureRequests
                    .filter((sig) => sig.status === "pending")
                    .map((sig) => (
                      <div
                        key={sig.id}
                        className="border border-gray-800/60 rounded-xl p-6 bg-gray-800/20"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white font-semibold text-lg">
                              {parseFloat(sig.total_hours).toFixed(1)} hours
                            </p>
                            <p className="text-sm text-gray-400">
                              Requested{" "}
                              {new Date(sig.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                            Awaiting Signature
                          </span>
                        </div>

                        {/* PDF Signer Component */}
                        {signingRequest !== sig.id ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSigningRequest(sig.id)}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                          >
                            <PenTool className="w-5 h-5" />
                            <span>Open PDF &amp; Sign</span>
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
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-2">
                Sign Volunteer Hours Form
              </h2>
              <p className="text-gray-400 text-sm mb-6">
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
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Signature History
              </h2>
              {signatureRequests.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
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
                      className="flex items-center justify-between p-4 border border-gray-800/60 rounded-xl bg-gray-800/20"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {parseFloat(sig.total_hours).toFixed(1)} hours
                        </p>
                        <p className="text-sm text-gray-400">
                          Requested{" "}
                          {new Date(sig.created_at).toLocaleDateString()}
                        </p>
                        {sig.signed_at && (
                          <p className="text-sm text-green-400">
                            Signed{" "}
                            {new Date(sig.signed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[sig.status]}`}
                      >
                        {sig.status.charAt(0).toUpperCase() +
                          sig.status.slice(1)}
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
