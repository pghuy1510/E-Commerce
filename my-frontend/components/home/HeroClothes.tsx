"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HeroClothes() {
  const router = useRouter();

  return (
    <section className="w-full h-full grid grid-cols-1 md:grid-cols-2">
      {/* Left */}
      <div
        onClick={() => router.push("/clothes/men")}
        className="relative cursor-pointer group overflow-hidden">
        <Image
          src="/img/clothes1.avif"
          alt="women"
          fill
          className="object-cover object-[center_0%] scale-95 group-hover:scale-100 transition duration-500"
        />
      </div>

      {/* Right */}
      <div
        onClick={() => router.push("/clothes/women")}
        className="relative cursor-pointer group overflow-hidden">
        <Image
          src="/img/clothes2.avif"
          alt="men"
          fill
          className="object-cover object-[center_0%] scale-95 group-hover:scale-100 transition duration-500"
        />
      </div>
    </section>
  );
}
