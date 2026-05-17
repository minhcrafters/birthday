"use client";

import AudioControl from "./AudioControl";
import MusicManager from "./MusicManager";
import { letters } from "../data/letters";
import Starfield, { STARFIELD_OPACITY } from "./Starfield";
import Gallery from "./Gallery";
import Credits from "./Credits";
import SurpriseReveal from "./SurpriseReveal";
import ExtraWorks from "./extra/ExtraWorks";
import { useSound } from "../contexts/SoundContext";
import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import Intro from "./Intro";
import TitleScreen from "./TitleScreen";
import LettersList from "./LettersList";
import LetterView from "./LetterView";
import { GalleryImage } from "../data/galleryData";

gsap.registerPlugin(useGSAP, TextPlugin);

gsap.ticker.lagSmoothing(0);

const SKIP_INTRO = false;

const INTRO_TEXTS = [
  "Hey, Shiori.",
  "Do you know what day it is today?",
  "That's right.",
  "Today's Valentine's Day.",
  "it is the day where an angel was summoned into this world...",
  "the day where a best friend to many people was born.",
  "So we made something for you.",
  "A small place filled with words we never say out loud...",
  "and memories you might recognise.",
  "Take your time.",
  "There's something waiting for you at the end.",
  "For now...",
];

interface ExperienceProps {
  galleryImages: GalleryImage[];
}

