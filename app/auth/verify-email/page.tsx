"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the hash from the URL (Supabase sends it via URL fragment)
        const hash = window.location.hash.slice(1);

        if (!hash) {
          // Check if we're on a confirmation from Supabase
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            setStatus("error");
            setMessage(
              "Email verification failed. The link may be expired or invalid. Please try signing up again.",
            );
            return;
          }

          // Update profile to mark email as verified
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", user.id);

          if (updateError) throw updateError;

          setStatus("success");
          setMessage("Email verified! Redirecting to dashboard...");

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);

          return;
        }

        // Handle the hash-based verification from Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: hash,
          type: "email",
        });

        if (error) {
          setStatus("error");
          setMessage(
            "Email verification failed. The link may be expired or invalid. Please try signing up again.",
          );
          return;
        }

        if (data.user) {
          // Update profile to mark email as verified
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", data.user.id);

          if (updateError) throw updateError;

          setStatus("success");
          setMessage("Email verified! Redirecting to dashboard...");

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage(
          error.message ||
            "Email verification failed. The link may be expired or invalid.",
        );
      }
    };

    verifyEmail();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center px-4 py-12">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 mb-8 hover:opacity-80 transition"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-3xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
              Vertex
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm text-center"
        >
          {status === "loading" && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 border-4 border-gray-700/30 border-t-gray-700 rounded-full mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold text-white mb-4">
                Verifying Email
              </h1>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-green-600/20 border border-green-600/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Email Verified!
              </h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
              >
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/signup"
                  className="block px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
                >
                  Try Sign Up Again
                </Link>
                <Link
                  href="/"
                  className="block px-6 py-3 bg-gray-800/50 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 border border-gray-700/50 transition"
                >
                  Back Home
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
