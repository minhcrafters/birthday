"use client";

import AudioControl from "./AudioControl";
import MusicManager from "./MusicManager";
import { letters, LetterData, SlideshowLetterContent } from "../data/letters";
import { isLetterLocked, getLetterAudioSrc } from "../lib/letters";
import { siteConfig } from "../config/site";
import Starfield, { STARFIELD_OPACITY } from "./Starfield";
import Gallery from "./Gallery";
import Credits from "./Credits";
import SlideshowLetter from "./letters/SlideshowLetter";
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

// Shared timing for the "warp" scene transitions (title <-> gallery/letters).
// Kept short and identical on both so switching screens feels consistent
// instead of some transitions dragging out longer than others.
const WARP_FADE_DURATION = 0.5;
const WARP_SPEED_UP_DURATION = 0.5;
const WARP_SPEED_DOWN_DURATION = 0.65;
const WARP_SPEED_PEAK = 160;
const WARP_SPEED_REVERSE_PEAK = -140;
const SCENE_CONTENT_REVEAL_DURATION = 0.7;
const SCENE_CONTENT_EXIT_DURATION = 0.5;

const INTRO_TEXTS = siteConfig.introTexts;
const introTwist = siteConfig.introTwist;

// Segment timings for the type -> backspace -> retype gag; must match the
// tween durations built in the Phase 1 useGSAP effect below.
const TWIST_TYPE_CPS = 0.08;
const TWIST_PAUSE_AFTER_TYPE = 0.1;
const TWIST_BACKSPACE_CPS = 0.05;
const TWIST_PAUSE_AFTER_RETYPE = 1.2;
const TWIST_FADE_OUT = 1;
const TWIST_PAUSE_AFTER_FADE = 0.5;

const calculateIntroTwistDuration = (twist: NonNullable<typeof introTwist>) => {
  const { revealText, keepPrefix, finalText } = twist;
  return (
    revealText.length * TWIST_TYPE_CPS +
    TWIST_PAUSE_AFTER_TYPE +
    (revealText.length - keepPrefix.length) * TWIST_BACKSPACE_CPS +
    Math.max(0, finalText.length - keepPrefix.length) * TWIST_TYPE_CPS +
    TWIST_PAUSE_AFTER_RETYPE +
    TWIST_FADE_OUT +
    TWIST_PAUSE_AFTER_FADE
  );
};

