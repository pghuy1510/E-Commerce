"use client";

import Image from "next/image";

export default function ParallaxBanner() {
  return (
    <section className="w-full max-w-[1330px] mx-auto px-4 mt-20">
      <div className="relative h-[400px] rounded-2xl overflow-hidden">
        {/* 🔥 BACKGROUND FIXED */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/img/sale.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", // 👈 KEY CHÍNH
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B5E3C]/60 via-[#a9745b]/50 to-[#d2a48c]/40" />

        {/* CONTENT (scroll bình thường) */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-lg mb-2 tracking-wide">Get 25% OFF</p>

          <h2 className="text-3xl md:text-5xl font-bold leading-snug max-w-3xl">
            Discount In All <br />
            Kind Of Super Selling
          </h2>

          <button className="relative mt-8 overflow-hidden bg-white text-[#8B5E3C] px-8 py-3 rounded-full text-sm font-medium group">
            <span className="absolute inset-0 bg-[#8B5E3C] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>

            <span className="relative z-10 group-hover:text-white transition">
              Shop Now →
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
