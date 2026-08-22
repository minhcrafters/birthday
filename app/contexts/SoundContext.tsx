"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type SoundName = "click" | "blip" | "blip_alt";

interface SoundContextType {
  playSfx: (name: SoundName) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

const SFX_MAP: Record<SoundName, string> = {
  click: "/audio/click.wav",
  blip: "/audio/blip.wav",
  blip_alt: "/audio/blip_alt.wav",
};

const BLIP_VOLUME = 0.15;
const DEFAULT_VOLUME = 0.5;
const BLIP_POOL_SIZE = 8;
const DEFAULT_POOL_SIZE = 3;

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioPool = useRef<Record<string, HTMLAudioElement[]>>({});

  useEffect(() => {
    for (const [name, src] of Object.entries(SFX_MAP)) {
      const poolSize = name === "blip" ? BLIP_POOL_SIZE : DEFAULT_POOL_SIZE;
      const volume = name === "blip" ? BLIP_VOLUME : DEFAULT_VOLUME;

      audioPool.current[name] = Array.from(
        { length: poolSize },
        () => new Audio(src),
      );

      for (const audio of audioPool.current[name]) {
        audio.volume = volume;
        audio.preload = "auto";
      }
    }
  }, []);

  const playSfx = (name: SoundName) => {
    if (isMuted) {
      return;
    }

    const pool = audioPool.current[name];
    if (!pool) {
      return;
    }

    const availablePlayer = pool.find((p) => p.paused) || pool[0];
    availablePlayer.currentTime = 0;
    availablePlayer.play().catch((err) => {
      console.warn("Audio play failed", err);
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <SoundContext.Provider value={{ playSfx, isMuted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
