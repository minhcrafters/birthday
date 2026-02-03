import React, { forwardRef, useLayoutEffect, useRef, useEffect } from "react";
import { LetterData } from "../data/letters";
import Starfield from "./Starfield";

interface MainMenuProps {
  letters: LetterData[];
  onLetterSelect: (id: string) => void;
  visible: boolean;
}

const MainMenu = forwardRef<HTMLDivElement, MainMenuProps>(
  ({ letters, onLetterSelect, visible }, ref) => {
    const scrollContainerRef = useRef<HTMLElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const starfieldSpeedRef = useRef(0);
    const lastScrollTopRef = useRef(0);

    const rAFRef = useRef<number | null>(null);

    const updateItems = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const currentScrollTop = container.scrollTop;

      // Calculate velocity
      const velocity = currentScrollTop - lastScrollTopRef.current;
      lastScrollTopRef.current = currentScrollTop;

      // Update starfield speed
      starfieldSpeedRef.current = velocity;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;
      const maxDist = containerRect.height / 2;

      itemsRef.current.forEach((item) => {
        if (!item) return;

        // Optimization: Use offsetTop relative to container if possible, 
        // but getBoundingClientRect is more reliable for fixed/absolute contexts.
        // given the list is short, getBoundingClientRect is acceptable per-frame if batched.
        // However, we are in a rAF loop now, so it's better.
        
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;

        const distance = Math.abs(containerCenter - itemCenter);
        const normalizedDist = Math.min(distance / maxDist, 1);

        // Calculate styles
        const scale = 1.5 - normalizedDist * 0.7;
        const opacity = 1 - normalizedDist * 0.7;
        const blur = normalizedDist * 3;

        // Use transform3d for hardware acceleration
        item.style.transform = `scale(${scale}) translateZ(0)`;
        item.style.opacity = `${opacity}`;
        item.style.filter = `blur(${blur}px)`;
        item.style.zIndex = `${Math.round((1 - normalizedDist) * 100)}`;
      });
      
      rAFRef.current = null;
    };

    const handleScroll = () => {
      if (!rAFRef.current) {
        rAFRef.current = requestAnimationFrame(updateItems);
      }
    };

    // Use useLayoutEffect to ensure styles are applied before browser paint
    // and before parent animations might read them (if delayed correctly).
    useLayoutEffect(() => {
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
        // Initial calculation
        updateItems(); // Call directly to force sync update on mount
      }

      return () => {
        if (container) container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      };
    }, [visible]); // Recalculate when visibility changes

    // Keyboard Navigation for Menu
    useEffect(() => {
      if (!visible) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Find currently centered item index
        const containerCenter =
          container.scrollTop + container.clientHeight / 2;
        let closestIndex = 0;
        let minDistance = Infinity;

        itemsRef.current.forEach((item, index) => {
          if (!item) return;
          const itemCenter = item.offsetTop + item.offsetHeight / 2;
          const dist = Math.abs(containerCenter - itemCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = index;
          }
        });

        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIndex = Math.min(letters.length - 1, closestIndex + 1);
          const targetItem = itemsRef.current[nextIndex];
          if (targetItem) {
            targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prevIndex = Math.max(0, closestIndex - 1);
          const targetItem = itemsRef.current[prevIndex];
          if (targetItem) {
            targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const targetItem = itemsRef.current[closestIndex];
          if (targetItem) {
            onLetterSelect(letters[closestIndex].id);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [visible, letters, onLetterSelect]);

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-40 flex justify-center bg-black text-white opacity-0 pointer-events-none"
      >
        <Starfield speedRef={starfieldSpeedRef} />

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

          {/* Instruction Text */}
          <div className="text-gray-500 text-xs tracking-[0.2em] font-light uppercase animate-pulse mb-2">
            Choose a letter to read
          </div>
        </div>

        {/* Scrollable List Container (Full Screen Centered) */}
        <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
          <div className="relative w-full max-w-lg h-full">
            {/* Top Fade Mask */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-linear-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />

            {/* Scrollable Area */}
            <nav
              ref={scrollContainerRef}
              className="h-full overflow-y-auto no-scrollbar py-[45vh] px-4 flex flex-col items-center gap-8 snap-y snap-mandatory touch-pan-y"
            >
              {letters.map((letter, index) => (
                <div key={letter.id} className="menu-item-wrapper w-full flex justify-center snap-center">
                  <button
                    ref={(el) => {
                      itemsRef.current[index] = el;
                    }}
                    onClick={() => onLetterSelect(letter.id)}
                    className="menu-item group relative text-2xl md:text-3xl font-serif font-semibold tracking-wide cursor-pointer focus:outline-none py-2 will-change-transform"
                    aria-label={`Read letter from ${letter.nickname}`}
                  >
                    <span className="relative z-10 text-white">
                      {letter.nickname.toLowerCase()}
                    </span>

                    {/* Simplified hover effect since scale is driven by scroll */}
                    <div className="absolute inset-x-0 bottom-0 h-px bg-white transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 opacity-50" />
                  </button>
                </div>
              ))}
            </nav>

            {/* Bottom Fade Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  },
);

MainMenu.displayName = "MainMenu";

export default MainMenu;
