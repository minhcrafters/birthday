import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AudioControlProps {
  src: string;
  targetVolume: number; // 0 to 1
}

const AudioControl = ({ src, targetVolume }: AudioControlProps) => {
  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);

  const activePlayerRef = useRef<"player1" | "player2">("player1");
  const currentSrcRef = useRef<string>(src);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize first player src (fix for ref-in-render)
  useEffect(() => {
    if (audioRef1.current) {
      audioRef1.current.src = src;
    }
  }, [src]);

  // Initialize audio context/unlock on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        // Try to play active player to unlock audio context
        const player =
          activePlayerRef.current === "player1"
            ? audioRef1.current
            : audioRef2.current;
        if (player) {
          player
            .play()
            .then(() => {
              setHasInteracted(true);
            })
            .catch((err) => {
              // Auto-play might fail, that's okay, we wait for next interaction or retry
              console.log("Audio unlock attempted", err);
            });
        }
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [hasInteracted]);

  // Handle source changes with Crossfade
  useEffect(() => {
    if (!hasInteracted) {
      // Keep active player ready with latest source so it plays correctly on first interaction
      const active =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;
      if (
        active &&
        active.src !== window.location.origin + src &&
        active.src !== src
      ) {
        active.src = src;
        currentSrcRef.current = src;
      }
      return;
    }

    if (src !== currentSrcRef.current) {
      // Source Changed! Perform Crossfade.
      const outgoing =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;
      const incoming =
        activePlayerRef.current === "player1"
          ? audioRef2.current
          : audioRef1.current;
      const nextPlayer =
        activePlayerRef.current === "player1" ? "player2" : "player1";

      if (outgoing && incoming) {
        // 1. Prepare Incoming
        incoming.src = src;
        incoming.volume = 0; // Start silent
        incoming.play().catch((e) => console.error("Play error", e));

        // 2. Animate
        gsap.to(outgoing, {
          volume: 0,
          duration: 2,
          ease: "power1.out",
          onComplete: () => {
            outgoing.pause();
          },
        });
        gsap.to(incoming, {
          volume: targetVolume,
          duration: 2,
          ease: "power1.in",
        });

        // 3. Update State
        activePlayerRef.current = nextPlayer;
        currentSrcRef.current = src;
      }
    } else {
      // Source is same, just adjust volume of active player
      const active =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;
      if (active) {
        gsap.to(active, {
          volume: targetVolume,
          duration: 1,
          ease: "power2.out",
        });
        // Ensure it's playing if it was paused or volume was 0
        if (active.paused && targetVolume > 0) active.play().catch(() => {});
      }
    }
  }, [src, targetVolume, hasInteracted]);

  return (
    <>
      <audio ref={audioRef1} loop preload="auto" className="hidden" />
      <audio ref={audioRef2} loop preload="auto" className="hidden" />
    </>
  );
};

export default AudioControl;
