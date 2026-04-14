"use client";

import { useRef, useState } from "react";

export default function HeroMouse() {
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
    <section className="relative w-full h-[650px] overflow-hidden">
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover">
        <source src="/video/mouse.mp4" type="video/mp4" />
      </video>

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/30" />

      {/* RGB */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full animate-rgb bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 opacity-30 mix-blend-overlay" />
      </div>

      {/* GLOW */}
      <div className="absolute w-[400px] h-[400px] bg-purple-500/30 blur-[120px] rounded-full top-20 left-1/2 -translate-x-1/2" />

      {/* CONTENT */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Ultimate Gaming Mouse
        </h1>

        <p className="text-gray-300 mb-6 text-lg">
          Precision. Speed. RGB Power.
        </p>

        {/* BUTTON SHOP */}
        <button
          className="
            relative overflow-hidden
            px-8 py-3 rounded-full
            bg-white text-black
            transition-all duration-300
            group
          ">
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">
            Shop Now →
          </span>

          <span
            className="
              absolute left-0 top-0 h-full w-0
              bg-purple-400
              transition-all duration-300
              group-hover:w-full
              z-0
            "
          />
        </button>
      </div>

      {/* PLAY/PAUSE */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={handleToggle}
          className="
            w-12 h-12 rounded-full
            bg-white/80 backdrop-blur
            flex items-center justify-center
            text-black
            hover:scale-110 transition
          ">
          {isPlaying ? "❚❚" : "▶"}
        </button>
      </div>
    </section>
  );
}
