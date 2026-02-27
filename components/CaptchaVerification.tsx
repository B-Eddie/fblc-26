"use client";

import { useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { motion } from "framer-motion";

type CaptchaVerificationProps = {
  onTokenReceived: (token: string | null) => void;
};

export default function CaptchaVerification({
  onTokenReceived,
}: CaptchaVerificationProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn(
        "reCAPTCHA site key not found. Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable.",
      );
      onTokenReceived(null);
    }
  }, [siteKey, onTokenReceived]);

  if (!siteKey) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-sm"
      >
        ⚠️ reCAPTCHA not configured. Please add NEXT_PUBLIC_RECAPTCHA_SITE_KEY
        to .env.local
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center"
    >
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={(token: string | null) => {
          if (token) {
            console.log("✅ CAPTCHA verified successfully");
            onTokenReceived(token);
          } else {
            console.log("❌ CAPTCHA was reset");
            onTokenReceived(null);
          }
        }}
        theme="dark"
      />
    </motion.div>
  );
}
