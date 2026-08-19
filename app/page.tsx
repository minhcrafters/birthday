import Experience from './components/Experience';
import { SoundProvider } from './contexts/SoundContext';
import { getGalleryImages } from './lib/gallery';

export default async function Home() {
  let images: Awaited<ReturnType<typeof getGalleryImages>> = [];
  try {
    images = await getGalleryImages();
  } catch (e) {
    console.error("Failed to load gallery images", e);
  }

  return (
    <SoundProvider>
      <Experience galleryImages={images} />
    </SoundProvider>
  );
}
