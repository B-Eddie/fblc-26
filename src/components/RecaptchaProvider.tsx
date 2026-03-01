"use client";

import { ReactNode } from "react";

type RecaptchaProviderProps = {
  children: ReactNode;
};

// For reCAPTCHA v2, we don't need a provider wrapper
// The ReCAPTCHA component can be used directly
export default function RecaptchaProvider({
  children,
}: RecaptchaProviderProps) {
  return <>{children}</>;
}
