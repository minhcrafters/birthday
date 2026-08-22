import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LyricsDisplay from "./LyricsDisplay";

interface TitleScreenProps {
  onStart: () => void;
  onGalleryOpen: () => void;
  onCreditsOpen: () => void;
  onExtraWorksOpen: () => void;
  skipIntro?: boolean;
  loopsStartTime?: number;
  audioContext?: AudioContext | null;
}

interface MenuItem {
  label: string;
  onClick: () => void;
  tone: "coral" | "mint";
}

const TitleScreen = ({
  onStart,
  onGalleryOpen,
  onCreditsOpen,
  onExtraWorksOpen,
  skipIntro = false,
  loopsStartTime = 0,
  audioContext = null,
}: TitleScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const btnGroupRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    { label: "Read the Letters", onClick: onStart, tone: "coral" },
    { label: "View Gallery", onClick: onGalleryOpen, tone: "mint" },
    { label: "Extra Works", onClick: onExtraWorksOpen, tone: "coral" },
    { label: "Credits", onClick: onCreditsOpen, tone: "mint" },
  ];

  useGSAP(
    () => {
      if (skipIntro) {
        gsap.set(containerRef.current, { opacity: 1 });
        gsap.set(titleRef.current, { opacity: 1, scale: 1, y: 0 });
        gsap.set(btnGroupRef.current, { opacity: 1, y: 0 });
        gsap.set(".frame-back", { opacity: 1, scale: 1, rotate: -20 });
        gsap.set(".frame-front", { opacity: 1, scale: 1, rotate: 0 });
        return;
      }

      const tl = gsap.timeline();

      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
      });

      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "back.out(1.4)" },
        "-=0.15",
      );

      tl.fromTo(
        ".frame-back",
        { opacity: 0, scale: 0.85, rotate: -34 },
        {
          opacity: 1,
          scale: 1,
          rotate: -20,
          duration: 0.9,
          ease: "power3.out",
        },
        "-=1.0",
      );

      tl.fromTo(
        ".frame-front",
        { opacity: 0, scale: 0.85, rotate: 10 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.9, ease: "power3.out" },
        "-=0.6",
      );

      tl.fromTo(
        btnGroupRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.5",
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 overflow-hidden opacity-0"
    >
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-10 px-8 pt-10 pb-20 md:flex-row md:gap-72 md:px-20 md:pb-28">
        <div className="flex flex-col items-center gap-8 md:gap-10">
          <div ref={titleRef}>
            <Image
              src="/images/title.png"
              alt="Happy Birthday!"
              width={1622}
              height={970}
              priority
              className="h-auto w-64 sm:w-80 md:w-[26rem] lg:w-[30rem]"
            />
          </div>

          <div
            ref={btnGroupRef}
            className="flex w-full max-w-xs flex-col gap-3 rounded-[2rem] border border-birthday-gold/30 bg-birthday-cream/90 p-4 shadow-[0_20px_45px_-15px_rgba(74,46,42,0.35)] backdrop-blur-sm sm:max-w-sm sm:gap-3.5 sm:p-5"
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-3.5 text-left shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg sm:px-7 sm:py-4 ${
                  item.tone === "coral"
                    ? "border-birthday-coral-deep/40 bg-birthday-coral-deep hover:border-birthday-coral-deep/70"
                    : "border-birthday-mint-deep/40 bg-birthday-mint-deep hover:border-birthday-mint-deep/70"
                }`}
              >
                <span className="relative font-sans text-sm font-semibold tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.15)] sm:text-base">
                  {item.label}
                </span>
                <span className="relative translate-x-[-4px] font-sans text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-52 w-52 shrink-0 sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-80 lg:w-80">
          <div className="frame-back absolute left-0 top-2 flex h-40 w-40 -rotate-[20deg] items-center justify-center rounded-xl border-2 border-birthday-gold bg-birthday-cream opacity-0 shadow-lg sm:h-48 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64">
            <PlaceholderGlyph />
          </div>
          <div className="frame-front absolute bottom-0 right-0 flex h-40 w-40 items-center justify-center rounded-xl border-2 border-birthday-gold bg-birthday-cream opacity-0 shadow-xl sm:h-48 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64">
            <PlaceholderGlyph />
          </div>
        </div>
      </div>

      <LyricsDisplay
        loopsStartTime={loopsStartTime}
        audioContext={audioContext}
        isInTitleScreen={true}
      />
    </div>
  );
};

const PlaceholderGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-birthday-gold)"
    strokeWidth="1.25"
    className="h-8 w-8 opacity-30 sm:h-10 sm:w-10"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <circle cx="8.5" cy="10" r="1.75" />
    <path d="M3 16l5-4 4 3 3-2.5 6 5.5" />
  </svg>
);

export default TitleScreen;
