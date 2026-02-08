"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type SoundName = "click" | "hover" | "warp" | "open" | "close" | "blip";

interface SoundContextType {
  playSfx: (name: SoundName) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

// Map sound names to files
const SFX_MAP: Record<SoundName, string> = {
  click: "/audio/test1.mp3", // Placeholder
  hover: "/audio/test2.mp3", // Placeholder
  warp: "/audio/test3.mp3", // Placeholder
  open: "/audio/test1.mp3", // Reuse click for now
  close: "/audio/test2.mp3", // Reuse hover for now
  blip: "/audio/blip.wav",
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioPool = useRef<Record<string, HTMLAudioElement[]>>({});

  useEffect(() => {
    // Preload sounds
    Object.entries(SFX_MAP).forEach(([name, src]) => {
      // Determine pool size based on sound type
      // Blips need higher concurrency for rapid typing
      const poolSize = name === "blip" ? 8 : 3;
      
      audioPool.current[name] = Array.from({ length: poolSize }, () => new Audio(src));
      
      audioPool.current[name].forEach((audio) => {
        audio.volume = name === "blip" ? 0.15 : 0.5; // Lower volume for repetitive blips
        audio.preload = "auto";
      });
    });
  }, []);

  const playSfx = (name: SoundName) => {
    if (isMuted) return;

    const pool = audioPool.current[name];
    if (!pool) return;

    // Find a free player or just use the first one and reset it
    const availablePlayer = pool.find((p) => p.paused) || pool[0];

    availablePlayer.currentTime = 0;
    availablePlayer.play().catch((err) => {
      // Audio context might be locked, expected behavior before interaction
      console.warn("Audio play failed", err);
    });
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

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
