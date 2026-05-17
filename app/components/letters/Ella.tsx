import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const meta = {
  id: "ella",
  nickname: "Ella",
  imageSrc: "/images/pfp/ella.png",
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

    const rescale = () => {
      if (!textRef.current || !contentWrapperRef.current) return;
      gsap.set(textRef.current, { clearProps: "scale" });
      const scaleH =
        contentWrapperRef.current.clientHeight / textRef.current.scrollHeight;
      const scaleW =
        contentWrapperRef.current.clientWidth / textRef.current.scrollWidth;
      const scale = Math.min(1, scaleH * 0.9, scaleW * 0.95);
      gsap.set(textRef.current, {
        scale,
        transformOrigin: "center center",
      });
    };

    const timer = setTimeout(rescale, 10);
    window.addEventListener("resize", rescale);
    return () => {
      window.removeEventListener("resize", rescale);
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
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out",
          },
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
        const visible =
          Number(gsap.getProperty(containerRef.current, "opacity")) > 0;
        if (!visible) return;

        if (timelineRef.current) timelineRef.current.kill();
        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(containerRef.current, { zIndex: -1, autoAlpha: 0 });
            onCloseComplete?.();
          },
        });
        timelineRef.current = tl;

        const paragraphs = textRef.current.querySelectorAll("p");
        const image = textRef.current.querySelector(".letter-image");

        if (image) {
          tl.to(image, {
            x: 20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
          });
        }

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
              <p>Dear Halo,</p>
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
                Uhh we haven't known each other long at all, I'd say I barely
                know you at all, but hey that can change in the future for sure!
              </p>
              <p>
                You're 19 now huh, your gonna be out of education soon I guess,
                good luck on your studies and whatever you want to achieve.
              </p>
              <p>
                Also stop thinking so negatively about yourself, I still believe
                you'll find a partner that genuinely cares about you.
              </p>
              <p>
                So good luck with everything, and many many returns of the day.
              </p>
              <p>- Ella</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
