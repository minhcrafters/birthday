import React, { useRef, useEffect, useState } from "react";
import { LetterData } from "../data/letters";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

interface LetterViewProps {
  letter: LetterData | null;
  onDismiss: () => void;
  onCloseComplete?: () => void;
}

const LetterView = ({
  letter,
  onDismiss,
  onCloseComplete,
}: LetterViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Store the letter to display so it persists during the exit animation
  const [displayLetter, setDisplayLetter] = useState<LetterData | null>(letter);

  // Update displayLetter when letter prop changes (and is not null)
  // Logic moved from useEffect to render phase to avoid cascading renders (Derived State pattern)
  if (letter && letter !== displayLetter) {
    setDisplayLetter(letter);
  }

  // Keyboard Support (Escape to close)
  useEffect(() => {
    if (!letter) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [letter, onDismiss]);

  useGSAP(
    () => {
      if (letter && containerRef.current && textRef.current) {
        // OPEN SEQUENCE
        if (timelineRef.current) timelineRef.current.kill();

        const tl = gsap.timeline();
        timelineRef.current = tl;

        // Make visible
        gsap.set(containerRef.current, { zIndex: 50, autoAlpha: 1 });

        // Animate background paper/texture
        tl.fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power2.inOut" },
        );

        // Animate text
        // Select only paragraphs to avoid animating the image container if it's inside
        const paragraphs = textRef.current
          ? textRef.current.querySelectorAll("p")
          : [];

        tl.fromTo(
          paragraphs,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
          "-=0.3",
        );

        // Animate Image
        if (imageRef.current) {
          tl.fromTo(
            imageRef.current,
            { x: 50, opacity: 0, rotate: 5 }, // Reduced x movement for float context
            { x: 0, opacity: 1, rotate: -2, duration: 1, ease: "power3.out" },
            "-=0.8",
          );
        }
      } else if (!letter && containerRef.current && displayLetter) {
        // CLOSE SEQUENCE
        if (timelineRef.current) timelineRef.current.kill();

        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(containerRef.current, { zIndex: -1, autoAlpha: 0 });
            if (onCloseComplete) onCloseComplete();
          },
        });
        timelineRef.current = tl;

        // Image Out
        if (imageRef.current) {
          tl.to(imageRef.current, {
            x: 20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
          });
        }

        const paragraphs = textRef.current
          ? textRef.current.querySelectorAll("p")
          : [];
        tl.to(
          paragraphs,
          {
            y: -10,
            opacity: 0,
            stagger: 0.05,
            duration: 0.4,
            ease: "power2.in",
          },
          "<",
        ).to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
          },
          "-=0.2",
        );
      }
    },
    { dependencies: [letter, displayLetter] },
  ); // Rely on letter prop changes

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-1] opacity-0 flex items-center justify-center bg-black text-white overflow-hidden"
    >
      {/* Backdrop Click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onDismiss} />

      <div className="relative max-w-6xl w-full h-full p-6 md:p-20 flex flex-col pointer-events-none">
        <div
          className="pointer-events-auto w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header / Close */}
          <div className="shrink-0 flex justify-end mb-4 md:mb-8">
            <button
              onClick={onDismiss}
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity text-white"
            >
              Close
            </button>
          </div>

          {/* Content Layout */}
          <div className="flex-1 min-h-0 relative z-10 overflow-y-auto no-scrollbar pr-2">
            <div
              ref={textRef}
              className="block font-serif text-xl md:text-3xl leading-relaxed text-gray-200 select-text cursor-text"
            >
              {displayLetter?.content.map((paragraph, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <React.Fragment key={index}>
                    {isLast && displayLetter.imageSrc && (
                      <div className="float-right ml-6 mb-1 relative z-0">
                        <Image
                          ref={imageRef}
                          src={displayLetter.imageSrc}
                          width={256}
                          height={256}
                          alt={displayLetter.nickname}
                          className="w-32 h-32 md:w-64 md:h-64 object-cover rounded-lg shadow-2xl opacity-0 transform rotate-3 grayscale contrast-125 border border-white/20"
                        />
                      </div>
                    )}
                    <p className="opacity-0 mb-6">{paragraph}</p>
                  </React.Fragment>
                );
              })}

              <div className="clear-both" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterView;
