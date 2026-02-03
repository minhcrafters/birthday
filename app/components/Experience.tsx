"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import Intro from "./Intro";
import MainMenu from "./MainMenu";
import LetterView from "./LetterView";
import AudioControl from "./AudioControl";
import { letters } from "../data/letters";

gsap.registerPlugin(useGSAP, TextPlugin);

export default function Experience() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0);

  const masterTimeline = useRef<gsap.core.Timeline | null>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Data
  const activeLetter = letters.find((l) => l.id === activeLetterId) || null;

  // Shortcut to Skip Intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "J" || e.key === "j")) {
        if (!introComplete && masterTimeline.current) {
          masterTimeline.current.progress(1); // Jump to end
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introComplete]);

  useGSAP(
    () => {
      // Check for mobile
      // const isMobile = window.matchMedia("(max-width: 768px)").matches;

      // Desktop & Mobile: Run Intro Sequence
      const tl = gsap.timeline({
        onComplete: () => {
          setIntroComplete(true);
          // Enable interaction with menu
          if (menuRef.current) {
            menuRef.current.style.pointerEvents = "auto";
          }
        },
      });

      masterTimeline.current = tl;

      const introEl = introRef.current!;
      const textEl = introEl.querySelector(".intro-text");

      // Initial Visibility
      gsap.set(introEl, { autoAlpha: 1, backgroundColor: "#000000" });
      gsap.set(textEl, { opacity: 1, text: "", filter: "blur(0px)", scale: 1 });

      // Intro Text Sequence
      const introTexts = [
        "Hey, Shiori.",
        "It's me, Michael.",
        "Do you know what day it is today?",
        "That's right.",
        "Today's Valentine's Day.",
        "But also,",
        "it is the day where an angel was summoned into this world...",
        "the day where my favourite person was born.",
        "So, to commemorate this important day,",
        "Our fellow Amycord members and I made something for you.",
        "Enjoy, and...",
      ];

      // Phase 1: Black BG, Typewriter Text
      introTexts.forEach((text) => {
        // Type In
        tl.to(textEl, {
          text: { value: text, delimiter: "" },
          duration: text.length * 0.08, // Slow typing speed
          ease: "none",
        });

        // Pause
        tl.to({}, { duration: 1.2 });

        // Fade Out (Cinematic)
        tl.to(textEl, {
          opacity: 0,
          duration: 1,
          ease: "power2.in",
        });

        // Reset for next (Clear text, reset opacity)
        tl.set(textEl, { text: "", opacity: 1 });
        // Slight pause before next
        tl.to({}, { duration: 0.5 });
      });

      // Phase 2: The "Happy Birthday" Sequence (Original Color Shift)
      // Transition from Black to Blue (#8EC5FF)

      // Prepare text for final reveal - MUST BE ON TIMELINE
      tl.set(textEl, {
        text: "Happy Birthday!",
        opacity: 0,
        scale: 1,
        filter: "blur(10px)",
      });

      // 1. Animate to Blue
      tl.to(introEl, {
        backgroundColor: "#8EC5FF",
        duration: 2.5,
        ease: "power2.inOut",
      });

      // 2. Text In (Blur/Fade)
      tl.to(
        textEl,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 2,
          ease: "power2.out",
        },
        "<+=0.5",
      );

      // 3. Animate to Purple
      tl.to(
        introEl,
        {
          backgroundColor: "#C6B7FF",
          duration: 2.5,
          ease: "power2.inOut",
        },
        ">-0.5",
      );

      // 4. Animate to Dark Red
      tl.to(
        introEl,
        {
          backgroundColor: "#8B1E1E",
          duration: 2.5,
          ease: "power2.inOut",
        },
        ">-0.5",
      );

      // 5. Text Out (Blur/Scale)
      tl.to(
        textEl,
        {
          opacity: 0,
          filter: "blur(10px)",
          scale: 1.1,
          duration: 1.5,
          ease: "power2.in",
        },
        "<+=1",
      );

      // Phase 3: Transition to Menu (Black)

      // Ensure Text is FULLY gone before we start fading the background/intro
      tl.to({}, { duration: 0.5 }); // Safety buffer

      // Transition BG to Black
      tl.to(introEl, {
        backgroundColor: "#000000",
        duration: 2,
        ease: "expo.inOut",
      });

      // Simultaneously bring in the menu elements
      if (menuRef.current) {
        tl.set(menuRef.current, { opacity: 1 });

        const menuItems = menuRef.current.querySelectorAll(".menu-item");
        const headerContent = menuRef.current.querySelectorAll("header > *");

        // Fade out Intro Container (revealing Starfield underneath)
        // We delay this slightly so the black BG has time to set in, creating a seamless crossfade to stars
        tl.to(
          introEl,
          {
            opacity: 0,
            duration: 3, // Slower fade for smoother reveal of stars
            ease: "power2.inOut",
          },
          ">-1",
        );

        // Slide up Menu Elements
        tl.from(
          [...Array.from(headerContent), ...Array.from(menuItems)],
          {
            y: 50, // Reduced distance for subtler slide
            opacity: 0,
            stagger: 0.05,
            duration: 2,
            ease: "power3.out",
            immediateRender: false, // Critical: Wait for MainMenu to apply its initial scale/blur styles
          },
          "<+=0.5", // Start sliding up while intro fades out
        );

        tl.call(() => setAudioVolume(0.5), undefined, "<");
      }

      tl.set(introEl, { display: "none" });
    },
    { scope: introRef },
  );

  // Handlers to manage audio ducking
  const handleLetterSelect = (id: string) => {
    setActiveLetterId(id);
    setAudioVolume(0.2); // Duck volume
  };

  const handleLetterDismiss = () => {
    setActiveLetterId(null);
    setAudioVolume(0.5); // Restore volume
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      <Intro ref={introRef} />

      <MainMenu
        ref={menuRef}
        letters={letters}
        visible={introComplete}
        onLetterSelect={handleLetterSelect}
      />

      <LetterView
        letter={activeLetter}
        onDismiss={handleLetterDismiss}
        onCloseComplete={() => {
          // Optional cleanup
        }}
      />

      <AudioControl
        src={
          activeLetter
            ? `/audio/${activeLetter.nickname.toLowerCase()}.mp3`
            : "/audio/background_loop.mp3"
        }
        targetVolume={audioVolume}
      />
    </main>
  );
}
