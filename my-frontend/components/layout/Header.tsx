"use client";

import {
  Search,
  Heart,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFacebook } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User } from "lucide-react";
import { cartAPI, getBrowserToken, wishlistAPI } from "@/lib/api";

export default function Header() {
  const [lang, setLang] = useState("ENGLISH");
  const [currency, setCurrency] = useState("USD");
  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [openLang, setOpenLang] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const userId = 1;

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

  useEffect(() => {
    const token = Cookies.get("token");
    const storedUsername = localStorage.getItem("username");

    if (token && storedUsername) {
      setLocalUsername(storedUsername);
      return;
    }

    setLocalUsername(null);
  }, []);

  useEffect(() => {
    if (!session?.backendAccessToken) {
      return;
    }

    Cookies.set("token", session.backendAccessToken, { path: "/" });

    const name = session.user?.name || session.user?.email || "google-user";
    localStorage.setItem("username", name);
    setLocalUsername(name);
  }, [session]);

  const displayName = session?.user?.name || localUsername;

  const refreshCartCount = useCallback(async () => {
    if (!getBrowserToken()) {
      setCartCount(0);
      return;
    }

    try {
      const res = await cartAPI.get();
      const items = res.data?.items ?? [];
      const count = items.reduce(
        (sum: number, item: { quantity?: number }) =>
          sum + (item.quantity ?? 0),
        0,
      );
      setCartCount(count);
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        setCartCount(0);
        return;
      }

      console.error("Fetch cart count error:", err);
    }
  }, []);

  const refreshWishlistCount = useCallback(async () => {
    try {
      const data = await wishlistAPI.get(userId);
      const count = Array.isArray(data)
        ? data.length
        : (data?.items?.length ?? 0);
      setWishlistCount(count);
    } catch (err) {
      console.error("Fetch wishlist count error:", err);
    }
  }, [userId]);

  useEffect(() => {
    refreshCartCount();
    refreshWishlistCount();
  }, [refreshCartCount, refreshWishlistCount, session]);

  useEffect(() => {
    const handleCartUpdated = () => {
      refreshCartCount();
    };
    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("wishlist-updated", handleWishlistUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("wishlist-updated", handleWishlistUpdated);
    };
  }, [refreshCartCount, refreshWishlistCount]);

  const handleLogout = async () => {
    Cookies.remove("token", { path: "/" });
    localStorage.removeItem("username");
    setLocalUsername(null);
    setCartCount(0);
    setWishlistCount(0);

    if (session) {
      await signOut({ callbackUrl: "/login" });
      return;
    }

    router.push("/login");
  };

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
          {displayName ? (
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2 hover:text-yellow-600">
                <User className="w-5 h-5" />
                <span className="font-medium">{displayName}</span>
                <ChevronDown size={16} />
              </div>

              {/* DROPDOWN */}
              <div className="absolute right-0 mt-3 w-40 bg-white shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:text-yellow-600">
                  Profile
                </Link>

                <Link
                  href="/orders"
                  className="block px-4 py-2 hover:text-yellow-600">
                  Orders
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:text-red-500">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="hover:text-yellow-600 cursor-pointer">
              LOG IN
            </Link>
          )}
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
        <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          {/* HOME */}
          <Link
            href="/"
            className="relative hover:text-yellow-600 transition group">
            Home
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* SHOP */}
          <div className="relative group">
            <div className="cursor-pointer hover:text-yellow-600 flex items-center gap-1 transition">
              Shop
              <ChevronDown size={16} />
            </div>

            {/* MEGA MENU */}
            <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[780px] bg-white shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100">
              <div className="grid grid-cols-4 gap-8 p-8">
                {/* CATEGORY */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
                    Categories
                  </h3>

                  <div className="space-y-3">
                    {[
                      "Men Fashion",
                      "Women Fashion",
                      "Sneakers",
                      "Sports Shoes",
                      "Accessories",
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href={`/shop?category=${item}`}
                        className="block text-sm text-gray-600 hover:text-yellow-600 transition">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* FEATURED */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
                    Featured
                  </h3>

                  <div className="space-y-3">
                    {[
                      "New Arrivals",
                      "Best Sellers",
                      "Trending",
                      "Top Rated",
                      "Limited Edition",
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href="/shop"
                        className="block text-sm text-gray-600 hover:text-yellow-600 transition">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CUSTOMER */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
                    Customer
                  </h3>

                  <div className="space-y-3">
                    {[
                      "Track Order",
                      "Wishlist",
                      "Cart",
                      "My Account",
                      "Order History",
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href="/"
                        className="block text-sm text-gray-600 hover:text-yellow-600 transition">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* PROMO */}
                <div className="bg-yellow-50 rounded-2xl p-5 flex flex-col justify-between border border-yellow-100">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-yellow-700 mb-2">
                      Special Offer
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 leading-snug">
                      Summer Sale
                    </h2>

                    <p className="text-sm text-gray-600 mt-2">
                      Up to 50% off selected products.
                    </p>
                  </div>

                  <Link
                    href="/shop"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* NEW ARRIVALS */}
          <Link
            href="/new-arrivals"
            className="relative hover:text-yellow-600 transition group">
            New Arrivals
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* BEST SELLERS */}
          <Link
            href="/best-sellers"
            className="relative hover:text-yellow-600 transition group">
            Best Sellers
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* BLOG */}
          <Link
            href="/blog"
            className="relative hover:text-yellow-600 transition group">
            Blog
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* CONTACT */}
          <Link
            href="/contact"
            className="relative hover:text-yellow-600 transition group">
            Contact
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>
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
          <Link href="/wishlist" className="relative">
            <Heart className="w-5 h-5 text-gray-700 cursor-pointer hover:text-yellow-600 transition" />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link href="/cart" className="relative">
            <ShoppingCart className="w-5 h-5 text-gray-700 cursor-pointer hover:text-yellow-600 transition" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
