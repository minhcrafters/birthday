import React, { forwardRef, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { LetterData } from "../data/letters";
import { siteConfig } from "../config/site";

interface LettersListProps {
  letters: LetterData[];
  onLetterSelect: (id: string) => void;
  onBack: () => void;
  starfieldSpeedRef: React.RefObject<number>;
  controlsStarfield?: boolean;
  readLetterIds?: string[];
  lockedLetterIds?: string[];
}

const DAY_STRIP_RADIUS = 4;

/** Days shown either side of the configured birthday, handling month rollover. */
function getBirthdayDayStrip(month: number, day: number): number[] {
  const days: number[] = [];
  for (let offset = -DAY_STRIP_RADIUS; offset <= DAY_STRIP_RADIUS; offset++) {
    days.push(new Date(Date.UTC(2024, month - 1, day + offset)).getUTCDate());
  }
  return days;
}

const Envelope = ({
  letter,
  isRead,
  isLocked,
  onClick,
}: {
  letter: LetterData;
  isRead?: boolean;
  isLocked?: boolean;
  onClick: () => void;
}) => {
  const cardBaseClasses =
    "absolute inset-0 border rounded-xl transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]";
  const cardLockedClasses = "bg-slate-900/20 border-white/5";
  const cardActiveClasses =
    "bg-slate-900/50 border-white/10 group-hover:bg-slate-800/60 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]";
  const cardReadClasses = "border-white/5 bg-slate-900/20";

  const iconBaseClasses =
    "relative z-10 w-full h-full flex items-center justify-center transition-colors duration-500";
  const iconLockedClasses = "text-gray-600";
  const iconActiveClasses = "text-white/80 group-hover:text-white";
  const iconReadClasses = "text-gray-500";

  const labelBaseClasses =
    "font-serif tracking-widest uppercase text-xs md:text-sm transition-colors duration-300";
  const labelLockedClasses = "text-gray-700";
  const labelActiveClasses = "text-gray-400 group-hover:text-white";
  const labelReadClasses = "text-gray-600";

  const isFeatured = Boolean(letter.featured);

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex flex-col items-center justify-center p-6 transition-all duration-500 focus:outline-none w-full ${
        isFeatured ? "aspect-2/1 md:aspect-3/1" : "aspect-square"
      } ${isLocked ? "opacity-60 cursor-not-allowed grayscale" : "hover:scale-105"}`}
    >
      <div
        className={`${cardBaseClasses} ${
          isLocked
            ? cardLockedClasses
            : isRead && !isFeatured
              ? cardReadClasses
              : cardActiveClasses
        }`}
      />

      <div
        className={`${iconBaseClasses} ${
          isLocked
            ? iconLockedClasses
            : isRead && !isFeatured
              ? iconReadClasses
              : iconActiveClasses
        }`}
      >
        {isLocked ? (
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
          <Image
            src={`/images/icons/letter_${isFeatured ? "purple" : "blue"}_${
              isRead ? "open" : "closed"
            }.png`}
            alt="Envelope"
            width={800}
            height={600}
            className={`w-3/4 h-3/4 object-contain drop-shadow-lg transition-transform duration-700 ${
              isFeatured
                ? "group-hover:scale-110"
                : "group-hover:-translate-y-2"
            } ${isRead && !isFeatured ? "opacity-75" : ""}`}
          />
        )}

        {isFeatured && !isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full absolute bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <span
          className={`${labelBaseClasses} ${
            isFeatured ? "text-base md:text-lg font-bold" : ""
          } ${
            isLocked
              ? labelLockedClasses
              : isRead && !isFeatured
                ? labelReadClasses
                : labelActiveClasses
          }`}
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
      onBack,
      starfieldSpeedRef,
      controlsStarfield = false,
      readLetterIds = [],
      lockedLetterIds = [],
    },
    ref,
  ) => {
    const scrollContainerRef = useRef<HTMLElement>(null);
    const dayStrip = getBirthdayDayStrip(
      siteConfig.birthday.month,
      siteConfig.birthday.day,
    );
    const targetDayIndex = Math.floor(dayStrip.length / 2);
    const lastScrollTopRef = useRef(0);
    const rAFRef = useRef<number | null>(null);

    useLayoutEffect(() => {
      const updatePhysics = () => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const currentScrollTop = container.scrollTop;
        const velocity = currentScrollTop - lastScrollTopRef.current;
        lastScrollTopRef.current = currentScrollTop;

        if (starfieldSpeedRef && controlsStarfield) {
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
        if (container) {
          container.removeEventListener("scroll", handleScroll);
        }
        if (rAFRef.current) {
          cancelAnimationFrame(rAFRef.current);
        }
      };
    }, [controlsStarfield, starfieldSpeedRef]);

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-40 flex justify-center text-white opacity-0 invisible pointer-events-none"
      >
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
          <header className="w-full pt-12 pb-4 flex flex-col items-center gap-4">
            <div className="text-xs tracking-[0.3em] font-light text-gray-400 uppercase">
              {siteConfig.monthName}
            </div>

            <div className="relative flex items-center justify-center gap-8 text-sm font-mono text-gray-600 select-none">
              {dayStrip.map((dayOfMonth, i) => (
                <span
                  key={i}
                  className={
                    i === targetDayIndex ? "text-white font-bold scale-125" : ""
                  }
                >
                  {String(dayOfMonth).padStart(2, "0")}
                </span>
              ))}

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

        <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
          <div className="relative w-full max-w-4xl h-full">
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-black via-black/80 to-transparent z-20 pointer-events-none fade-mask" />

            <nav
              ref={scrollContainerRef}
              className="relative h-full overflow-y-auto no-scrollbar pt-40 pb-32 px-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {letters.map((letter) => {
                  const isRead = readLetterIds.includes(letter.id);
                  const isLocked = lockedLetterIds.includes(letter.id);

                  return (
                    <div
                      key={letter.id}
                      className={`menu-item-wrapper ${
                        letter.featured ? "col-span-2 md:col-span-3" : "col-span-1"
                      }`}
                    >
                      <Envelope
                        letter={letter}
                        isRead={isRead}
                        isLocked={isLocked}
                        onClick={() => onLetterSelect(letter.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent z-20 pointer-events-none fade-mask" />
          </div>
        </div>
      </div>
    );
  },
);

LettersList.displayName = "MainMenu";

export default LettersList;
