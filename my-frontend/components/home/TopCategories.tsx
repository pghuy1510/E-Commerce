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
  onHoverCategory?: (category: Category | null) => void;
};

/* ===== DATA ===== */
const categories: { name: Category; image: string }[] = [
  { name: "Books", image: "/img/book.jpg" },
  { name: "Shoes", image: "/img/shoe.jpg" },
  { name: "Clothing", image: "/img/clothing.jpg" },
  { name: "Computers", image: "/img/computer.webp" },
  { name: "Phones", image: "/img/phone.jpg" },
  { name: "Mouse", image: "/img/mouse.jpg" },
  { name: "Keyboard", image: "/img/keyboard.jpg" },
];

export default function TopCategories({ onHoverCategory }: Props) {
  const [active, setActive] = useState<Category | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { t, translateCategory } = usePreferences();

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
    setActive(category);
    onHoverCategory?.(category);
  };

  return (
    <section
      className="relative w-full mt-16"
      onMouseLeave={() => {
        setActive(null);
        onHoverCategory?.(null);
      }}>
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
          <Book className="text-orange-400 w-8 h-8" />
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
                  className="group cursor-pointer"
                  onMouseEnter={() => handleSelect(item.name)}
                  onClick={() => handleSelect(item.name)}>
                  {/* CARD */}
                  <div
                    className={`rounded-xl p-4 flex flex-col items-center justify-between h-[180px] relative transition-all duration-300
                    ${
                      isActive
                        ? "bg-yellow-600 shadow-xl scale-105"
                        : "bg-white hover:bg-yellow-600 hover:scale-105"
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
                          ? "bg-white text-black"
                          : "bg-yellow-600 text-white"
                      }`}>
                      {t("topCategories.badge")}
                    </span>
                  </div>

                  {/* NAME */}
                  <p
                    className={`mt-3 text-sm font-medium text-center transition
                    ${
                      isActive
                        ? "text-yellow-600"
                        : "text-white group-hover:text-yellow-300"
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
