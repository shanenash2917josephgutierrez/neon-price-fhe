import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RangeSelectorProps {
  currentPrice: number;
  onRangeSelect: (lower: number, upper: number) => void;
}

// Range selector for price predictions with validation
export const RangeSelector = ({ currentPrice, onRangeSelect }: RangeSelectorProps) => {
  const [lowerBound, setLowerBound] = useState<string>('');
  const [upperBound, setUpperBound] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const lower = parseFloat(lowerBound);
    const upper = parseFloat(upperBound);

    // Validation
    if (isNaN(lower) || isNaN(upper)) {
      setError('Please enter valid numbers');
      return;
    }

    if (lower >= upper) {
      setError('Lower bound must be less than upper bound');
      return;
    }

    if (lower <= 0 || upper <= 0) {
      setError('Bounds must be positive values');
      return;
    }

    setError('');
    onRangeSelect(lower, upper);
  };

  const spread = upperBound && lowerBound ? 
    ((parseFloat(upperBound) - parseFloat(lowerBound)) / parseFloat(lowerBound) * 100).toFixed(2) : 
    '0.00';

  return (
    <Card className="border-2 border-secondary/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          PRICE RANGE PREDICTION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current price display */}
        <div className="border-2 neon-border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground font-mono mb-1">CURRENT PRICE</div>
          <div className="text-3xl font-bold text-secondary font-mono price-flicker">
            ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Range inputs */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lower" className="font-mono text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent" />
              LOWER BOUND
            </Label>
            <Input
              id="lower"
              type="number"
              step="0.01"
              placeholder="e.g. 40000"
              value={lowerBound}
              onChange={(e) => setLowerBound(e.target.value)}
              className="font-mono border-2 border-muted focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upper" className="font-mono text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              UPPER BOUND
            </Label>
            <Input
              id="upper"
              type="number"
              step="0.01"
              placeholder="e.g. 45000"
              value={upperBound}
              onChange={(e) => setUpperBound(e.target.value)}
              className="font-mono border-2 border-muted focus:border-secondary"
            />
          </div>
        </div>

        {/* Spread indicator */}
        {lowerBound && upperBound && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-lg p-3 bg-muted/20 text-center"
          >
            <div className="text-xs text-muted-foreground font-mono mb-1">RANGE SPREAD</div>
            <div className="text-xl font-bold text-secondary font-mono">{spread}%</div>
          </motion.div>
        )}

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-destructive rounded-lg p-3 bg-destructive/10 text-center"
          >
            <p className="text-sm text-destructive font-mono">{error}</p>
          </motion.div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!lowerBound || !upperBound}
          className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold border-2 border-secondary neon-border"
        >
          SET PREDICTION RANGE
        </Button>
      </CardContent>
    </Card>
  );
};
