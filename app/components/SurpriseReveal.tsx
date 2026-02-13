import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LetterData } from "../data/letters";

const SURPRISE_UNLOCKED = false;

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
  const [canClose, setCanClose] = useState(false);

  const handleClose = () => {
    if (!canClose) return;

    gsap.to(containerRef.current, {
      autoAlpha: 0,
      duration: 2,
      ease: "power2.inOut",
      onComplete: onComplete,
    });
  };

  useGSAP(
    () => {
      if (!containerRef.current || !textRef.current) return;

      const tl = gsap.timeline();

      // Initial Set
      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(textRef.current, { opacity: 1, text: "" }); // Reset text container

      // Fade out the white overlay (Entrance)
      if (whiteOverlayRef.current) {
        tl.to(whiteOverlayRef.current, {
          opacity: 0,
          duration: 3, // Very slow fade in from white
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(whiteOverlayRef.current, { display: "none" });
          },
        });
      }

      // Check if unlocked
      if (!SURPRISE_UNLOCKED) {
        // ... (locked logic) ...
      }

      const content = letter.content;
      if (!content) return;

      // Loop through paragraphs - ONE BY ONE
      content.forEach((paragraph, index) => {
        // 1. Set Text & Prepare Fade In
        tl.call(() => {
          if (textRef.current) {
            textRef.current.innerText = paragraph;
            // Styling adjustments based on content type (rudimentary check)
            if (index === 0) {
              textRef.current.className =
                "text-4xl md:text-6xl font-bold mb-8 text-white font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
            } else if (index === content.length - 1) {
              textRef.current.className =
                "text-2xl md:text-3xl mt-8 italic text-gray-300 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
            } else {
              textRef.current.className =
                "text-2xl md:text-4xl font-light text-gray-100 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
            }
          }
        });

        // 2. Slow Fade In
        tl.fromTo(
          textRef.current,
          { opacity: 0, y: 10, filter: "blur(5px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 2.5, // Slow fade in
            ease: "power2.out",
          },
          index === 0 ? "-=1.0" : "+=0.5", // Overlap first with white fade, others have gap
        );

        // 3. Read Time (Hold)
        // Calculate read time: minimum 3s, plus 0.08s per character
        const readTime = Math.max(3, paragraph.length * 0.08);
        tl.to({}, { duration: readTime });

        // 4. Slow Fade Out (if not last)
        if (index < content.length - 1) {
          tl.to(textRef.current, {
            opacity: 0,
            y: -10,
            filter: "blur(5px)",
            duration: 2, // Slow fade out
            ease: "power2.in",
          });
        }
      });

      // After loop ends (last item is still visible or just finished holding)
      // Fade out the last item too
      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        duration: 2,
        ease: "power2.in",
      });

      // Enable closing
      tl.call(() => setCanClose(true));

      // Animate close hint in
      tl.to(".close-hint", { opacity: 1, duration: 2 });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-300 flex flex-col items-center justify-center bg-black ${
        canClose ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={handleClose}
    >
      {/* White Flash Overlay for Entrance Transition */}
      <div
        ref={whiteOverlayRef}
        className="absolute inset-0 z-310 bg-white pointer-events-none"
      />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent opacity-50 pointer-events-none"></div>

      {/* Centered Text Container - Updates dynamically */}
      <div className="relative z-30 max-w-4xl px-8 flex justify-center items-center min-h-50">
        <div
          ref={textRef}
          className="text-white font-serif tracking-wider leading-relaxed text-center opacity-0 will-change-transform will-change-opacity"
        >
          {/* Text injected by GSAP */}
        </div>
      </div>

      {/* Close Hint */}
      <div className="close-hint opacity-0 absolute bottom-12 text-xs uppercase tracking-[0.3em] text-gray-500 animate-pulse pointer-events-none">
        {SURPRISE_UNLOCKED ? "Fin." : "Click to close"}
      </div>
    </div>
  );
};

export default SurpriseReveal;
