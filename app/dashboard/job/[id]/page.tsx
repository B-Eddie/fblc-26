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

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30",
    approved: "bg-green-600/20 text-green-400 border border-green-600/30",
    rejected: "bg-red-600/20 text-red-400 border border-red-600/30",
    signed: "bg-green-600/20 text-green-400 border border-green-600/30",
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

  const business = application.opportunity?.business;
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
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition"
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
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-2">
                {opportunity?.title}
              </h1>
              <div className="flex items-center space-x-3 text-gray-400">
                <Building2 className="w-5 h-5" />
                <span className="text-lg">{business?.name}</span>
                <span className="text-gray-600">•</span>
                <span className="capitalize">{business?.category}</span>
              </div>
            </div>
            <motion.span
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                application.status === "accepted"
                  ? "bg-green-600/20 text-green-400 border border-green-600/30"
                  : application.status === "completed"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                    : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
              }`}
            >
              {application.status.charAt(0).toUpperCase() +
                application.status.slice(1)}
            </motion.span>
          </div>
        </motion.div>

        {/* Hours Summary Cards */}
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
              label: "Pending",
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
              { id: "details", label: "Job Details", icon: Building2 },
              { id: "hours", label: "Hours", icon: Clock },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "signature", label: "Signature", icon: FileText },
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
        {activeTab === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Job Description */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Job Description
              </h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {opportunity?.description}
              </p>
              {opportunity?.requirements && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Requirements
                  </h3>
                  <p className="text-gray-400 whitespace-pre-wrap">
                    {opportunity.requirements}
                  </p>
                </div>
              )}
              {opportunity?.perks && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Perks
                  </h3>
                  <p className="text-gray-400 whitespace-pre-wrap">
                    {opportunity.perks}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{opportunity?.hours_available} hours available</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Applied{" "}
                    {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </span>
                {opportunity?.is_flexible && (
                  <span className="text-green-400 font-medium">
                    ✓ Flexible Schedule
                  </span>
                )}
              </div>
            </div>

            {/* Business Contact Info */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Contact Your Supervisor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business?.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center space-x-3 p-4 border border-gray-800/60 rounded-xl hover:border-gray-600/40 transition bg-gray-800/20"
                  >
                    <Phone className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white font-medium">{business.phone}</p>
                    </div>
                  </a>
                )}
                {business?.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center space-x-3 p-4 border border-gray-800/60 rounded-xl hover:border-gray-600/40 transition bg-gray-800/20"
                  >
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white font-medium">{business.email}</p>
                    </div>
                  </a>
                )}
                {business?.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 border border-gray-800/60 rounded-xl hover:border-gray-600/40 transition bg-gray-800/20"
                  >
                    <Globe className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Website</p>
                      <p className="text-white font-medium">
                        {business.website}
                      </p>
                    </div>
                  </a>
                )}
                {business?.address && (
                  <div className="flex items-center space-x-3 p-4 border border-gray-800/60 rounded-xl bg-gray-800/20">
                    <MapPin className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="text-white font-medium">
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
            className="space-y-6"
          >
            {/* Log New Hours */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Register Hours
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    placeholder="e.g., 3.5"
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newHoursDate}
                    onChange={(e) => setNewHoursDate(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newHoursDescription}
                    onChange={(e) => setNewHoursDescription(e.target.value)}
                    placeholder="What did you work on?"
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitHourLog}
                disabled={submittingHours || !newHours}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>
                  {submittingHours ? "Submitting..." : "Log Hours"}
                </span>
              </motion.button>
            </div>

            {/* Hour Logs Table */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Hours History
              </h2>
              {hourLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hours logged yet. Start by registering your first hours
                  above.
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
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[log.status]}`}
                      >
                        {log.status.charAt(0).toUpperCase() +
                          log.status.slice(1)}
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
            className="bg-gray-900/40 border border-gray-800/60 rounded-2xl backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800/60">
              <h2 className="text-2xl font-bold text-white">
                Messages with {business?.name}
              </h2>
            </div>

            {/* Messages List */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  No messages yet. Start a conversation with your supervisor.
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
                        {msg.sender?.full_name || "You"}
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

        {activeTab === "signature" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Request Signature */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Request Volunteer Hour Signature
              </h2>
              <p className="text-gray-400 mb-6">
                Request your supervisor to sign off on your approved volunteer
                hours. The Record of Community Involvement Hours form will be
                available for download.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestSignature}
                  disabled={requestingSignature || !canRequestSignature}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  <span>
                    {requestingSignature
                      ? "Requesting..."
                      : canRequestSignature
                        ? `Request Signature (${newHoursToRequest.toFixed(1)}h new)`
                        : "All approved hours requested"}
                  </span>
                </motion.button>
                <a
                  href="/record-of-community-involvement-hours.pdf"
                  download
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-700/50 text-gray-300 rounded-lg font-semibold hover:bg-gray-800/50 transition"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Blank Form</span>
                </a>
              </div>
              {!canRequestSignature && (
                <p className="text-yellow-400 text-sm mt-3 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {approvedHours === 0
                      ? "You need approved hours before requesting a signature."
                      : "You have already requested signatures for all your approved hours. Log more hours to request again."}
                  </span>
                </p>
              )}
            </div>

            {/* Signature History */}
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Signature Requests
              </h2>
              {signatureRequests.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No signature requests yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {signatureRequests.map((sig, i) => (
                    <motion.div
                      key={sig.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
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
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[sig.status]}`}
                        >
                          {sig.status.charAt(0).toUpperCase() +
                            sig.status.slice(1)}
                        </span>
                      </div>

                      {/* Show volunteer PDFSigner to add student signatures */}
                      {sig.status === "signed" && sig.signed_pdf_url && (
                        <div className="px-4 pb-4 space-y-4">
                          <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Complete Your Signatures
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
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
                            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-700/50 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800/50 transition"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Supervisor-Signed PDF</span>
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
