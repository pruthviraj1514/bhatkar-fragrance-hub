import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { products } from "@/data/products";

interface FeaturedProductsProps {
  title?: string;
  description?: string;
  filterFn?: (product: typeof products[0]) => boolean;
  limit?: number;
}

export function FeaturedProducts({
  title = "Best Sellers",
  description = "Our most loved fragrances, chosen by thousands of customers",
  filterFn = (p) => p.isBestSeller || false,
  limit = 4,
}: FeaturedProductsProps) {
  const filteredProducts = products.filter(filterFn).slice(0, limit);

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              {description}
            </p>
          </div>
          <Button variant="gold-outline" className="mt-6 md:mt-0" asChild>
            <Link to="/shop">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
