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
      const tl = gsap.timeline({ delay: 0.5 });

      tl.fromTo(
        containerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.5, ease: "power2.inOut" },
      );

      tl.fromTo(
        ".gallery-item",
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=1.0",
      );
    },
    { scope: containerRef },
  );

  const handleClose = () => {
    playSfx("close");
    gsap.to(containerRef.current, {
      autoAlpha: 0,
      duration: 0.8,
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
      className="fixed inset-0 z-60 flex justify-center text-white opacity-0 pointer-events-none"
    >
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute inset-0 h-32 bg-linear-to-b from-black via-black/80 to-transparent -z-10" />

        <div className="absolute top-8 left-8 z-50 pointer-events-auto">
          {selectedCategory ? (
            <button
              onClick={() => {
                playSfx("close");
                setSelectedCategory(null);
              }}
              className="back-button text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <div className="p-1 border border-gray-600 rounded-full group-hover:border-white transition-all">
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
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
                Categories
              </span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="back-button text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <div className="p-1 border border-gray-600 rounded-full group-hover:border-white transition-all">
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
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block">
                Back
              </span>
            </button>
          )}
        </div>

        <div className="absolute top-8 right-8 z-50 text-right pointer-events-none">
          <h1 className="text-xl md:text-4xl font-serif font-bold tracking-[0.15em] uppercase text-bright drop-shadow-lg mb-2">
            Gallery
          </h1>
          <p className="text-[9px] md:text-[10px] text-text-muted uppercase tracking-[0.2em] font-mono">
            {selectedCategory
              ? `${imagesToShow.length} Memories`
              : `${images.length} Memories Collected`}
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex justify-center overflow-hidden pointer-events-auto">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />

          <nav
            ref={gridRef}
            className="relative h-full overflow-y-auto no-scrollbar pt-40 pb-32 px-6"
          >
            {!selectedCategory ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className="gallery-item group relative aspect-square cursor-pointer flex flex-col items-center justify-center p-4 transition-all duration-500 hover:scale-105"
                  >
                    <div className="absolute inset-0 backdrop-blur-sm border rounded-xl transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.3)] bg-slate-900/40 border-white/10 group-hover:bg-slate-800/60 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]" />

                    <div className="relative z-10 w-full h-full overflow-hidden rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                      {cat.preview ? (
                        <Image
                          src={cat.preview}
                          alt={cat.name}
                          fill
                          className="object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-sm">
                          {cat.name}
                        </div>
                      )}
                      <div className="absolute left-4 bottom-4 z-20 text-left">
                        <div className="text-sm font-semibold">{cat.name}</div>
                        <div className="text-xs text-text-muted">
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
                    className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white pointer-events-auto"
                  >
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
                    Back to categories
                  </button>
                  <div className="mt-2 text-sm text-text-muted">
                    {selectedCategory
                      ? formatCategoryName(selectedCategory)
                      : ""}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {imagesToShow.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => handleImageClick(img)}
                      className="gallery-item group relative aspect-square cursor-pointer flex flex-col items-center justify-center p-4 transition-all duration-500 hover:scale-105"
                    >
                      <div className="absolute inset-0 backdrop-blur-sm border rounded-xl transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.3)] bg-slate-900/40 border-white/10 group-hover:bg-slate-800/60 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]" />

                      <div className="relative z-10 w-full h-full overflow-hidden rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300">
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

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
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
