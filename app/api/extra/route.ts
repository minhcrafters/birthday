/**
 * API route: Lists "extra works" media files located in `public/extra`.
 *
 * Responsibilities:
 * - Read the server-side filesystem to enumerate media files.
 * - Return a JSON payload suitable for a client to render a centered list.
 *
 * Should NOT contain:
 * - UI rendering
 * - Authentication/authorization logic
 */

import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type ExtraMediaType = "audio" | "video" | "other";

type ExtraMediaItem = {
  name: string; // filename
  url: string; // public URL e.g. /extra/file.mp3
  type: ExtraMediaType;
};

function detectType(filename: string): ExtraMediaType {
  const ext = path.extname(filename).toLowerCase();

  // Audio
  if (
    ext === ".mp3" ||
    ext === ".wav" ||
    ext === ".ogg" ||
    ext === ".m4a" ||
    ext === ".flac"
  ) {
    return "audio";
  }

  // Video
  if (ext === ".mp4" || ext === ".webm" || ext === ".mov" || ext === ".mkv") {
    return "video";
  }

  return "other";
}

function isHiddenOrSystemFile(filename: string): boolean {
  // Skip dotfiles and obvious OS artifacts
  const lower = filename.toLowerCase();
  return (
    filename.startsWith(".") || lower === "thumbs.db" || lower === "desktop.ini"
  );
}

export async function GET() {
  try {
    const extraDir = path.join(process.cwd(), "public", "extra");

    let entries: string[] = [];
    try {
      entries = await fs.readdir(extraDir);
    } catch (e) {
      // If the folder doesn't exist, return an empty list (non-fatal).
      if (
        e instanceof Error &&
        (e as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return NextResponse.json({ items: [] satisfies ExtraMediaItem[] });
      }
      throw e;
    }

    const items: ExtraMediaItem[] = entries
      .filter((name) => !isHiddenOrSystemFile(name))
      .filter((name) => {
        const ext = path.extname(name).toLowerCase();
        // Only allow typical media files; extend as needed.
        return (
          ext === ".mp3" ||
          ext === ".wav" ||
          ext === ".ogg" ||
          ext === ".m4a" ||
          ext === ".flac" ||
          ext === ".mp4" ||
          ext === ".webm" ||
          ext === ".mov" ||
          ext === ".mkv"
        );
      })
      .map((name) => ({
        name,
        url: `/extra/${encodeURIComponent(name)}`,
        type: detectType(name),
      }))
      // Sort consistently
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Failed to list extra works media files." },
      { status: 500 },
    );
  }
}
