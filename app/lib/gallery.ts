import fs from 'fs';
import path from 'path';
import { GalleryImage } from '../data/galleryData';

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const galleryDir = path.join(process.cwd(), 'public', 'images', 'gallery');
  
  if (!fs.existsSync(galleryDir)) {
    return [];
  }

  const authors = fs.readdirSync(galleryDir).filter(file => 
    fs.statSync(path.join(galleryDir, file)).isDirectory()
  );

  const images: GalleryImage[] = [];

  for (const author of authors) {
    const authorDir = path.join(galleryDir, author);
    const files = fs.readdirSync(authorDir).filter(file => 
      /\.(png|jpg|jpeg|svg|webp)$/i.test(file)
    );

    // Sort files to ensure stable order if needed, but not strictly required
    // Assuming 1.svg, 2.svg etc, numeric sort might be nice
    // files.sort((a, b) => {
    //     const numA = parseInt(a) || 0;
    //     const numB = parseInt(b) || 0;
    //     if (numA && numB) return numA - numB;
    //     return a.localeCompare(b);
    // });

    files.forEach(file => {
      images.push({
        id: `${author}-${file}`, 
        src: `/images/gallery/${author}/${file}`,
        author: author,
      });
    });
  }

  return images;
}
