import React, { forwardRef, useLayoutEffect, useRef, useEffect } from "react";
import { LetterData } from "../data/letters";
import gsap from "gsap";

interface LettersListProps {
  letters: LetterData[];
  onLetterSelect: (id: string) => void;
  onGalleryOpen: () => void;
  onBack: () => void;
  visible: boolean;
  starfieldSpeedRef: React.RefObject<number>;
  controlsStarfield?: boolean;
  readLetterIds?: string[];
  isSurpriseUnlocked?: boolean;
}

const Envelope = ({
  letter,
  index,
  isLast,
  isRead,
  isLocked,
  onClick,
}: {
  letter: LetterData;
  index: number;
  isLast: boolean;
  isRead?: boolean;
  isLocked?: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex flex-col items-center justify-center p-6 transition-all duration-500 focus:outline-none w-full ${
        isLast
          ? "aspect-[2/1] md:aspect-[3/1]"
          : "aspect-square"
      } ${isLocked ? "opacity-50 cursor-not-allowed grayscale" : "hover:scale-105"}`}
    >
      {/* Glassy Background Card */}
      <div
        className={`absolute inset-0 backdrop-blur-sm border rounded-xl transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
          isLocked
            ? "bg-slate-900/20 border-white/5"
            : "bg-slate-900/40 border-white/10 group-hover:bg-slate-800/60 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
        } ${isRead && !isLast ? "border-white/5 bg-slate-900/20" : ""}`}
      ></div>

      {/* Envelope Icon (SVG) */}
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center transition-colors duration-500 ${
          isLocked
            ? "text-gray-600"
            : "text-white/80 group-hover:text-white"
        } ${isRead && !isLast ? "text-gray-500" : ""}`}
      >
        {isLocked ? (
          // Lock Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-1/3 h-1/3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : (
          // Simple Geometric Envelope
          <svg
            viewBox="0 0 100 70"
            className={`w-2/3 h-2/3 drop-shadow-lg transition-transform duration-700 ${
              isLast ? "group-hover:scale-110" : "group-hover:-translate-y-2"
            } ${isRead && !isLast ? "opacity-50" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Base Rectangle */}
            <path d="M5 5h90v60H5z" className="fill-black/20" />
            {/* Flap (Closed) */}
            <path
              d="M5 5l45 35 45-35"
              className={`transition-all duration-700 ${
                isRead ? "origin-top -scale-y-100 translate-y-[-10px]" : ""
              }`}
            />
            {/* Bottom folds */}
            <path d="M5 65l40-30 M95 65l-40-30" />
          </svg>
        )}

        {/* Surprise Letter specific decoration */}
        {isLast && !isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full absolute bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </div>
        )}
      </div>

      {/* Nickname Label */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <span
          className={`font-serif tracking-widest uppercase text-xs md:text-sm transition-colors duration-300 ${
            isLast
              ? "text-base md:text-lg font-bold"
              : ""
          } ${
            isLocked
              ? "text-gray-700"
              : "text-gray-400 group-hover:text-white"
          } ${isRead && !isLast ? "text-gray-600" : ""}`}
        >
          {isLocked ? "LOCKED" : letter.nickname}
        </span>
      </div>
    </button>
  );
};

const LettersList = forwardRef<HTMLDivElement, LettersListProps>(
  (
    {
      letters,
      onLetterSelect,
      onGalleryOpen,
      onBack,
      visible,
      starfieldSpeedRef,
      controlsStarfield = false,
      readLetterIds = [],
      isSurpriseUnlocked = false,
    },
    ref
  ) => {
    const scrollContainerRef = useRef<HTMLElement>(null);
    const lastScrollTopRef = useRef(0);
    const rAFRef = useRef<number | null>(null);

    // Starfield Velocity Logic
    useLayoutEffect(() => {
      const updatePhysics = () => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const currentScrollTop = container.scrollTop;
        const velocity = currentScrollTop - lastScrollTopRef.current;
        lastScrollTopRef.current = currentScrollTop;

        if (starfieldSpeedRef && controlsStarfield) {
          // Amplify velocity slightly for effect
          starfieldSpeedRef.current = velocity * 5;
        }

        rAFRef.current = null;
      };

      const handleScroll = () => {
        if (!rAFRef.current) {
          rAFRef.current = requestAnimationFrame(updatePhysics);
        }
      };

      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener("scroll", handleScroll, { passive: true });
      }

      return () => {
        if (container) container.removeEventListener("scroll", handleScroll);
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      };
    }, [controlsStarfield, starfieldSpeedRef]);

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-40 flex justify-center text-white opacity-0 invisible pointer-events-none"
      >
        {/* Header & Instructions Layer (Fixed Top) */}
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
          <header className="w-full pt-12 pb-4 flex flex-col items-center gap-4 bg-linear-to-b from-black via-black/80 to-transparent">
            {/* Month Name */}
            <div className="text-xs tracking-[0.3em] font-light text-gray-400 uppercase">
              February
            </div>

            {/* Number Line */}
            <div className="relative flex items-center justify-center gap-8 text-sm font-mono text-gray-600 select-none">
              <span>10</span>
              <span>11</span>
              <span>12</span>
              <span>13</span>
              <span className="text-white font-bold scale-125">14</span>
              <span>15</span>
              <span>16</span>
              <span>17</span>
              <span>18</span>

              {/* Arrow pointing to 14 */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5 6L0 0H10L5 6Z" fill="white" />
                </svg>
              </div>
            </div>
          </header>

          {/* Back Button - Fixed Top Left */}
          <button
            onClick={onBack}
            className="back-button opacity-0 absolute top-8 left-8 z-50 text-gray-400 hover:text-white transition-colors pointer-events-auto flex items-center gap-2 group"
          >
            <div className="p-1 border border-gray-600 rounded-full group-hover:border-white transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
              Back
            </span>
          </button>
        </div>

        {/* Scrollable Grid Container */}
        <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
          <div className="relative w-full max-w-4xl h-full">
            {/* Top Fade Mask */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />

            {/* Scrollable Area */}
            <nav
              ref={scrollContainerRef}
              className="relative h-full overflow-y-auto no-scrollbar pt-40 pb-32 px-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {letters.map((letter, index) => {
                  const isLast = index === letters.length - 1;
                  const isRead = readLetterIds.includes(letter.id);
                  const isLocked = isLast && !isSurpriseUnlocked;

                  return (
                    <div
                      key={letter.id}
                      className={`menu-item-wrapper ${
                        isLast ? "col-span-2 md:col-span-3" : "col-span-1"
                      }`}
                    >
                      <Envelope
                        letter={letter}
                        index={index}
                        isLast={isLast}
                        isRead={isRead}
                        isLocked={isLocked}
                        onClick={() => onLetterSelect(letter.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* Bottom Fade Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }
);

LettersList.displayName = "MainMenu";

export default LettersList;
