import { DigitalRain } from '@/components/DigitalRain';
import { HeroTicker } from '@/components/landing/HeroTicker';
import { FeatureMatrix } from '@/components/landing/FeatureMatrix';
import { DataPartnersSection } from '@/components/landing/DataPartnersSection';

// Landing page showcasing PriceGuess platform
const Landing = () => {
  return (
    <div className="relative min-h-screen">
      <DigitalRain />
      <main className="relative z-10">
        <HeroTicker />
        <FeatureMatrix />
        <DataPartnersSection />
      </main>
    </div>
  );
};

export default Landing;
