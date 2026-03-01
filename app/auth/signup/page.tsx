"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import CaptchaVerification from "@/components/CaptchaVerification";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "business">(
    roleParam === "business" ? "business" : "student",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingAuth(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if ((profile as any)?.role === "business") {
        router.replace("/business/dashboard");
      } else {
        router.replace("/dashboard");
      }
    };
    redirectIfLoggedIn();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA verification");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error("No user data returned");

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          email_verified: true,
        },
      ] as any);

      if (profileError) throw profileError;

      setSignUpSuccess(true);
      setVerificationEmail(email);
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      setError(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="/"
              className="inline-flex items-center space-x-3 mb-8 hover:opacity-80 transition"
            >
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain filter grayscale brightness-200" />
              <span className="text-3xl font-bold font-heading text-white tracking-tight">
                Pilot
              </span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-4xl font-bold text-white font-heading tracking-tight">
              Initialize <span className="font-drama italic font-normal text-[#4EA8F3]">Profile</span>
            </h1>
            <p className="text-ink-muted mt-3 font-mono text-sm uppercase tracking-widest">Join the network</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="card-surface p-8 backdrop-blur-xl bg-[#0a0a0a]/80 border-[#222]">
          {signUpSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-green-600/20 border border-green-600/30 rounded-full flex items-center justify-center mx-auto"
              >
                <img
                  src="/image.png"
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-full"
                />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight text-white mb-2">
                  Account Created!
                </h2>
                <p className="text-ink-muted mb-4 font-mono text-sm">
                  Welcome to Vertex,{" "}
                  <span className="font-bold text-white">
                    {verificationEmail}
                  </span>
                  !
                </p>
                <p className="text-ink-faint text-xs mb-6 font-mono leading-relaxed">
                  Your account has been successfully created. You can now log in
                  and start exploring opportunities and businesses.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="btn-magnetic w-full flex bg-white text-black py-4 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center text-center"
              >
                <span className="relative z-10 flex items-center justify-center">Go to Login</span>
                <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
              </Link>
              {/* Removed duplicate login link for Account Created page */}
            </motion.div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-950/40 border border-red-800/60 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-4">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-4 border-2 rounded-xl font-bold font-heading transition-colors ${
                      role === "student"
                        ? "border-[#4EA8F3] bg-[#4EA8F3]/10 text-[#4EA8F3]"
                        : "border-[#2a2a2a] text-ink-muted hover:border-[#4EA8F3] hover:text-white"
                    }`}
                  >
                    Student
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setRole("business")}
                    className={`p-4 border-2 rounded-xl font-bold font-heading transition-colors ${
                      role === "business"
                        ? "border-[#4EA8F3] bg-[#4EA8F3]/10 text-[#4EA8F3]"
                        : "border-[#2a2a2a] text-ink-muted hover:border-[#4EA8F3] hover:text-white"
                    }`}
                  >
                    Business
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <label
                  htmlFor="fullName"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  placeholder="John Doe"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label
                  htmlFor="email"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  placeholder="you@example.com"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#4EA8F3] transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <CaptchaVerification onTokenReceived={setRecaptchaToken} />
              </motion.div>

              <button
                type="submit"
                disabled={loading || !recaptchaToken}
                className="btn-magnetic w-full flex bg-white text-black py-4 rounded-full text-sm font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500 justify-center disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full mr-2"
                    />
                    Creating account...
                  </span>
                ) : (
                  "Sign Up"
                )}
                </span>
                <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
              </button>
            </form>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-ink-muted text-sm font-mono">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-white hover:text-[#4EA8F3] font-bold transition-colors"
              >
                Log in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignUpContent />
    </Suspense>
  );
}
