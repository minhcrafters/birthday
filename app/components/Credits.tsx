import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface CreditsProps {
  onClose: () => void;
}

const Credits = ({ onClose }: CreditsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !contentRef.current) {
        return;
      }

      const tl = gsap.timeline();

      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      });

      tl.fromTo(
        contentRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3",
      );
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    if (!containerRef.current || !contentRef.current) {
      return;
    }

    const tl = gsap.timeline({
      onComplete: onClose,
    });

    tl.to(contentRef.current, {
      y: 10,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
    });

    tl.to(
      containerRef.current,
      {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      },
      "-=0.2",
    );
  };

  return (
    <div
      ref={containerRef}
      className="gingham-background fixed inset-0 z-55 flex items-center justify-center text-birthday-ink opacity-0"
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="relative max-w-4xl w-full m-6 md:m-10 rounded-[2rem] border border-birthday-gold/30 bg-birthday-cream/95 p-8 shadow-[0_20px_45px_-15px_rgba(74,46,42,0.35)] backdrop-blur-sm md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-xs uppercase tracking-[0.2em] text-birthday-ink/50 hover:text-birthday-ink transition-colors"
        >
          Close
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 font-sans text-sm md:text-base tracking-widest leading-loose uppercase text-center md:text-left">
          <div className="flex flex-col gap-6 md:items-end md:text-right">
            <div>
              <span className="block text-xs text-birthday-ink/50 mb-1 tracking-[0.2em]">
                Website
              </span>
              <span className="text-xl md:text-2xl font-bold text-birthday-coral-deep">
                Pychael
              </span>
            </div>
            <div>
              <span className="block text-xs text-birthday-ink/50 mb-1 tracking-[0.2em]">
                Art
              </span>
              <span className="text-xl md:text-2xl font-bold text-birthday-mint-deep">
                Aoco
              </span>
            </div>
            <div>
              <span className="block text-xs text-birthday-ink/50 mb-1 tracking-[0.2em]">
                The Goat
              </span>
              <span className="text-xl md:text-2xl font-bold text-birthday-coral-deep">
                Miyamura
              </span>
            </div>
            <div>
              <span className="block text-xs text-birthday-ink/50 mb-1 tracking-[0.2em]">
                Counselor
              </span>
              <span className="text-xl md:text-2xl font-bold text-birthday-mint-deep">
                Snoofy
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-start md:text-left">
            <span className="block text-xs text-birthday-ink/50 mb-4 tracking-[0.2em]">
              Special Thanks To
            </span>
            <ul className="space-y-2 font-bold text-lg md:text-xl text-birthday-ink">
              <li>Amy</li>
              <li>BurnedPotato</li>
              <li>Cent of Fire</li>
              <li>Ella</li>
              <li>ilickturtles</li>
              <li>HP</li>
              <li>Kimyona</li>
              <li>Crescent Luna</li>
              <li>Lee</li>
              <li>Sollera Luna</li>
            </ul>
            <span className="block text-xs text-birthday-ink/50 mt-6 tracking-[0.1em] lowercase italic">
              for making this possible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
