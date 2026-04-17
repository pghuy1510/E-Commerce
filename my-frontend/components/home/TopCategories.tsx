"use client";

import Image from "next/image";
import { Book } from "lucide-react";
import { useState } from "react";

/* ===== TYPE ===== */
type Category =
  | "Unicorn Erna"
  | "Castle In The Sky"
  | "UX Research"
  | "Safe Home"
  | "Grow Flower";

type Props = {
  onHoverCategory?: (category: Category) => void;
};

/* ===== DATA ===== */
const categories: { name: Category; image: string }[] = [
  { name: "Unicorn Erna", image: "/books/book4.jpg" },
  { name: "Castle In The Sky", image: "/books/book6.jpg" },
  { name: "UX Research", image: "/books/book3.jpg" },
  { name: "Safe Home", image: "/books/book7.jpg" },
  { name: "Grow Flower", image: "/books/book2.jpg" },
];

/* ===== COMPONENT ===== */
export default function TopCategories({ onHoverCategory }: Props) {
  const [active, setActive] = useState<Category | null>(null);

  const handleSelect = (category: Category) => {
    setActive(category);
    onHoverCategory?.(category);
  };

  return (
    <section className="relative w-full mt-16">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg-book.jpg"
          alt="background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* ICON */}
        <div className="flex justify-center mb-4">
          <Book className="text-orange-400 w-8 h-8" />
        </div>

        {/* TITLE */}
        <h2 className="text-3xl font-bold text-white mb-12">
          Top Categories Book
        </h2>

        {/* LIST */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {categories.map((item) => {
            const isActive = active === item.name;

            return (
              <div
                key={item.name}
                className="group cursor-pointer"
                onMouseEnter={() => handleSelect(item.name)}
                onClick={() => handleSelect(item.name)} // mobile support
              >
                {/* CARD */}
                <div
                  className={`
                    rounded-xl p-4 flex flex-col items-center relative
                    transition-all duration-300
                    ${
                      isActive
                        ? "bg-yellow-600 shadow-xl scale-105"
                        : "bg-white hover:bg-yellow-600 hover:scale-105"
                    }
                  `}>
                  {/* IMAGE */}
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={90}
                    height={120}
                    className="object-contain transition duration-300 group-hover:scale-110"
                  />

                  {/* BADGE */}
                  <span
                    className={`
                      absolute bottom-3 text-xs px-3 py-1 rounded transition
                      ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-yellow-600 text-white"
                      }
                    `}>
                    25 Books
                  </span>
                </div>

                {/* NAME */}
                <p
                  className={`
                    mt-3 text-sm font-medium transition
                    ${
                      isActive
                        ? "text-yellow-600"
                        : "text-white group-hover:text-yellow-300"
                    }
                  `}>
                  {item.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
