"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function FeaturedBooks() {
  const products = [
    {
      id: 1,
      title: "How Deal With Very Bad BOOK",
      price: 39,
      author: "Esther",
      image: "/books/book1.jpg",
    },
    {
      id: 2,
      title: "The Hidden Mystery Behind",
      price: 29,
      author: "Hawkins",
      image: "/books/book2.jpg",
    },
    {
      id: 3,
      title: "Qple GPad With Retina Sisplay",
      price: 19,
      author: "Albert",
      image: "/books/book3.jpg",
      discount: "-12%",
    },
    {
      id: 4,
      title: "Flovely And Unicorn Erna",
      price: 30,
      author: "Alexander",
      image: "/books/book4.jpg",
    },
    {
      id: 5,
      title: "Simple Things You To Save BOOK",
      price: 30,
      oldPrice: 39.99,
      author: "Wilson",
      image: "/books/book5.jpg",
      hot: true,
      discount: "-30%",
    },
    {
      id: 6,
      title: "Flovely ",
      price: 30,
      author: "Alexander",
      image: "/books/book6.jpg",
    }
  ];

  return (
    <section className="w-full flex justify-center mt-16">
      <div className="w-full max-w-7xl px-4 md:px-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Books</h2>

          <button className="relative overflow-hidden bg-[#eee0d9] text-yellow-600 px-5 py-2 rounded-full text-sm group">
            <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              Explore More →
            </span>
          </button>
        </div>

        {/* SLIDER */}
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={2}
          breakpoints={{
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={800}
          loop>
          {products.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="group">
                {/* CARD */}
                <div className="bg-[#eee0d9] rounded-xl p-4 relative">
                  {/* DISCOUNT */}
                  {item.discount && (
                    <span className="absolute top-3 left-3 bg-orange-400 text-white text-xs px-2 py-1 rounded">
                      {item.discount}
                    </span>
                  )}

                  {/* HOT */}
                  {item.hot && (
                    <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded">
                      Hot
                    </span>
                  )}

                  {/* IMAGE */}
                  <div className="flex justify-center">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={120}
                      height={160}
                      className="object-contain group-hover:scale-105 transition"
                    />
                  </div>
                </div>

                {/* INFO */}
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-500">Design Low Book</p>

                  <h3 className="text-sm font-semibold text-gray-800 leading-snug">
                    {item.title}
                  </h3>

                  {/* PRICE */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      ${item.price.toFixed(2)}
                    </span>

                    {item.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ${item.oldPrice}
                      </span>
                    )}
                  </div>

                  {/* AUTHOR + RATING */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{item.author}</span>

                    <div className="flex gap-1 text-orange-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button className="relative w-full mt-3 overflow-hidden bg-[#eee0d9] text-yellow-600 text-sm py-2 rounded-full group">
                    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                      Add To Cart
                    </span>
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
