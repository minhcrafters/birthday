import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { GalleryImage, GalleryLocation } from "../data/galleryData";
import { useSound } from "../contexts/SoundContext";

interface GalleryModalProps {
  location: GalleryLocation;
  onClose: () => void;
  onImageSelect: (image: GalleryImage) => void;
}

export default function GalleryModal({
  location,
  onClose,
  onImageSelect,
}: GalleryModalProps) {
  const { playSfx } = useSound();
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        // Immersive "pop" animation from center
        const tl = gsap.timeline();

        // 1. Backdrop fade in
        tl.to(backdropRef.current, { opacity: 1, duration: 0.5 });

        // 2. Container Expand from center (as if coming from the globe point)
        // Since the globe point is centered, we scale from center.
        tl.fromTo(
          containerRef.current,
          {
            opacity: 0,
            scale: 0,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.2)", // Slightly bouncy "pop" effect
          },
          "<", // Start with backdrop
        );

        // 3. Stagger in items
        tl.from(
          ".gallery-item",
          {
            y: 30,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "power2.out",
          },
          "-=0.2",
        );
      }
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    if (containerRef.current && backdropRef.current) {
      const tl = gsap.timeline({
        onComplete: onClose,
      });

      tl.to(containerRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      tl.to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.3,
        },
        "<",
      );
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0"
        onClick={handleClose}
      />

      <div
        ref={containerRef}
        className="relative w-full max-w-5xl max-h-[85vh] bg-black border border-white/30 flex flex-col opacity-0 shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-[0.15em] uppercase flex items-center gap-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {location.name}
          </h2>
          <button
            onClick={handleClose}
            className="group p-3 md:p-2 border border-transparent hover:border-white/50 transition-all duration-300"
            aria-label="Close Gallery"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar bg-black">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {location.images.map((img) => (
              <div
                key={img.id}
                className="gallery-item group relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer border border-white/10 hover:border-white transition-colors duration-500"
                onClick={() => {
                  playSfx("click");
                  onImageSelect(img);
                }}
              >
                <img
                  src={img.src}
                  alt={`Photo by ${img.author}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-t from-black/90 to-transparent">
                  <div className="flex flex-col gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white font-medium border-b border-white pb-1 inline-block self-start">
                      View Full
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono mt-1">
                      IMG // {img.id.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
