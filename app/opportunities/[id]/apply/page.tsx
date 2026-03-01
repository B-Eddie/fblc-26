"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Upload,
  Send,
  FileText,
  Phone,
  Calendar,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CustomQuestion {
  id: string;
  question: string;
  type: "text" | "file";
  required: boolean;
}

export default function ApplyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Form fields
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [availability, setAvailability] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [referenceLetterFile, setReferenceLetterFile] = useState<File | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [customFiles, setCustomFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);

      // Check role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if ((profileData as any)?.role === "business") {
        router.replace("/business/dashboard");
        return;
      }
      // Fetch opportunity with business details
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select(`*, business:businesses (*)`)
        .eq("id", params.id)
        .single();

      if (oppError) throw oppError;
      setOpportunity(oppData);

      // Check if already applied
      const { data: appData } = await supabase
        .from("applications")
        .select("*")
        .eq("profile_id", currentUser.id)
        .eq("opportunity_id", params.id)
        .limit(1);

      if (appData && appData.length > 0) setHasApplied(true);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("application-files")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("File upload failed:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("application-files")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !opportunity) return;

    setSubmitting(true);
    setError(null);

    try {
      // Validate required custom questions
      const questions: CustomQuestion[] = opportunity.custom_questions || [];
      for (const q of questions) {
        if (q.required) {
          if (q.type === "text" && !customAnswers[q.id]?.trim()) {
            setError(`Please answer the required question: "${q.question}"`);
            setSubmitting(false);
            return;
          }
          if (q.type === "file" && !customFiles[q.id]) {
            setError(`Please upload the required file for: "${q.question}"`);
            setSubmitting(false);
            return;
          }
        }
      }

      // Upload resume if provided
      let resumeUrl: string | null = null;
      if (resumeFile) {
        resumeUrl = await uploadFile(resumeFile, "resumes");
        if (!resumeUrl) {
          setError(
            "Resume upload failed. Make sure the 'application-files' storage bucket exists in Supabase."
          );
          setSubmitting(false);
          return;
        }
      }

      // Upload reference letter if provided
      let referenceLetterUrl: string | null = null;
      if (referenceLetterFile) {
        referenceLetterUrl = await uploadFile(referenceLetterFile, "references");
        if (!referenceLetterUrl) {
          setError(
            "Reference letter upload failed. Make sure the 'application-files' storage bucket exists in Supabase."
          );
          setSubmitting(false);
          return;
        }
      }

      // Upload custom file answers and build answers map
      const finalAnswers: Record<string, string> = { ...customAnswers };
      for (const q of questions) {
        if (q.type === "file" && customFiles[q.id]) {
          const url = await uploadFile(customFiles[q.id]!, "custom");
          if (url) {
            finalAnswers[q.id] = url;
          } else if (q.required) {
            setError(`File upload failed for: "${q.question}"`);
            setSubmitting(false);
            return;
          }
        }
      }

      // Submit the application
      const { error: insertError } = await supabase.from("applications").insert([
        {
          profile_id: user.id,
          opportunity_id: params.id,
          message: message.trim() || null,
          phone_number: phoneNumber.trim() || null,
          availability: availability.trim() || null,
          resume_url: resumeUrl,
          reference_letter_url: referenceLetterUrl,
          custom_answers: finalAnswers,
          status: "pending",
        },
      ] as any);

      if (insertError) throw insertError;

      setHasApplied(true);
    } catch (err: any) {
      console.error("Error submitting application:", err);
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomFileChange = (questionId: string, file: File | null) => {
    setCustomFiles((prev) => ({ ...prev, [questionId]: file }));
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Opportunity not found</h1>
          <Link href="/browse" className="text-gray-400 hover:text-gray-300 transition">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const customQuestions: CustomQuestion[] = opportunity.custom_questions || [];

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
        {/* Header */}
        <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src="/image.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-2xl font-bold text-white">Vertex</span>
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-12 text-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-3">Application Submitted!</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Your application for <span className="text-white font-medium">{opportunity.title}</span> at{" "}
              <span className="text-white font-medium">{opportunity.business.name}</span> has been
              submitted. You'll be notified when the business reviews it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
              >
                View Dashboard
              </Link>
              <Link
                href={`/opportunities/${params.id}`}
                className="px-6 py-3 bg-gray-800/50 text-gray-300 rounded-lg font-semibold hover:bg-gray-700/50 transition"
              >
                Back to Opportunity
              </Link>
            </div>
          </motion.div>
        </main>
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
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-4">
              <Link
                href={`/opportunities/${params.id}`}
                className="hover:opacity-80 transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src="/image.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                  Vertex
                </span>
              </Link>
            </div>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Opportunity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-6 mb-8 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Applying to</p>
              <h2 className="text-2xl font-bold text-white mb-1">{opportunity.title}</h2>
              <Link
                href={`/business/${opportunity.business.id}`}
                className="text-gray-400 hover:text-gray-300 transition"
              >
                {opportunity.business.name} →
              </Link>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{opportunity.hours_available} hours</p>
              {opportunity.is_flexible && (
                <span className="inline-block mt-1 bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full text-xs border border-green-600/30">
                  Flexible
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-3">
            Submit Your Application
          </h1>
          <p className="text-gray-400 text-lg">
            Fill out the form below to apply. Fields marked with * are required.
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-600/20 border border-red-600/30 rounded-xl p-4 flex items-start space-x-4"
          >
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Application Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Basic Information Section */}
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Basic Information
            </h3>

            <div className="space-y-6">
              {/* Why are you interested */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Why are you interested in this opportunity? *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the business why you'd be a great fit for this role..."
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your chance to stand out — share your motivation and relevant experience.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional — in case the business needs to reach you quickly.
                </p>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Availability
                  </span>
                </label>
                <textarea
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g., Weekdays after 3 PM, Saturdays 9 AM–5 PM, flexible on weekends..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional — let them know when you're free to volunteer.
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              Documents
            </h3>

            <div className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Resume / CV
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 cursor-pointer px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>{resumeFile ? resumeFile.name : "Upload Resume"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {resumeFile && (
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1 text-gray-500 hover:text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional — PDF, DOC, or DOCX accepted.
                </p>
              </div>

              {/* Reference Letter Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reference Letter
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 cursor-pointer px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>
                      {referenceLetterFile ? referenceLetterFile.name : "Upload Reference Letter"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setReferenceLetterFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {referenceLetterFile && (
                    <button
                      type="button"
                      onClick={() => setReferenceLetterFile(null)}
                      className="p-1 text-gray-500 hover:text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional — PDF, DOC, or DOCX accepted.
                </p>
              </div>
            </div>
          </div>

          {/* Custom Questions Section */}
          {customQuestions.length > 0 && (
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Additional Questions
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                The business has some additional questions for applicants.
              </p>

              <div className="space-y-6">
                {customQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {q.question} {q.required && "*"}
                    </label>

                    {q.type === "text" ? (
                      <textarea
                        value={customAnswers[q.id] || ""}
                        onChange={(e) =>
                          setCustomAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your answer here..."
                        rows={3}
                        required={q.required}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
                      />
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="flex-shrink-0 cursor-pointer px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          <span>
                            {customFiles[q.id]
                              ? customFiles[q.id]!.name
                              : "Choose file"}
                          </span>
                          <input
                            type="file"
                            onChange={(e) =>
                              handleCustomFileChange(q.id, e.target.files?.[0] || null)
                            }
                            className="hidden"
                          />
                        </label>
                        {customFiles[q.id] && (
                          <button
                            type="button"
                            onClick={() => handleCustomFileChange(q.id, null)}
                            className="p-1 text-gray-500 hover:text-red-400 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link
              href={`/opportunities/${params.id}`}
              className="flex-1 px-6 py-4 bg-gray-800/50 text-gray-300 rounded-xl font-semibold hover:bg-gray-700/50 transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </motion.div>
        </motion.form>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gray-800/20 border border-gray-700/30 rounded-2xl p-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Application Tips</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start space-x-3">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>Be specific about why you're interested and what skills you bring</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>Include your availability so the business can plan accordingly</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>A resume or reference letter can help your application stand out</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>Answer all required questions thoroughly</span>
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
