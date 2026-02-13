export interface GalleryImage {
  id: string;
  src: string;
  author?: string; // Made optional
  width?: number;
  height?: number;
}

// Images are now loaded dynamically via app/lib/gallery.ts

