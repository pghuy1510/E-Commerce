"use client";

import { useRef, useState } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleToggle = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <section className="relative w-full h-full overflow-hidden">
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover">
        <source src="/video/Adv_shoe.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CONTENT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center z-10 px-6">
        <p className="uppercase text-sm tracking-widest mb-2 opacity-80">
          Sneaker Trend
        </p>

        <h1 className="text-6xl font-extrabold mb-4">STEP INTO STYLE</h1>

        <p className="max-w-xl text-gray-200 mb-6">
          Discover the shoes that are making waves this year.
        </p>

        <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition">
          Shop
        </button>
      </div>

      {/* CONTROL */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-10">
        <button
          onClick={handleToggle}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:scale-110 transition">
          {isPlaying ? "❚❚" : "▶"}
        </button>
      </div>
    </section>
  );
}
