// Student application detail page with PDF signature
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Clock,
  Send,
  FileText,
  Plus,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Download,
  MessageCircle,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import PDFSigner from "@/components/PDFSigner";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [application, setApplication] = useState<any>(null);
  const [hourLogs, setHourLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [volunteerProfile, setVolunteerProfile] = useState<any>(null);

  // Form states
  const [newHours, setNewHours] = useState("");
  const [newHoursDate, setNewHoursDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newHoursDescription, setNewHoursDescription] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submittingHours, setSubmittingHours] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [requestingSignature, setRequestingSignature] = useState(false);

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
    fetchJobData(user.id);
  };

  const fetchJobData = async (userId: string) => {
    try {
      // Fetch application with opportunity and business details
      const { data: appData, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          opportunity:opportunities (
            *,
            business:businesses (*)
          )
        `,
        )
        .eq("id", params.id)
        .eq("profile_id", userId)
        .single();

      if (error || !appData) {
        router.push("/dashboard");
        return;
      }

      setApplication(appData);

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

      // Fetch volunteer profile for name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      setVolunteerProfile(profileData);
    } catch (error) {
      console.error("Error fetching job data:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitHourLog = async () => {
    if (!newHours || !newHoursDate || !currentUser) return;
    setSubmittingHours(true);
    try {
      const { data, error } = await supabase
        .from("hour_logs")
        .insert({
          application_id: params.id,
          profile_id: currentUser.id,
          hours: parseFloat(newHours),
          date: newHoursDate,
          description: newHoursDescription || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setHourLogs([data, ...hourLogs]);
      setNewHours("");
      setNewHoursDescription("");
      setNewHoursDate(new Date().toISOString().split("T")[0]);
    } catch (error: any) {
      alert("Error logging hours: " + error.message);
    } finally {
      setSubmittingHours(false);
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

  const requestSignature = async () => {
    if (!currentUser) return;
    setRequestingSignature(true);
    try {
      const approvedHours = hourLogs
        .filter((log) => log.status === "approved")
        .reduce((sum, log) => sum + parseFloat(log.hours), 0);

      const alreadyRequested = signatureRequests.reduce(
        (sum, sig) => sum + (parseFloat(sig.total_hours) || 0),
        0,
      );
      const hoursToRequest = approvedHours - alreadyRequested;

      if (hoursToRequest <= 0) {
        alert("You have already requested signatures for all your approved hours.");
        setRequestingSignature(false);
        return;
      }

      const { data, error } = await supabase
        .from("signature_requests")
        .insert({
          application_id: params.id,
          requested_by: currentUser.id,
          total_hours: hoursToRequest,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setSignatureRequests([data, ...signatureRequests]);
    } catch (error: any) {
      alert("Error requesting signature: " + error.message);
    } finally {
      setRequestingSignature(false);
    }
  };

  const totalLoggedHours = hourLogs.reduce(
    (sum, log) => sum + parseFloat(log.hours),
    0,
  );
  const approvedHours = hourLogs
    .filter((log) => log.status === "approved")
    .reduce((sum, log) => sum + parseFloat(log.hours), 0);
  const alreadyRequestedHours = signatureRequests.reduce(
    (sum, sig) => sum + (parseFloat(sig.total_hours) || 0),
    0,
  );
  const newHoursToRequest = approvedHours - alreadyRequestedHours;
  const canRequestSignature = newHoursToRequest > 0;
  const pendingHours = hourLogs
    .filter((log) => log.status === "pending")
    .reduce((sum, log) => sum + parseFloat(log.hours), 0);

  const statusStyles: Record<string, string> = {
    pending: "bg-[#1a1a1a] text-[#f59e0b] border-[#f59e0b]/30",
    approved: "bg-[#1a1a1a] text-[#10b981] border-[#10b981]/30",
    rejected: "bg-[#1a1a1a] text-[#ef4444] border-[#ef4444]/30",
    signed: "bg-[#1a1a1a] text-[#4EA8F3] border-[#4EA8F3]/30",
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

  if (!application) return null;

  const business = application.opportunity?.business;
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
              href="/dashboard"
              className="flex items-center space-x-2 text-sm font-medium text-ink-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-white mb-3">
                {opportunity?.title}
              </h1>
              <div className="flex items-center space-x-3 text-ink-muted font-mono text-sm uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span className="font-bold text-white">{business?.name}</span>
                <span className="text-ink-faint">•</span>
                <span>{business?.category}</span>
              </div>
            </div>
            <motion.span
              className={`px-4 py-2 border rounded-full text-xs font-mono uppercase tracking-wider font-bold ${
                application.status === "accepted"
                  ? "bg-[#1a1a1a] text-[#10b981] border-[#10b981]/30"
                  : application.status === "completed"
                    ? "bg-[#1a1a1a] text-[#4EA8F3] border-[#4EA8F3]/30"
                    : "bg-[#1a1a1a] text-[#f59e0b] border-[#f59e0b]/30"
              }`}
            >
              {application.status}
            </motion.span>
          </div>
        </motion.div>

        {/* Hours Summary Cards */}
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
              { id: "details", label: "Job Details", icon: Building2 },
              { id: "hours", label: "Hours", icon: Clock },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "signature", label: "Signature", icon: FileText },
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
        {activeTab === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Job Description */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Job Description
              </h2>
              <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                {opportunity?.description}
              </p>
              {opportunity?.requirements && (
                <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                  <h3 className="text-lg font-bold font-heading text-white mb-4">
                    Requirements
                  </h3>
                  <p className="text-ink-muted whitespace-pre-wrap">
                    {opportunity.requirements}
                  </p>
                </div>
              )}
              {opportunity?.perks && (
                <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                  <h3 className="text-lg font-bold font-heading text-white mb-4">
                    Perks
                  </h3>
                  <p className="text-ink-muted whitespace-pre-wrap">
                    {opportunity.perks}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-[#2a2a2a] text-sm font-mono text-ink-muted">
                <span className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ink-faint" />
                  <span>{opportunity?.hours_available} hours available</span>
                </span>
                <span className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-ink-faint" />
                  <span>
                    Applied:{" "}
                    {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </span>
                {opportunity?.is_flexible && (
                  <span className="text-[#4EA8F3] font-bold border border-[#4EA8F3]/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                    Flexible Schedule
                  </span>
                )}
              </div>
            </div>

            {/* Business Contact Info */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Contact Your Supervisor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business?.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl hover:border-[#4EA8F3] transition-colors bg-[#0a0a0a]"
                  >
                    <Phone className="w-5 h-5 text-[#4EA8F3]" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Phone</p>
                      <p className="text-white font-medium">{business.phone}</p>
                    </div>
                  </a>
                )}
                {business?.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl hover:border-[#4EA8F3] transition-colors bg-[#0a0a0a]"
                  >
                    <Mail className="w-5 h-5 text-[#4EA8F3]" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Email</p>
                      <p className="text-white font-medium truncate max-w-[200px]">{business.email}</p>
                    </div>
                  </a>
                )}
                {business?.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl hover:border-[#4EA8F3] transition-colors bg-[#0a0a0a]"
                  >
                    <Globe className="w-5 h-5 text-[#4EA8F3]" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Website</p>
                      <p className="text-white font-medium truncate max-w-[200px]">
                        {business.website}
                      </p>
                    </div>
                  </a>
                )}
                {business?.address && (
                  <div className="flex items-center space-x-4 p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a]">
                    <MapPin className="w-5 h-5 text-[#4EA8F3]" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">Address</p>
                      <p className="text-white font-medium text-sm">
                        {business.address}, {business.city},{" "}
                        {business.province}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "hours" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Log New Hours */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Register Hours
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    placeholder="e.g., 3.5"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newHoursDate}
                    onChange={(e) => setNewHoursDate(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newHoursDescription}
                    onChange={(e) => setNewHoursDescription(e.target.value)}
                    placeholder="What did you work on?"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  />
                </div>
              </div>
              <button
                onClick={submitHourLog}
                disabled={submittingHours || !newHours}
                className="btn-magnetic w-full md:w-auto flex bg-white text-black px-8 py-3 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow duration-500 justify-center disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>
                    {submittingHours ? "Submitting..." : "Log Hours"}
                  </span>
                </span>
                <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
              </button>
            </div>

            {/* Hour Logs Table */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Hours History
              </h2>
              {hourLogs.length === 0 ? (
                <p className="text-ink-muted font-mono text-center py-8">
                  No hours logged yet. Start by registering your first hours
                  above.
                </p>
              ) : (
                <div className="space-y-4">
                  {hourLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-[#2a2a2a] rounded-2xl bg-[#0a0a0a] hover:border-[#444] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-white font-bold font-heading text-lg">
                            {parseFloat(log.hours).toFixed(1)} hours
                          </span>
                          <span className="text-ink-faint">•</span>
                          <span className="text-ink-muted text-xs font-mono uppercase tracking-wider">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-ink-muted leading-relaxed">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 border rounded-full text-[10px] font-mono uppercase tracking-wider font-bold whitespace-nowrap self-start sm:self-auto ${statusStyles[log.status]}`}
                      >
                        {log.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "messages" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface overflow-hidden flex flex-col h-[600px]"
          >
            <div className="p-6 border-b border-[#2a2a2a] bg-[#0a0a0a]">
              <h2 className="text-xl font-bold font-heading text-white">
                Messages with {business?.name}
              </h2>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-ink-muted font-mono text-sm">
                    No messages yet. Start a conversation with your supervisor.
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
                        {msg.sender?.full_name || "You"}
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
            <div className="p-5 border-t border-[#2a2a2a] bg-[#0a0a0a]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Type a message..."
                  className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={submittingMessage || !newMessage.trim()}
                  className="px-5 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "signature" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Request Signature */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-4">
                Request Volunteer Hour Signature
              </h2>
              <p className="text-ink-muted leading-relaxed mb-8 max-w-2xl">
                Request your supervisor to sign off on your approved volunteer
                hours. The Record of Community Involvement Hours form will be
                available for download once requested.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={requestSignature}
                  disabled={requestingSignature || !canRequestSignature}
                  className="btn-magnetic flex bg-white text-black px-6 py-3 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow duration-500 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>
                      {requestingSignature
                        ? "Requesting..."
                        : canRequestSignature
                        ? `Request Signature (${newHoursToRequest.toFixed(1)}h new)`
                        : "All hours requested"}
                    </span>
                  </span>
                  <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
                </button>
                <a
                  href="/record-of-community-involvement-hours.pdf"
                  download
                  className="flex items-center space-x-2 px-6 py-3 border border-[#333] text-white rounded-full font-bold text-sm hover:border-[#4EA8F3] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Blank Form</span>
                </a>
              </div>
              {!canRequestSignature && (
                <p className="text-[#f59e0b] text-xs font-mono uppercase tracking-wider mt-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {approvedHours === 0
                      ? "You need approved hours before requesting a signature."
                      : "You have already requested signatures for all your approved hours. Log more hours to request again."}
                  </span>
                  <span>You need approved hours before requesting a signature.</span>
                </p>
              )}
            </div>

            {/* Signature History */}
            <div className="card-surface p-8">
              <h2 className="text-2xl font-bold font-heading text-white mb-6">
                Signature Requests
              </h2>
              {signatureRequests.length === 0 ? (
                <p className="text-ink-muted font-mono text-center py-8">
                  No signature requests yet.
                </p>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {signatureRequests.map((sig, i) => (
                    <motion.div
                      key={sig.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-gray-800/60 rounded-xl bg-gray-800/20 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4">
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
                          {sig.notes && (
                            <p className="text-sm text-gray-400 mt-1 italic">
                              {sig.notes}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${statusStyles[sig.status]}`}
                        >
                          {sig.status.charAt(0).toUpperCase() +
                            sig.status.slice(1)}
                        </span>
                      </div>

                      {/* Show volunteer PDFSigner to add student signatures */}
                      <div className="py-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold font-heading text-white">
                              {parseFloat(sig.total_hours).toFixed(1)}
                            </span>
                            <span className="text-xs font-mono text-ink-muted uppercase tracking-wider">hours</span>
                          </div>
                          <span
                            className={`px-3 py-1 border rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${statusStyles[sig.status]}`}
                          >
                            {sig.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-ink-faint mb-1">
                          <span>Requested {new Date(sig.created_at).toLocaleDateString()}</span>
                          {sig.signed_at && (
                            <>
                              <span>·</span>
                              <span className="text-[#10b981]">Signed {new Date(sig.signed_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        {sig.notes && (
                          <p className="text-sm text-ink-muted mt-2 leading-relaxed border-l-2 border-[#333] pl-3">
                            {sig.notes}
                          </p>
                        )}
                      </div>

                      {/* Volunteer signs here */}
                      {sig.status === "signed" && sig.signed_pdf_url && (
                        <div className="pt-4 border-t border-[#222] space-y-4">
                          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Complete Your Signatures
                            </h3>
                            <p className="text-sm text-ink-muted mb-4">
                              Your supervisor has signed the form. Add your
                              signatures below to finalize it.
                            </p>
                            <PDFSigner
                              role="volunteer"
                              pdfUrl={sig.signed_pdf_url}
                              volunteerName={volunteerProfile?.full_name || ""}
                              supervisorName={business?.name || ""}
                              totalHours={approvedHours}
                              opportunityTitle={opportunity?.title || ""}
                              applicationId={params.id}
                              signatureRequestId={sig.id}
                            />
                          </div>
                          <a
                            href={sig.signed_pdf_url}
                            download={`signed-volunteer-hours.pdf`}
                            className="inline-flex items-center space-x-2 px-4 py-2 border border-[#333] text-ink-muted rounded-lg text-sm font-medium hover:bg-[#111] hover:text-white transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download supervisor-signed PDF</span>
                          </a>
                        </div>
                      )}
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
