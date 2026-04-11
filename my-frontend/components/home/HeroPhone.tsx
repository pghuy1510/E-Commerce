"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HeroPhone() {
  const router = useRouter();

  return (
    <section
      onClick={() => router.push("/phones/iphone")}
      className="w-full h-full flex flex-col items-center justify-center 
      bg-gradient-to-t from-[#d6c7b3] to-[#f5f1ea] 
      cursor-pointer overflow-hidden group">
      {/* PHONE */}
      <div className="relative z-10 mb-6">
        <Image
          src="/img/mobile2.png"
          alt="phone"
          width={500}
          height={600}
          className="object-contain scale-90 group-hover:scale-100 transition duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
        />
      </div>

      {/* TEXT */}
      <div className="text-center text-[#2c2c2c] px-6">
        <p className="uppercase text-sm tracking-widest opacity-60 mb-2">
          New collection
        </p>

        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          High-end smartphones
        </h1>

        <p className="text-[#6b6b6b]">
          Luxurious design • Powerful performance • Good prices every day
        </p>
      </div>

      {/* GLOW */}
      <div className="absolute bottom-20 w-[300px] h-[300px] bg-[#cbbba5]/40 blur-3xl rounded-full" />
    </section>
  );
}
