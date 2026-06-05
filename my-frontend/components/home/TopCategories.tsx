"use client";

import Image from "next/image";
import { Book } from "lucide-react";
import { useState, useEffect } from "react";
import { usePreferences } from "@/lib/i18n";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

/* ===== TYPE ===== */
type Category =
  | "Books"
  | "Shoes"
  | "Clothing"
  | "Computers"
  | "Phones"
  | "Mouse"
  | "Keyboard";

type Props = {
  activeCategory?: Category | null;
  onSelectCategory?: (category: Category | null) => void;
  onHoverCategory?: (category: Category | null) => void;
};

/* ===== DATA ===== */
const categories: { name: Category; image: string }[] = [
  { name: "Shoes", image: "/img/shoe.jpg" },
  { name: "Clothing", image: "/img/clothing.jpg" },
  { name: "Computers", image: "/img/computer.webp" },
  { name: "Phones", image: "/img/phone.jpg" },
  { name: "Mouse", image: "/img/mouse.jpg" },
  { name: "Keyboard", image: "/img/keyboard.jpg" },
];

export default function TopCategories({
  activeCategory,
  onSelectCategory,
  onHoverCategory,
}: Props) {
  const [localActive, setLocalActive] = useState<Category | null>(null);
  const active = activeCategory !== undefined ? activeCategory : localActive;
  const [isMobile, setIsMobile] = useState(false);
  const { t, translateCategory } = usePreferences();

  /* Sync local active state if parent state changes */
  useEffect(() => {
    if (activeCategory !== undefined) {
      setLocalActive(activeCategory);
    }
  }, [activeCategory]);

  /* ✅ detect mobile để fix parallax */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelect = (category: Category) => {
    const nextActive = active === category ? null : category;
    if (activeCategory === undefined) {
      setLocalActive(nextActive);
    }
    onSelectCategory?.(nextActive);
    onHoverCategory?.(nextActive);
  };

  return (
    <section className="relative w-full mt-16">
      {/* 🔥 PARALLAX BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: isMobile ? "scroll" : "fixed", // 👈 key
        }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-[1330px] mx-auto px-4 py-20 text-center">
        {/* ICON */}
        <div className="flex justify-center mb-4">
          <Book className="text-brand-primary w-8 h-8" />
        </div>

        {/* TITLE */}
        <h2 className="text-3xl font-bold text-white mb-12">
          {t("topCategories.title")}
        </h2>

        {/* SWIPER */}
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={2}
          breakpoints={{
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 6 },
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={800}
          loop>
          {categories.map((item) => {
            const isActive = active === item.name;

            return (
              <SwiperSlide key={item.name}>
                <div
                  className="group cursor-pointer animate-none"
                  onClick={() => handleSelect(item.name)}>
                  {/* CARD */}
                  <div
                    className={`rounded-xl p-4 flex flex-col items-center justify-between h-[180px] relative transition-all duration-300
                    ${
                      isActive
                        ? "bg-brand-primary text-white shadow-xl scale-105"
                        : "bg-brand-primary-light text-brand-text hover:bg-brand-primary hover:scale-105 hover:text-white"
                    }`}>
                    {/* IMAGE */}
                    <div className="w-[100px] h-[110px] flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={100}
                        height={110}
                        className="object-contain max-h-full transition group-hover:scale-110"
                      />
                    </div>

                    {/* BADGE */}
                    <span
                      className={`absolute bottom-3 text-xs px-3 py-1 rounded
                      ${
                        isActive
                          ? "bg-white text-brand-primary font-semibold"
                          : "bg-brand-primary text-white"
                      }`}>
                      {t("topCategories.badge")}
                    </span>
                  </div>

                  {/* NAME */}
                  <p
                    className={`mt-3 text-sm font-medium text-center transition
                    ${
                      isActive
                        ? "text-brand-primary-light font-semibold"
                        : "text-white group-hover:text-brand-primary-light"
                    }`}>
                    {translateCategory(item.name)}
                  </p>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
