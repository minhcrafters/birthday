"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import Intro from "./Intro";
import TitleScreen from "./TitleScreen";
import MainMenu from "./MainMenu";
import LetterView from "./LetterView";
import AudioControl from "./AudioControl";
import { letters } from "../data/letters";
import Starfield from "./Starfield";

gsap.registerPlugin(useGSAP, TextPlugin);

const SKIP_INTRO = true;

export default function Experience() {
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
  // const titleScreenRef = useRef<HTMLDivElement>(null);
  const [menuMounted, setMenuMounted] = useState(false); // New State to control mounting
  const [menuInteractive, setMenuInteractive] = useState(false); // Controls if Menu can influence stars
  const starfieldSpeedRef = useRef(0); // Shared Starfield Ref

  const handleTitleScreenStart = () => {
    // 1. Mount the Menu
    setMenuMounted(true);
    // Reset starfield speed to ensure no jumps
    starfieldSpeedRef.current = 0;
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
      tl.to(introEl, { opacity: 0, duration: 2, ease: "power2.inOut" }, "<");

      // Pause Timeline and wait for User Interaction (Start Button)
      tl.addPause();

      // --- RESUME HERE AFTER CLICKING START ---

      // Phase 3: "Camera Move Down" Transition
      // We simulate the camera moving down rapidly by moving the current view (Title Screen) UP
      // and bringing the new view (Menu) in from the BOTTOM.

      // We use a call() to check for refs because menuRef.current might be null at build time
      // if it wasn't mounted yet. However, since we build the timeline once,
      // we need to dynamically add these tweens OR ensure menuRef is stable.

      // Since we changed MainMenu to be conditionally mounted, menuRef.current is initially null.
      // We cannot pre-build the timeline for menu animations.

      // SOLUTION: We add the transition logic dynamically to the master timeline
      // OR we just use a separate tween sequence here triggered by the play().
      // But we are inside the initial build.

      // Better approach for conditional mount:
      // The timeline PAUSES at line 178.
      // When we resume, we are strictly relying on what was built.
      // BUT if menuRef.current was null during build, those tweens are invalid.

      // So we must NOT put the Menu tweens in the initial timeline build if the menu isn't mounted.
      // We should append them or run them separately.

      // Let's truncate the master timeline here.
    },
    { scope: containerRef, dependencies: [started] },
  );

  // New Effect: Handle Transition Sequence when Menu Mounts
  useGSAP(
    () => {
      if (!menuMounted || !menuRef.current || !titleScreenWrapperRef.current)
        return;

      // Create a specific transition timeline
      const tl = gsap.timeline();

      // 1. Prepare Main Menu
      gsap.set(menuRef.current, { autoAlpha: 1 });
      gsap.set(introRef.current, { autoAlpha: 0, display: "none" });

      // 2. Animate Title Screen UP and OUT
      // tl.to(titleScreenWrapperRef.current, {
      //     y: "-100%",
      //     duration: 1.5,
      //     ease: "power3.inOut",
      // });

      // NEW SIMPLIFIED TRANSITION

      // 1. Fade Out Title Screen (Foreground)
      tl.to(titleScreenWrapperRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
      });

      // 2. Starfield Acceleration (Travel Phase)
      const speedProxy = { val: 0 };
      tl.to(speedProxy, {
        val: 80, // Much faster
        duration: 1.5, // Faster buildup
        ease: "power2.in", // Smooth buildup
        onUpdate: () => {
          starfieldSpeedRef.current = speedProxy.val;
        },
      });

      // 3. Starfield Deceleration (Arrival Phase)
      tl.to(speedProxy, {
        val: 0,
        duration: 1.8, // Faster braking
        ease: "power3.out",
        onUpdate: () => {
          starfieldSpeedRef.current = speedProxy.val;
        },
      });

      // 4. Main Menu Entry (Synchronized with Braking)
      const menuItemWrappers =
        menuRef.current.querySelectorAll(".menu-item-wrapper");
      const headerContent = menuRef.current.querySelectorAll("header > *");
      const allMenuContent = [
        ...Array.from(headerContent),
        ...Array.from(menuItemWrappers),
      ];

      tl.from(
        allMenuContent,
        {
          y: "20vh",
          opacity: 0,
          duration: 1.8, // Matches deceleration
          ease: "power3.out",
          stagger: 0.1,
        },
        "<", // Starts exactly when deceleration starts
      );

      // 5. Cleanup
      tl.call(() => setShowTitleScreen(false));
      tl.set(titleScreenWrapperRef.current, { display: "none" });
      tl.call(() => setMenuInteractive(true)); // Allow menu to control stars now

      // 4. Cleanup
      tl.call(() => setShowTitleScreen(false));
      tl.set(titleScreenWrapperRef.current, { display: "none" });
      tl.call(
        () => {
          setBgMusicSrc("/audio/background_loop.mp3");
          setAudioVolume(0.5);
        },
        undefined,
        "<",
      );
    },
    { scope: containerRef, dependencies: [menuMounted] },
  ); // Run when menuMounted becomes true

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

      <Starfield speedRef={starfieldSpeedRef} />

      <Intro ref={introRef} />

      {/* Title Screen Layer - Persistent Wrapper */}
      <div
        ref={titleScreenWrapperRef}
        className="fixed inset-0 z-55 pointer-events-auto"
        style={{ display: "none" }} // Hidden by default, controlled by GSAP
      >
        {showTitleScreen && <TitleScreen onStart={handleTitleScreenStart} />}
      </div>

      <MainMenu
        ref={menuRef}
        letters={letters}
        visible={introComplete}
        onLetterSelect={handleLetterSelect}
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

      <AudioControl
        src={
          activeLetter
            ? `/audio/${activeLetter.nickname.toLowerCase()}.mp3`
            : bgMusicSrc
        }
        targetVolume={audioVolume}
      />
    </main>
  );
}
