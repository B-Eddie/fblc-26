import type { Metadata } from "next";
import "./globals.css";
import RecaptchaProvider from "@/components/RecaptchaProvider";

export const metadata: Metadata = {
  title: "Vertex — The fastest way for students to earn volunteer hours",
  description:
    "Vertex connects students with meaningful volunteer opportunities at local businesses. Earn real hours, gain experience, make an impact.",
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
      <body suppressHydrationWarning={true} className="bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
        <svg className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.03]">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        <RecaptchaProvider>{children}</RecaptchaProvider>
      </body>
    </html>
  );
}
