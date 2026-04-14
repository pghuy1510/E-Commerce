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
import HeroMouse from "./HeroMouse";
import HeroComputer from "./HeroComputer";

export default function HeroSlider() {

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

        {/* Slide 5: Mouse */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroMouse />
        </SwiperSlide>

        {/* Slide 6: Computer */}
        <SwiperSlide className="!relative !h-full overflow-hidden">
          <HeroComputer />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
