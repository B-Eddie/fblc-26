import type { Metadata } from "next";
import "./globals.css";
import RecaptchaProvider from "@/components/RecaptchaProvider";

export const metadata: Metadata = {
  title: "Pilot — The fastest way for students to earn volunteer hours",
  description:
    "Pilot connects students with meaningful volunteer opportunities at local businesses. Earn real hours, gain experience, make an impact.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <RecaptchaProvider>{children}</RecaptchaProvider>
      </body>
    </html>
  );
}
