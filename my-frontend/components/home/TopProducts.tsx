"use client";

export default function BannerGrid() {
  return (
    <section className="w-full max-w-[1330px] mx-auto px-4 mt-20">
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT BANNER */}
        <div className="relative h-[300px] rounded-2xl overflow-hidden">
          {/* BG */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/img/banner-left.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-8 text-white">
            <p className="text-sm mb-2">Limited Offer</p>

            <h3 className="text-2xl md:text-3xl font-bold leading-snug">
              Up To 50% Off <br />
              All Books
            </h3>

            <button className="mt-5 w-fit bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:scale-105 transition">
              Shop Now →
            </button>
          </div>
        </div>

        {/* RIGHT BANNER */}
        <div className="relative h-[300px] rounded-2xl overflow-hidden">
          {/* BG */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/img/banner-right.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B5E3C]/70 to-[#00000040]" />

          {/* content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-8 text-white">
            <p className="text-sm mb-2">New Collection</p>

            <h3 className="text-2xl md:text-3xl font-bold leading-snug">
              Discover Your <br />
              Next Favorite Book
            </h3>

            <button className="mt-5 w-fit bg-yellow-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:scale-105 transition">
              Explore →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
