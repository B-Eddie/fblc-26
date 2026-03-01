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
  const [referenceLetterFile, setReferenceLetterFile] = useState<File | null>(
    null,
  );
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
    {},
  );
  const [customFiles, setCustomFiles] = useState<Record<string, File | null>>(
    {},
  );

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

  const uploadFile = async (
    file: File,
    folder: string,
  ): Promise<string | null> => {
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
            "Resume upload failed. Make sure the 'application-files' storage bucket exists in Supabase.",
          );
          setSubmitting(false);
          return;
        }
      }

      // Upload reference letter if provided
      let referenceLetterUrl: string | null = null;
      if (referenceLetterFile) {
        referenceLetterUrl = await uploadFile(
          referenceLetterFile,
          "references",
        );
        if (!referenceLetterUrl) {
          setError(
            "Reference letter upload failed. Make sure the 'application-files' storage bucket exists in Supabase.",
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
      const { error: insertError } = await supabase
        .from("applications")
        .insert([
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-[#333] border-t-[#4EA8F3] rounded-full"
        />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center card-surface p-12">
          <h1 className="text-2xl font-bold text-white mb-4 font-heading">Opportunity not found</h1>
          <Link href="/browse" className="text-ink-muted hover:text-[#4EA8F3] transition">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const customQuestions: CustomQuestion[] = opportunity.custom_questions || [];

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-[#050505]">
        {/* Header */}
        <header className="border-b border-[#222] sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-xl font-bold font-heading text-white">Vertex</span>
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-surface p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-[#4EA8F3] mx-auto mb-6" />
            </motion.div>
            <h1 className="text-4xl font-bold font-heading text-white mb-4">Application Submitted!</h1>
            <p className="text-ink-muted mb-10 max-w-md mx-auto leading-relaxed">
              Your application for <span className="text-white font-bold">{opportunity.title}</span> at{" "}
              <span className="text-white font-bold">{opportunity.business.name}</span> has been
              submitted. You'll be notified when the business reviews it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="btn-magnetic bg-white text-black px-8 py-4 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center text-center flex items-center"
              >
                <span className="relative z-10">View Dashboard</span>
                <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
              </Link>
              <Link
                href={`/opportunities/${params.id}`}
                className="px-8 py-4 border border-[#333] text-white rounded-full font-bold hover:border-[#4EA8F3] transition flex items-center justify-center"
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-[#222] sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl">
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
                className="hover:opacity-80 transition text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-xl font-bold font-heading tracking-tight text-white">
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
          className="card-surface p-6 mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">Applying to</p>
              <h2 className="text-2xl font-bold font-heading text-white mb-1">{opportunity.title}</h2>
              <Link
                href={`/business/${opportunity.business.id}`}
                className="text-ink-muted font-mono text-sm hover:text-[#4EA8F3] transition"
              >
                {opportunity.business.name} →
              </Link>
            </div>
            <div className="text-right font-mono text-sm text-ink-muted">
              <p>{opportunity.hours_available} hours</p>
              {opportunity.is_flexible && (
                <span className="inline-block mt-2 bg-[#4EA8F3]/10 text-[#4EA8F3] border border-[#4EA8F3]/50 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
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
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-white mb-3">
            Submit Your Application
          </h1>
          <p className="text-ink-muted text-lg font-mono">
            Fill out the form below to apply. Fields marked with * are required.
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 bg-[#1a0f0f] border border-red-500/30 rounded-xl p-4 flex items-start space-x-4"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </motion.div>
        )}

        {/* Application Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Basic Information Section */}
          <div className="card-surface p-8">
            <h3 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-ink-faint" />
              Basic Information
            </h3>

            <div className="space-y-6">
              {/* Why are you interested */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                  Why are you interested in this opportunity? *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the business why you'd be a great fit for this role..."
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm resize-none"
                />
                <p className="text-[11px] font-mono text-ink-faint mt-2">
                  This is your chance to stand out — share your motivation and relevant experience.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
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
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                />
                <p className="text-[11px] font-mono text-ink-faint mt-2">
                  Optional — in case the business needs to reach you quickly.
                </p>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
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
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm resize-none"
                />
                <p className="text-[11px] font-mono text-ink-faint mt-2">
                  Optional — let them know when you're free to volunteer.
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="card-surface p-8">
            <h3 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-ink-faint" />
              Documents
            </h3>

            <div className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                  Resume / CV
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 cursor-pointer px-5 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-ink-muted font-mono text-xs uppercase tracking-wider hover:border-[#4EA8F3] hover:text-white transition flex items-center gap-3">
                    <Upload className="w-4 h-4" />
                    <span>{resumeFile ? resumeFile.name : "Upload Resume"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setResumeFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                  {resumeFile && (
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-2 text-ink-muted hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-mono text-ink-faint mt-3">
                  Optional — PDF, DOC, or DOCX accepted.
                </p>
              </div>

              {/* Reference Letter Upload */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                  Reference Letter
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 cursor-pointer px-5 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-ink-muted font-mono text-xs uppercase tracking-wider hover:border-[#4EA8F3] hover:text-white transition flex items-center gap-3">
                    <Upload className="w-4 h-4" />
                    <span>
                      {referenceLetterFile
                        ? referenceLetterFile.name
                        : "Upload Reference Letter"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setReferenceLetterFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                  {referenceLetterFile && (
                    <button
                      type="button"
                      onClick={() => setReferenceLetterFile(null)}
                      className="p-2 text-ink-muted hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-mono text-ink-faint mt-3">
                  Optional — PDF, DOC, or DOCX accepted.
                </p>
              </div>
            </div>
          </div>

          {/* Custom Questions Section */}
          {customQuestions.length > 0 && (
            <div className="card-surface p-8">
              <h3 className="text-xl font-bold font-heading text-white mb-2 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-ink-faint" />
                Additional Questions
              </h3>
              <p className="text-sm font-mono text-ink-muted mb-8">
                The business has some additional questions for applicants.
              </p>

              <div className="space-y-8">
                {customQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
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
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm resize-none"
                      />
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="flex-shrink-0 cursor-pointer px-5 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-ink-muted font-mono text-xs uppercase tracking-wider hover:border-[#4EA8F3] hover:text-white transition flex items-center gap-3">
                          <Upload className="w-4 h-4" />
                          <span>
                            {customFiles[q.id]
                              ? customFiles[q.id]!.name
                              : "Choose file"}
                          </span>
                          <input
                            type="file"
                            onChange={(e) =>
                              handleCustomFileChange(
                                q.id,
                                e.target.files?.[0] || null,
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        {customFiles[q.id] && (
                          <button
                            type="button"
                            onClick={() => handleCustomFileChange(q.id, null)}
                            className="p-2 text-ink-muted hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
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
              className="flex-1 px-6 py-4 border border-[#333] text-white rounded-full font-bold hover:border-[#4EA8F3] transition text-center flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="btn-magnetic flex-1 flex bg-white text-black py-4 rounded-full text-base font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Application</span>
                  </>
                )}
              </span>
              <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
            </button>
          </motion.div>
        </motion.form>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 card-surface p-8"
        >
          <h3 className="text-lg font-bold font-heading text-white mb-4">Application Tips</h3>
          <ul className="space-y-4 text-ink-muted font-mono text-sm leading-relaxed">
            <li className="flex items-start space-x-3">
              <span className="text-[#4EA8F3] mt-0.5">•</span>
              <span>Be specific about why you're interested and what skills you bring</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-[#4EA8F3] mt-0.5">•</span>
              <span>
                Include your availability so the business can plan accordingly
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-[#4EA8F3] mt-0.5">•</span>
              <span>
                A resume or reference letter can help your application stand out
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-[#4EA8F3] mt-0.5">•</span>
              <span>Answer all required questions thoroughly</span>
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
