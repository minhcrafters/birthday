import React, { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const meta = {
  id: "pychael",
  nickname: "Pychael",
  imageSrc: "/images/pfp/pychael.png",
};

interface LetterProps {
  isOpen: boolean;
  onDismiss: () => void;
  onCloseComplete?: () => void;
}

export default function Pychael({
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
      gsap.set(textRef.current, {
        scale: 0.8,
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
            className="flex-1 min-h-0 relative z-10 flex items-start justify-center overflow-y-auto scrollless"
          >
            <div
              ref={textRef}
              className="block font-serif text-2xl md:text-4xl leading-relaxed text-gray-200 select-text cursor-text w-full max-h-full px-4 py-6"
            >
              <p>
                To my favorite halo, the 5'13 japanese muscular tomboy, and the
                realest nigga that I know,
              </p>
              <br />
              <div className="float-right ml-6 mb-1 relative z-0">
                <Image
                  src={meta.imageSrc}
                  width={320}
                  height={320}
                  alt={meta.nickname}
                  className="letter-image w-40 h-40 md:w-72 md:h-72 object-cover rounded-lg shadow-2xl transform rotate-3 contrast-125 border border-white/20"
                />
              </div>
              <p>
                We finally made it to the real date, ain't we? To be honest, it
                kinda fits that your birthday is on Valentine's Day, considering
                you're a hopeless romantic (as evidenced by your constant
                Miyamura chasing lmao). I know he's been blunt, but don't let it
                get you down too much. You're a rare catch, and if he doesn't
                see that, it's his loss.
              </p>
              <p>
                It's been a crazy 8 months since we started talking, from me
                thinking you were a rich ass dude to finding out you're the
                coolest (and scariest) tomboy I know (still being rich ass tho
                hehe). Looking back, we really went from random occasional DMs
                to us screaming at the top of our lungs with that one skeleton
                shield GIF. Imma be honest, it has never been boring with you.
                Even when you're busy, you still make time, and I appreciate
                that.
              </p>
              <p>
                You trusted me when you did not trust many people. You talked
                when things were falling apart instead of disappearing. And I
                tell you, that matters more than you think. I did not text you
                out of obligation, but because you are real, because you are
                funny in a certain way, because you care real hard about your
                sister, your work, and the people you let close.
              </p>
              <p>
                I know stuff get heavy sometimes, with the side effects of
                antidepressants and constant exhaustion, and it makes me
                appreciate our trust even more. I hate seeing you on the low,
                but I respect the hell out of you for still standing. You are
                genuinely one of the strongest people I know, both physically
                and mentally.
              </p>
              <p>
                I'm looking forward to seeing "Dear Memoire" on Netflix one day,
                and I definitely am going to keep glazing your art, one sketch
                at a time. You're an underrated masterpiece yourself, Shiori.
                Stop being so apologetic for living a life, you deserve every
                second of it.
              </p>
              <p>
                Remember what I told you. I am always here if you need to vent,
                if you need someone to find sauces of obscure images, or if you
                just need a hug. You aren't a burden, and you never will be.
              </p>
              <p>
                Happy birthday, Shiori. You made it through another year. That
                already counts for something.
              </p>
              <br />
              <p>Love you /p,</p>
              <p>- Michael/Luigi</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        /* Hide scrollbar for WebKit browsers (Chrome, Safari, Opera) */
        .scrollless::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for Firefox */
        .scrollless {
          scrollbar-width: none;
        }

        /* Hide scrollbar for IE and Edge */
        .scrollless {
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}
