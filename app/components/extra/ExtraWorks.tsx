"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type ExtraMediaType = "audio" | "video" | "other";

type ExtraMediaItem = {
  name: string;
  url: string;
  type: ExtraMediaType;
};

type ApiResponse =
  | { items: ExtraMediaItem[] }
  | { error: string; items?: never };

export interface ExtraWorksProps {
  open: boolean;
  onClose: () => void;
}

function prettyTitle(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.replace(/\s+/g, " ").trim();
}

export default function ExtraWorks({ open, onClose }: ExtraWorksProps) {
  const [mounted, setMounted] = useState(false);

  const [items, setItems] = useState<ExtraMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioItems = useMemo(
    () => items.filter((i) => i.type === "audio"),
    [items],
  );
  const videoItems = useMemo(
    () => items.filter((i) => i.type === "video"),
    [items],
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  gsap.registerPlugin(useGSAP);

  const anim = useRef<{
    opening?: gsap.core.Timeline;
    closing?: gsap.core.Timeline;
  }>({});

  const requestClose = () => {
    if (!openRef.current) return;
    onCloseRef.current();
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/extra", { cache: "no-store" });
        const data = (await res.json()) as ApiResponse;

        if (!res.ok) {
          const message =
            "error" in data && data.error
              ? data.error
              : "Failed to load Extra Works.";
          throw new Error(message);
        }

        if ("items" in data && Array.isArray(data.items)) {
          if (!cancelled) setItems(data.items);
        } else {
          throw new Error("Malformed response from /api/extra.");
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load Extra Works.";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) requestClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted]);

  useGSAP(
    () => {
      if (!mounted) return;
      if (!overlayRef.current || !panelRef.current) return;

      anim.current.opening?.kill();
      anim.current.closing?.kill();

      if (open) {
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(panelRef.current, { opacity: 0, y: 16, scale: 0.985 });

        const openTl = gsap.timeline();
        openTl
          .to(overlayRef.current, {
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          })
          .to(
            panelRef.current,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "power3.out",
            },
            "-=0.15",
          );

        anim.current.opening = openTl;
      } else {
        const closeTl = gsap.timeline({
          onComplete: () => {
            if (!openRef.current) setMounted(false);
          },
        });

        closeTl
          .to(panelRef.current, {
            opacity: 0,
            y: 10,
            scale: 0.99,
            duration: 0.35,
            ease: "power2.in",
          })
          .to(
            overlayRef.current,
            {
              opacity: 0,
              duration: 0.3,
              ease: "power2.in",
            },
            "-=0.1",
          );

        anim.current.closing = closeTl;
      }

      return () => {
        anim.current.opening?.kill();
        anim.current.closing?.kill();
      };
    },
    { dependencies: [open, mounted] },
  );

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      className="gingham-background fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10"
      onClick={() => {
        if (openRef.current) requestClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Extra Works"
    >
      <div
        ref={panelRef}
        className="w-full max-w-3xl rounded-[2rem] border border-birthday-gold/30 bg-birthday-cream/95 shadow-[0_20px_45px_-15px_rgba(74,46,42,0.35)] backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 p-6 md:p-8 border-b border-birthday-gold/20">
          <div className="min-w-0">
            <h2 className="text-birthday-ink text-sm md:text-base uppercase tracking-[0.3em] font-bold">
              Extra Works
            </h2>
          </div>

          <button
            onClick={() => {
              if (openRef.current) requestClose();
            }}
            className="text-xs uppercase tracking-[0.2em] text-birthday-ink/50 hover:text-birthday-ink transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 md:p-8">
          {loading && (
            <div className="text-center text-sm text-birthday-ink/50">
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="text-center text-sm text-birthday-coral-deep">
              {error}
              <div className="mt-3 text-xs text-birthday-ink/50">
                Make sure{" "}
                <code className="text-birthday-ink/70">/api/extra</code> is
                available and that the server can read{" "}
                <code className="text-birthday-ink/70">public/extra</code>.
              </div>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center text-sm text-birthday-ink/50">
              No media found in{" "}
              <code className="text-birthday-ink/70">/public/extra</code>.
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xl space-y-8">
                {audioItems.length > 0 && (
                  <section>
                    <h3 className="text-xs uppercase tracking-[0.25em] text-birthday-ink/50 mb-4 text-center">
                      Audio
                    </h3>
                    <ul className="space-y-5">
                      {audioItems.map((item) => (
                        <li key={item.url} className="text-center">
                          <div className="text-xs md:text-sm text-birthday-ink/80 mb-2">
                            {prettyTitle(item.name)}
                          </div>
                          <audio
                            controls
                            preload="none"
                            className="mx-auto w-full"
                            src={item.url}
                          />
                          <div className="mt-2 text-[10px] text-birthday-ink/40 break-all">
                            {item.name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {videoItems.length > 0 && (
                  <section>
                    <h3 className="text-xs uppercase tracking-[0.25em] text-birthday-ink/50 mb-4 text-center">
                      Video
                    </h3>
                    <ul className="space-y-8">
                      {videoItems.map((item) => (
                        <li key={item.url} className="text-center">
                          <div className="text-xs md:text-sm text-birthday-ink/80 mb-3">
                            {prettyTitle(item.name)}
                          </div>
                          <video
                            controls
                            preload="metadata"
                            className="mx-auto w-full rounded-sm border border-birthday-gold/30"
                            src={item.url}
                          />
                          <div className="mt-2 text-[10px] text-birthday-ink/40 break-all">
                            {item.name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {items.some((i) => i.type === "other") && (
                  <section>
                    <h3 className="text-xs uppercase tracking-[0.25em] text-birthday-ink/50 mb-4 text-center">
                      Other
                    </h3>
                    <ul className="space-y-2">
                      {items
                        .filter((i) => i.type === "other")
                        .map((item) => (
                          <li key={item.url} className="text-center">
                            <a
                              className="text-xs md:text-sm text-birthday-ink/70 hover:text-birthday-ink underline underline-offset-4"
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.name}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
