"use client";

import React, { useEffect, useRef } from "react";

const Starfield = ({ speedRef }: { speedRef?: React.RefObject<number> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
      speed: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 4000); // Density
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          alpha: Math.random(),
          speed: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        // Twinkle
        star.alpha += (Math.random() - 0.5) * 0.05;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 0.8) star.alpha = 0.8;

        // Subtle movement (cosmic drift) + Scroll parallax
        let moveY = star.speed;
        if (speedRef) {
          moveY += speedRef.current * star.radius * 0.1; // Parallax depth
        }

        star.y -= moveY;
        if (star.y < 0) star.y += canvas.height;
        if (star.y > canvas.height) star.y -= canvas.height;
      });

      // Decay external speed (friction)
      if (speedRef && Math.abs(speedRef.current) > 0.01) {
        speedRef.current *= 0.9;
      } else if (speedRef) {
        speedRef.current = 0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speedRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-60"
    />
  );
};

export default Starfield;
