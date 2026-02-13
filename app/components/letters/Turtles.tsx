import React, { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const meta = {
  id: "turtles",
  nickname: "Turtles",
  imageSrc: "/images/pfp/turtles.webp",
};

interface LetterProps {
  isOpen: boolean;
  onDismiss: () => void;
  onCloseComplete?: () => void;
}

export default function Ella({
  isOpen,
  onDismiss,
  onCloseComplete,
}: LetterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (!textRef.current || !contentWrapperRef.current) return;
      gsap.set(textRef.current, { clearProps: "scale" });
      const availableHeight = contentWrapperRef.current.clientHeight;
      const contentHeight = textRef.current.scrollHeight;
      const availableWidth = contentWrapperRef.current.clientWidth;
      const contentWidth = textRef.current.scrollWidth;
      const scaleH = availableHeight / contentHeight;
      const scaleW = availableWidth / contentWidth;
      const scale = Math.min(1, scaleH * 0.9, scaleW * 0.95);
      gsap.set(textRef.current, {
        scale: scale,
        transformOrigin: "center center",
      });
    };
    const timer = setTimeout(handleResize, 10);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onDismiss]);

  useGSAP(
    () => {
      if (isOpen && containerRef.current && textRef.current) {
        if (timelineRef.current) timelineRef.current.kill();
        const tl = gsap.timeline();
        timelineRef.current = tl;

        gsap.set(containerRef.current, { zIndex: 50, autoAlpha: 1 });
        tl.fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power2.inOut" },
        );

        const paragraphs = textRef.current.querySelectorAll("p");
        const image = textRef.current.querySelector(".letter-image");

        tl.fromTo(
          paragraphs,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
          "-=0.3",
        );
        if (image) {
          tl.fromTo(
            image,
            { x: 50, opacity: 0, rotate: 5 },
            { x: 0, opacity: 1, rotate: 3, duration: 1, ease: "power3.out" },
            "-=0.8",
          );
        }
      } else if (!isOpen && containerRef.current && textRef.current) {
        const isVisible =
          Number(gsap.getProperty(containerRef.current, "opacity")) > 0;
        if (isVisible) {
          if (timelineRef.current) timelineRef.current.kill();
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(containerRef.current, { zIndex: -1, autoAlpha: 0 });
              if (onCloseComplete) onCloseComplete();
            },
          });
          timelineRef.current = tl;

          const paragraphs = textRef.current.querySelectorAll("p");
          const image = textRef.current.querySelector(".letter-image");

          if (image)
            tl.to(image, {
              x: 20,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in",
            });
          tl.to(
            paragraphs,
            {
              y: -10,
              opacity: 0,
              stagger: 0.05,
              duration: 0.4,
              ease: "power2.in",
            },
            "<",
          ).to(
            containerRef.current,
            { opacity: 0, duration: 0.4, ease: "power2.in" },
            "-=0.2",
          );
        }
      }
    },
    { dependencies: [isOpen] },
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-1] opacity-0 flex items-center justify-center bg-black text-white overflow-hidden"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onDismiss} />
      <div className="relative max-w-6xl w-full h-full p-6 md:p-20 flex flex-col pointer-events-none">
        <div
          className="pointer-events-auto w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 flex justify-end mb-4 md:mb-8">
            <button
              onClick={onDismiss}
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity text-white"
            >
              Close
            </button>
          </div>
          <div
            ref={contentWrapperRef}
            className="flex-1 min-h-0 relative z-10 flex items-center justify-center overflow-hidden"
          >
            <div
              ref={textRef}
              className="block font-serif text-xl md:text-3xl leading-relaxed text-gray-200 select-text cursor-text w-full"
            >
              <p>Happy Birthday Halo!!</p>
              <div className="float-right ml-6 mb-1 relative z-0">
                <Image
                  src={meta.imageSrc}
                  width={256}
                  height={256}
                  alt={meta.nickname}
                  className="letter-image w-32 h-32 md:w-64 md:h-64 object-cover rounded-lg shadow-2xl transform rotate-3 contrast-125 border border-white/20"
                />
              </div>
              <p>
                Since you've joined Amycord, it's genuinely been alot more fun!
                Whether you're barking for gardenia or denying the cute
                allegations (which are 100% true) , every moment with you is so
                enjoyable that I do get a teeny weeny excited when you say
                morning.
              </p>
              <p>I hope for us to be closer friends this year!!</p>
              <p>- Turtles/Yuki</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
