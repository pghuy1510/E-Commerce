"use client";

import { Search, Heart, ShoppingCart } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full">
      {/* TOP BAR */}
      <div className="bg-gray-100 text-sm py-2 px-6 flex justify-between">
        <div className="flex gap-6 text-gray-600">
          <span>7500k Followers</span>
          <span>+84 971 599 019</span>
        </div>

        <div className="flex gap-4 text-gray-600">
          <span>ENGLISH</span>
          <span>$USD</span>
          <span>LOG IN</span>
        </div>
      </div>

      {/* NAVBAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        {/* Logo */}
        <div className="text-2xl font-bold flex items-center gap-2">
          📚 <span>E-Commerce</span>
        </div>

        {/* Menu */}
        <nav className="hidden md:flex gap-6 text-gray-700">
          <a href="#">Home</a>
          <a href="#">Shop</a>
          <a href="#">Pages</a>
          <a href="#">Blog</a>
          <a href="#">Contact</a>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center border px-3 py-1 rounded-full">
            <input
              placeholder="Search for Products..."
              className="outline-none text-sm"
            />
            <Search size={16} />
          </div>

          <Heart />
          <ShoppingCart />
        </div>
      </div>
    </header>
  );
}
