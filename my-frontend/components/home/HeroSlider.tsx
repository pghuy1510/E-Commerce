"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import Image from "next/image";
import HeroBook from "./HeroBook";
import HeroVideo from "./HeroShoe";
import HeroClothes from "./HeroClothes";
import HeroPhone from "./HeroPhone";

export default function HeroSlider() {
  const banners = ["/img/book1.jpg", "/img/book2.jpg", "/img/book3.png"];

  return (
    <div className="w-full h-[650px] overflow-hidden bg-black">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 7000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        loop
        className="h-full">
        {/* Slide 1 */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroBook />
        </SwiperSlide>

        {/* Slide 2 */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroVideo />
        </SwiperSlide>

        {/* Slide 3: Clothes */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroClothes />
        </SwiperSlide>

        {/* Slide 4: Phone */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroPhone />
        </SwiperSlide>

        {/* Slide 3+ */}
        {banners.map((img, index) => (
          <SwiperSlide
            key={index}
            className="!relative !h-full overflow-hidden">
            <div className="relative w-full h-full">
              <Image src={img} alt="" fill className="object-cover" />

              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-0 flex flex-col justify-center items-start px-10 text-white z-10">
                <h1 className="text-5xl font-bold mb-4">Big Sale</h1>
                <p className="mb-4">Up to 70% Off</p>
                <button className="bg-orange-400 px-6 py-3 rounded-full">
                  Shop Now
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
