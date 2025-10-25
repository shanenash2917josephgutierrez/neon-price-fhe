import { motion } from 'framer-motion';
import { Shield, Clock, Bot, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Feature matrix showcasing key platform capabilities
export const FeatureMatrix = () => {
  const features = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'All predictions encrypted with FHE technology. Your strategy stays hidden until settlement.',
      color: 'text-accent',
      delay: 0.1,
    },
    {
      icon: Clock,
      title: 'Real-time Oracle',
      description: 'Live price feeds from Coingecko and Binance. Sub-second updates for accurate predictions.',
      color: 'text-secondary',
      delay: 0.2,
    },
    {
      icon: Bot,
      title: 'Autonomous Settlement',
      description: 'Smart contracts automatically settle predictions. No intermediaries, no delays.',
      color: 'text-accent',
      delay: 0.3,
    },
    {
      icon: BarChart3,
      title: 'Visual Analytics',
      description: 'Interactive charts and range visualization. Track market movements in real-time.',
      color: 'text-secondary',
      delay: 0.4,
    },
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
            <span className="neon-purple">SYSTEM</span>{' '}
            <span className="neon-green">CAPABILITIES</span>
          </h2>
          <p className="text-muted-foreground font-mono">
            [ ADVANCED PREDICTION INFRASTRUCTURE ]
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
            >
              <Card className="border-2 border-border hover:border-secondary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm h-full group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm font-mono">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
