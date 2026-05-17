import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type ExtraMediaType = "audio" | "video" | "other";

type ExtraMediaItem = {
  name: string;
  url: string;
  type: ExtraMediaType;
};

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".mkv"]);
const ALLOWED_EXTENSIONS = new Set([...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]);

const IGNORED_FILES = new Set(["thumbs.db", "desktop.ini"]);

function detectType(filename: string): ExtraMediaType {
  const ext = path.extname(filename).toLowerCase();

  if (AUDIO_EXTENSIONS.has(ext)) {
    return "audio";
  }

  if (VIDEO_EXTENSIONS.has(ext)) {
    return "video";
  }

  return "other";
}

function isHiddenOrSystemFile(filename: string): boolean {
  if (filename.startsWith(".")) {
    return true;
  }

  return IGNORED_FILES.has(filename.toLowerCase());
}

export async function GET() {
  try {
    const extraDir = path.join(process.cwd(), "public", "extra");

    let entries: string[];
    try {
      entries = await fs.readdir(extraDir);
    } catch (e) {
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
      .filter((name) =>
        ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()),
      )
      .map((name) => ({
        name,
        url: `/extra/${encodeURIComponent(name)}`,
        type: detectType(name),
      }))
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
