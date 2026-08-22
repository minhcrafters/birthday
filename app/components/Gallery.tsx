"use client";

import React, { useRef, useState, useLayoutEffect, useMemo } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";

import { GalleryImage } from "../data/galleryData";
import ImageView from "./ImageView";
import { useSound } from "../contexts/SoundContext";

interface GalleryProps {
  onClose: () => void;
  images: GalleryImage[];
  starfieldSpeedRef?: React.RefObject<number>;
  controlsStarfield?: boolean;
}

const BackArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
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
);

export default function Gallery({
  onClose,
  images,
  starfieldSpeedRef,
  controlsStarfield = false,
}: GalleryProps) {
  const { playSfx } = useSound();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const lastScrollTopRef = useRef(0);
  const rAFRef = useRef<number | null>(null);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, GalleryImage[]>();
    images.forEach((img) => {
      try {
        let src = img.src ?? "";
        if (src.startsWith("/")) src = src.slice(1);
        if (src.toLowerCase().startsWith("images/gallery/")) {
          src = src.slice("images/gallery/".length);
        } else if (src.toLowerCase().startsWith("images/")) {
          src = src.slice("images/".length);
        }
        const parts = src.split("/");
        const category = parts.length > 1 ? parts[0] : "Uncategorized";
        const arr = map.get(category) || [];
        arr.push(img);
        map.set(category, arr);
      } catch {
        const arr = map.get("Uncategorized") || [];
        arr.push(img);
        map.set("Uncategorized", arr);
      }
    });
    return map;
  }, [images]);

  const categories = useMemo(
    () =>
      Array.from(categoriesMap.entries()).map(([key, imgs]) => ({
        key,
        name: key
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        count: imgs.length,
        preview: imgs[0]?.src ?? "",
      })),
    [categoriesMap],
  );

  useLayoutEffect(() => {
    const updatePhysics = () => {
      const container: HTMLElement | null = gridRef.current;
      if (!container) return;

      const currentScrollTop = container.scrollTop;
      const velocity = currentScrollTop - lastScrollTopRef.current;
      lastScrollTopRef.current = currentScrollTop;

      if (starfieldSpeedRef && controlsStarfield) {
        starfieldSpeedRef.current = velocity * 5;
      }

      rAFRef.current = null;
    };

    const handleScroll = () => {
      if (!rAFRef.current) {
        rAFRef.current = requestAnimationFrame(updatePhysics);
      }
    };

    const container: HTMLElement | null = gridRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
      }
    };
  }, [controlsStarfield, starfieldSpeedRef]);

  useGSAP(
    () => {
      // Kept in sync with Experience's Phase 3 title-fade-out (0.5s): the
      // background must be fully opaque by then or the starfield shows
      // through as a black gap between screens.
      const tl = gsap.timeline();

      tl.fromTo(
        containerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: "power2.inOut" },
      );

      tl.fromTo(
        ".gallery-item",
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=0.15",
      );
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    gsap.to(containerRef.current, {
      autoAlpha: 0,
      duration: 0.5,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  const handleImageClick = (img: GalleryImage) => {
    playSfx("click");
    setSelectedImage(img);
  };

  const handleCategoryClick = (key: string) => {
    playSfx("click");
    setSelectedCategory(key);
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  };

  const imagesToShow = selectedCategory
    ? categoriesMap.get(selectedCategory) || []
    : images;

  const formatCategoryName = (name: string) =>
    name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex justify-center text-birthday-ink opacity-0 pointer-events-none"
    >
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute inset-0 h-32 bg-linear-to-b from-birthday-cream via-birthday-cream/85 to-transparent -z-10" />

        <div className="absolute top-8 left-8 z-50 pointer-events-auto">
          {selectedCategory ? (
            <button
              onClick={() => setSelectedCategory(null)}
              className="back-button text-birthday-ink/60 hover:text-birthday-ink transition-colors flex items-center gap-2 group"
            >
              <div className="p-1 border border-birthday-gold/40 rounded-full bg-birthday-cream/80 group-hover:border-birthday-gold transition-all">
                <BackArrow />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
                Categories
              </span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="back-button text-birthday-ink/60 hover:text-birthday-ink transition-colors flex items-center gap-2 group"
            >
              <div className="p-1 border border-birthday-gold/40 rounded-full bg-birthday-cream/80 group-hover:border-birthday-gold transition-all">
                <BackArrow />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
                Back
              </span>
            </button>
          )}
        </div>

        <div className="absolute top-8 right-8 z-50 text-right pointer-events-none">
          <h1 className="text-xl md:text-4xl font-sans font-bold tracking-[0.15em] uppercase text-birthday-ink drop-shadow-sm mb-2">
            Gallery
          </h1>
          <p className="text-[9px] md:text-[10px] text-birthday-ink/50 uppercase tracking-[0.2em] font-mono">
            {selectedCategory
              ? `${imagesToShow.length} Memories`
              : `${images.length} Memories Collected`}
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
        <div className="relative w-full max-w-5xl h-full">
          <nav
            ref={gridRef}
            className="relative h-full overflow-y-auto no-scrollbar pt-40 pb-32 px-6"
          >
            {!selectedCategory ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className="gallery-item group relative aspect-square cursor-pointer flex flex-col items-center justify-center p-3 transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 rounded-2xl border-2 border-birthday-gold/30 bg-birthday-cream/90 shadow-md transition-all duration-500 group-hover:border-birthday-gold group-hover:shadow-lg" />

                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-10 rounded-full ${
                        idx % 2 === 0
                          ? "bg-birthday-coral-deep"
                          : "bg-birthday-mint-deep"
                      }`}
                    />

                    <div className="relative z-10 w-full h-full overflow-hidden rounded-xl m-2">
                      {cat.preview ? (
                        <Image
                          src={cat.preview}
                          alt={cat.name}
                          fill
                          className="object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-birthday-cream flex items-center justify-center text-sm text-birthday-ink">
                          {cat.name}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-birthday-ink/70 to-transparent px-4 pb-3 pt-8 text-left">
                        <div className="text-sm font-semibold text-white">
                          {cat.name}
                        </div>
                        <div className="text-xs text-white/75">
                          {cat.count} photos
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => {
                      playSfx("click");
                      setSelectedCategory(null);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-birthday-ink/60 hover:text-birthday-ink pointer-events-auto"
                  >
                    <BackArrow />
                    Back to categories
                  </button>
                  <div className="mt-2 text-sm text-birthday-ink/50">
                    {selectedCategory
                      ? formatCategoryName(selectedCategory)
                      : ""}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {imagesToShow.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => handleImageClick(img)}
                      className="gallery-item group relative aspect-square cursor-pointer flex flex-col items-center justify-center p-3 transition-all duration-500 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 rounded-2xl border-2 border-birthday-gold/30 bg-birthday-cream/90 shadow-md transition-all duration-500 group-hover:border-birthday-gold group-hover:shadow-lg" />

                      <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-10 rounded-full ${
                          idx % 2 === 0
                            ? "bg-birthday-coral-deep"
                            : "bg-birthday-mint-deep"
                        }`}
                      />

                      <div className="relative z-10 w-full h-full overflow-hidden rounded-xl m-2">
                        <Image
                          src={img.src}
                          alt={img.author || "Gallery Image"}
                          fill
                          className="object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </nav>
        </div>
      </div>

      {selectedImage && (
        <ImageView
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
