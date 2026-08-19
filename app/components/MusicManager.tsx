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

  const gainIntroRef = useRef<GainNode | null>(null);
  const gainAccRef = useRef<GainNode | null>(null);
  const gainVocalsRef = useRef<GainNode | null>(null);

  const sourceIntroRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceAccRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceVocalsRef = useRef<AudioBufferSourceNode | null>(null);

  const buffersRef = useRef<{
    intro: AudioBuffer | null;
    acc: AudioBuffer | null;
    vocals: AudioBuffer | null;
  }>({
    intro: null,
    acc: null,
    vocals: null,
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

        const gIntro = ctx.createGain();
        const gAcc = ctx.createGain();
        const gVocals = ctx.createGain();

        gIntro.gain.value = 0;
        gAcc.gain.value = 0;
        gVocals.gain.value = 0;

        gIntro.connect(ctx.destination);
        gAcc.connect(ctx.destination);
        gVocals.connect(ctx.destination);

        gainIntroRef.current = gIntro;
        gainAccRef.current = gAcc;
        gainVocalsRef.current = gVocals;

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

        const [introBuf, accBuf, vocBuf] = await Promise.all([
          loadBuffer("/audio/intro.wav"),
          loadBuffer("/audio/loop_acc.wav"),
          loadBuffer("/audio/loop_vocals.wav"),
        ]);

        buffersRef.current.intro = introBuf;
        buffersRef.current.acc = accBuf;
        buffersRef.current.vocals = vocBuf;

        setIntroDuration(introBuf.duration);
        if (onDurationLoaded) onDurationLoaded(introBuf.duration);

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

      const { intro, acc, vocals } = buffersRef.current;
      if (!intro || !acc || !vocals) return;

      const delay = Math.max(0, textDuration - intro.duration);
      const now = ctx.currentTime;
      const introStartTime = now + delay + 0.1;
      const loopsStartTime = introStartTime + intro.duration;

      scheduledLoopsStartTimeRef.current = loopsStartTime;

      console.log(
        `Scheduling Audio: Intro at ${introStartTime}, Loops at ${loopsStartTime} (Delay: ${delay})`,
      );

      const srcIntro = ctx.createBufferSource();
      srcIntro.buffer = intro;
      srcIntro.connect(gainIntroRef.current!);
      srcIntro.start(introStartTime);
      sourceIntroRef.current = srcIntro;

      srcIntro.onended = () => {
        onIntroEnd();
      };

      const startDelay = introStartTime - now;
      const gIntro = gainIntroRef.current!;

      gIntro.gain.cancelScheduledValues(now);
      gIntro.gain.setValueAtTime(0, now);

      gsap.to(gIntro.gain, {
        value: volume,
        duration: intro.duration,
        ease: "power2.in",
        delay: startDelay,
        overwrite: true,
      });

      const srcAcc = ctx.createBufferSource();
      srcAcc.buffer = acc;
      srcAcc.loop = true;
      srcAcc.connect(gainAccRef.current!);
      srcAcc.start(loopsStartTime);
      sourceAccRef.current = srcAcc;

      const srcVocals = ctx.createBufferSource();
      srcVocals.buffer = vocals;
      srcVocals.loop = true;
      srcVocals.connect(gainVocalsRef.current!);
      srcVocals.start(loopsStartTime);
      sourceVocalsRef.current = srcVocals;

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

        if (sourceIntroRef.current) {
          try {
            sourceIntroRef.current.stop();
          } catch (e) {}
        }

        if (sourceAccRef.current) {
          try {
            sourceAccRef.current.stop();
          } catch (e) {}
        }
        if (sourceVocalsRef.current) {
          try {
            sourceVocalsRef.current.stop();
          } catch (e) {}
        }

        if (introTimeoutRef.current) {
          clearTimeout(introTimeoutRef.current);
        }

        const { acc, vocals } = buffersRef.current;
        if (acc && vocals) {
          const srcAcc = ctx.createBufferSource();
          srcAcc.buffer = acc;
          srcAcc.loop = true;
          srcAcc.connect(gainAccRef.current!);
          srcAcc.start(now);
          sourceAccRef.current = srcAcc;

          const srcVocals = ctx.createBufferSource();
          srcVocals.buffer = vocals;
          srcVocals.loop = true;
          srcVocals.connect(gainVocalsRef.current!);
          srcVocals.start(now);
          sourceVocalsRef.current = srcVocals;

          gainAccRef.current!.gain.cancelScheduledValues(now);
          gainAccRef.current!.gain.setValueAtTime(volume, now);

          gainVocalsRef.current!.gain.cancelScheduledValues(now);
          gainVocalsRef.current!.gain.setValueAtTime(0, now);

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
    if (gainIntroRef.current) {
      gsap.to(gainIntroRef.current.gain, {
        value: volume,
        duration: fadeDuration,
        overwrite: "auto",
      });
    }

    if (gainAccRef.current) {
      gsap.to(gainAccRef.current.gain, {
        value: volume,
        duration: fadeDuration,
        overwrite: "auto",
      });
    }

    if (gainVocalsRef.current) {
      const shouldPlayVocals = inTitleScreen && !isMenuMounted;
      const targetVocalVol = shouldPlayVocals ? volume : 0;

      let duration = 2.5;

      if (inTitleScreen && !hasIntroTransitionHappenedRef.current) {
        duration = 0;
        hasIntroTransitionHappenedRef.current = true;
      }

      gsap.to(gainVocalsRef.current.gain, {
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
      if (gainIntroRef.current) {
        gsap.to(gainIntroRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
      if (gainAccRef.current) {
        gsap.to(gainAccRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
      if (gainVocalsRef.current) {
        gsap.to(gainVocalsRef.current.gain, {
          value: 0,
          duration: 0.25,
          overwrite: "auto",
        });
      }
    };

    const onVideoPause = () => {
      if (!contextRef.current) return;
      if (gainIntroRef.current) {
        gsap.to(gainIntroRef.current.gain, {
          value: volume,
          duration: 0.5,
          overwrite: "auto",
        });
      }
      if (gainAccRef.current) {
        gsap.to(gainAccRef.current.gain, {
          value: volume,
          duration: 0.5,
          overwrite: "auto",
        });
      }
      if (gainVocalsRef.current) {
        const shouldPlayVocals = inTitleScreen && !isMenuMounted;
        const targetVocalVol = shouldPlayVocals ? volume : 0;
        gsap.to(gainVocalsRef.current.gain, {
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
