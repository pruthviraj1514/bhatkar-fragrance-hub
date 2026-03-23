import { motion, useTransform } from 'framer-motion';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import Bhatkarlogo from '@/assets/Bhatkarlogo.png';
import bottleSvg from '@/assets/bottle.svg';

export function ParallaxBottleSection() {
  const scrollY = useScrollPosition();

  // Define the scroll range for the animation (0 to 1000px scroll)
  const bottleY = useTransform(scrollY, [0, 1000], [0, -400]);
  const bottleScale = useTransform(scrollY, [0, 800], [1, 0.3]);
  const bottleOpacity = useTransform(scrollY, [700, 1000], [1, 0]);
  const logoOpacity = useTransform(scrollY, [800, 1000], [0, 1]);
  const logoScale = useTransform(scrollY, [800, 1000], [0.3, 1]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted">
      {/* Bottle Animation */}
      <motion.div
        style={{
          y: bottleY,
          scale: bottleScale,
          opacity: bottleOpacity,
        }}
        className="absolute z-10"
      >
        <img
          src={bottleSvg}
          alt="Bhatkar Fragrance Bottle"
          className="w-32 h-64 object-contain"
        />
      </motion.div>

      {/* Logo that appears after bottle shrinks */}
      <motion.div
        style={{
          opacity: logoOpacity,
          scale: logoScale,
        }}
        className="absolute z-20"
      >
        <img
          src={Bhatkarlogo}
          alt="Bhatkar & Co. Logo"
          className="w-48 h-auto"
        />
      </motion.div>

      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/20 rounded-full blur-xl" />
      </div>
    </section>
  );
}