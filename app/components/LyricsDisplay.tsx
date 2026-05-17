import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface LyricsDisplayProps {
  loopsStartTime: number;
  audioContext: AudioContext | null;
  isInTitleScreen: boolean;
}

const LYRICS = [
  "Take me back when",
  "we met at",
  "Covent Garden",
  "My time is frozen",
];

const BPM = 120;
const BEATS_PER_LINE = 8;
const SECONDS_PER_BEAT = 60 / BPM;
const LINE_DURATION = BEATS_PER_LINE * SECONDS_PER_BEAT;
const FADE_DURATION = 0.5;
const TOTAL_LOOP_DURATION = LYRICS.length * LINE_DURATION;

const LyricsDisplay = ({
  loopsStartTime,
  audioContext,
  isInTitleScreen,
}: LyricsDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lyricsRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafRef = useRef<number | null>(null);

  useGSAP(
    () => {
      if (!audioContext || loopsStartTime === 0) {
        return;
      }

      const tl = gsap.timeline({ paused: true });

      LYRICS.forEach((_, index) => {
        const lyricEl = lyricsRefs.current[index];
        if (!lyricEl) {
          return;
        }

        const startTime = index * LINE_DURATION;
        const fadeInEnd = startTime + FADE_DURATION;
        const fadeOutStart = startTime + LINE_DURATION - FADE_DURATION;

        tl.fromTo(
          lyricEl,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: FADE_DURATION,
            ease: "power2.out",
          },
          startTime,
        );

        const holdDuration = fadeOutStart - fadeInEnd;
        tl.to(lyricEl, { duration: holdDuration }, fadeInEnd);

        tl.to(
          lyricEl,
          {
            opacity: 0,
            y: -10,
            duration: FADE_DURATION,
            ease: "power2.in",
          },
          fadeOutStart,
        );
      });

      timelineRef.current = tl;

      const syncWithAudio = () => {
        if (!audioContext || !timelineRef.current) {
          return;
        }

        const elapsedSinceLoopStart = audioContext.currentTime - loopsStartTime;
        const positionInLoop = elapsedSinceLoopStart % TOTAL_LOOP_DURATION;

        if (positionInLoop >= 0) {
          timelineRef.current.time(positionInLoop);
        }

        rafRef.current = requestAnimationFrame(syncWithAudio);
      };

      const startSync = () => {
        if (!audioContext) {
          return;
        }

        const currentAudioTime = audioContext.currentTime;

        if (currentAudioTime >= loopsStartTime) {
          syncWithAudio();
        } else {
          const waitTime = (loopsStartTime - currentAudioTime) * 1000;
          setTimeout(startSync, waitTime);
        }
      };

      startSync();

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [loopsStartTime, audioContext] },
  );

  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: isInTitleScreen ? 1 : 0,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }
  }, [isInTitleScreen]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-8 left-0 right-0 grid place-items-center pointer-events-none"
      style={{ opacity: 0 }}
    >
      {LYRICS.map((line, index) => (
        <p
          key={index}
          ref={(el) => {
            lyricsRefs.current[index] = el;
          }}
          className="col-start-1 row-start-1 whitespace-nowrap text-xs font-medium tracking-[0.3em] text-gray-500 text-center"
          style={{ opacity: 0 }}
        >
          {line.toUpperCase()}
        </p>
      ))}
    </div>
  );
};

export default LyricsDisplay;
