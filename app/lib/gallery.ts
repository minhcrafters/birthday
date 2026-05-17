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

  const images: GalleryImage[] = [];

  for (const author of authors) {
    const authorDir = path.join(galleryDir, author);
    const files = await fs.readdir(authorDir);
    const mediaFiles = files.filter((file) => MEDIA_EXTENSION_RE.test(file));

    for (const file of mediaFiles) {
      images.push({
        id: `${author}-${file}`,
        src: `/images/gallery/${author}/${file}`,
        author,
      });
    }
  }

  return images;
}
