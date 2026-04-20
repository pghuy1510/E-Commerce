
import HeroSlider from "@/components/home/HeroSlider";
import ServiceHighlight from "@/components/home/ServiceHighlight";
import FeaturedBook from "@/components/home/FeaturedBook";
import TopCategories from "@/components/home/TopCategories";
import TopProducts from "@/components/home/TopProducts";
import ParallaxBanner from "@/components/home/ParallaxBanner";
import TopRatingProducts from "@/components/home/TopRatingProducts";
import TopSellingProducts from "@/components/home/TopSellingProducts";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="bg-gray-100 min-h-screen">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* SERVICE HIGHLIGHTS */}
      <ServiceHighlight />

      {/* FEATURED BOOKS */}
      <FeaturedBook />

      {/* TOP CATEGORIES */}
      <TopCategories />

      {/* TOP PRODUCTS */}
      <TopProducts />

      {/* PARALLAX BANNER */}
      <ParallaxBanner />

      {/* TOP RATING PRODUCTS */}
      <TopRatingProducts />

      {/* TOP SELLING PRODUCTS */}
      <TopSellingProducts />

    </main>
  );
}
