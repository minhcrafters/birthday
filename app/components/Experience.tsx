"use client";

import AudioControl from "./AudioControl";
import MusicManager from "./MusicManager";
import { letters } from "../data/letters";
import Starfield from "./Starfield";
import GlobeGallery from "./GlobeGallery";
import SurpriseReveal from "./SurpriseReveal";
import { useSound } from "../contexts/SoundContext";
import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import Intro from "./Intro";
import TitleScreen from "./TitleScreen";
import LettersList from "./LettersList";
import LetterView from "./LetterView";

gsap.registerPlugin(useGSAP, TextPlugin);

const SKIP_INTRO = false;

const INTRO_TEXTS = [
  "Hey, Shiori.",
  "Do you know what day it is today?",
  "That's right.",
  "Today's Valentine's Day.",
  "But also,",
  "it is the day where an angel was summoned into this world...",
  "the day where a best friend to many people was born.",
  "So we made something for you.",
  "A small place filled with words we never say out loud...",
  "and memories you might recognise.",
  "Take your time.",
  "There’s something waiting for you at the end.",
  "For now...",
];

export default function Experience() {
  const { playSfx } = useSound();
  const [started, setStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0.5); // Default BGM volume 0.5
  const [shouldPlayLoops, setShouldPlayLoops] = useState(false); // Controls when loops start
  const [introDuration, setIntroDuration] = useState(0); // For syncing
  const [loopsStartTime, setLoopsStartTime] = useState(0); // Audio loop start time
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null); // Audio context

  const masterTimeline = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startOverlayRef = useRef<HTMLDivElement>(null);
  const titleScreenWrapperRef = useRef<HTMLDivElement>(null);
  const audioIntroCompleteRef = useRef(false);

  const [showTitleScreen, setShowTitleScreen] = useState(false);
  const [hasSeenTitleIntro, setHasSeenTitleIntro] = useState(false); // New State
  // const titleScreenRef = useRef<HTMLDivElement>(null);
  const [menuMounted, setMenuMounted] = useState(false); // New State to control mounting
  const [menuInteractive, setMenuInteractive] = useState(false); // Controls if Menu can influence stars
  const [showGallery, setShowGallery] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [readLetterIds, setReadLetterIds] = useState<string[]>([]); // Track read letters
  const starfieldSpeedRef = useRef(0); // Shared Starfield Ref
  const transitionOverlayRef = useRef<HTMLDivElement>(null);

  // Check if all regular letters have been read
  const isSurpriseUnlocked = letters
    .filter((l) => l.id !== "surprise")
    .every((l) => readLetterIds.includes(l.id));

  const [introDelay, setIntroDelay] = useState<number | null>(null);

  // Helper to calculate natural text duration
  const calculateTextDuration = () => {
      // Formula matches GSAP loop: (len * 0.08) + 1.2 + 1.0 + 0.5
      return INTRO_TEXTS.reduce((acc, text) => {
          return acc + (text.length * 0.08) + 2.7;
      }, 0) + 1.5; // +1.5 for initial overlay fade out
  };

  useEffect(() => {
     if (introDuration > 0) {
         const textDur = calculateTextDuration();
         // If text is longer than audio, we delay the audio start
         const delay = Math.max(0, textDur - introDuration);
         setIntroDelay(delay);
     }
  }, [introDuration]);

  const handleTitleScreenStart = () => {
    // 1. Mount the Menu
    setMenuMounted(true);
    setHasSeenTitleIntro(true); // Mark intro as seen when leaving
    // Don't reset speed here, let the animation interpolate from current speed
  };
  
  // Callback when Intro Audio finishes
  // Wrapped in useCallback to prevent unnecessary re-renders in MusicManager
  const handleIntroAudioEnd = React.useCallback(() => {
    console.log("Intro audio finished. Resuming timeline if paused.");
    audioIntroCompleteRef.current = true;
    if (masterTimeline.current && masterTimeline.current.paused()) {
        masterTimeline.current.play();
    }
  }, []);

  // Callback when loops start (for lyrics sync)
  const handleLoopsStarted = React.useCallback(
    (startTime: number, context: AudioContext) => {
      setLoopsStartTime(startTime);
      setAudioContext(context);
    },
    [],
  );

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

    const handleStart = () => {
      playSfx("click");
      setStarted(true);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        playSfx("click");
        setStarted(true);
      }
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
          // Manually trigger states that would be skipped by progress(1)
          setShowTitleScreen(true);
          setShouldPlayLoops(true);
          
          masterTimeline.current.progress(1); // Jump to end
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introComplete, started]);

  useGSAP(
    () => {
      // Don't wait for introDuration (allow default flow if 0/loading)
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

      // --- PHASE 1: Text Sequence (Synced to Audio) ---
      // We create a nested timeline for the text sequence so we can scale it
      const textTl = gsap.timeline();

      // Fade out Start Overlay
      if (startOverlayRef.current) {
        textTl.to(startOverlayRef.current, {
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
        // Add text steps to nested timeline
        INTRO_TEXTS.forEach((text) => {
          // Type In
          textTl.to(textEl, {
            text: { value: text, delimiter: "" },
            duration: text.length * 0.08, // Slow typing speed
            ease: "none",
            onUpdate: function () {
              // @ts-ignore - GSAP specific typing
              const currentText = this.targets()[0].textContent;
              // Simple heuristic: if text grew, play sound
              // We use a small randomized condition to not play on EVERY frame if multiple frames add one char,
              // or to skip some for less annoyance. But for typing effect, every char is usually okay.
              // To avoid spamming, we check if length changed.
              const prevLen = (this as any)._prevLen || 0;
              if (currentText.length > prevLen) {
                 // Play sound every 2 characters or so to keep it pleasant? 
                 // Or every character but low volume (handled in SoundContext).
                 // Let's try every character.
                 playSfx("blip");
                 (this as any)._prevLen = currentText.length;
              }
            },
            onStart: function() {
                (this as any)._prevLen = 0;
            }
          });

          // Pause
          textTl.to({}, { duration: 1.2 });

          // Fade Out (Cinematic)
          textTl.to(textEl, {
            opacity: 0,
            duration: 1,
            ease: "power2.in",
          });

          // Reset for next (Clear text, reset opacity)
          textTl.set(textEl, { text: "", opacity: 1 });
          // Slight pause before next
          textTl.to({}, { duration: 0.5 });
        });
      }
        
      // Add nested timeline to master
      tl.add(textTl);

      // --- WAIT FOR AUDIO GATE ---
      // If audio is LONGER than text, we pause here until audio finishes.
      tl.call(() => {
           if (!audioIntroCompleteRef.current) {
               console.log("Timeline pausing for audio completion...");
               tl.pause();
           } else {
               console.log("Audio already done, continuing timeline...");
           }
      });

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
      
      // TRIGGER LOOPS HERE: Title screen is now active/visible
      tl.call(() => setShouldPlayLoops(true));

      // Fade out Intro Black BG to reveal Stars (concurrent with Title Screen entrance)
      // Delayed by 2.5s to let "Happy Birthday" text appear on black first
      // NOTE: This now runs ONLY after audio gate is passed (resumed)
      tl.to(
        introEl,
        { opacity: 0, duration: 2, ease: "power2.inOut" },
        "+=0.5",
      );

      // Pause Timeline and wait for User Interaction (Start Button)
      tl.addPause();
    },
    { scope: containerRef, dependencies: [started, introDuration] }
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

        // 7. Music (Handled by MusicManager mostly now)
        // But we might want to ensure volume is up?
        tl.call(
          () => {
             // We don't set bgMusicSrc anymore for global loop
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
    // Handle Surprise Letter
    if (id === "surprise") {
      if (!isSurpriseUnlocked) {
        // Optional: Play a "locked" sound effect here
        return;
      }

      playSfx("open");

      // White Fade Out Sequence
      if (transitionOverlayRef.current) {
        gsap.set(transitionOverlayRef.current, {
          display: "block",
          opacity: 0,
        });
        gsap.to(transitionOverlayRef.current, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.inOut",
          onComplete: () => {
            setShowSurprise(true);
            setMenuInteractive(false); // Disable menu interaction

            // Hide the overlay shortly after SurpriseReveal mounts (z-300) to prevent it being visible when SurpriseReveal fades out later
            gsap.delayedCall(0.1, () => {
              if (transitionOverlayRef.current)
                gsap.set(transitionOverlayRef.current, { autoAlpha: 0 });
            });
          },
        });
      }
      return;
    }

    // Handle Normal Letter
    if (!readLetterIds.includes(id)) {
      setReadLetterIds((prev) => [...prev, id]);
    }

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
      
      {/* Background Music Manager */}
      <MusicManager 
         started={started}
         textDuration={calculateTextDuration()} // Pass duration directly
         playLoops={shouldPlayLoops}
         inTitleScreen={showTitleScreen} // Vocal stems active only when TitleScreen is visible (and not hidden by menu)
         // Note: showTitleScreen is true during Menu->Title transition, so vocals fade in.
         // When Menu is mounted, showTitleScreen becomes false at end of transition.
         volume={audioVolume}
         onIntroEnd={handleIntroAudioEnd}
         onDurationLoaded={(d) => setIntroDuration(d)}
         onLoopsStarted={handleLoopsStarted}
      />

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
            loopsStartTime={loopsStartTime}
            audioContext={audioContext}
          />
        )}
      </div>

      <LettersList
        ref={menuRef}
        letters={letters}
        visible={introComplete}
        readLetterIds={readLetterIds}
        isSurpriseUnlocked={isSurpriseUnlocked}
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

      {/* AudioControl ONLY for Letter Voiceovers (if any) or extra SFX, NOT BGM */}
      {activeLetter && (
          <AudioControl
            src={`/audio/${activeLetter.id}.mp3`}
            targetVolume={audioVolume}
          />
      )}

      <div
        ref={transitionOverlayRef}
        className="fixed inset-0 z-[200] bg-white pointer-events-none opacity-0 hidden"
      />

      {showSurprise && (
        <SurpriseReveal
          letter={letters.find((l) => l.id === "surprise")!}
          onComplete={() => {
            setShowSurprise(false);
            setMenuInteractive(true); // Re-enable menu interaction
            gsap.set(transitionOverlayRef.current, {
              display: "none",
              opacity: 0,
            });
          }}
        />
      )}
    </main>
  );
}
