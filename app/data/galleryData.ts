export interface GalleryImage {
  id: string;
  src: string;
  author: string;
  width?: number;
  height?: number;
}

export interface GalleryLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  images: GalleryImage[];
}

const generateImages = (location: string, count: number): GalleryImage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${location}-${i + 1}`,
    // Use picsum for realistic placeholder photography
    // Use seed to ensure consistent images for the same ID
    src: `https://picsum.photos/seed/${location}-${i + 1}/800/600`,
    author: `Member from ${location}`,
  }));
};

export const galleryLocations: GalleryLocation[] = [
  {
    id: 'england',
    name: 'England',
    lat: 51.5074,
    lng: -0.1278,
    images: generateImages('england', 6),
  },
  {
    id: 'india',
    name: 'India',
    lat: 28.6139,
    lng: 77.2090,
    images: generateImages('india', 6),
  },
  {
    id: 'taiwan',
    name: 'Taiwan',
    lat: 25.0330,
    lng: 121.5654,
    images: generateImages('taiwan', 6),
  },
  {
    id: 'vietnam',
    name: 'Vietnam',
    lat: 21.0285,
    lng: 105.8542,
    images: generateImages('vietnam', 6),
  },
];
