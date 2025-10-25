import { motion } from 'framer-motion';
import { TrendingUp, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Hero section with animated price ticker and CTAs
export const HeroTicker = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        {/* Main heading with neon glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-4">
            <span className="neon-green">PRICE</span>
            <span className="neon-purple">GUESS</span>
          </h1>
          <div className="text-xl md:text-2xl text-muted-foreground font-mono">
            [ ENCRYPTED PREDICTION TERMINAL ]
          </div>
        </motion.div>

        {/* Animated price display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="border-2 neon-border rounded-lg p-8 bg-card/50 backdrop-blur-sm inline-block pulse-glow"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <TrendingUp className="w-8 h-8 text-secondary" />
            <span className="text-4xl md:text-6xl font-mono font-bold text-secondary">
              $42,879.24
            </span>
          </div>
          <div className="text-sm text-muted-foreground font-mono">BTC/USD LIVE</div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 text-sm"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <span>FHE Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" />
            <span>Real-time Data</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <span>On-chain Settlements</span>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/terminal">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg px-8 border-2 border-secondary neon-border">
              ENTER TERMINAL
            </Button>
          </Link>
          <Link to="/positions">
            <Button size="lg" variant="outline" className="border-2 border-accent text-accent hover:bg-accent/10 font-bold text-lg px-8">
              VIEW POSITIONS
            </Button>
          </Link>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-muted-foreground max-w-2xl mx-auto font-mono text-sm"
        >
          Predict cryptocurrency price ranges with fully encrypted bets. Your predictions remain private until settlement through FHE technology.
        </motion.p>
      </div>
    </section>
  );
};
