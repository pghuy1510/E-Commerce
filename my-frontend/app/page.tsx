import Header from "@/components/layout/Header";
import HeroSlider from "@/components/home/HeroSlider";
import ServiceHighlight from "@/components/home/ServiceHighlight";
import FeaturedBook from "@/components/home/FeaturedBook";

export default function Home() {
  return (
    <main className="bg-gray-100 min-h-screen">
      {/* HEADER */}
      <Header />

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* SERVICE HIGHLIGHTS */}
      <ServiceHighlight />

      {/* FEATURED BOOKS */}
      <FeaturedBook />

    </main>
  );
}
