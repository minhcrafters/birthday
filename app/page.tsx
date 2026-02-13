import Experience from './components/Experience';
import { SoundProvider } from './contexts/SoundContext';
import { getGalleryImages } from './lib/gallery';

export default async function Home() {
  const images = await getGalleryImages();

  return (
    <SoundProvider>
      <Experience galleryImages={images} />
    </SoundProvider>
  );
}
