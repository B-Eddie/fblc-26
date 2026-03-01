  'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, MousePointer2, Award } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

import { ShaderAnimation } from "@/components/ui/shader-animation";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  
  // Typewriter state
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = "Scanning local opportunities...\nVerified role found.\nTransparent time commitment confirmed.";

  // When logged in, redirect auth links to the user's dashboard
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if ((profile as any)?.role === "business") {
        setDashboardHref("/business/dashboard");
      } else {
        setDashboardHref("/dashboard");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let shufflerInterval: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;

    const ctx = gsap.context(() => {
      // --- A. NAVBAR ---
      ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: { className: 'nav-scrolled', targets: navRef.current },
      });

      // --- B. HERO ---
      gsap.fromTo(
        '.hero-element',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
      );

      // --- C. FEATURES ---
      // Card 1: Diagnostic Shuffler
      shufflerInterval = setInterval(() => {
        const cards = gsap.utils.toArray('.shuffler-card') as HTMLElement[];
        if (cards.length === 0) return;
        
        // Move last card to front visually
        gsap.to(cards[0], { y: 20, scale: 0.9, zIndex: 1, opacity: 0.5, duration: 0.6, ease: 'back.out(1.5)' });
        gsap.to(cards[1], { y: 10, scale: 0.95, zIndex: 2, opacity: 0.8, duration: 0.6, ease: 'back.out(1.5)' });
        gsap.to(cards[2], { y: 0, scale: 1, zIndex: 3, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' });
        
        // Reorder DOM
        setTimeout(() => {
          const parent = cards[0].parentNode;
          if (parent) {
            parent.insertBefore(cards[2], cards[0]);
          }
        }, 600);
      }, 3000);

      // Card 2: Telemetry Typewriter
      ScrollTrigger.create({
        trigger: '.typewriter-container',
        start: 'top 80%',
        onEnter: () => {
          let i = 0;
          typeInterval = setInterval(() => {
            setTypewriterText(fullText.substring(0, i));
            i++;
            if (i > fullText.length) clearInterval(typeInterval);
          }, 50);
        }
      });

      // Card 3: Cursor Protocol Scheduler
      const cursorTl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      cursorTl
        .set('.animated-cursor', { x: 0, y: 0, opacity: 0 })
        .to('.animated-cursor', { opacity: 1, duration: 0.3 })
        .to('.animated-cursor', { x: 120, y: 60, duration: 1, ease: 'power2.inOut' })
        .to('.animated-cursor', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.day-cell-active', { backgroundColor: '#4EA8F3', color: '#000000', duration: 0.2 }, '-=0.1')
        .to('.animated-cursor', { x: 200, y: 140, duration: 0.8, ease: 'power2.inOut', delay: 0.5 })
        .to('.animated-cursor', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.save-btn-active', { backgroundColor: '#4EA8F3', scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }, '-=0.1')
        .to('.animated-cursor', { opacity: 0, duration: 0.3, delay: 0.5 })
        .set('.day-cell-active', { backgroundColor: 'transparent', color: '#ffffff' })
        .set('.save-btn-active', { backgroundColor: '#222' });

      // --- D. PHILOSOPHY ---
      gsap.fromTo(
        '.philosophy-text',
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.philosophy-section',
            start: 'top 60%',
          }
        }
      );

      // --- E. PROTOCOL ---
      const protocolCards = gsap.utils.toArray('.protocol-card');
      protocolCards.forEach((card: any, i: number) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          pin: true,
          pinSpacing: false,
          end: '+=100%',
        });
        
        if (i > 0) {
          gsap.fromTo(protocolCards[i - 1], 
            { scale: 1, filter: 'blur(0px)', opacity: 1 },
            { 
              scale: 0.9, filter: 'blur(10px)', opacity: 0.5,
              scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'top top',
                scrub: true,
              }
            }
          );
        }
      });

    }, mainRef);

    return () => {
      if (shufflerInterval) clearInterval(shufflerInterval);
      if (typeInterval) clearInterval(typeInterval);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={mainRef} className="bg-transparent min-h-screen text-white font-sans selection:bg-white selection:text-black">

      {/* A. NAVBAR */}
      <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-6 py-3 flex items-center gap-8 border border-transparent [&.nav-scrolled]:bg-[#0a0a0a]/80 [&.nav-scrolled]:backdrop-blur-xl [&.nav-scrolled]:border-[#222]">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Vertex Logo" className="w-8 h-8 object-contain" />
          <div className="font-heading font-bold text-xl tracking-tight">Vertex</div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
          <Link href="#features" className="lift-hover hover:text-white">Features</Link>
          <Link href="#protocol" className="lift-hover hover:text-white">Protocol</Link>
          {!dashboardHref && (
            <Link href="/auth/login" className="lift-hover hover:text-white">Log In</Link>
          )}
        </div>
        {dashboardHref ? (
          <Link href={dashboardHref} className="btn-magnetic bg-white text-black px-5 py-2 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow">
            <span className="relative z-10">Dashboard</span>
            <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
          </Link>
        ) : (
          <Link href="/auth/signup" className="btn-magnetic bg-white text-black px-5 py-2 rounded-full text-sm font-bold group hover:shadow-[0_0_20px_rgba(78,168,243,0.3)] transition-shadow">
            <span className="relative z-10">Start Earning</span>
            <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
          </Link>
        )}
      </nav>

      {/* B. HERO SECTION */}
      <section className="relative h-[100dvh] w-full flex flex-col justify-center items-center pb-24 px-6 md:px-16 overflow-hidden bg-[#050505]">
        {/* WebGL Shader Background */}
        <div className="absolute inset-0 z-0 opacity-60">
          <ShaderAnimation />
        </div>
        
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40 pointer-events-none" />
        
        {/* Blue accent glow overlay */}
        <div className="absolute inset-0 z-0 bg-[#4EA8F3] mix-blend-overlay opacity-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl pointer-events-none text-center flex flex-col items-center">
          <h1 className="hero-element flex flex-col gap-2 mb-8 pointer-events-auto">
            <span className="font-heading font-bold text-6xl md:text-8xl tracking-tighter text-white">
              Accelerate your
            </span>
            <span className="font-heading font-bold text-6xl md:text-8xl tracking-tighter text-[#4EA8F3] leading-[0.9]">
              Impact.
            </span>
          </h1>
          <p className="hero-element font-mono text-ink-muted max-w-2xl text-sm md:text-base mb-10 leading-relaxed pointer-events-auto mx-auto">
            Vertex is the fastest way for students to earn volunteer hours by working with local businesses. Real work. Verified hours. Zero friction.
          </p>
          <div className="hero-element pointer-events-auto">
            <Link href={dashboardHref || "/auth/signup"} className="btn-magnetic inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-lg font-bold group hover:shadow-[0_0_30px_rgba(78,168,243,0.4)] transition-shadow duration-500">
              <span className="relative z-10 flex items-center gap-2">
                {dashboardHref ? "Go to dashboard" : "Start earning meaningful hours"} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="btn-bg bg-[#4EA8F3] rounded-full"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* C. FEATURES */}
      <section id="features" className="py-32 px-6 md:px-16 max-w-7xl mx-auto relative z-10 bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Diagnostic Shuffler */}
          <div className="card-surface p-8 relative h-[400px] flex flex-col overflow-hidden group">
            <h3 className="font-heading font-bold text-2xl mb-2 z-10">Effort that counts</h3>
            <p className="text-ink-muted text-sm z-10">Directing student service toward real, high-need local work.</p>
            
            <div className="absolute bottom-20 left-8 right-8 h-48 flex items-end justify-center">
              <div className="relative w-full max-w-[240px] h-32">
                <div className="shuffler-card absolute inset-0 bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 flex items-center justify-center text-center shadow-2xl" style={{ zIndex: 1, transform: 'translateY(20px) scale(0.9)', opacity: 0.5 }}>
                  <span className="font-mono text-xs text-ink-muted">Box-checking eliminated</span>
                </div>
                <div className="shuffler-card absolute inset-0 bg-[#1e293b] border border-[#4EA8F3]/30 rounded-2xl p-4 flex items-center justify-center text-center shadow-2xl" style={{ zIndex: 2, transform: 'translateY(10px) scale(0.95)', opacity: 0.8 }}>
                  <span className="font-mono text-xs text-[#4EA8F3]">High-need local work</span>
                </div>
                <div className="shuffler-card absolute inset-0 bg-[#4EA8F3] text-black border border-[#4EA8F3] rounded-2xl p-4 flex items-center justify-center text-center shadow-[0_0_30px_rgba(78,168,243,0.3)]" style={{ zIndex: 3, transform: 'translateY(0) scale(1)', opacity: 1 }}>
                  <span className="font-mono text-sm font-bold">Meaningful Contribution</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Telemetry Typewriter */}
          <div className="card-surface p-8 relative h-[400px] flex flex-col typewriter-container">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-heading font-bold text-2xl mb-2">Clear discovery</h3>
                <p className="text-ink-muted text-sm">Legitimate local opportunities found quickly.</p>
              </div>
              <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#333]">
                <div className="w-2 h-2 rounded-full bg-[#4EA8F3] pulse-dot" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#4EA8F3]">Live Feed</span>
              </div>
            </div>
            
            <div className="mt-auto bg-[#0a0a0a] rounded-xl p-6 border border-[#222] h-48 overflow-hidden">
              <pre className="font-mono text-sm text-ink-muted whitespace-pre-wrap leading-relaxed">
                {typewriterText}
                <span className="inline-block w-2 h-4 bg-[#4EA8F3] align-middle ml-1 blink-cursor" />
              </pre>
            </div>
          </div>

          {/* Card 3: Cursor Protocol Scheduler */}
          <div className="card-surface p-8 relative h-[400px] flex flex-col overflow-hidden">
            <h3 className="font-heading font-bold text-2xl mb-2">Mutual value</h3>
            <p className="text-ink-muted text-sm">Businesses get reliable help. Students gain hours.</p>
            
            <div className="mt-auto relative bg-[#0a0a0a] rounded-xl p-4 border border-[#222] h-48">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className="text-center font-mono text-[10px] text-ink-faint mb-1">{day}</div>
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-md border border-[#222] flex items-center justify-center ${i === 10 ? 'day-cell-active' : ''}`}
                  >
                    <span className="font-mono text-[10px] opacity-20">{i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <div className="save-btn-active bg-[#222] text-white font-mono text-[10px] px-3 py-1 rounded border border-[#333]">
                  Confirm Hours
                </div>
              </div>
              
              <MousePointer2 className="animated-cursor absolute text-white w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ top: 0, left: 0, zIndex: 10 }} />
            </div>
          </div>

        </div>
      </section>

      {/* D. PHILOSOPHY */}
      <section className="philosophy-section relative py-40 px-6 md:px-16 bg-[#000000] overflow-hidden border-y border-[#111]">
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay grayscale"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2000&auto=format&fit=crop")' }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="philosophy-text font-mono text-ink-muted text-lg md:text-xl mb-8">
            Most volunteer platforms focus on: <span className="line-through opacity-50">endless scrolling and box-checking.</span>
          </p>
          <h2 className="philosophy-text font-drama italic text-5xl md:text-8xl leading-[1.1] text-white">
            We focus on: <br/>
            <span className="font-heading not-italic font-bold tracking-tighter text-[#4EA8F3]">tangible alignment.</span>
          </h2>
        </div>
      </section>

      {/* E. PROTOCOL */}
      <section id="protocol" className="relative bg-[#050505]">
        {[
          {
            step: '01',
            title: 'Discover',
            desc: 'Find legitimate local opportunities quickly, with clear expectations and verified roles.',
            visual: (
              <div className="w-64 h-64 border border-[#333] rounded-full flex items-center justify-center relative animate-[spin_20s_linear_infinite]">
                <div className="w-48 h-48 border border-[#444] rounded-full absolute" />
                <div className="w-32 h-32 border border-[#4EA8F3]/50 border-dashed rounded-full absolute" />
                <div className="w-2 h-2 bg-[#4EA8F3] rounded-full absolute top-0 shadow-[0_0_10px_rgba(78,168,243,0.8)]" />
              </div>
            )
          },
          {
            step: '02',
            title: 'Connect',
            desc: 'Local businesses receive reliable help without the friction of traditional hiring.',
            visual: (
              <div className="w-64 h-64 border border-[#333] rounded-2xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2 opacity-20">
                  {Array.from({ length: 64 }).map((_, i) => <div key={i} className={`rounded-sm ${i % 7 === 0 ? 'bg-[#4EA8F3]' : 'bg-white'}`} />)}
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-[#4EA8F3] shadow-[0_0_20px_rgba(78,168,243,0.8)] animate-[scan_3s_ease-in-out_infinite_alternate]" />
              </div>
            )
          },
          {
            step: '03',
            title: 'Earn',
            desc: 'Students gain hours, experience, and tangible recognition for their work.',
            visual: (
              <div className="relative w-64 h-32 flex items-center justify-center">
                {/* Animated progress ring (hours filling up) – loops so it’s always visible */}
                <svg className="absolute w-40 h-40 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#1a1a1a]"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="animate-[progress-ring-loop_2.5s_ease-in-out_infinite]"
                    stroke="#4EA8F3"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(78,168,243,0.8))' }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Award icon with visible pulse */}
                <Award
                  className="w-20 h-20 text-[#4EA8F3] animate-[earn-pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_16px_rgba(78,168,243,0.6)]"
                  strokeWidth={1.5}
                />
              </div>
            )
          }
        ].map((card, index) => (
          <div key={index} className="protocol-card h-[100dvh] w-full flex items-center justify-center px-6 sticky top-0 bg-[#050505]">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 flex justify-center">
                {card.visual}
              </div>
              <div className="order-1 md:order-2">
                <div className="font-mono text-white/40 text-sm mb-4">Step // {card.step}</div>
                <h2 className="font-heading font-bold text-5xl md:text-7xl mb-6">{card.title}</h2>
                <p className="text-ink-muted text-lg md:text-xl leading-relaxed max-w-md">{card.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* F. GET STARTED */}
      <section className="py-40 px-6 md:px-16 flex items-center justify-center bg-[#050505] border-t border-[#111] relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#4EA8F3] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />
        </div>
        <div className="text-center max-w-3xl relative z-10">
          <h2 className="font-heading font-bold text-5xl md:text-7xl mb-8">Ready to begin?</h2>
          <p className="text-ink-muted text-xl mb-12">Join Vertex today and start earning meaningful hours while making a real impact in your community.</p>
          <Link href={dashboardHref || "/auth/signup"} className="btn-magnetic inline-block bg-white text-black px-12 py-6 rounded-[2rem] text-xl font-bold group hover:shadow-[0_0_40px_rgba(78,168,243,0.3)] transition-shadow duration-500">
            <span className="relative z-10 flex items-center gap-3">
              {dashboardHref ? "Go to dashboard" : "Start earning meaningful hours"} <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="btn-bg bg-[#4EA8F3] rounded-[2rem]"></span>
          </Link>
        </div>
      </section>

      {/* G. FOOTER */}
      <footer className="bg-[#000000] rounded-t-[4rem] pt-32 pb-12 px-6 md:px-16 border-t border-[#111] relative overflow-hidden">
        {/* Decorative background element for footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-[#4EA8F3]/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[200px] bg-[#4EA8F3] mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-24 relative z-10">
          <div className="md:col-span-12 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Vertex Logo" className="w-10 h-10 object-contain filter grayscale brightness-200" />
                <div className="font-heading font-bold text-3xl tracking-tight">Vertex</div>
              </div>
              <p className="text-ink-muted max-w-sm text-base leading-relaxed mb-8">
                The fastest way for students to earn volunteer hours by working with local businesses. Real work. Verified hours. Zero friction.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Social Icons */}
              {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-full border border-[#222] bg-[#111] flex items-center justify-center text-ink-muted hover:text-white hover:border-[#4EA8F3] hover:bg-[#4EA8F3]/10 transition-colors">
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 bg-current" style={{ maskImage: social === 'Twitter' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z\'/%3E%3C/svg%3E")' : social === 'Instagram' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'2\' y=\'2\' width=\'20\' height=\'20\' rx=\'5\' ry=\'5\'/%3E%3Cpath d=\'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\'/%3E%3Cline x1=\'17.5\' y1=\'6.5\' x2=\'17.51\' y2=\'6.5\'/%3E%3C/svg%3E")' : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z\'/%3E%3Crect x=\'2\' y=\'9\' width=\'4\' height=\'12\'/%3E%3Ccircle cx=\'4\' cy=\'4\' r=\'2\'/%3E%3C/svg%3E")', WebkitMaskImage: social === 'Twitter' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z\'/%3E%3C/svg%3E")' : social === 'Instagram' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'2\' y=\'2\' width=\'20\' height=\'20\' rx=\'5\' ry=\'5\'/%3E%3Cpath d=\'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\'/%3E%3Cline x1=\'17.5\' y1=\'6.5\' x2=\'17.51\' y2=\'6.5\'/%3E%3C/svg%3E")' : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z\'/%3E%3Crect x=\'2\' y=\'9\' width=\'4\' height=\'12\'/%3E%3Ccircle cx=\'4\' cy=\'4\' r=\'2\'/%3E%3C/svg%3E")', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
                </a>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-4 text-ink-muted text-sm font-medium">
              <li><Link href="/browse" className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>Browse Roles</Link></li>
              <li><Link href={dashboardHref || "/auth/signup?role=business"} className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>{dashboardHref ? "Dashboard" : "For Businesses"}</Link></li>
              <li><Link href={dashboardHref || "/auth/signup?role=student"} className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>{dashboardHref ? "Dashboard" : "For Students"}</Link></li>
              <li><Link href={dashboardHref || "/auth/login"} className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>{dashboardHref ? "Dashboard" : "Log In"}</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-4 text-ink-muted text-sm font-medium">
              <li><Link href="/about" className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>Contact</Link></li>
              <li><Link href="/careers" className="hover:text-[#4EA8F3] transition-colors flex items-center gap-2 group"><span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 h-px bg-[#4EA8F3]"></span>Careers</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Stay Updated</h4>
            <p className="text-ink-muted text-sm mb-4">Subscribe to our newsletter for the latest opportunities and platform updates.</p>
            <form className="relative mt-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#4EA8F3] transition-colors"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-2 bottom-2 bg-[#222] hover:bg-[#4EA8F3] hover:text-black text-white rounded-lg px-3 flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#222] flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6 text-ink-faint text-sm">
            <p>© {new Date().getFullYear()} Vertex. All rights reserved.</p>
            <div className="hidden md:flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#111] px-4 py-2 rounded-full border border-[#222] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="w-2 h-2 rounded-full bg-[#4EA8F3] pulse-dot shadow-[0_0_8px_rgba(78,168,243,0.8)]" />
            <span className="font-mono text-xs text-ink-muted font-medium">System Operational</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes progress-ring {
          to { stroke-dashoffset: 0; }
        }
        @keyframes progress-ring-loop {
          0% { stroke-dashoffset: 100; }
          45% { stroke-dashoffset: 0; }
          55% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 100; }
        }
        @keyframes earn-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.88; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
