import { promises as fs } from "fs";
import path from "path";
import { GalleryImage } from "../data/galleryData";

const MEDIA_EXTENSION_RE = /\.(png|jpg|jpeg|svg|webp)$/i;

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const galleryDir = path.join(process.cwd(), "public", "images", "gallery");

  try {
    await fs.access(galleryDir);
  } catch {
    return [];
  }

  const entries = await fs.readdir(galleryDir, { withFileTypes: true });
  const authors = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const imagesByAuthor = await Promise.all(
    authors.map(async (author): Promise<GalleryImage[]> => {
      const authorDir = path.join(galleryDir, author);

      let files: string[];
      try {
        files = await fs.readdir(authorDir);
      } catch {
        // Directory may have been removed/renamed between the top-level
        // listing and this read (or become unreadable) — skip it rather
        // than failing the whole gallery.
        return [];
      }

      return files
        .filter((file) => MEDIA_EXTENSION_RE.test(file))
        .map((file) => ({
          id: `${author}-${file}`,
          src: `/images/gallery/${author}/${file}`,
          author,
        }));
    }),
  );

  return imagesByAuthor.flat();
}
