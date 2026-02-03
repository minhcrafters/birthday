import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TitleScreenProps {
  onStart: () => void;
}

const TitleScreen = ({ onStart }: TitleScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const btnGroupRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Main Cinematic Sequence
      const tl = gsap.timeline();

      // 0. Initial Setup
      // Fade in container first
      tl.to(containerRef.current, {
        opacity: 1,
        duration: 2,
        ease: "power2.inOut",
      });

      // 1. "Happy Birthday!" appears BIG at center
      tl.fromTo(
        titleRef.current,
        {
          scale: 1.5, // Big
          y: "20vh", // Centered roughly (offset by layout)
          opacity: 0,
        },
        {
          scale: 1.5,
          y: "20vh",
          opacity: 1,
          duration: 2.5,
          ease: "power2.out",
        },
      );

      // Hold for a moment to let the user read it
      tl.to({}, { duration: 1.5 });

      // 2. Scale down and move up to title position
      tl.to(titleRef.current, {
        scale: 1,
        y: 0,
        duration: 2,
        ease: "power3.inOut", // Cinematic slow move
      });

      // 3. Reveal Buttons (Slowly)
      tl.fromTo(
        btnGroupRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 2, ease: "power2.out" },
        "-=0.5", // Start slightly before title finishes settling
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white opacity-0"
    >
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-16 md:gap-24">
        {/* Title */}
        <div ref={titleRef} className="text-center space-y-4">
          <h1 className="text-4xl md:text-8xl font-serif font-bold tracking-[0.15em] uppercase text-white drop-shadow-2xl">
            Happy
            <br />
            Birthday!
          </h1>
          {/*<p className="text-xs md:text-sm font-serif tracking-[0.8em] text-gray-500 uppercase">
            Shiori Edition
          </p>*/}
        </div>

        {/* Menu Buttons (Revealed later) */}
        <div ref={btnGroupRef} className="flex flex-col gap-6 min-w-60">
          <button
            onClick={onStart}
            className="group relative px-10 py-4 overflow-hidden border border-white/30 hover:border-white transition-colors duration-500"
          >
            <div className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            <span className="relative flex items-center justify-between text-xs tracking-[0.3em] font-medium text-white group-hover:text-black transition-colors duration-300">
              <span>START</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                →
              </span>
            </span>
          </button>

          <button
            disabled
            className="group relative px-10 py-4 border border-white/10 opacity-40 cursor-not-allowed"
          >
            <span className="flex items-center justify-between text-xs tracking-[0.3em] font-medium text-gray-500">
              <span>CHAPTERS</span>
              <span className="text-[9px]">LOCKED</span>
            </span>
          </button>

          <button
            disabled
            className="group relative px-10 py-4 border border-white/10 opacity-40 cursor-not-allowed"
          >
            <span className="flex items-center justify-between text-xs tracking-[0.3em] font-medium text-gray-500">
              <span>OPTIONS</span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer / Version */}
      <div className="absolute bottom-8 text-[9px] text-gray-800 tracking-widest font-mono">
        VER 2.14.2025 // AMYCORD
      </div>
    </div>
  );
};

export default TitleScreen;
