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
  index,
  isRead,
  isLocked,
  onClick,
}: {
  letter: LetterData;
  index: number;
  isRead?: boolean;
  isLocked?: boolean;
  onClick: () => void;
}) => {
  const tone = index % 2 === 0 ? "coral" : "mint";

  const cardBaseClasses =
    "absolute inset-0 rounded-2xl border-2 transition-all duration-500 shadow-md";
  const cardLockedClasses = "bg-birthday-cream/60 border-birthday-gold/15";
  const cardActiveClasses =
    tone === "coral"
      ? "bg-birthday-cream/90 border-birthday-coral-deep/30 group-hover:border-birthday-coral-deep group-hover:shadow-lg"
      : "bg-birthday-cream/90 border-birthday-mint-deep/30 group-hover:border-birthday-mint-deep group-hover:shadow-lg";
  const cardReadClasses = "bg-birthday-cream/70 border-birthday-gold/20";

  const iconBaseClasses =
    "relative z-10 w-full h-full flex items-center justify-center transition-colors duration-500";

  const labelBaseClasses =
    "font-sans tracking-widest uppercase text-xs md:text-sm transition-colors duration-300";
  const labelLockedClasses = "text-birthday-ink/30";
  const labelActiveClasses = "text-birthday-ink/70 group-hover:text-birthday-ink";
  const labelReadClasses = "text-birthday-ink/40";

  const isFeatured = Boolean(letter.featured);

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex flex-col items-center justify-center p-6 transition-all duration-500 focus:outline-none w-full ${
        isFeatured ? "aspect-2/1 md:aspect-3/1" : "aspect-square"
      } ${isLocked ? "opacity-70 cursor-not-allowed grayscale" : "hover:-translate-y-1"}`}
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

      {!isLocked && !(isRead && !isFeatured) && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-10 rounded-full ${
            tone === "coral" ? "bg-birthday-coral-deep" : "bg-birthday-mint-deep"
          }`}
        />
      )}

      <div className={iconBaseClasses}>
        {isLocked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-1/3 h-1/3 text-birthday-ink/30"
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
            <div className="w-full h-full absolute bg-linear-to-r from-transparent via-birthday-gold/10 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
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

const BackArrow = () => (
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
);

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
        className="fixed inset-0 z-10 flex justify-center text-birthday-ink opacity-0 invisible pointer-events-none"
      >
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
          <header className="w-full pt-12 pb-4 flex flex-col items-center gap-4">
            <div className="text-xs tracking-[0.3em] font-light text-birthday-ink/50 uppercase">
              {siteConfig.monthName}
            </div>

            <div className="relative flex items-center justify-center gap-8 text-sm font-mono text-birthday-ink/40 select-none">
              {dayStrip.map((dayOfMonth, i) => (
                <span
                  key={i}
                  className={
                    i === targetDayIndex
                      ? "text-birthday-coral-deep font-bold scale-125"
                      : ""
                  }
                >
                  {String(dayOfMonth).padStart(2, "0")}
                </span>
              ))}

              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-birthday-coral-deep animate-bounce">
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5 6L0 0H10L5 6Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </header>

          <button
            onClick={onBack}
            className="back-button opacity-0 absolute top-8 left-8 z-50 text-birthday-ink/60 hover:text-birthday-ink transition-colors pointer-events-auto flex items-center gap-2 group"
          >
            <div className="p-1 border border-birthday-gold/40 rounded-full bg-birthday-cream/80 group-hover:border-birthday-gold transition-all">
              <BackArrow />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
              Back
            </span>
          </button>
        </div>

        <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
          <div className="relative w-full max-w-4xl h-full">
            <nav
              ref={scrollContainerRef}
              className="relative h-full overflow-y-auto no-scrollbar pt-40 pb-32 px-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {letters.map((letter, index) => {
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
                        index={index}
                        isRead={isRead}
                        isLocked={isLocked}
                        onClick={() => onLetterSelect(letter.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>
    );
  },
);

LettersList.displayName = "MainMenu";

export default LettersList;
