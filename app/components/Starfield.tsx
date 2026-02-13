"use client";

import React, { useEffect, useRef } from "react";

export const STARFIELD_OPACITY = 0.6;

/**
 * Starfield canvas with optional background image.
 *
 * Responsibilities:
 * - Render a procedurally-generated starfield into a full-viewport canvas.
 * - Draw an optional background image underneath the stars (cover + subtle alpha).
 * - Accept `speedRef` to allow external systems to accelerate/brake the starfield.
 * - Accept `enableFriction` to toggle automatic speed decay.
 * - Accept `bgImage` (URL string) and reload the image whenever it changes.
 * - Accept `opacity` to ensure consistent canvas opacity across transitions.
 * - Manage smooth crossfade transitions between background images when `bgImage` changes.
 *
 * Notes:
 * - The background image is loaded and stored in a ref; the render loop will
 *   pick it up on the next frame automatically. This avoids tearing down and
 *   reinitializing the canvas animation when only the image changes.
 */

type Props = {
  speedRef?: React.RefObject<number>;
  enableFriction?: boolean;
  bgImage?: string; // optional URL to draw behind the stars
  opacity?: number; // optional canvas opacity (0.0 - 1.0)
  crossfadeDuration?: number; // duration of bg crossfade in ms
};

const Starfield = ({
  speedRef,
  enableFriction = true,
  bgImage,
  opacity = STARFIELD_OPACITY,
  crossfadeDuration = 1500,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frictionEnabledRef = useRef(enableFriction);

  // Background image management
  const currentBgRef = useRef<HTMLImageElement | null>(null);
  const prevBgRef = useRef<HTMLImageElement | null>(null);
  const fadeStartTimeRef = useRef<number>(0);
  const isFadingRef = useRef(false);

  // Track the last requested image URL to avoid reloading same image
  const lastRequestedSrcRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with prop without re-initializing the canvas
  useEffect(() => {
    frictionEnabledRef.current = enableFriction;
  }, [enableFriction]);

  // Load / reload the background image when `bgImage` changes.
  useEffect(() => {
    const targetSrc = bgImage;

    // If source hasn't changed, do nothing
    if (targetSrc === lastRequestedSrcRef.current) return;
    lastRequestedSrcRef.current = targetSrc;

    // If no bgImage is provided, just clear (maybe fade out?)
    if (!targetSrc) {
      prevBgRef.current = currentBgRef.current;
      currentBgRef.current = null;
      fadeStartTimeRef.current = performance.now();
      isFadingRef.current = true;
      return;
    }

    let mounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = targetSrc;

    img.onload = () => {
      if (!mounted) return;
      // Start crossfade
      prevBgRef.current = currentBgRef.current;
      currentBgRef.current = img;
      fadeStartTimeRef.current = performance.now();
      isFadingRef.current = true;
    };

    img.onerror = () => {
      // If load fails, we don't switch (or we could switch to null)
      console.warn(`Failed to load background image: ${targetSrc}`);
    };

    return () => {
      mounted = false;
    };
  }, [bgImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let stars: Float32Array;
    const STAR_PROPS = 6; // x, y, radius, alpha, speed, twinklePhase

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      // Create a new star field sized to the canvas. We intentionally
      // regenerate stars on resize to keep density consistent.
      const starCount = Math.max(
        32,
        Math.floor((canvas.width * canvas.height) / 4000),
      );
      stars = new Float32Array(starCount * STAR_PROPS);

      for (let i = 0; i < starCount; i++) {
        const base = i * STAR_PROPS;
        stars[base + 0] = Math.random() * canvas.width; // x
        stars[base + 1] = Math.random() * canvas.height; // y
        stars[base + 2] = Math.random() * 1.5 + 0.1; // radius
        stars[base + 3] = Math.random() * 0.8 + 0.1; // alpha
        stars[base + 4] = Math.random() * 0.5 + 0.05; // speed factor
        stars[base + 5] = Math.random() * Math.PI * 2; // twinkle phase
      }
    };

    // Helper to draw a specific image with cover scaling and alpha
    const drawImageCover = (img: HTMLImageElement | null, alpha: number) => {
      if (!img) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width;
      const ih = img.height;

      // 'cover' scale calculation
      const scale = Math.max(cw / iw, ch / ih);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const dx = (cw - drawW) / 2;
      const dy = (ch - drawH) / 2;

      ctx.save();
      ctx.globalAlpha = 0.4 * alpha; // Base alpha 0.4 * fade alpha
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    };

    const drawBackground = (now: number) => {
      // 1. Draw Previous Image (Fading Out)
      if (prevBgRef.current) {
        let alpha = 0;
        if (isFadingRef.current) {
          const elapsed = now - fadeStartTimeRef.current;
          const progress = Math.min(1, elapsed / crossfadeDuration);
          alpha = 1 - progress;

          // Cleanup if done
          if (progress >= 1) {
            prevBgRef.current = null;
          }
        }
        if (alpha > 0) drawImageCover(prevBgRef.current, alpha);
      }

      // 2. Draw Current Image (Fading In or Static)
      if (currentBgRef.current) {
        let alpha = 1;
        if (isFadingRef.current) {
          const elapsed = now - fadeStartTimeRef.current;
          const progress = Math.min(1, elapsed / crossfadeDuration);
          alpha = progress;

          if (progress >= 1) {
            isFadingRef.current = false;
          }
        }
        drawImageCover(currentBgRef.current, alpha);
      }
    };

    const draw = (now: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Crossfade
      drawBackground(now);

      const count = stars.length / STAR_PROPS;
      const height = canvas.height;
      const externalSpeed = speedRef?.current || 0;

      for (let i = 0; i < count; i++) {
        const base = i * STAR_PROPS;

        // Update twinkle phase and compute alpha
        stars[base + 5] += 0.05;
        stars[base + 3] = (Math.sin(stars[base + 5]) + 1) * 0.35 + 0.05; // 0.05..0.75

        // Movement influenced by external speed and star size
        let moveY = stars[base + 4];
        if (externalSpeed !== 0) {
          // scale movement by star radius for parallax effect
          moveY += externalSpeed * stars[base + 2] * 0.1;
        }

        stars[base + 1] -= moveY;

        // Wrap vertically
        if (stars[base + 1] < 0) stars[base + 1] += height;
        if (stars[base + 1] > height) stars[base + 1] -= height;

        // Draw star if visible enough
        if (stars[base + 3] > 0.03) {
          ctx.beginPath();
          ctx.arc(
            stars[base + 0],
            stars[base + 1],
            stars[base + 2],
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = `rgba(255,255,255,${stars[base + 3].toFixed(3)})`;
          ctx.fill();
        }
      }

      // Apply friction to external speed if applicable
      if (frictionEnabledRef.current && speedRef) {
        if (Math.abs(speedRef.current) > 0.01) {
          speedRef.current *= 0.9;
        } else {
          speedRef.current = 0;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // Setup
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw(performance.now());

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      // Clear image refs to allow GC
      currentBgRef.current = null;
      prevBgRef.current = null;
    };
  }, [speedRef, crossfadeDuration]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};

export default Starfield;
