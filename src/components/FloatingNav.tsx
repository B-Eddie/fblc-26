"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const dashboardHref = profile?.role === "business" ? "/business/dashboard" : "/dashboard";

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-6 py-3 flex items-center gap-8 bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#222] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
        <img src="/logo.png" alt="Pilot Logo" className="w-8 h-8 object-contain filter grayscale brightness-200" />
        <div className="font-heading font-bold text-xl tracking-tight text-white">Pilot</div>
      </Link>
      
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
        <Link 
          href="/browse" 
          className={`lift-hover transition-colors ${pathname.startsWith('/browse') ? 'text-white' : 'hover:text-white'}`}
        >
          Browse
        </Link>
        {session && (
          <Link 
            href={dashboardHref}
            className={`lift-hover transition-colors ${pathname.includes('dashboard') ? 'text-white' : 'hover:text-white'}`}
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <button
            onClick={handleLogout}
            className="btn-magnetic bg-white text-black px-5 py-2 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow"
          >
            <span className="relative z-10 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </span>
            <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
          </button>
        ) : (
          <>
            <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-ink-muted lift-hover hover:text-white">
              Log In
            </Link>
            <Link href="/auth/signup" className="btn-magnetic bg-white text-black px-5 py-2 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow">
              <span className="relative z-10">Sign Up</span>
              <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}