export default function Experience({ galleryImages }: ExperienceProps) {
  const { playSfx } = useSound();

  // App state
  const [started, setStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [bgmFadeDuration, setBgmFadeDuration] = useState(0.5);
  const [shouldPlayLoops, setShouldPlayLoops] = useState(false);
  const [introDuration, setIntroDuration] = useState(0);
  const [loopsStartTime, setLoopsStartTime] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const masterTimeline = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startOverlayRef = useRef<HTMLDivElement>(null);
  const titleScreenWrapperRef = useRef<HTMLDivElement>(null);
  const audioIntroCompleteRef = useRef(false);

  const [showTitleScreen, setShowTitleScreen] = useState(false);
  const [hasSeenTitleIntro, setHasSeenTitleIntro] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuInteractive, setMenuInteractive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showExtraWorks, setShowExtraWorks] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [readLetterIds, setReadLetterIds] = useState<string[]>([]);
  const starfieldSpeedRef = useRef(0);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);

  const isSurpriseUnlocked = letters
    .filter((l) => l.id !== "surprise")
    .every((l) => readLetterIds.includes(l.id));

  const [introDelay, setIntroDelay] = useState<number | null>(null);

  // Audio sync helpers
  const calculateTextDuration = () => {
    return (
      INTRO_TEXTS.reduce((acc, text) => {
        let duration = text.length * 0.08 + 2.7;

        if (text === "Today's Valentine's Day.") {
          duration = 7.14;
        }

        return acc + duration;
      }, 0) + 1.5
    );
  };

  useEffect(() => {
    if (introDuration > 0) {
      const textDur = calculateTextDuration();
      const delay = Math.max(0, textDur - introDuration);
      setIntroDelay(delay);
    }
  }, [introDuration]);

  const handleTitleScreenStart = () => {
    setMenuMounted(true);
    setHasSeenTitleIntro(true);
  };

  const handleIntroAudioEnd = React.useCallback(() => {
    console.log("Intro audio finished. Resuming timeline if paused.");
    audioIntroCompleteRef.current = true;
    if (masterTimeline.current && masterTimeline.current.paused()) {
      masterTimeline.current.play();
    }
  }, []);

  const handleLoopsStarted = React.useCallback(
    (startTime: number, context: AudioContext) => {
      setLoopsStartTime(startTime);
      setAudioContext(context);
    },
    [],
  );

  const handleDurationLoaded = React.useCallback((d: number) => {
    setIntroDuration(d);
  }, []);

  useGSAP(() => {
    if (menuMounted && masterTimeline.current) {
      masterTimeline.current.play();
    }
  }, [menuMounted]);

  // Derived
  const activeLetter = letters.find((l) => l.id === activeLetterId) || null;

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

  // Skip intro shortcut (Shift+J)
  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "J" || e.key === "j")) {
        if (!introComplete && masterTimeline.current) {
          setShowTitleScreen(true);
          setShouldPlayLoops(true);

          masterTimeline.current.progress(1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introComplete, started]);

  // Phase 1: Intro text sequence
  useGSAP(
    () => {
      if (!started) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIntroComplete(true);
          if (menuRef.current) {
            menuRef.current.style.pointerEvents = "auto";
          }
        },
      });

      masterTimeline.current = tl;

      const introEl = introRef.current!;
      const textEl = introEl.querySelector(".intro-text");

      gsap.set(introEl, {
        autoAlpha: 1,
        backgroundColor: "#000000",
        zIndex: 50,
      });
      gsap.set(textEl, { opacity: 1, text: "", filter: "blur(0px)", scale: 1 });

      if (menuRef.current) {
        gsap.set(menuRef.current, { autoAlpha: 0 });
      }

      const textTl = gsap.timeline();

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

      if (!SKIP_INTRO) {
        INTRO_TEXTS.forEach((text) => {
          if (text === "Today's Valentine's Day.") {
            textTl.to(textEl, {
              text: { value: text, delimiter: "" },
              duration: text.length * 0.08,
              ease: "none",
              onUpdate: function () {
                const currentText = this.targets()[0].textContent;
                const prevLen = this._prevLen || 0;
                if (currentText.length > prevLen) {
                  playSfx("blip");
                  this._prevLen = currentText.length;
                }
              },
              onStart: function () {
                this._prevLen = 0;
              },
            });

            textTl.to({}, { duration: 0.6 });

            const fullStr = "Today's Valentine's Day.";
            const targetStr = "Today's ";
            const backspaceObj = { len: fullStr.length };

            textTl.to(backspaceObj, {
              len: targetStr.length,
              duration: (fullStr.length - targetStr.length) * 0.05,
              ease: "none",
              onUpdate: () => {
                if (textEl) {
                  textEl.textContent = fullStr.substring(
                    0,
                    Math.ceil(backspaceObj.len),
                  );
                  playSfx("blip_alt");
                }
              },
            });

            const finalText = "Today's your birthday.";
            textTl.to(textEl, {
              text: { value: finalText, delimiter: "" },
              duration: "your birthday.".length * 0.08,
              ease: "none",
              onUpdate: function () {
                const currentText = this.targets()[0].textContent;
                const prevLen = this._prevLen || 0;
                if (currentText.length > prevLen) {
                  playSfx("blip");
                  this._prevLen = currentText.length;
                }
              },
              onStart: function () {
                this._prevLen = targetStr.length;
              },
            });

            textTl.to({}, { duration: 1.2 });

            textTl.to(textEl, {
              opacity: 0,
              duration: 1,
              ease: "power2.in",
            });

            textTl.set(textEl, { text: "", opacity: 1 });
            textTl.to({}, { duration: 0.5 });

            return;
          }

          textTl.to(textEl, {
            text: { value: text, delimiter: "" },
            duration: text.length * 0.08,
            ease: "none",
            onUpdate: function () {
              const currentText = this.targets()[0].textContent;
              const prevLen = this._prevLen || 0;
              if (currentText.length > prevLen) {
                playSfx("blip");
                this._prevLen = currentText.length;
              }
            },
            onStart: function () {
              this._prevLen = 0;
            },
          });

          textTl.to({}, { duration: 1.2 });

          textTl.to(textEl, {
            opacity: 0,
            duration: 1,
            ease: "power2.in",
          });

          textTl.set(textEl, { text: "", opacity: 1 });
          textTl.to({}, { duration: 0.5 });
        });
      }

      tl.add(textTl);

      // Pause if audio outlasts the text sequence
      tl.call(() => {
        if (!audioIntroCompleteRef.current) {
          console.log("Timeline pausing for audio completion...");
          tl.pause();
        } else {
          console.log("Audio already done, continuing timeline...");
        }
      });

      // Phase 2: Title screen entrance
      tl.set(textEl, { display: "none" });

      if (titleScreenWrapperRef.current) {
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 1 });
      }

      tl.call(() => setShowTitleScreen(true));
      tl.call(() => setShouldPlayLoops(true));

      tl.to(
        introEl,
        { opacity: 0, duration: 2, ease: "power2.inOut" },
        "+=0.5",
      );

      tl.addPause();
    },
    { scope: containerRef, dependencies: [started, introDuration] },
  );

  // Phase 3: Title <-> Gallery warp transitions
  useGSAP(
    () => {
      if (menuMounted) return;

      if (!titleScreenWrapperRef.current) return;

      const tl = gsap.timeline();

      if (showGallery) {
        tl.to(titleScreenWrapperRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
        });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(
          speedProxy,
          {
            val: 180,
            duration: 1.0,
            ease: "power3.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(speedProxy, {
          val: 0,
          duration: 1.5,
          ease: "power3.out",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        tl.call(() => setShowTitleScreen(false));
        tl.set(titleScreenWrapperRef.current, { display: "none" });
      } else if (hasSeenTitleIntro && !showGallery && !menuMounted) {
        tl.call(() => setShowTitleScreen(true));
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 0 });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(speedProxy, {
          val: -150,
          duration: 0.8,
          ease: "expo.in",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        tl.to(titleScreenWrapperRef.current, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.out",
        });

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
      }
    },
    { scope: containerRef, dependencies: [showGallery] },
  );

  // Phase 4: Title <-> Letters menu transitions
  useGSAP(
    () => {
      if (!menuRef.current || !titleScreenWrapperRef.current) return;

      const tl = gsap.timeline();

      if (menuMounted) {
        gsap.set(introRef.current, { autoAlpha: 0, display: "none" });

        tl.to(titleScreenWrapperRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
        });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(
          speedProxy,
          {
            val: 180,
            duration: 1.0,
            ease: "power3.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(speedProxy, {
          val: 0,
          duration: 1.5,
          ease: "power3.out",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        const menuItemWrappers =
          menuRef.current.querySelectorAll(".menu-item-wrapper");
        const headerContent = menuRef.current.querySelectorAll("header > *");
        const fadeMasks = menuRef.current.querySelectorAll(".fade-mask");

        const allMenuContent = [
          ...Array.from(headerContent),
          ...Array.from(menuItemWrappers),
        ];

        gsap.set(allMenuContent, { y: 0, opacity: 1 });
        gsap.set(fadeMasks, { opacity: 1 });

        tl.set(menuRef.current, { autoAlpha: 1 }, "<");

        tl.from(
          allMenuContent,
          {
            y: "20vh",
            opacity: 0,
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.1,
          },
          "<",
        );

        tl.from(
          fadeMasks,
          {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut",
          },
          "<",
        );

        tl.call(() => setShowTitleScreen(false));
        tl.set(titleScreenWrapperRef.current, { display: "none" });
        tl.call(() => setMenuInteractive(true));

        const backButton = menuRef.current.querySelector(".back-button");
        if (backButton) {
          tl.to(backButton, { opacity: 1, duration: 1, ease: "power2.out" });
        }

        tl.call(
          () => {
            setAudioVolume(0.5);
          },
          undefined,
          "<",
        );
      } else {
        if (gsap.getProperty(menuRef.current, "opacity") === 0) return;

        tl.call(() => setMenuInteractive(false));

        const backButton = menuRef.current.querySelector(".back-button");
        if (backButton) {
          tl.to(backButton, { opacity: 0, duration: 0.3, ease: "power2.out" });
        }

        tl.call(() => setShowTitleScreen(true));
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 0 });

        const menuItemWrappers =
          menuRef.current.querySelectorAll(".menu-item-wrapper");
        const headerContent = menuRef.current.querySelectorAll("header > *");
        const fadeMasks = menuRef.current.querySelectorAll(".fade-mask");
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

        tl.to(
          fadeMasks,
          {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
          },
          "<",
        );

        const speedProxy = { val: starfieldSpeedRef.current || 0 };
        tl.call(() => playSfx("warp"));

        tl.to(
          speedProxy,
          {
            val: -150,
            duration: 0.8,
            ease: "expo.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(titleScreenWrapperRef.current, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.out",
        });

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

        tl.set(menuRef.current, { autoAlpha: 0 });

        tl.call(() => setAudioVolume(0.5));
      }
    },
    { scope: containerRef, dependencies: [menuMounted] },
  );

  // Letter open / close handlers
  const handleLetterSelect = (id: string) => {
    if (id === "surprise") {
      if (!isSurpriseUnlocked) {
        return;
      }

      playSfx("open");

      if (transitionOverlayRef.current) {
        setBgmFadeDuration(3.0);
        setAudioVolume(0);

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
            setMenuInteractive(false);
            setShouldPlayLoops(false);

            gsap.delayedCall(0.1, () => {
              if (transitionOverlayRef.current)
                gsap.set(transitionOverlayRef.current, { autoAlpha: 0 });
            });
          },
        });
      }
      return;
    }

    playSfx("open");
    setActiveLetterId(id);
    setBgmFadeDuration(0.5);
    setAudioVolume(0.2);
  };

  const handleLetterDismiss = () => {
    if (activeLetterId && !readLetterIds.includes(activeLetterId)) {
      setReadLetterIds((prev) => [...prev, activeLetterId]);
    }

    playSfx("close");
    setActiveLetterId(null);
    setBgmFadeDuration(0.5);
    setAudioVolume(0.5);
  };

  return (
    <main
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-bg-deep text-text-bright selection:bg-text-bright selection:text-bg-deep"
    >
      <div
        ref={startOverlayRef}
        className={`fixed inset-0 z-100 flex items-center justify-center bg-bg-deep cursor-pointer ${
          started ? "pointer-events-none" : ""
        }`}
      >
        <div className="mt-12 text-xs uppercase tracking-[0.2em] text-text-muted animate-pulse">
          click or press enter to start -&gt;
        </div>
      </div>

      <Starfield
        speedRef={starfieldSpeedRef}
        enableFriction={menuInteractive}
        bgImage={
          menuMounted
            ? "/images/bg/hbp_thumbnail_3.png"
            : "/images/bg/hbp_thumbnail_1.png"
        }
        opacity={STARFIELD_OPACITY}
      />

      <Intro ref={introRef} />

      <MusicManager
        started={started}
        textDuration={calculateTextDuration()}
        playLoops={shouldPlayLoops}
        inTitleScreen={showTitleScreen}
        isMenuMounted={menuMounted}
        volume={audioVolume}
        fadeDuration={bgmFadeDuration}
        onIntroEnd={handleIntroAudioEnd}
        onDurationLoaded={handleDurationLoaded}
        onLoopsStarted={handleLoopsStarted}
      />

      <div
        ref={titleScreenWrapperRef}
        className="fixed inset-0 z-55 pointer-events-auto"
        style={{ display: "none" }}
      >
        {showTitleScreen && (
          <TitleScreen
            onStart={handleTitleScreenStart}
            onGalleryOpen={() => {
              setShowGallery(true);
              setHasSeenTitleIntro(true);
            }}
            onExtraWorksOpen={() => {
              setShowExtraWorks(true);
              setHasSeenTitleIntro(true);
            }}
            onCreditsOpen={() => setShowCredits(true)}
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
        onCloseComplete={() => {}}
      />

      {showGallery && (
        <Gallery images={galleryImages} onClose={() => setShowGallery(false)} />
      )}

      {showCredits && <Credits onClose={() => setShowCredits(false)} />}

      <ExtraWorks
        open={showExtraWorks}
        onClose={() => setShowExtraWorks(false)}
      />

      {activeLetter && (
        <AudioControl
          src={`/audio/${activeLetter.id}.mp3`}
          targetVolume={audioVolume}
        />
      )}

      <div
        ref={transitionOverlayRef}
        className="fixed inset-0 z-200 bg-white pointer-events-none opacity-0 hidden"
      />

      {showSurprise && (
        <SurpriseReveal
          letter={letters.find((l) => l.id === "surprise")!}
          onComplete={() => {
            setReadLetterIds((prev) =>
              prev.includes("surprise") ? prev : [...prev, "surprise"],
            );
            setShowSurprise(false);
            setMenuInteractive(true);
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
