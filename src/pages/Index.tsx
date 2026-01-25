import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CollectionsSection } from "@/components/home/CollectionsSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CollectionsSection />
      <FeaturedProducts
        title="Best Sellers"
        description="Our most loved fragrances, chosen by thousands of customers"
        filterFn={(p) => p.isBestSeller || false}
        limit={4}
      />
      <WhyUsSection />
      <FeaturedProducts
        title="New Arrivals"
        description="Fresh additions to our collection, crafted with the latest trends"
        filterFn={(p) => p.isNewArrival || false}
        limit={4}
      />
      <TestimonialsSection />
      <NewsletterSection />
    </Layout>
  );
};

export default Index;
