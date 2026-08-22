import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface MusicManagerProps {
  started: boolean;
  textDuration?: number;
  playLoops: boolean;
  inTitleScreen: boolean;
  isMenuMounted?: boolean;
  volume: number;
  fadeDuration?: number;
  onIntroEnd: () => void;
  onDurationLoaded?: (duration: number) => void;
  onLoopsStarted?: (loopsStartTime: number, audioContext: AudioContext) => void;
}

export default function MusicManager({
  started,
  textDuration = 0,
  playLoops,
  inTitleScreen,
  isMenuMounted = false,
  volume,
  fadeDuration = 0.5,
  onIntroEnd,
  onDurationLoaded,
  onLoopsStarted,
}: MusicManagerProps) {
  const contextRef = useRef<AudioContext | null>(null);

  const gainIntroAccRef = useRef<GainNode | null>(null);
  const gainIntroVoxRef = useRef<GainNode | null>(null);
  const gainLoopAccRef = useRef<GainNode | null>(null);
  const gainLoopVoxRef = useRef<GainNode | null>(null);

  const sourceIntroAccRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceIntroVoxRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceLoopAccRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceLoopVoxRef = useRef<AudioBufferSourceNode | null>(null);

  const buffersRef = useRef<{
    introAcc: AudioBuffer | null;
    introVox: AudioBuffer | null;
    loopAcc: AudioBuffer | null;
    loopVox: AudioBuffer | null;
  }>({
    introAcc: null,
    introVox: null,
    loopAcc: null,
    loopVox: null,
  });

  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const hasStartedRef = useRef(false);
  const loopsScheduledRef = useRef(false);
  const scheduledLoopsStartTimeRef = useRef<number>(0);
  const introTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [introDuration, setIntroDuration] = useState(0);
  const hasIntroTransitionHappenedRef = useRef<boolean>(false);

  // Init: create AudioContext, load buffers
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext;
        const ctx = new AudioContextClass();
        contextRef.current = ctx;

        const unlock = () => {
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          if (ctx.state === "running") {
            window.removeEventListener("click", unlock);
            window.removeEventListener("touchstart", unlock);
            window.removeEventListener("keydown", unlock);
          }
        };

        window.addEventListener("click", unlock);
        window.addEventListener("touchstart", unlock);
        window.addEventListener("keydown", unlock);

        const gIntroAcc = ctx.createGain();
        const gIntroVox = ctx.createGain();
        const gLoopAcc = ctx.createGain();
        const gLoopVox = ctx.createGain();

        gIntroAcc.gain.value = 0;
        gIntroVox.gain.value = 0;
        gLoopAcc.gain.value = 0;
        gLoopVox.gain.value = 0;

        gIntroAcc.connect(ctx.destination);
        gIntroVox.connect(ctx.destination);
        gLoopAcc.connect(ctx.destination);
        gLoopVox.connect(ctx.destination);

        gainIntroAccRef.current = gIntroAcc;
        gainIntroVoxRef.current = gIntroVox;
        gainLoopAccRef.current = gLoopAcc;
        gainLoopVoxRef.current = gLoopVox;

        const loadBuffer = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(
              `Failed to fetch audio "${url}": ${res.status} ${res.statusText}`,
            );
          }
          const arrayBuffer = await res.arrayBuffer();
          return await ctx.decodeAudioData(arrayBuffer);
        };

        const [introAccBuf, introVoxBuf, loopAccBuf, loopVoxBuf] =
          await Promise.all([
            loadBuffer("/audio/new/intro_acc.wav"),
            loadBuffer("/audio/new/intro_vox.wav"),
            loadBuffer("/audio/new/loop_acc.wav"),
            loadBuffer("/audio/new/loop_vox.wav"),
          ]);

        buffersRef.current.introAcc = introAccBuf;
        buffersRef.current.introVox = introVoxBuf;
        buffersRef.current.loopAcc = loopAccBuf;
        buffersRef.current.loopVox = loopVoxBuf;

        setIntroDuration(introAccBuf.duration);
        if (onDurationLoaded) onDurationLoaded(introAccBuf.duration);

        setIsAudioLoaded(true);
      } catch (e) {
        console.error("Audio init failed", e);
      }
    };

    initAudio();

    return () => {
      contextRef.current?.close();
    };
  }, []);

  // Schedule intro + loops together
  useEffect(() => {
    if (
      started &&
      !hasStartedRef.current &&
      isAudioLoaded &&
      contextRef.current
    ) {
      hasStartedRef.current = true;
      loopsScheduledRef.current = true;

      const ctx = contextRef.current;

      if (ctx.state === "suspended") {
        ctx.resume().catch(console.error);
      }

      const { introAcc, introVox, loopAcc, loopVox } = buffersRef.current;
      if (!introAcc || !introVox || !loopAcc || !loopVox) return;

      const delay = Math.max(0, textDuration - introAcc.duration);
      const now = ctx.currentTime;
      const introStartTime = now + delay + 0.1;
      const loopsStartTime = introStartTime + introAcc.duration;

      scheduledLoopsStartTimeRef.current = loopsStartTime;

      console.log(
        `Scheduling Audio: Intro at ${introStartTime}, Loops at ${loopsStartTime} (Delay: ${delay})`,
      );

      const srcIntroAcc = ctx.createBufferSource();
      srcIntroAcc.buffer = introAcc;
      srcIntroAcc.connect(gainIntroAccRef.current!);
      srcIntroAcc.start(introStartTime);
      sourceIntroAccRef.current = srcIntroAcc;

      srcIntroAcc.onended = () => {
        onIntroEnd();
      };

      const srcIntroVox = ctx.createBufferSource();
      srcIntroVox.buffer = introVox;
      srcIntroVox.connect(gainIntroVoxRef.current!);
      srcIntroVox.start(introStartTime);
      sourceIntroVoxRef.current = srcIntroVox;

      const gIntroAcc = gainIntroAccRef.current!;
      const gIntroVox = gainIntroVoxRef.current!;

      [gIntroAcc, gIntroVox].forEach((g) => {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0, now);
        g.gain.setValueAtTime(volume, introStartTime);
      });

      const srcLoopAcc = ctx.createBufferSource();
      srcLoopAcc.buffer = loopAcc;
      srcLoopAcc.loop = true;
      srcLoopAcc.connect(gainLoopAccRef.current!);
      srcLoopAcc.start(loopsStartTime);
      sourceLoopAccRef.current = srcLoopAcc;

      const srcLoopVox = ctx.createBufferSource();
      srcLoopVox.buffer = loopVox;
      srcLoopVox.loop = true;
      srcLoopVox.connect(gainLoopVoxRef.current!);
      srcLoopVox.start(loopsStartTime);
      sourceLoopVoxRef.current = srcLoopVox;

      if (onLoopsStarted) {
        onLoopsStarted(loopsStartTime, ctx);
      }
    }
  }, [
    started,
    isAudioLoaded,
    textDuration,
    onIntroEnd,
    onDurationLoaded,
    onLoopsStarted,
  ]);

  // Skip intro -> jump to loops
  useEffect(() => {
    if (playLoops && hasStartedRef.current && contextRef.current) {
      const ctx = contextRef.current;
      const now = ctx.currentTime;

      if (scheduledLoopsStartTimeRef.current > now + 0.5) {
        console.log("Skipping Intro Audio - Jumping to Loops");

        if (sourceIntroAccRef.current) {
          try {
            sourceIntroAccRef.current.stop();
          } catch (e) {}
        }
        if (sourceIntroVoxRef.current) {
          try {
            sourceIntroVoxRef.current.stop();
          } catch (e) {}
        }

        if (sourceLoopAccRef.current) {
          try {
            sourceLoopAccRef.current.stop();
          } catch (e) {}
        }
        if (sourceLoopVoxRef.current) {
          try {
            sourceLoopVoxRef.current.stop();
          } catch (e) {}
        }

        if (introTimeoutRef.current) {
          clearTimeout(introTimeoutRef.current);
        }

        const { loopAcc, loopVox } = buffersRef.current;
        if (loopAcc && loopVox) {
          const srcLoopAcc = ctx.createBufferSource();
          srcLoopAcc.buffer = loopAcc;
          srcLoopAcc.loop = true;
          srcLoopAcc.connect(gainLoopAccRef.current!);
          srcLoopAcc.start(now);
          sourceLoopAccRef.current = srcLoopAcc;

          const srcLoopVox = ctx.createBufferSource();
          srcLoopVox.buffer = loopVox;
          srcLoopVox.loop = true;
          srcLoopVox.connect(gainLoopVoxRef.current!);
          srcLoopVox.start(now);
          sourceLoopVoxRef.current = srcLoopVox;

          gainLoopAccRef.current!.gain.cancelScheduledValues(now);
          gainLoopAccRef.current!.gain.setValueAtTime(volume, now);

          gainLoopVoxRef.current!.gain.cancelScheduledValues(now);
          gainLoopVoxRef.current!.gain.setValueAtTime(0, now);

          if (onLoopsStarted) {
            onLoopsStarted(now, ctx);
          }
        }

        onIntroEnd();
      }
    }
  }, [playLoops, volume, onIntroEnd, onLoopsStarted]);

  // Volume & vocal ducking
  useEffect(() => {
    if (gainIntroAccRef.current) {
      gsap.to(gainIntroAccRef.current.gain, {
        value: volume,
        duration: fadeDuration,
        overwrite: "auto",
      });
    }

    if (gainIntroVoxRef.current) {
      gsap.to(gainIntroVoxRef.current.gain, {
        value: volume,
        duration: fadeDuration,
        overwrite: "auto",
      });
    }

    if (gainLoopAccRef.current) {
      gsap.to(gainLoopAccRef.current.gain, {
        value: volume,
        duration: fadeDuration,
        overwrite: "auto",
      });
    }

    if (gainLoopVoxRef.current) {
      const shouldPlayVocals = inTitleScreen && !isMenuMounted;
      const targetVocalVol = shouldPlayVocals ? volume : 0;

      let duration = 2.5;

      if (inTitleScreen && !hasIntroTransitionHappenedRef.current) {
        duration = 0;
        hasIntroTransitionHappenedRef.current = true;
      }

      gsap.to(gainLoopVoxRef.current.gain, {
        value: targetVocalVol,
        duration: duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
  }, [volume, inTitleScreen, isMenuMounted, fadeDuration]);

  useEffect(() => {
    const onVideoPlay = () => {
      if (!contextRef.current) return;
      if (gainIntroAccRef.current) {
        gsap.to(gainIntroAccRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
      if (gainIntroVoxRef.current) {
        gsap.to(gainIntroVoxRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
      if (gainLoopAccRef.current) {
        gsap.to(gainLoopAccRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
      if (gainLoopVoxRef.current) {
        gsap.to(gainLoopVoxRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
    };

    const onVideoPause = () => {
      if (!contextRef.current) return;
      if (gainIntroAccRef.current) {
        gsap.to(gainIntroAccRef.current.gain, {
          value: volume,
          duration: 0.5,
          overwrite: "auto",
        });
      }
      if (gainIntroVoxRef.current) {
        gsap.to(gainIntroVoxRef.current.gain, {
          value: volume,
          duration: 0.5,
          overwrite: "auto",
        });
      }
      if (gainLoopAccRef.current) {
        gsap.to(gainLoopAccRef.current.gain, {
          value: volume,
          duration: 0.5,
          overwrite: "auto",
        });
      }
      if (gainLoopVoxRef.current) {
        const shouldPlayVocals = inTitleScreen && !isMenuMounted;
        const targetVocalVol = shouldPlayVocals ? volume : 0;
        gsap.to(gainLoopVoxRef.current.gain, {
          value: targetVocalVol,
          duration: 0.5,
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("letter-video-play", onVideoPlay as EventListener);
    window.addEventListener(
      "letter-video-pause",
      onVideoPause as EventListener,
    );

    return () => {
      window.removeEventListener(
        "letter-video-play",
        onVideoPlay as EventListener,
      );
      window.removeEventListener(
        "letter-video-pause",
        onVideoPause as EventListener,
      );
    };
  }, [volume, inTitleScreen, isMenuMounted]);

  return null;
}
