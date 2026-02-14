import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LetterData } from "../data/letters";

interface SurpriseRevealProps {
  letter: LetterData;
  onComplete: () => void;
}

const SurpriseReveal: React.FC<SurpriseRevealProps> = ({
  letter,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const whiteOverlayRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true); // Start true to block clicks during intro

  // Audio setup
  useEffect(() => {
    const audio = new Audio("/audio/prelude.wav");
    audio.loop = true;
    audio.volume = 0.4;

    audioRef.current = audio;

    return () => {
      // Fade out audio on unmount
      if (audioRef.current) {
        const aud = audioRef.current;
        // Simple fade out if we could use GSAP on it, but standard pause is fine for cleanup
        aud.pause();
        aud.currentTime = 0;
      }
    };
  }, []);

  // Fade out audio helper
  const fadeOutAudio = () => {
    if (audioRef.current) {
      gsap.to(audioRef.current, {
        volume: 0,
        duration: 2,
        onComplete: () => audioRef.current?.pause(),
      });
    }
  };

  // Initial Entrance Animation
  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => setIsAnimating(false),
      });

      // Initial Set
      gsap.set(containerRef.current, { autoAlpha: 1 });

      // Fade out the white overlay (Entrance)
      if (whiteOverlayRef.current) {
        tl.to(whiteOverlayRef.current, {
          opacity: 0,
          duration: 3,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(whiteOverlayRef.current, { display: "none" });
          },
        });
      }

      // Animate first text in specifically
      if (textRef.current) {
        tl.fromTo(
          textRef.current,
          { opacity: 0, y: 10, filter: "blur(5px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 2.5,
            ease: "power2.out",
            onStart: () => {
              if (audioRef.current) {
                audioRef.current
                  .play()
                  .catch((e) => console.log("Audio play failed", e));
              }
            },
          },
          "-=1.5", // Overlap with white fade
        );
      }
    },
    { scope: containerRef },
  );

  // Handle click to advance
  const handleClick = () => {
    if (isAnimating || !textRef.current) return;

    // Ensure audio is playing if autoplay failed
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }

    const content = letter.content || [];
    const isLastSlide = currentIndex >= content.length - 1;

    setIsAnimating(true);

    if (!isLastSlide) {
      // Animate OUT current text -> Increment -> Animate IN next text
      const tl = gsap.timeline();

      // OUT
      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        duration: 1,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((prev) => prev + 1);
        },
      });

      // IN (Using a slight delay to allow state update to render)
      tl.to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 2,
          ease: "power2.out",
          delay: 0.1, // Wait for React render
        },
        "+=0.1",
      );

      tl.call(() => setIsAnimating(false));
    } else {
      // Final slide: Fade everything out and exit
      fadeOutAudio();

      const tl = gsap.timeline();

      // Text OUT
      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        duration: 1.5,
        ease: "power2.in",
      });

      // Container OUT
      tl.to(
        containerRef.current,
        {
          autoAlpha: 0,
          duration: 2,
          ease: "power2.inOut",
          onComplete: onComplete,
        },
        "-=0.5",
      );
    }
  };

  // Determine styles based on index (reusing original logic)
  const getTextStyle = (index: number, total: number) => {
    if (index === 0) {
      return "text-4xl md:text-6xl font-bold mb-8 text-white font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
    } else if (index === total - 1) {
      return "text-2xl md:text-3xl mt-8 italic text-gray-300 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
    } else {
      return "text-2xl md:text-4xl font-light text-gray-100 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
    }
  };

  const content = letter.content || [];
  const currentText = content[currentIndex] || "";
  const isLast = currentIndex === content.length - 1;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-300 flex flex-col items-center justify-center bg-black ${
        !isAnimating ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={handleClick}
    >
      {/* White Flash Overlay for Entrance Transition */}
      <div
        ref={whiteOverlayRef}
        className="absolute inset-0 z-310 bg-white pointer-events-none"
      />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent opacity-50 pointer-events-none"></div>

      {/* Centered Text Container - Updates dynamically */}
      <div className="relative z-30 max-w-4xl px-8 flex justify-center items-center min-h-[50vh]">
        <div
          ref={textRef}
          className={`${getTextStyle(currentIndex, content.length)} text-center will-change-transform will-change-opacity`}
        >
          {currentText}
        </div>
      </div>

      {/* Close Hint */}
      <div
        className={`absolute bottom-12 text-xs uppercase tracking-[0.3em] text-gray-500 transition-opacity duration-1000 pointer-events-none ${
          !isAnimating ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
      >
        {isLast ? "Click to close" : "Click to continue"}
      </div>
    </div>
  );
};

export default SurpriseReveal;
