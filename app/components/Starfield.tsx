"use client";

import React, { useEffect, useRef } from "react";

export const STARFIELD_OPACITY = 0.6;

type Props = {
  speedRef?: React.RefObject<number>;
  enableFriction?: boolean;
  bgImage?: string;
  opacity?: number;
  crossfadeDuration?: number;
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

  const currentBgRef = useRef<HTMLImageElement | null>(null);
  const prevBgRef = useRef<HTMLImageElement | null>(null);
  const fadeStartTimeRef = useRef<number>(0);
  const isFadingRef = useRef(false);

  const lastRequestedSrcRef = useRef<string | undefined>(undefined);

  // Sync friction flag from props
  useEffect(() => {
    frictionEnabledRef.current = enableFriction;
  }, [enableFriction]);

  // Background image loader with crossfade
  useEffect(() => {
    const targetSrc = bgImage;

    if (targetSrc === lastRequestedSrcRef.current) return;
    lastRequestedSrcRef.current = targetSrc;

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
      prevBgRef.current = currentBgRef.current;
      currentBgRef.current = img;
      fadeStartTimeRef.current = performance.now();
      isFadingRef.current = true;
    };

    img.onerror = () => {
      console.warn(`Failed to load background image: ${targetSrc}`);
    };

    return () => {
      mounted = false;
    };
  }, [bgImage]);

  // Starfield canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let stars: Float32Array;
    const STAR_PROPS = 6;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const starCount = Math.max(
        32,
        Math.floor((canvas.width * canvas.height) / 4000),
      );
      stars = new Float32Array(starCount * STAR_PROPS);

      for (let i = 0; i < starCount; i++) {
        const base = i * STAR_PROPS;
        stars[base + 0] = Math.random() * canvas.width;
        stars[base + 1] = Math.random() * canvas.height;
        stars[base + 2] = Math.random() * 1.5 + 0.1;
        stars[base + 3] = Math.random() * 0.8 + 0.1;
        stars[base + 4] = Math.random() * 0.5 + 0.05;
        stars[base + 5] = Math.random() * Math.PI * 2;
      }
    };

    const drawImageCover = (img: HTMLImageElement | null, alpha: number) => {
      if (!img) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width;
      const ih = img.height;

      const scale = Math.max(cw / iw, ch / ih);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const dx = (cw - drawW) / 2;
      const dy = (ch - drawH) / 2;

      ctx.save();
      ctx.globalAlpha = 0.4 * alpha;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    };

    const drawBackground = (now: number) => {
      if (prevBgRef.current) {
        let alpha = 0;
        if (isFadingRef.current) {
          const elapsed = now - fadeStartTimeRef.current;
          const progress = Math.min(1, elapsed / crossfadeDuration);
          alpha = 1 - progress;

          if (progress >= 1) {
            prevBgRef.current = null;
          }
        }
        if (alpha > 0) drawImageCover(prevBgRef.current, alpha);
      }

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground(now);

      const count = stars.length / STAR_PROPS;
      const height = canvas.height;
      const externalSpeed = speedRef?.current || 0;

      for (let i = 0; i < count; i++) {
        const base = i * STAR_PROPS;

        stars[base + 5] += 0.05;
        stars[base + 3] = (Math.sin(stars[base + 5]) + 1) * 0.35 + 0.05;

        let moveY = stars[base + 4];
        if (externalSpeed !== 0) {
          moveY += externalSpeed * stars[base + 2] * 0.1;
        }

        stars[base + 1] -= moveY;

        if (stars[base + 1] < 0) stars[base + 1] += height;
        if (stars[base + 1] > height) stars[base + 1] -= height;

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

      if (frictionEnabledRef.current && speedRef) {
        if (Math.abs(speedRef.current) > 0.01) {
          speedRef.current *= 0.9;
        } else {
          speedRef.current = 0;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw(performance.now());

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
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
