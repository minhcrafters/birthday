import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AudioControlProps {
  src: string;
  targetVolume: number;
}

const CROSSFADE_DURATION = 1;

const AudioControl = ({ src, targetVolume }: AudioControlProps) => {
  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);

  const activePlayerRef = useRef<"player1" | "player2">("player1");
  const currentSrcRef = useRef<string>(src);
  const hasInteractedRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (audioRef1.current && src) {
      audioRef1.current.src = src;
    }
  }, [src]);

  useEffect(() => {
    const handleInteraction = () => {
      if (hasInteractedRef.current) {
        return;
      }

      const player =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;

      if (player && player.src && player.src !== window.location.href) {
        player
          .play()
          .then(() => {
            hasInteractedRef.current = true;
            setHasInteracted(true);
          })
          .catch(() => {
            hasInteractedRef.current = true;
            setHasInteracted(true);
          });
      } else {
        hasInteractedRef.current = true;
        setHasInteracted(true);
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
  }, []);

  useEffect(() => {
    if (!hasInteracted) {
      const active =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;

      if (
        active &&
        src &&
        active.src !== window.location.origin + src &&
        active.src !== src
      ) {
        active.src = src;
        currentSrcRef.current = src;
      }
      return;
    }

    if (src !== currentSrcRef.current) {
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
        if (src) {
          incoming.src = src;
          incoming.volume = 0;
          incoming.play().catch((e) => console.error("Play error", e));

          gsap.to(incoming, {
            volume: targetVolume,
            duration: CROSSFADE_DURATION,
            ease: "power1.in",
          });
        }

        gsap.to(outgoing, {
          volume: 0,
          duration: CROSSFADE_DURATION,
          ease: "power1.out",
          onComplete: () => {
            outgoing.pause();
          },
        });

        activePlayerRef.current = nextPlayer;
        currentSrcRef.current = src;
      }
    } else {
      const active =
        activePlayerRef.current === "player1"
          ? audioRef1.current
          : audioRef2.current;

      if (active) {
        gsap.to(active, {
          volume: targetVolume,
          duration: CROSSFADE_DURATION,
          ease: "power2.out",
        });

        if (active.paused && targetVolume > 0) {
          active.play().catch(() => {});
        }
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
