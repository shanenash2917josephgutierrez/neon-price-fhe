import { DigitalRain } from '@/components/DigitalRain';
import { PositionTable } from '@/components/terminal/PositionTable';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Positions page displaying historical predictions
const Positions = () => {
  return (
    <div className="relative min-h-screen">
      <DigitalRain />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-4 border-secondary text-secondary hover:bg-secondary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="neon-purple">MY</span>{' '}
            <span className="neon-green">POSITIONS</span>
          </h1>
          <p className="text-muted-foreground font-mono">
            [ ENCRYPTED PREDICTION HISTORY ]
          </p>
        </div>

        {/* Positions table */}
        <div className="max-w-6xl">
          <PositionTable />
        </div>
      </div>
    </div>
  );
};

export default Positions;
