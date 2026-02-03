"use client";

import React, { useState } from "react";
import Globe3D from "./Globe3D";
import GalleryModal from "./GalleryModal";
import ImageView from "./ImageView";
import { GalleryLocation, GalleryImage } from "../data/galleryData";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useSound } from "../contexts/SoundContext";

interface GlobeGalleryProps {
  onClose: () => void;
}

export default function GlobeGallery({ onClose }: GlobeGalleryProps) {
  const { playSfx } = useSound();
  const [selectedLocation, setSelectedLocation] =
    useState<GalleryLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1 },
      );
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    // 1. Start Exit Animation (Zoom Out)
    playSfx("close");
    setIsExiting(true);

    // 2. Fade Out after Zoom Out matches timing
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 1.0,
      delay: 0.5, // Wait for zoom to start
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  const handleLocationSelect = (loc: GalleryLocation) => {
    playSfx("click");
    setSelectedLocation(loc);
    setIsModalOpen(false); // Ensure modal is closed while camera moves
  };

  const handleTransitionComplete = () => {
    if (selectedLocation) {
      playSfx("open");
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    playSfx("close");
    setSelectedLocation(null);
    setIsModalOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-black text-white"
    >
      {/* Back Button - Consistent with MainMenu */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
        <button
          onClick={handleClose}
          className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
        >
          <div className="p-3 md:p-2 border border-white/30 group-hover:border-white transition-colors duration-300 backdrop-blur-sm bg-black/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium hidden md:block">
            Back to Menu
          </span>
        </button>
      </div>

      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-40 text-right pointer-events-none">
        <h1 className="text-xl md:text-4xl font-serif font-bold tracking-[0.15em] uppercase text-white drop-shadow-lg mb-2">
          Global Gallery
        </h1>
        <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-mono">
          Drag to explore • Select a location
        </p>
      </div>

      <div className="w-full h-full cursor-move">
        <Globe3D
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          onTransitionComplete={handleTransitionComplete}
          isExiting={isExiting}
        />
      </div>

      {selectedLocation && isModalOpen && (
        <GalleryModal
          location={selectedLocation}
          onClose={handleModalClose}
          onImageSelect={setSelectedImage}
        />
      )}

      {selectedImage && (
        <ImageView
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
