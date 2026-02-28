'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, MousePointer2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  
  // Typewriter state
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = "Scanning local opportunities...\nVerified role found.\nTransparent time commitment confirmed.";

  useEffect(() => {
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
      const shufflerInterval = setInterval(() => {
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
      let typeInterval: NodeJS.Timeout;
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
        .to('.day-cell-active', { backgroundColor: '#ffffff', color: '#000000', duration: 0.2 }, '-=0.1')
        .to('.animated-cursor', { x: 200, y: 140, duration: 0.8, ease: 'power2.inOut', delay: 0.5 })
        .to('.animated-cursor', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.save-btn-active', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }, '-=0.1')
        .to('.animated-cursor', { opacity: 0, duration: 0.3, delay: 0.5 })
        .set('.day-cell-active', { backgroundColor: 'transparent', color: '#ffffff' });

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
      clearInterval(shufflerInterval);
      if (typeof typeInterval !== 'undefined') clearInterval(typeInterval);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={mainRef} className="bg-[#050505] min-h-screen text-white font-sans selection:bg-white selection:text-black">
      {/* Noise Overlay */}
      <svg className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.03]">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* A. NAVBAR */}
      <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-6 py-3 flex items-center gap-8 border border-transparent [&.nav-scrolled]:bg-[#0a0a0a]/80 [&.nav-scrolled]:backdrop-blur-xl [&.nav-scrolled]:border-[#222]">
        <div className="font-heading font-bold text-xl tracking-tight">Pilot</div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
          <Link href="#features" className="lift-hover hover:text-white">Features</Link>
          <Link href="#protocol" className="lift-hover hover:text-white">Protocol</Link>
          <Link href="/auth/login" className="lift-hover hover:text-white">Log In</Link>
        </div>
        <Link href="/auth/signup" className="btn-magnetic bg-white text-black px-5 py-2 rounded-full text-sm font-bold">
          <span className="relative z-10">Start Earning</span>
          <span className="btn-bg bg-[#e0e0e0] rounded-full"></span>
        </Link>
      </nav>

      {/* B. HERO SECTION */}
      <section className="relative h-[100dvh] w-full flex flex-col justify-end pb-24 px-6 md:px-16 overflow-hidden">
        {/* Background Image with Heavy Gradient */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 grayscale"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2940&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        
        <div className="relative z-10 max-w-5xl">
          <h1 className="hero-element flex flex-col gap-2 mb-8">
            <span className="font-heading font-bold text-5xl md:text-7xl tracking-tighter text-white">
              Accelerate your
            </span>
            <span className="font-drama italic text-7xl md:text-9xl text-white leading-[0.8]">
              Impact.
            </span>
          </h1>
          <p className="hero-element font-mono text-ink-muted max-w-xl text-sm md:text-base mb-10 leading-relaxed">
            Pilot is the fastest way for students to earn volunteer hours by working with local businesses. Real work. Verified hours. Zero friction.
          </p>
          <div className="hero-element">
            <Link href="/auth/signup" className="btn-magnetic inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-lg font-bold">
              <span className="relative z-10 flex items-center gap-2">
                Start earning meaningful hours <ArrowRight className="w-5 h-5" />
              </span>
              <span className="btn-bg bg-[#e0e0e0] rounded-full"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* C. FEATURES */}
      <section id="features" className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Diagnostic Shuffler */}
          <div className="card-surface p-8 relative h-[400px] flex flex-col overflow-hidden group">
            <h3 className="font-heading font-bold text-2xl mb-2 z-10">Effort that counts</h3>
            <p className="text-ink-muted text-sm z-10">Directing student service toward real, high-need local work.</p>
            
            <div className="absolute bottom-8 left-8 right-8 h-48 flex items-end justify-center">
              <div className="relative w-full max-w-[240px] h-32">
                <div className="shuffler-card absolute inset-0 bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 flex items-center justify-center text-center shadow-2xl" style={{ zIndex: 1, transform: 'translateY(20px) scale(0.9)', opacity: 0.5 }}>
                  <span className="font-mono text-xs text-ink-muted">Box-checking eliminated</span>
                </div>
                <div className="shuffler-card absolute inset-0 bg-[#222] border border-[#444] rounded-2xl p-4 flex items-center justify-center text-center shadow-2xl" style={{ zIndex: 2, transform: 'translateY(10px) scale(0.95)', opacity: 0.8 }}>
                  <span className="font-mono text-xs text-ink-muted">High-need local work</span>
                </div>
                <div className="shuffler-card absolute inset-0 bg-white text-black border border-white rounded-2xl p-4 flex items-center justify-center text-center shadow-2xl" style={{ zIndex: 3, transform: 'translateY(0) scale(1)', opacity: 1 }}>
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
                <div className="w-2 h-2 rounded-full bg-white pulse-dot" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Live Feed</span>
              </div>
            </div>
            
            <div className="mt-auto bg-[#0a0a0a] rounded-xl p-6 border border-[#222] h-48 overflow-hidden">
              <pre className="font-mono text-sm text-ink-muted whitespace-pre-wrap leading-relaxed">
                {typewriterText}
                <span className="inline-block w-2 h-4 bg-white align-middle ml-1 blink-cursor" />
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
            <span className="font-heading not-italic font-bold tracking-tighter text-white">tangible alignment.</span>
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
                <div className="w-32 h-32 border border-white border-dashed rounded-full absolute" />
                <div className="w-2 h-2 bg-white rounded-full absolute top-0" />
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
                  {Array.from({ length: 64 }).map((_, i) => <div key={i} className="bg-white rounded-sm" />)}
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-[scan_3s_ease-in-out_infinite_alternate]" />
              </div>
            )
          },
          {
            step: '03',
            title: 'Earn',
            desc: 'Students gain hours, experience, and tangible recognition for their work.',
            visual: (
              <svg className="w-64 h-32" viewBox="0 0 200 100">
                <path 
                  d="M0,50 L50,50 L60,20 L70,80 L80,50 L200,50" 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="2"
                  className="animate-[dash_2s_linear_infinite]"
                  strokeDasharray="200"
                  strokeDashoffset="200"
                />
              </svg>
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
      <section className="py-40 px-6 md:px-16 flex items-center justify-center bg-[#0a0a0a] border-t border-[#111]">
        <div className="text-center max-w-3xl">
          <h2 className="font-heading font-bold text-5xl md:text-7xl mb-8">Ready to begin?</h2>
          <p className="text-ink-muted text-xl mb-12">Join Pilot today and start earning meaningful hours while making a real impact in your community.</p>
          <Link href="/auth/signup" className="btn-magnetic inline-block bg-white text-black px-12 py-6 rounded-[2rem] text-xl font-bold">
            <span className="relative z-10">Start earning meaningful hours</span>
            <span className="btn-bg bg-[#e0e0e0] rounded-[2rem]"></span>
          </Link>
        </div>
      </section>

      {/* G. FOOTER */}
      <footer className="bg-[#000000] rounded-t-[4rem] pt-24 pb-12 px-6 md:px-16 border-t border-[#111]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="col-span-1 md:col-span-2">
            <div className="font-heading font-bold text-3xl mb-4">Pilot</div>
            <p className="text-ink-muted max-w-sm">The fastest way for students to earn volunteer hours by working with local businesses.</p>
          </div>
          <div>
            <h4 className="font-mono text-sm text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-ink-muted text-sm">
              <li><Link href="/browse" className="hover:text-white transition-colors">Browse Roles</Link></li>
              <li><Link href="/auth/signup?role=business" className="hover:text-white transition-colors">For Businesses</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Log In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-sm text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-ink-muted text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#222] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ink-faint text-sm">© {new Date().getFullYear()} Pilot. All rights reserved.</p>
          <div className="flex items-center gap-3 bg-[#111] px-4 py-2 rounded-full border border-[#222]">
            <div className="w-2 h-2 rounded-full bg-white pulse-dot" />
            <span className="font-mono text-xs text-ink-muted">System Operational</span>
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
      `}</style>
    </div>
  );
}
