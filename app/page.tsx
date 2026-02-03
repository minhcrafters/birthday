import Experience from './components/Experience';
import { SoundProvider } from './contexts/SoundContext';

export default function Home() {
  return (
    <SoundProvider>
      <Experience />
    </SoundProvider>
  );
}
