"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import Intro from "./Intro";
import TitleScreen from "./TitleScreen";
import LettersList from "./LettersList";
import LetterView from "./LetterView";
import AudioControl from "./AudioControl";
import { letters } from "../data/letters";
import Starfield from "./Starfield";
import GlobeGallery from "./GlobeGallery";
import { useSound } from "../contexts/SoundContext";

gsap.registerPlugin(useGSAP, TextPlugin);

const SKIP_INTRO = true;

export default function Experience() {
  const { playSfx } = useSound();
  const [started, setStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0);
  const [bgMusicSrc, setBgMusicSrc] = useState(""); // Initially silent

  const masterTimeline = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startOverlayRef = useRef<HTMLDivElement>(null);
  const titleScreenWrapperRef = useRef<HTMLDivElement>(null);

  const [showTitleScreen, setShowTitleScreen] = useState(false);
  const [hasSeenTitleIntro, setHasSeenTitleIntro] = useState(false); // New State
  // const titleScreenRef = useRef<HTMLDivElement>(null);
  const [menuMounted, setMenuMounted] = useState(false); // New State to control mounting
  const [menuInteractive, setMenuInteractive] = useState(false); // Controls if Menu can influence stars
  const [showGallery, setShowGallery] = useState(false);
  const starfieldSpeedRef = useRef(0); // Shared Starfield Ref

  const handleTitleScreenStart = () => {
    // 1. Mount the Menu
    setMenuMounted(true);
    setHasSeenTitleIntro(true); // Mark intro as seen when leaving
    // Don't reset speed here, let the animation interpolate from current speed
  };

  // Watch for menu mount to start transition
  useGSAP(() => {
    if (menuMounted && masterTimeline.current) {
      // Resume timeline from paused state once menu is presumably mounted
      // We use a small delay or rAF to ensure DOM is ready if needed,
      // but typically useGSAP runs after render commit.
      masterTimeline.current.play();
    }
  }, [menuMounted]);

  // Data
  const activeLetter = letters.find((l) => l.id === activeLetterId) || null;

  // Handle Start (Click or Enter)
  useEffect(() => {
    if (started) return;

    const handleStart = () => setStarted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") setStarted(true);
    };

    window.addEventListener("click", handleStart);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleStart);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [started]);

  // Shortcut to Skip Intro
  useEffect(() => {
    if (!started) return; // Disable skip before start

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "J" || e.key === "j")) {
        if (!introComplete && masterTimeline.current) {
          masterTimeline.current.progress(1); // Jump to end
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introComplete, started]);

  useGSAP(
    () => {
      if (!started) return;

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
      gsap.set(introEl, {
        autoAlpha: 1,
        backgroundColor: "#000000",
        zIndex: 50,
      });
      gsap.set(textEl, { opacity: 1, text: "", filter: "blur(0px)", scale: 1 });

      // Ensure Menu is hidden initially (prevent flash)
      if (menuRef.current) {
        gsap.set(menuRef.current, { autoAlpha: 0 });
      }

      // Phase 0: Fade out Start Overlay
      if (startOverlayRef.current) {
        tl.to(startOverlayRef.current, {
          opacity: 0,
          duration: SKIP_INTRO ? 0.5 : 1.5,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(startOverlayRef.current, { display: "none" });
          },
        });
      }

      // Intro Text Sequence
      if (!SKIP_INTRO) {
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
      }

      // Phase 2: Game-like Title Screen (Always Runs)

      // Ensure Text is gone (in case we skipped or just finished)
      tl.set(textEl, { display: "none" });

      // Reveal Title Screen Wrapper (it's persistent now)
      if (titleScreenWrapperRef.current) {
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 1 });
      }

      // Show Title Screen Component (via State)
      // This mounts the child component, triggering its internal entrance animation
      tl.call(() => setShowTitleScreen(true));

      // Fade out Intro Black BG to reveal Stars (concurrent with Title Screen entrance)
      // Delayed by 2.5s to let "Happy Birthday" text appear on black first
      tl.to(
        introEl,
        { opacity: 0, duration: 2, ease: "power2.inOut" },
        "+=0.5",
      );

      // Pause Timeline and wait for User Interaction (Start Button)
      tl.addPause();
    },
    { scope: containerRef, dependencies: [started] },
  );

  // New Effect: Handle Transition Sequence when Menu Mounts OR Unmounts
  useGSAP(
    () => {
      if (!menuRef.current || !titleScreenWrapperRef.current) return;

      const tl = gsap.timeline();

      if (menuMounted) {
        // --- FORWARD: Title -> Menu ---
        // 1. Prepare Main Menu
        gsap.set(menuRef.current, { autoAlpha: 1 });
        gsap.set(introRef.current, { autoAlpha: 0, display: "none" });

        // 2. Fade Out Title Screen (Foreground)
        tl.to(titleScreenWrapperRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
        });

        // 3. Starfield Acceleration (Travel Phase)
        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(
          speedProxy,
          {
            val: 180, // Much faster (from 120 -> 180)
            duration: 1.0, // Shorter buildup (from 1.8 -> 1.0)
            ease: "power3.in", // Sharp acceleration
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<", // Overlap completely with fade out (was <0.1)
        );

        // 4. Starfield Deceleration (Arrival Phase)
        tl.to(speedProxy, {
          val: 0,
          duration: 1.5, // Faster braking
          ease: "power3.out",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        // 5. Main Menu Entry (Synchronized with Braking)
        const menuItemWrappers =
          menuRef.current.querySelectorAll(".menu-item-wrapper");
        const headerContent = menuRef.current.querySelectorAll("header > *");
        // const instructionText =
        //   menuRef.current.querySelector(".instruction-text");

        const allMenuContent = [
          ...Array.from(headerContent),
          // instructionText,
          ...Array.from(menuItemWrappers),
        ];

        // FIX: Reset properties to resting state so .from() works correctly on re-entry
        gsap.set(allMenuContent, { y: 0, opacity: 1 });

        tl.from(
          allMenuContent,
          {
            y: "20vh",
            opacity: 0,
            duration: 1.5, // Matches deceleration
            ease: "power3.out",
            stagger: 0.1,
          },
          "<", // Starts exactly when deceleration starts
        );

        // 6. Cleanup
        tl.call(() => setShowTitleScreen(false));
        tl.set(titleScreenWrapperRef.current, { display: "none" });
        tl.call(() => setMenuInteractive(true)); // Allow menu to control stars now

        // Fade In Back Button (after menu entry is largely done)
        const backButton = menuRef.current.querySelector(".back-button");
        if (backButton) {
          tl.to(backButton, { opacity: 1, duration: 1, ease: "power2.out" });
        }

        // 7. Music
        tl.call(
          () => {
            setBgMusicSrc("/audio/background_loop.mp3");
            setAudioVolume(0.5);
          },
          undefined,
          "<",
        );
      } else {
        // --- BACKWARD: Menu -> Title ---
        // Check if Menu is visible to avoid initial run
        if (gsap.getProperty(menuRef.current, "opacity") === 0) return;

        tl.call(() => setMenuInteractive(false));

        // Hide Back Button immediately
        const backButton = menuRef.current.querySelector(".back-button");
        if (backButton) {
          tl.to(backButton, { opacity: 0, duration: 0.3, ease: "power2.out" });
        }

        // Prepare Title Screen
        tl.call(() => setShowTitleScreen(true));
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 0 });

        // Fade Out Menu
        const menuItemWrappers =
          menuRef.current.querySelectorAll(".menu-item-wrapper");
        const headerContent = menuRef.current.querySelectorAll("header > *");
        const allMenuContent = [
          ...Array.from(headerContent),
          ...Array.from(menuItemWrappers),
        ];

        tl.to(allMenuContent, {
          y: "20vh",
          opacity: 0,
          duration: 0.8,
          ease: "power2.in",
          stagger: { amount: 0.2, from: "end" },
        });

        // Reverse Warp
        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(
          speedProxy,
          {
            val: -150, // Reverse speed
            duration: 0.8,
            ease: "expo.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        // Fade In Title Screen
        tl.to(titleScreenWrapperRef.current, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.out",
        });

        // Brake to stop
        tl.to(
          speedProxy,
          {
            val: 0,
            duration: 1.5,
            ease: "power3.out",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        // Cleanup Menu
        tl.set(menuRef.current, { autoAlpha: 0 });
      }
    },
    { scope: containerRef, dependencies: [menuMounted] },
  );

  // Handlers to manage audio ducking
  const handleLetterSelect = (id: string) => {
    playSfx("open");
    setActiveLetterId(id);
    setAudioVolume(0.2); // Duck volume
  };

  const handleLetterDismiss = () => {
    playSfx("close");
    setActiveLetterId(null);
    setAudioVolume(0.5); // Restore volume
  };

  return (
    <main
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black"
    >
      <div
        ref={startOverlayRef}
        className={`fixed inset-0 z-100 flex items-center justify-center bg-black cursor-pointer ${
          started ? "pointer-events-none" : ""
        }`}
      >
        <div className="mt-12 text-xs uppercase tracking-[0.2em] text-gray-400 animate-pulse">
          click or press enter to start -&gt;
        </div>
      </div>

      <Starfield
        speedRef={starfieldSpeedRef}
        enableFriction={menuInteractive}
      />

      <Intro ref={introRef} />

      {/* Title Screen Layer - Persistent Wrapper */}
      <div
        ref={titleScreenWrapperRef}
        className="fixed inset-0 z-55 pointer-events-auto"
        style={{ display: "none" }} // Hidden by default, controlled by GSAP
      >
        {showTitleScreen && (
          <TitleScreen
            onStart={handleTitleScreenStart}
            onGalleryOpen={() => {
              setShowGallery(true);
              setHasSeenTitleIntro(true); // Also set if they go to gallery first
            }}
            skipIntro={hasSeenTitleIntro}
          />
        )}
      </div>

      <LettersList
        ref={menuRef}
        letters={letters}
        visible={introComplete}
        onLetterSelect={handleLetterSelect}
        onGalleryOpen={() => setShowGallery(true)}
        onBack={() => {
          setMenuMounted(false);
          setShowTitleScreen(true);
        }}
        starfieldSpeedRef={starfieldSpeedRef}
        controlsStarfield={menuInteractive}
      />

      <LetterView
        letter={activeLetter}
        onDismiss={handleLetterDismiss}
        onCloseComplete={() => {
          // Optional cleanup
        }}
      />

      {showGallery && <GlobeGallery onClose={() => setShowGallery(false)} />}

      <AudioControl
        src={activeLetter ? `/audio/${activeLetter.id}.mp3` : bgMusicSrc}
        targetVolume={audioVolume}
      />
    </main>
  );
}