const isSlideshowLetter = (
  letter: LetterData,
): letter is LetterData & { content: SlideshowLetterContent } =>
  letter.content.layout === "slideshow";

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
  const [loopsStartTime, setLoopsStartTime] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const masterTimeline = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startOverlayRef = useRef<HTMLDivElement>(null);
  const titleScreenWrapperRef = useRef<HTMLDivElement>(null);
  const audioIntroCompleteRef = useRef(false);
  // Mirrors the audio-duration prop without being a useGSAP dependency —
  // MusicManager can resolve this after `started` flips true (slow network,
  // uncached assets), and putting the raw state in Phase 1's dependency
  // array would revert + rebuild the already-running intro timeline,
  // snapping the typed text back to the first line mid-animation.
  const introDurationRef = useRef(0);

  const [showTitleScreen, setShowTitleScreen] = useState(false);
  const [hasSeenTitleIntro, setHasSeenTitleIntro] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuInteractive, setMenuInteractive] = useState(false);
  const [galleryInteractive, setGalleryInteractive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showExtraWorks, setShowExtraWorks] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [readLetterIds, setReadLetterIds] = useState<string[]>([]);
  const starfieldSpeedRef = useRef(0);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);

  const slideshowLetter = letters.find(isSlideshowLetter) ?? null;
  const lockedLetterIds = letters
    .filter((l) => isLetterLocked(l, letters, readLetterIds))
    .map((l) => l.id);

  // Audio sync helpers
  const calculateTextDuration = () => {
    return (
      INTRO_TEXTS.reduce((acc, text) => {
        let duration = text.length * 0.08 + 2.7;

        if (introTwist && text === introTwist.revealText) {
          duration =
            introTwist.revealDuration ??
            calculateIntroTwistDuration(introTwist);
        }

        return acc + duration;
      }, 0) +
      1.5 -
      0.2
    );
  };

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
    introDurationRef.current = d;
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
  }, [started, playSfx]);

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
        zIndex: 60,
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

      // Matches the audio start offset MusicManager schedules intro_acc/intro_vox at,
      // so the last line can vanish on the beat instead of fading out.
      const introAudioStartTime =
        Math.max(0, calculateTextDuration() - introDurationRef.current) + 0.1;

      if (!SKIP_INTRO) {
        INTRO_TEXTS.forEach((text, index) => {
          const isLast = index === INTRO_TEXTS.length - 1;

          if (introTwist && text === introTwist.revealText) {
            const { revealText, keepPrefix, finalText } = introTwist;

            textTl.to(textEl, {
              text: { value: revealText, delimiter: "" },
              duration: revealText.length * TWIST_TYPE_CPS,
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

            textTl.to({}, { duration: TWIST_PAUSE_AFTER_TYPE });

            const backspaceObj = { len: revealText.length };

            textTl.to(backspaceObj, {
              len: keepPrefix.length,
              duration:
                (revealText.length - keepPrefix.length) * TWIST_BACKSPACE_CPS,
              ease: "none",
              onUpdate: () => {
                if (textEl) {
                  textEl.textContent = revealText.substring(
                    0,
                    Math.ceil(backspaceObj.len),
                  );
                  playSfx("blip_alt");
                }
              },
            });

            textTl.to(textEl, {
              text: { value: finalText, delimiter: "" },
              duration:
                Math.max(0, finalText.length - keepPrefix.length) *
                TWIST_TYPE_CPS,
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
                this._prevLen = keepPrefix.length;
              },
            });

            textTl.to({}, { duration: TWIST_PAUSE_AFTER_RETYPE });

            if (isLast) {
              const holdDuration = Math.max(
                0.3,
                introAudioStartTime - textTl.duration(),
              );
              textTl.to({}, { duration: holdDuration });
              textTl.set(textEl, { text: "", opacity: 0 });
            } else {
              textTl.to(textEl, {
                opacity: 0,
                duration: TWIST_FADE_OUT,
                ease: "power2.in",
              });

              textTl.set(textEl, { text: "", opacity: 1 });
              textTl.to({}, { duration: TWIST_PAUSE_AFTER_FADE });
            }

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

          if (isLast) {
            const holdDuration = Math.max(
              0.3,
              introAudioStartTime - textTl.duration(),
            );
            textTl.to({}, { duration: holdDuration });
            textTl.set(textEl, { text: "", opacity: 0 });
          } else {
            textTl.to({}, { duration: 1.2 });

            textTl.to(textEl, {
              opacity: 0,
              duration: 1,
              ease: "power2.in",
            });

            textTl.set(textEl, { text: "", opacity: 1 });
            textTl.to({}, { duration: 0.5 });
          }
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
        { opacity: 0, duration: 1.0, ease: "power2.inOut" },
        "+=0.3",
      );

      tl.addPause();
    },
    { scope: containerRef, dependencies: [started] },
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
          duration: WARP_FADE_DURATION,
          ease: "power2.inOut",
        });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };

        tl.to(
          speedProxy,
          {
            val: WARP_SPEED_PEAK,
            duration: WARP_SPEED_UP_DURATION,
            ease: "power3.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(speedProxy, {
          val: 0,
          duration: WARP_SPEED_DOWN_DURATION,
          ease: "power3.out",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        tl.call(() => setShowTitleScreen(false));
        tl.set(titleScreenWrapperRef.current, { display: "none" });
        tl.call(() => setGalleryInteractive(true));
      } else if (hasSeenTitleIntro && !showGallery && !menuMounted) {
        setGalleryInteractive(false);

        tl.call(() => setShowTitleScreen(true));
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 0 });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };

        tl.to(speedProxy, {
          val: WARP_SPEED_REVERSE_PEAK,
          duration: WARP_SPEED_UP_DURATION,
          ease: "expo.in",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        tl.to(titleScreenWrapperRef.current, {
          opacity: 1,
          duration: WARP_FADE_DURATION,
          ease: "power2.out",
        });

        tl.to(
          speedProxy,
          {
            val: 0,
            duration: WARP_SPEED_DOWN_DURATION,
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
          duration: WARP_FADE_DURATION,
          ease: "power2.inOut",
        });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };

        tl.to(
          speedProxy,
          {
            val: WARP_SPEED_PEAK,
            duration: WARP_SPEED_UP_DURATION,
            ease: "power3.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(speedProxy, {
          val: 0,
          duration: WARP_SPEED_DOWN_DURATION,
          ease: "power3.out",
          onUpdate: () => {
            starfieldSpeedRef.current = speedProxy.val;
          },
        });

        const menuItemWrappers =
          menuRef.current.querySelectorAll(".menu-item-wrapper");
        const headerContent = menuRef.current.querySelectorAll("header > *");

        const allMenuContent = [
          ...Array.from(headerContent),
          ...Array.from(menuItemWrappers),
        ];

        gsap.set(allMenuContent, { y: 0, opacity: 1 });

        tl.set(menuRef.current, { autoAlpha: 1 }, 0);

        tl.from(
          allMenuContent,
          {
            y: "20vh",
            opacity: 0,
            duration: SCENE_CONTENT_REVEAL_DURATION,
            ease: "power3.out",
            stagger: 0.06,
          },
          0,
        );

        tl.call(() => setShowTitleScreen(false));
        tl.set(titleScreenWrapperRef.current, { display: "none" });
        tl.call(() => setMenuInteractive(true));

        const backButton = menuRef.current.querySelector(".back-button");
        if (backButton) {
          tl.to(backButton, {
            opacity: 1,
            duration: SCENE_CONTENT_EXIT_DURATION,
            ease: "power2.out",
          });
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
          tl.to(backButton, {
            opacity: 0,
            duration: SCENE_CONTENT_EXIT_DURATION,
            ease: "power2.out",
          });
        }

        tl.call(() => setShowTitleScreen(true));
        tl.set(titleScreenWrapperRef.current, { display: "block", opacity: 0 });

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
          duration: SCENE_CONTENT_EXIT_DURATION,
          ease: "power2.in",
          stagger: { amount: 0.15, from: "end" },
        });

        const speedProxy = { val: starfieldSpeedRef.current || 0 };

        tl.to(
          speedProxy,
          {
            val: WARP_SPEED_REVERSE_PEAK,
            duration: WARP_SPEED_UP_DURATION,
            ease: "expo.in",
            onUpdate: () => {
              starfieldSpeedRef.current = speedProxy.val;
            },
          },
          "<",
        );

        tl.to(titleScreenWrapperRef.current, {
          opacity: 1,
          duration: WARP_FADE_DURATION,
          ease: "power2.out",
        });

        tl.to(
          speedProxy,
          {
            val: 0,
            duration: WARP_SPEED_DOWN_DURATION,
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
    const letter = letters.find((l) => l.id === id);
    if (!letter) return;

    if (isLetterLocked(letter, letters, readLetterIds)) {
      return;
    }

    if (isSlideshowLetter(letter)) {
      if (transitionOverlayRef.current) {
        setBgmFadeDuration(3.0);
        setAudioVolume(0);

        gsap.set(transitionOverlayRef.current, {
          display: "block",
          opacity: 0,
        });
        gsap.to(transitionOverlayRef.current, {
          opacity: 1,
          duration: 0.9,
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

    setActiveLetterId(id);
    setBgmFadeDuration(0.5);
    setAudioVolume(0.2);
  };

  const handleLetterDismiss = () => {
    if (activeLetterId && !readLetterIds.includes(activeLetterId)) {
      setReadLetterIds((prev) => [...prev, activeLetterId]);
    }

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
        className={`fixed inset-0 z-90 flex items-center justify-center bg-bg-deep cursor-pointer ${
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

      {/* Single persistent gingham layer behind the title/gallery/letters
          screens, so its CSS drift animation never resets or falls out of
          phase when those screens crossfade against each other. */}
      <div className="gingham-background fixed inset-0 z-5 pointer-events-none" />

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
        className="fixed inset-0 z-20 pointer-events-auto"
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
        readLetterIds={readLetterIds}
        lockedLetterIds={lockedLetterIds}
        onLetterSelect={handleLetterSelect}
        onBack={() => {
          setMenuMounted(false);
          setShowTitleScreen(true);
        }}
        starfieldSpeedRef={starfieldSpeedRef}
        controlsStarfield={menuInteractive}
      />

      <LetterView
        activeLetterId={activeLetterId}
        onDismiss={handleLetterDismiss}
        onCloseComplete={() => {}}
      />

      {showGallery && (
        <Gallery
          images={galleryImages}
          onClose={() => setShowGallery(false)}
          starfieldSpeedRef={starfieldSpeedRef}
          controlsStarfield={galleryInteractive}
        />
      )}

      {showCredits && <Credits onClose={() => setShowCredits(false)} />}

      <ExtraWorks
        open={showExtraWorks}
        onClose={() => setShowExtraWorks(false)}
      />

      {activeLetter && (
        <AudioControl
          src={getLetterAudioSrc(activeLetter)}
          targetVolume={audioVolume}
        />
      )}

      <div
        ref={transitionOverlayRef}
        className="fixed inset-0 z-95 bg-white pointer-events-none opacity-0 hidden"
      />

      {showSurprise && slideshowLetter && (
        <SlideshowLetter
          letter={slideshowLetter}
          onComplete={() => {
            setReadLetterIds((prev) =>
              prev.includes(slideshowLetter.id)
                ? prev
                : [...prev, slideshowLetter.id],
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
