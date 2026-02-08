import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface LyricsDisplayProps {
  loopsStartTime: number; // Audio context time when loops start
  audioContext: AudioContext | null;
  isInTitleScreen: boolean;
}

const LYRICS = [
  "Take me back when",
  "we met at",
  "Covent Garden",
  "My time is frozen",
];

// Timing calculations
const BPM = 120;
const BEATS_PER_LINE = 8;
const SECONDS_PER_BEAT = 60 / BPM; // 0.5 seconds per beat
const LINE_DURATION = BEATS_PER_LINE * SECONDS_PER_BEAT; // 4 seconds per line
const FADE_DURATION = 0.5; // Fade in/out duration in seconds

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
      if (!audioContext || loopsStartTime === 0) return;

      // Create timeline for lyrics animation
      // Paused because we control it manually via requestAnimationFrame
      const tl = gsap.timeline({ paused: true });

      LYRICS.forEach((_, index) => {
        const lyricEl = lyricsRefs.current[index];
        if (!lyricEl) return;

        // Calculate timings for this line
        const startTime = index * LINE_DURATION;
        const fadeInEnd = startTime + FADE_DURATION;
        const fadeOutStart = startTime + LINE_DURATION - FADE_DURATION;

        // Ensure clean state at start of line's window
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

        // Hold (visible duration)
        const holdDuration = fadeOutStart - fadeInEnd;
        tl.to(lyricEl, { duration: holdDuration }, fadeInEnd);

        // Fade out
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

      // Function to sync timeline with audio loop
      const syncWithAudio = () => {
        if (!audioContext || !timelineRef.current) return;

        const currentAudioTime = audioContext.currentTime;
        const elapsedSinceLoopStart = currentAudioTime - loopsStartTime;

        // Calculate position within the loop cycle
        const totalLoopDuration = LYRICS.length * LINE_DURATION;
        const positionInLoop = elapsedSinceLoopStart % totalLoopDuration;

        // Update timeline to match audio position
        if (positionInLoop >= 0) {
          timelineRef.current.time(positionInLoop);
        }

        // Continue syncing
        rafRef.current = requestAnimationFrame(syncWithAudio);
      };

      // Start syncing once loops have started
      const startSync = () => {
        if (!audioContext) return;

        const currentAudioTime = audioContext.currentTime;
        if (currentAudioTime >= loopsStartTime) {
          // Loops have started, begin sync
          syncWithAudio();
        } else {
          // Wait until loops start
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

  // Control visibility based on title screen
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
