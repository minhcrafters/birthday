import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LetterData, SlideshowLetterContent } from "../../data/letters";

interface SlideshowLetterProps {
  letter: LetterData & { content: SlideshowLetterContent };
  onComplete: () => void;
}

const SlideshowLetter: React.FC<SlideshowLetterProps> = ({
  letter,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const whiteOverlayRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const slides = letter.content.slides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const audio = new Audio(letter.content.preludeSrc ?? "/audio/prelude.wav");
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        const aud = audioRef.current;
        aud.pause();
        aud.currentTime = 0;
      }
    };
  }, [letter.content.preludeSrc]);

  const fadeOutAudio = () => {
    if (audioRef.current) {
      gsap.to(audioRef.current, {
        volume: 0,
        duration: 2,
        onComplete: () => audioRef.current?.pause(),
      });
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => setIsAnimating(false),
      });

      gsap.set(containerRef.current, { autoAlpha: 1 });

      if (whiteOverlayRef.current) {
        tl.to(whiteOverlayRef.current, {
          opacity: 0,
          duration: 3,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(whiteOverlayRef.current, { display: "none" });
          },
        });
      }

      if (textRef.current) {
        tl.fromTo(
          textRef.current,
          { opacity: 0, y: 10, filter: "blur(5px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 2.5,
            ease: "power2.out",
            onStart: () => {
              if (audioRef.current) {
                audioRef.current
                  .play()
                  .catch((e) => console.log("Audio play failed", e));
              }
            },
          },
          "-=1.5",
        );
      }
    },
    { scope: containerRef },
  );

  const handleClick = () => {
    if (isAnimating || !textRef.current) return;

    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }

    const isLastSlide = currentIndex >= slides.length - 1;

    setIsAnimating(true);

    if (!isLastSlide) {
      const tl = gsap.timeline();

      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        duration: 1,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((prev) => prev + 1);
        },
      });

      tl.to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 2,
          ease: "power2.out",
          delay: 0.1,
        },
        "+=0.1",
      );

      tl.call(() => setIsAnimating(false));
    } else {
      fadeOutAudio();

      const tl = gsap.timeline();

      tl.to(textRef.current, {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        duration: 1.5,
        ease: "power2.in",
      });

      tl.to(
        containerRef.current,
        {
          autoAlpha: 0,
          duration: 2,
          ease: "power2.inOut",
          onComplete: onComplete,
        },
        "-=0.5",
      );
    }
  };

  const getTextStyle = (index: number, total: number) => {
    if (index === 0) {
      return "text-4xl md:text-6xl font-bold mb-8 text-white font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
    }
    if (index === total - 1) {
      return "text-2xl md:text-3xl mt-8 italic text-gray-300 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
    }
    return "text-2xl md:text-4xl font-light text-gray-100 font-serif tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
  };

  const currentText = slides[currentIndex] || "";
  const isLast = currentIndex === slides.length - 1;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-300 flex flex-col items-center justify-center bg-black ${
        !isAnimating ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={handleClick}
    >
      <div
        ref={whiteOverlayRef}
        className="absolute inset-0 z-310 bg-white pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-30 max-w-4xl px-8 flex justify-center items-center min-h-[50vh]">
        <div
          ref={textRef}
          className={`${getTextStyle(currentIndex, slides.length)} text-center will-change-transform will-change-opacity`}
        >
          {currentText}
        </div>
      </div>

      <div
        className={`absolute bottom-12 text-xs uppercase tracking-[0.3em] text-gray-500 transition-opacity duration-1000 pointer-events-none ${
          !isAnimating ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
      >
        {isLast ? "Click to close" : "Click to continue"}
      </div>
    </div>
  );
};

export default SlideshowLetter;
