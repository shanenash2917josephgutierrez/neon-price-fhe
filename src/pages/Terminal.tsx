import { useState } from 'react';
import { DigitalRain } from '@/components/DigitalRain';
import { RangeSelector } from '@/components/terminal/RangeSelector';
import { BetPanel } from '@/components/terminal/BetPanel';
import { useTerminalStore } from '@/store/terminalStore';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Trading terminal for placing encrypted predictions
const Terminal = () => {
  const { currentPrice, setRange } = useTerminalStore();
  const [selectedRange, setSelectedRange] = useState<{ lower: number; upper: number } | null>(null);

  const handleRangeSelect = (lower: number, upper: number) => {
    setRange(lower, upper);
    setSelectedRange({ lower, upper });
  };

  const handlePlaceBet = async (amount: number) => {
    // This would integrate with actual FHE encryption and smart contract
    console.log('Placing bet:', { ...selectedRange, amount });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
  };

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
            <span className="neon-green">PREDICTION</span>{' '}
            <span className="neon-purple">TERMINAL</span>
          </h1>
          <p className="text-muted-foreground font-mono">
            [ ENCRYPTED RANGE BETTING INTERFACE ]
          </p>
        </div>

        {/* Trading interface */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
          <RangeSelector 
            currentPrice={currentPrice}
            onRangeSelect={handleRangeSelect}
          />
          
          {selectedRange && (
            <BetPanel
              lowerBound={selectedRange.lower}
              upperBound={selectedRange.upper}
              onPlaceBet={handlePlaceBet}
            />
          )}
        </div>

        {!selectedRange && (
          <div className="lg:col-start-2 max-w-6xl mt-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-card/30">
              <p className="text-muted-foreground font-mono">
                Set your prediction range to enable betting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
