"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import Image from "next/image";
import HeroBook from "./HeroBook";

export default function HeroSlider() {
const banners = ["/img/book1.jpg", "/img/book2.jpg", "/img/book3.png"];

  return (
    <div className="w-full h-[650px]">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        loop
        className="h-full">
        {/* 🔥 Slide 1: Hero sách giữ nguyên */}
        <SwiperSlide>
          <HeroBook />
        </SwiperSlide>

        {/* 🔥 Slide 2+ */}
        {banners.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              <Image src={img} alt="" fill className="object-cover" />

              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-0 flex flex-col justify-center items-start px-10 text-white">
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
