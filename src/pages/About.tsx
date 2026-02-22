import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { COMPANY_INFO } from "@/config/company";

export default function About() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-16 md:py-24 border-b border-border/50"
        >
          <div className="container max-w-4xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              About Bhatkar & Co
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to Bhatkar & Co, where tradition meets luxury in the world of fine perfumery.
            </p>
          </div>
        </motion.section>

        {/* Company Information */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="py-16 md:py-24 border-b border-border/50"
        >
          <div className="container max-w-4xl">
            <h2 className="font-display text-3xl font-bold mb-8">Our Story</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Founded with a passion for exquisite fragrances, Bhatkar & Co has been dedicated to 
                bringing the finest scents from around the world to discerning customers. Our commitment 
                to quality, authenticity, and customer satisfaction has made us a trusted name in the 
                perfume industry.
              </p>
              <p>
                Each fragrance in our collection is carefully curated, selected for its exceptional 
                quality and unique character. We believe that a good perfume is more than just a scent—
                it's a story, a memory, and a reflection of one's personality.
              </p>
              <p>
                Our expert team is passionate about helping you find the perfect fragrance that resonates 
                with your individual style. Whether you're looking for a classic signature scent or 
                something bold and contemporary, we're here to guide you through your fragrance journey.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="py-16 md:py-24 border-b border-border/50"
        >
          <div className="container max-w-4xl">
            <h2 className="font-display text-3xl font-bold mb-8">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">Quality</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality. Every product is authentic and sourced from trusted suppliers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  Our commitment to excellence extends from product selection to customer service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Trust</h3>
                <p className="text-muted-foreground">
                  Building lasting relationships with our customers is at the heart of everything we do.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contact & Location Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="py-16 md:py-24"
        >
          <div className="container max-w-4xl">
            <h2 className="font-display text-3xl font-bold mb-12">Contact Us</h2>
            
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Phone</h3>
                    <p className="text-muted-foreground">
                      <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-primary transition-colors">
                        {COMPANY_INFO.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Email</h3>
                    <p className="text-muted-foreground">
                      <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-primary transition-colors">
                        {COMPANY_INFO.email}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Address</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {COMPANY_INFO.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Map */}
              <div className="h-96 rounded-lg overflow-hidden border border-border shadow-sm">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.7280944156434!2d72.8478!3d19.0176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9f5f7f7f7f7%3A0x7f7f7f7f7f7f7f7f!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1234567890"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bhatkar & Co Location"
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border/50">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Business Hours
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                <div>
                  <p className="mb-2">Monday - Friday: 10:00 AM - 7:00 PM</p>
                  <p>Saturday: 10:00 AM - 6:00 PM</p>
                </div>
                <div>
                  <p className="mb-2">Sunday: 12:00 PM - 6:00 PM</p>
                  <p>Holidays: Closed</p>
                </div>
              </div>
            </div>

            {/* Mobile Quick Contact Buttons */}
            <div className="flex flex-col gap-3 mt-6 md:hidden">
              <a 
                href={`tel:${COMPANY_INFO.phone}`}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </a>
              <a 
                href={`mailto:${COMPANY_INFO.email}`}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
              >
                <Mail className="h-5 w-5" />
                Email Us
              </a>
            </div>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
