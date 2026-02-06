import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { GalleryImage } from "../data/galleryData";
import { useSound } from "../contexts/SoundContext";

interface ImageViewProps {
  image: GalleryImage;
  onClose: () => void;
}

export default function ImageView({ image, onClose }: ImageViewProps) {
  const { playSfx } = useSound();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3 },
        );
        gsap.fromTo(
          ".image-content",
          { scale: 0.95, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.1,
          },
        );
      }
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    playSfx("close");
    if (containerRef.current) {
      const tl = gsap.timeline({ onComplete: onClose });
      tl.to(".image-content", {
        scale: 0.95,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
      tl.to(
        containerRef.current,
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
    <div
      ref={containerRef}
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/98 backdrop-blur-xl"
      onClick={handleClose}
    >
      <div className="absolute top-6 right-6 md:top-8 md:right-8 text-white/50 hover:text-white cursor-pointer z-50 p-4 border border-transparent hover:border-white/30 transition-all duration-300 group">
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono mr-2 hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
          Close
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>

      <div
        className="image-content flex flex-col items-center max-w-[95vw] max-h-[95vh] gap-8"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
      >
        <div className="relative border border-white/10 bg-neutral-900 p-1 md:p-2 shadow-2xl">
          <img
            src={image.src}
            alt={`Full size by ${image.author}`}
            className="max-w-full max-h-[75vh] object-contain"
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase font-mono border-b border-gray-800 pb-2 inline-block">
            Captured by
          </p>
          <p className="text-white text-2xl md:text-3xl font-serif font-bold tracking-widest uppercase">
            {image.author}
          </p>
        </div>
      </div>
    </div>
  );
}
