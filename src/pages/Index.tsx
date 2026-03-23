import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import OrthodonticsSection from "@/components/OrthodonticsSection";
import WhatsAppSection from "@/components/WhatsAppSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <OrthodonticsSection />
      <WhatsAppSection />
      <Footer />
    </div>
  );
};

export default Index;
