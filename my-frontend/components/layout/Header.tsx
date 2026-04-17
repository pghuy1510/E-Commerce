"use client";

import {
  Search,
  Heart,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { FaFacebook } from "react-icons/fa";

export default function Header() {
  const [lang, setLang] = useState("ENGLISH");
  const [currency, setCurrency] = useState("USD");

  const [openLang, setOpenLang] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  // click ngoài để đóng
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !langRef.current?.contains(e.target as Node) &&
        !currencyRef.current?.contains(e.target as Node)
      ) {
        setOpenLang(false);
        setOpenCurrency(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-md">
      {/* TOP BAR */}
      <div className="bg-gray-100 text-sm py-2 px-10 flex justify-between items-center">
        <div className="flex gap-6 text-gray-600">
          <span className="flex items-center gap-2">
            <FaFacebook className="w-4 h-4 text-yellow-600" />
            7.5k Followers
          </span>

          <div className="h-4 w-px bg-gray-300"></div>

          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-yellow-600" />
            +84 971 599 019
          </span>
        </div>

        <div className="flex gap-6 text-gray-600 items-center">
          {/* LANGUAGE */}
          <div ref={langRef} className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpenLang(!openLang);
                setOpenCurrency(false);
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-600">
              {lang}
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  openLang ? "rotate-180" : ""
                }`}
              />
            </div>

            {openLang && (
              <div className="absolute right-0 mt-2 w-32 bg-white shadow-md rounded z-50">
                {/* ENGLISH */}
                <div
                  onClick={() => {
                    setLang("ENGLISH");
                    setOpenLang(false);
                  }}
                  className="relative px-4 py-2 cursor-pointer group">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    English
                  </span>

                  {/* line */}
                  <span className="absolute left-4 bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>

                {/* VIETNAMESE */}
                <div
                  onClick={() => {
                    setLang("VIETNAMESE");
                    setOpenLang(false);
                  }}
                  className="relative px-4 py-2 cursor-pointer group">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    Tiếng Việt
                  </span>

                  <span className="absolute left-4 bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>
              </div>
            )}
          </div>

          {/* CURRENCY */}
          <div ref={currencyRef} className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpenCurrency(!openCurrency);
                setOpenLang(false);
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-600">
              ${currency}
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  openCurrency ? "rotate-180" : ""
                }`}
              />
            </div>

            {openCurrency && (
              <div className="absolute right-0 mt-2 w-28 bg-white shadow-md rounded z-50">
                {/* USD */}
                <div
                  onClick={() => {
                    setCurrency("USD");
                    setOpenCurrency(false);
                  }}
                  className="relative px-4 py-2 cursor-pointer group">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    $USD
                  </span>

                  <span className="absolute left-4 bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>

                {/* VND */}
                <div
                  onClick={() => {
                    setCurrency("VND");
                    setOpenCurrency(false);
                  }}
                  className="relative px-4 py-2 cursor-pointer group">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    ₫VND
                  </span>

                  <span className="absolute left-4 bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>
              </div>
            )}
          </div>

          {/* LOGIN */}
          <Link href="/login" className="hover:text-yellow-600 cursor-pointer">
            LOG IN
          </Link>
        </div>
      </div>

      <div className="h-[1px] bg-gray-200 w-full"></div>

      {/* NAVBAR */}
      <div className="flex items-center justify-between px-10 py-4">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="bg-yellow-600 p-3 rounded-full">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-gray-900">E-Commerce</span>
        </div>

        {/* MENU */}
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <Link href="/" className="hover:text-yellow-600">
            Home
          </Link>
          <div className="relative group">
            {/* SHOP */}
            <span className="cursor-pointer hover:text-yellow-600 flex items-center gap-1">
              Shop
              <ChevronDown size={16} />
            </span>

            {/* DROPDOWN */}
            <div className="absolute left-0 mt-3 w-56 bg-white shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="py-3">
                {[
                  "Books",
                  "Shoes",
                  "Clothing",
                  "Computers",
                  "Phones",
                  "Mouse",
                  "Keyboard",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="px-6 py-2 cursor-pointer relative group/item">
                    {/* TEXT */}
                    <span className="transition-colors duration-200 group-hover/item:text-yellow-600">
                      {item}
                    </span>

                    {/* LINE ANIMATION */}
                    <span className="absolute left-6 bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover/item:w-[calc(100%-48px)]"></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <a href="#" className="hover:text-yellow-600">
            Pages
          </a>
          <a href="#" className="hover:text-yellow-600">
            Blog
          </a>
          <a href="#" className="hover:text-yellow-600">
            Contact
          </a>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-5">
          {/* SEARCH */}
          <div className="hidden lg:flex items-center bg-gray-100 border border-gray-300 px-4 py-2 rounded-full w-[260px]">
            <input
              placeholder="Search for Products..."
              className="bg-transparent outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
            />
            <Search size={18} className="text-gray-500" />
          </div>

          {/* ICONS */}
          <Link href="/wishlist">
            <Heart className="w-5 h-5 text-gray-700 cursor-pointer hover:text-yellow-600 transition" />
          </Link>

          <Link href="/cart" className="relative">
            <ShoppingCart className="w-5 h-5 text-gray-700 cursor-pointer hover:text-yellow-600 transition" />
            <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              2
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
