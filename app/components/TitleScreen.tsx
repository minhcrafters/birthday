import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LyricsDisplay from "./LyricsDisplay";

interface TitleScreenProps {
  onStart: () => void;
  onGalleryOpen: () => void;
  onCreditsOpen: () => void;
  skipIntro?: boolean;
  loopsStartTime?: number;
  audioContext?: AudioContext | null;
}

const TitleScreen = ({
  onStart,
  onGalleryOpen,
  onCreditsOpen,
  skipIntro = false,
  loopsStartTime = 0,
  audioContext = null,
}: TitleScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const btnGroupRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Main Cinematic Sequence
      const tl = gsap.timeline();

      if (skipIntro) {
        // Skip animation: Set to final state immediately
        gsap.set(containerRef.current, { opacity: 1 });
        gsap.set(titleRef.current, { scale: 1, y: 0, opacity: 1 });
        gsap.set(btnGroupRef.current, { opacity: 1, y: 0 });
        return;
      }

      // 0. Initial Setup
      // Fade in container first
      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
      });

      // Calculate distance to center the title
      let centerOffset = 0;
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const titleCenter = titleRect.top + titleRect.height / 2;
        centerOffset = viewportCenter - titleCenter;
      }

      // 1. "Happy Birthday!" appears BIG at center
      tl.fromTo(
        titleRef.current,
        {
          scale: 1.5, // Big
          y: centerOffset, // Dynamically centered
          opacity: 0,
        },
        {
          scale: 1.5,
          y: centerOffset,
          opacity: 1,
          duration: 1.5, // Shorter duration
          ease: "power2.out",
        },
        "<", // Start immediately with container fade
      );

      // Hold for a moment to let the user read it
      tl.to({}, { duration: 1.0 }); // Shorter hold

      // 2. Scale down and move up to title position
      tl.to(titleRef.current, {
        scale: 1,
        y: 0, // Back to layout position
        duration: 2,
        ease: "power3.inOut", // Cinematic slow move
      });

      // 3. Reveal Buttons (Slowly)
      tl.fromTo(
        btnGroupRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
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
            className="group relative px-10 py-4 overflow-hidden border border-white bg-black hover:border-white transition-colors duration-500"
          >
            <div className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            <span className="relative flex items-center justify-between text-xs tracking-[0.3em] font-medium text-white group-hover:text-black transition-colors duration-300">
              <span>READ THE LETTERS</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                →
              </span>
            </span>
          </button>

          <button
            onClick={onGalleryOpen}
            className="group relative px-10 py-4 overflow-hidden border border-white bg-black hover:border-white transition-colors duration-500"
          >
            <div className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            <span className="relative flex items-center justify-between text-xs tracking-[0.3em] font-medium text-white group-hover:text-black transition-colors duration-300">
              <span>VIEW GALLERY</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                →
              </span>
            </span>
          </button>

          <button
            onClick={onCreditsOpen}
            className="group relative px-10 py-4 overflow-hidden border border-white bg-black hover:border-white transition-colors duration-500"
          >
            <div className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            <span className="relative flex items-center justify-between text-xs tracking-[0.3em] font-medium text-white group-hover:text-black transition-colors duration-300">
              <span>CREDITS</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                →
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Lyrics Display (replaces copyright text) */}
      <LyricsDisplay
        loopsStartTime={loopsStartTime}
        audioContext={audioContext}
        isInTitleScreen={true}
      />
    </div>
  );
};

export default TitleScreen;
