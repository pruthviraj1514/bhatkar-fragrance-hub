import { motion } from "framer-motion";
import { Droplets, Leaf, Award, Clock } from "lucide-react";

const features = [
  {
    icon: Droplets,
    title: "Premium Oils",
    description:
      "We source only the finest essential oils from around the world, ensuring each fragrance is rich and authentic.",
  },
  {
    icon: Clock,
    title: "Long-Lasting",
    description:
      "Our expertly crafted formulas ensure your fragrance stays with you from morning to night.",
  },
  {
    icon: Leaf,
    title: "Sustainably Sourced",
    description:
      "We're committed to ethical sourcing and environmentally conscious practices in all our processes.",
  },
  {
    icon: Award,
    title: "Made in India",
    description:
      "Proudly crafted in India with traditional techniques passed down through generations.",
  },
];

export function WhyUsSection() {
  return (
    <section className="py-24 bg-charcoal text-ivory relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Why <span className="text-gradient-gold">Bhatkar & Co</span>?
          </h2>
          <p className="text-ivory/70 text-lg max-w-2xl mx-auto">
            For over three decades, we've been perfecting the art of perfumery,
            creating fragrances that tell stories and evoke emotions.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-ivory/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 pt-12 border-t border-ivory/10"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              "100% Authentic Products",
              "No Return Policy",
              "Secure Payments",
            ].map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-2 text-ivory/60 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                {badge}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
