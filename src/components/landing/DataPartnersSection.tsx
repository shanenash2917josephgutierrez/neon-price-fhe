import { motion } from 'framer-motion';
import { Database, Link as LinkIcon, Coins } from 'lucide-react';

// Data partners and network integrations section
export const DataPartnersSection = () => {
  const partners = [
    { name: 'Coingecko', type: 'Price Oracle', icon: Coins },
    { name: 'Binance API', type: 'Market Data', icon: Database },
    { name: 'Ethereum', type: 'Settlement Layer', icon: LinkIcon },
    { name: 'Polygon', type: 'Fast Finality', icon: LinkIcon },
  ];

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-green">DATA</span>{' '}
            <span className="neon-purple">INFRASTRUCTURE</span>
          </h2>
          <p className="text-muted-foreground font-mono">
            [ MULTI-SOURCE AGGREGATION ]
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="border-2 border-border hover:border-accent transition-all duration-300 rounded-lg p-6 bg-card/50 backdrop-blur-sm text-center group"
            >
              <div className="flex flex-col items-center gap-3">
                <partner.icon className="w-8 h-8 text-accent group-hover:text-secondary transition-colors duration-300" />
                <div>
                  <div className="font-bold text-foreground mb-1">{partner.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{partner.type}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-block border border-secondary/30 rounded-lg px-6 py-4 bg-card/30 backdrop-blur-sm">
            <p className="text-sm font-mono text-muted-foreground">
              <span className="text-secondary font-bold">99.9%</span> uptime guarantee ·{' '}
              <span className="text-secondary font-bold">&lt;100ms</span> price updates ·{' '}
              <span className="text-secondary font-bold">Multi-chain</span> support
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
