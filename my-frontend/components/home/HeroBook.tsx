"use client";

import Image from "next/image";

export default function HeroBook() {
  return (
    <section className="relative w-full h-[650px] overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <Image
          src="/img/book3.png"
          alt=""
          fill
          className="object-cover blur-[2px] opacity-80"
        />
      </div>

      {/* GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e1b4b]/70 via-[#5b2c6f]/60 to-[#f87171]/50" />

      {/* SHAPE */}
      <div className="absolute right-0 top-0 w-[45%] h-full bg-white/20 backdrop-blur-md clip-slant z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-7xl mx-auto h-full flex items-center px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center w-full">
          {/* LEFT */}
          <div className="text-white pl-24">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-orange-300">
                Editor Choice Best Books
              </span>
              <span className="bg-black text-xs px-2 py-1 rounded">
                Up to 50% Off
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight mb-4">
              <span className="whitespace-nowrap">Your Next Favorite Book</span>
              <br />
              Is Just A{" "}
              <span className="text-orange-400 relative underline-custom">
                Click Away
              </span>
            </h1>

            <p className="text-gray-200 mb-6">
              Sed ac arcu sed felis vulputate molestie.
            </p>

            {/* BUTTONS */}
            <div className="flex gap-4">
              {/* SHOP NOW */}
              <button
                className="
                px-6 py-3 rounded-full
                bg-white text-black
                transition-all duration-300 ease-in-out
                hover:bg-orange-400 hover:text-white
                hover:scale-105 hover:shadow-lg
                active:scale-95
              ">
                Shop Now →
              </button>

              {/* VIEW ALL BOOKS */}
              <button
                className="
                px-6 py-3 rounded-full
                bg-orange-400 text-white
                transition-all duration-300 ease-in-out
                hover:bg-white hover:text-black
                hover:scale-105 hover:shadow-lg
                active:scale-95
              ">
                View All Books →
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative h-[550px] flex items-center justify-center">
            <Image
              src="/img/book8.png"
              alt=""
              width={430}
              height={480}
              className="relative z-20 object-contain animate-float translate-x-20"
              style={{ animationDuration: "4s" }}
            />

            <Image
              src="/img/book5.png"
              alt=""
              width={300}
              height={300}
              className="absolute right-[-300px] top-20 animate-float"
              style={{ animationDelay: "1s" }}
            />
          </div>
        </div>
      </div>

      {/* BOOK LEFT */}
      <Image
        src="/img/book7.png"
        alt=""
        width={350}
        height={400}
        className="absolute left-10 bottom-[-60px] z-20 animate-float"
        style={{ animationDuration: "4s" }}
      />
    </section>
  );
}
