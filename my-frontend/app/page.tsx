import Header from "@/components/layout/Header";
import HeroSlider from "@/components/home/HeroSlider";

export default function Home() {
  return (
    <main className="bg-gray-100 min-h-screen">
      {/* HEADER */}
      <Header />

      {/* HERO SLIDER */}
      <HeroSlider />
    </main>
  );
}
