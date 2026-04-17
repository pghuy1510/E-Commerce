"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ParallaxBanner() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.25); // chỉnh tốc độ parallax
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-16">
      <div className="relative h-[400px] rounded-2xl overflow-hidden">
        {/* BACKGROUND IMAGE */}
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: "url('/banner.jpg')", // đổi ảnh của bạn
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translateY(${offset}px)`,
            transition: "transform 0.1s linear",
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-orange-500/70" />

        {/* DECOR IMAGE TOP LEFT */}
        <Image
          src="/book-top.png" // ảnh góc trái
          alt="decor"
          width={120}
          height={120}
          className="absolute top-0 left-0"
        />

        {/* DECOR IMAGE BOTTOM RIGHT */}
        <Image
          src="/book-bottom.png" // ảnh góc phải
          alt="decor"
          width={140}
          height={140}
          className="absolute bottom-0 right-0"
        />

        {/* CONTENT */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-lg mb-2">Get 25%</p>

          <h2 className="text-3xl md:text-4xl font-bold leading-snug max-w-2xl">
            Discount In All <br />
            Kind Of Super Selling
          </h2>

          <button className="mt-6 bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:scale-105 transition">
            Shop Now →
          </button>
        </div>
      </div>
    </section>
  );
}
