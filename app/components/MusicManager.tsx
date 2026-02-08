import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface MusicManagerProps {
  started: boolean;
  textDuration?: number; // Prop for calculating offset
  playLoops: boolean;
  inTitleScreen: boolean;
  volume: number; // 0 to 1
  onIntroEnd: () => void;
  onDurationLoaded?: (duration: number) => void;
  onLoopsStarted?: (loopsStartTime: number, audioContext: AudioContext) => void;
}

export default function MusicManager({
  started,
  textDuration = 0,
  playLoops,
  inTitleScreen,
  volume,
  onIntroEnd,
  onDurationLoaded,
  onLoopsStarted,
}: MusicManagerProps) {
  // Web Audio API refs
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
  const [hasIntroTransitionHappened, setHasIntroTransitionHappened] =
    useState(false);

  // 1. Initialization (Load Buffers & Setup Context)
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create Context
        const AudioContextClass = window.AudioContext;
        const ctx = new AudioContextClass();
        contextRef.current = ctx;

        // Unlock AudioContext on first user interaction (Mobile/Autoplay fix)
        const unlock = () => {
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          // Remove listeners once resumed
          if (ctx.state === "running") {
            window.removeEventListener("click", unlock);
            window.removeEventListener("touchstart", unlock);
            window.removeEventListener("keydown", unlock);
          }
        };

        window.addEventListener("click", unlock);
        window.addEventListener("touchstart", unlock);
        window.addEventListener("keydown", unlock);

        // Create Gains
        const gIntro = ctx.createGain();
        const gAcc = ctx.createGain();
        const gVocals = ctx.createGain();

        // Initialize volumes
        gIntro.gain.value = 0;
        gAcc.gain.value = 0;
        gVocals.gain.value = 0;

        gIntro.connect(ctx.destination);
        gAcc.connect(ctx.destination);
        gVocals.connect(ctx.destination);

        gainIntroRef.current = gIntro;
        gainAccRef.current = gAcc;
        gainVocalsRef.current = gVocals;

        // Load Buffers
        const loadBuffer = async (url: string) => {
          const res = await fetch(url);
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

  // 2. Handle Start (Schedule Intro AND Loops)
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

      // Resume Web Audio Context
      if (ctx.state === "suspended") {
        ctx.resume().catch(console.error);
      }

      const { intro, acc, vocals } = buffersRef.current;
      if (!intro || !acc || !vocals) return;

      // Calculate Timeline
      const delay = Math.max(0, textDuration - intro.duration);
      const now = ctx.currentTime;
      const introStartTime = now + delay + 0.1; // small buffer
      const loopsStartTime = introStartTime + intro.duration;

      scheduledLoopsStartTimeRef.current = loopsStartTime;

      console.log(
        `Scheduling Audio: Intro at ${introStartTime}, Loops at ${loopsStartTime} (Delay: ${delay})`,
      );

      // --- SETUP INTRO ---
      const srcIntro = ctx.createBufferSource();
      srcIntro.buffer = intro;
      srcIntro.connect(gainIntroRef.current!);
      srcIntro.start(introStartTime);
      sourceIntroRef.current = srcIntro;

      // Fade In Intro (Covering the entire intro duration)
      // We use GSAP for a smoother, cinematic build-up that spans the whole intro.
      const startDelay = introStartTime - now;
      const gIntro = gainIntroRef.current!;

      // Ensure silence initially
      gIntro.gain.cancelScheduledValues(now);
      gIntro.gain.setValueAtTime(0, now);

      gsap.to(gIntro.gain, {
        value: volume,
        duration: intro.duration, // Fade in over the full length
        ease: "power2.in", // Cinematic build-up
        delay: startDelay,
        overwrite: true,
      });

      // --- SETUP LOOPS (Gapless Schedule) ---
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

      // Initialize Loop Volumes (Scheduled)
      // We rely on the Volume/Ducking useEffect (Step 4) to manage gain.
      // Scheduling explicit values here would create a race condition where a scheduled '0'
      // could override the '0.5' set by the React effect when the Title Screen appears.

      // Notify parent of loop timing for lyrics synchronization
      if (onLoopsStarted) {
        onLoopsStarted(loopsStartTime, ctx);
      }

      // Notify parent when intro is theoretically done
      // (This is redundant if parent syncs via duration, but good for safety)
      const timeToIntroEnd = (loopsStartTime - now) * 1000;
      
      introTimeoutRef.current = setTimeout(() => {
        onIntroEnd();
      }, timeToIntroEnd);
    }
  }, [
    started,
    isAudioLoaded,
    textDuration,
    volume,
    onIntroEnd,
    onDurationLoaded,
    onLoopsStarted,
  ]);

  // 3. Handle Skip / Force Loops
  useEffect(() => {
    // If playLoops is true (e.g. Skip Intro pressed), check if we need to force jump.

    if (playLoops && hasStartedRef.current && contextRef.current) {
      const ctx = contextRef.current;
      const now = ctx.currentTime;

      // If we are skipping (loops scheduled for future)
      if (scheduledLoopsStartTimeRef.current > now + 0.5) {
        console.log("Skipping Intro Audio - Jumping to Loops");

        // 1. Stop Intro
        if (sourceIntroRef.current) {
          try {
            sourceIntroRef.current.stop();
          } catch (e) {}
        }

        // 2. Cancel previously scheduled loops
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

        // 3. Clear timeout
        if (introTimeoutRef.current) {
          clearTimeout(introTimeoutRef.current);
        }

        // 4. Start Loops IMMEDIATELY
        const { acc, vocals } = buffersRef.current;
        if (acc && vocals) {
          // Acc
          const srcAcc = ctx.createBufferSource();
          srcAcc.buffer = acc;
          srcAcc.loop = true;
          srcAcc.connect(gainAccRef.current!);
          srcAcc.start(now);
          sourceAccRef.current = srcAcc;

          // Vocals
          const srcVocals = ctx.createBufferSource();
          srcVocals.buffer = vocals;
          srcVocals.loop = true;
          srcVocals.connect(gainVocalsRef.current!);
          srcVocals.start(now);
          sourceVocalsRef.current = srcVocals;

          // Reset Gains to immediate volume
          gainAccRef.current!.gain.cancelScheduledValues(now);
          gainAccRef.current!.gain.setValueAtTime(volume, now);

          gainVocalsRef.current!.gain.cancelScheduledValues(now);
          // If in title screen, 0->Vol transition happens in effect #4, but ensure base is 0
          gainVocalsRef.current!.gain.setValueAtTime(0, now);

          // Notify parent of loop timing for lyrics synchronization
          if (onLoopsStarted) {
            onLoopsStarted(now, ctx);
          }
        }

        // 5. Fire completion handler immediately
        onIntroEnd();
      }
    }
  }, [playLoops, volume, onIntroEnd, onLoopsStarted]);

  // 4. Volume & Ducking Control
  useEffect(() => {
    const now = contextRef.current?.currentTime || 0;

    // Intro Volume
    if (gainIntroRef.current) {
      gsap.to(gainIntroRef.current.gain, {
        value: volume,
        duration: 0.5,
        overwrite: "auto",
      });
    }

    // Loops Volume
    if (gainAccRef.current) {
      gsap.to(gainAccRef.current.gain, {
        value: volume,
        duration: 0.5,
        overwrite: "auto",
      });
    }

    if (gainVocalsRef.current) {
      const targetVocalVol = inTitleScreen ? volume : 0;
      let duration = 1.5;

      // Special case: First entry to Title Screen (Intro -> Title transition)
      // We want this to be instant (Gapless drop) so the vocals hit hard immediately
      if (inTitleScreen && !hasIntroTransitionHappened) {
        duration = 0;
        setHasIntroTransitionHappened(true);
      }

      gsap.to(gainVocalsRef.current.gain, {
        value: targetVocalVol,
        duration: duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
  }, [volume, inTitleScreen]);

  return null;
}
