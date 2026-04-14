"use client";

import Image from "next/image";

export default function HeroBook() {
  return (
    <section className="relative w-full h-full overflow-hidden">
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
      <div className="relative z-10 max-w-7xl mx-auto h-full flex items-center px-6">
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
              Thousands of books. One perfect choice for you.
            </p>

            <div className="flex gap-4">
              <button
                className="
                  relative overflow-hidden
                  px-6 py-3 rounded-full
                  bg-white text-black
                  transition-all duration-300
                  group
                ">
                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                  Shop Now →
                </span>

                {/* nền chạy từ phải sang trái */}
                <span
                  className="
                    absolute left-0 top-0 h-full w-0
                    bg-orange-400
                    transition-all duration-300
                    group-hover:w-full
                    z-0
                  "
                />
              </button>

              <button
                className="
                  relative overflow-hidden
                  px-6 py-3 rounded-full
                  bg-orange-400 text-white
                  transition-all duration-300
                  group
                ">
                <span className="relative z-10 group-hover:text-black transition-colors duration-300">
                  View All Books →
                </span>

                <span
                  className="
                    absolute left-0 top-0 h-full w-0
                    bg-white
                    transition-all duration-300
                    group-hover:w-full
                    z-0
                  "
                />
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
              className="relative z-10 object-contain animate-float-x"
            />

            <Image
              src="/img/book5.png"
              alt=""
              width={300}
              height={300}
              className="absolute right-[-220px] top-20 animate-float"
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
        className="absolute left-10 bottom-[-60px] z-10 animate-float"
      />
    </section>
  );
}
