import { Layout } from "@/components/layout/Layout";
import { ParallaxBottleSection } from "@/components/home/ParallaxBottleSection";
import { HeroSection } from "@/components/home/HeroSection";
import { CollectionsSection } from "@/components/home/CollectionsSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";

const Index = () => {
  return (
    <Layout>
      <ParallaxBottleSection />
      <HeroSection />
      <CollectionsSection />
      <WhyUsSection />
      <TestimonialsSection />
      <NewsletterSection />
    </Layout>
  );
};

export default Index;
