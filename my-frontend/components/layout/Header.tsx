"use client";

import {
  Search,
  Heart,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  Phone,
  User,
} from "lucide-react";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFacebook } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { cartAPI, getBrowserToken, wishlistAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function Header() {
  const { language, currency, setLanguage, setCurrency, t, translateCategory } =
    usePreferences();

  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [openLang, setOpenLang] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const router = useRouter();

  const userId = 1;

  /* =========================
     CLOSE DROPDOWN
  ========================= */
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

  /* =========================
     LOAD USER
  ========================= */
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
    if (!session?.backendAccessToken) return;

    Cookies.set("token", session.backendAccessToken, {
      path: "/",
    });
    localStorage.setItem("token", session.backendAccessToken);

    const name = session.user?.name || session.user?.email || "google-user";

    localStorage.setItem("username", name);
    setLocalUsername(name);
  }, [session]);

  const displayName = session?.user?.name || localUsername;

  const languageLabel =
    language === "en" ? t("language.english") : t("language.vietnamese");

  const currencyLabel = currency === "USD" ? "$USD" : "₫VND";

  /* =========================
     CART COUNT
  ========================= */
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
      const status = err?.response?.status;
      const code = err?.code;

      if (status === 401 || code === "AUTH_REQUIRED") {
        setCartCount(0);
        return;
      }

      console.error("Fetch cart count error:", err);
    }
  }, []);

  /* =========================
     WISHLIST COUNT
  ========================= */
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

  /* =========================
     LISTENER
  ========================= */
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

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = async () => {
    Cookies.remove("token", { path: "/" });

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setLocalUsername(null);
    setCartCount(0);
    setWishlistCount(0);

    if (session) {
      await signOut({
        callbackUrl: "/login",
      });

      return;
    }

    router.push("/login");
  };

  /* =========================
     SEARCH
  ========================= */
  const handleSearch = () => {
    const keyword = searchQuery.trim();

    if (keyword) {
      router.push(`/shop?search=${encodeURIComponent(keyword)}`);

      return;
    }

    router.push("/shop");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">
      {/* =========================
          TOP BAR
      ========================= */}
      <div className="flex items-center justify-between bg-gray-100 px-10 py-2 text-sm">
        <div className="flex items-center gap-6 text-gray-600">
          <span className="flex items-center gap-2">
            <FaFacebook className="h-4 w-4 text-yellow-600" />
            {t("header.followers", {
              count: "7.5k",
            })}
          </span>

          <div className="h-4 w-px bg-gray-300" />

          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-yellow-600" />
            +84 971 599 019
          </span>
        </div>

        <div className="flex items-center gap-6 text-gray-600">
          {/* LANGUAGE */}
          <div ref={langRef} className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();

                setOpenLang(!openLang);
                setOpenCurrency(false);
              }}
              className="flex cursor-pointer items-center gap-1 hover:text-yellow-600">
              {languageLabel}

              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  openLang ? "rotate-180" : ""
                }`}
              />
            </div>

            {openLang && (
              <div className="absolute right-0 z-50 mt-2 w-32 rounded bg-white shadow-md">
                <div
                  onClick={() => {
                    setLanguage("en");
                    setOpenLang(false);
                  }}
                  className="group relative cursor-pointer px-4 py-2">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    {t("language.english")}
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>

                <div
                  onClick={() => {
                    setLanguage("vi");
                    setOpenLang(false);
                  }}
                  className="group relative cursor-pointer px-4 py-2">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    {t("language.vietnamese")}
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
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
              className="flex cursor-pointer items-center gap-1 hover:text-yellow-600">
              {currencyLabel}

              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  openCurrency ? "rotate-180" : ""
                }`}
              />
            </div>

            {openCurrency && (
              <div className="absolute right-0 z-50 mt-2 w-28 rounded bg-white shadow-md">
                <div
                  onClick={() => {
                    setCurrency("USD");
                    setOpenCurrency(false);
                  }}
                  className="group relative cursor-pointer px-4 py-2">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    $USD
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>

                <div
                  onClick={() => {
                    setCurrency("VND");
                    setOpenCurrency(false);
                  }}
                  className="group relative cursor-pointer px-4 py-2">
                  <span className="transition-colors duration-200 group-hover:text-yellow-600">
                    ₫VND
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>
              </div>
            )}
          </div>

          {/* USER */}
          {displayName ? (
            <div className="group relative cursor-pointer">
              <div className="flex items-center gap-2 hover:text-yellow-600">
                <User className="h-5 w-5" />

                <span className="font-medium">{displayName}</span>

                <ChevronDown size={16} />
              </div>

              <div className="invisible absolute right-0 z-50 mt-3 w-40 rounded bg-white opacity-0 shadow-lg transition-all duration-300 group-hover:visible group-hover:opacity-100">
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:text-yellow-600">
                  {t("header.profile")}
                </Link>

                <Link
                  href="/orders"
                  className="block px-4 py-2 hover:text-yellow-600">
                  {t("header.orders")}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:text-red-500">
                  {t("header.logout")}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="cursor-pointer hover:text-yellow-600">
              {t("header.logIn")}
            </Link>
          )}
        </div>
      </div>

      <div className="h-[1px] w-full bg-gray-200" />

      {/* =========================
          NAVBAR
      ========================= */}
      <div className="flex items-center justify-between px-10 py-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-full bg-yellow-600 p-3">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>

          <span className="text-2xl font-bold text-gray-900">E-Commerce</span>
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-8 font-medium text-gray-700 md:flex">
          {/* HOME */}
          <Link
            href="/"
            className="group relative transition hover:text-yellow-600">
            {t("nav.home")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* SHOP */}
          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-1 transition hover:text-yellow-600">
              {t("nav.shop")}

              <ChevronDown size={16} />
            </div>

            {/* MEGA MENU */}
            <div className="invisible absolute left-1/2 top-10 z-50 w-[720px] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-3 gap-8 p-8">
                {/* CATEGORY */}
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900">
                    {t("nav.categories")}
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
                        className="block text-sm text-gray-600 transition hover:text-yellow-600">
                        {translateCategory(item)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* FEATURED */}
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900">
                    {t("nav.featured")}
                  </h3>

                  <div className="space-y-3">
                    {[
                      {
                        name: "New Arrivals",
                        href: "/new-arrivals",
                      },
                      {
                        name: "Best Sellers",
                        href: "/best-sellers",
                      },
                      {
                        name: "Trending",
                        href: "/shop",
                      },
                      {
                        name: "Top Rated",
                        href: "/shop",
                      },
                      {
                        name: "Limited Edition",
                        href: "/shop",
                      },
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block text-sm text-gray-600 transition hover:text-yellow-600">
                        {translateCategory(item.name)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* PROMO */}
                <div className="flex flex-col justify-between rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-yellow-700">
                      {t("nav.specialOffer")}
                    </p>

                    <h2 className="text-xl font-bold leading-snug text-gray-900">
                      {t("nav.summerSale")}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      {t("nav.upTo50Selected")}
                    </p>
                  </div>

                  <Link
                    href="/shop"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-700">
                    {t("action.shopNowPlain")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* NEW ARRIVALS */}
          <Link
            href="/new-arrivals"
            className="group relative transition hover:text-yellow-600">
            {t("nav.newArrivals")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* BEST SELLERS */}
          <Link
            href="/best-sellers"
            className="group relative transition hover:text-yellow-600">
            {t("nav.bestSellers")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* CONTACT */}
          <Link
            href="/contact"
            className="group relative transition hover:text-yellow-600">
            {t("nav.contact")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-yellow-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-5">
          {/* SEARCH */}
          <div className="hidden w-[260px] items-center rounded-full border border-gray-300 bg-gray-100 px-4 py-2 lg:flex">
            <input
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />

            <button type="button" onClick={handleSearch}>
              <Search size={18} className="text-gray-500" />
            </button>
          </div>

          {/* WISHLIST */}
          <Link href="/wishlist" className="relative">
            <Heart className="h-5 w-5 cursor-pointer text-gray-700 transition hover:text-yellow-600" />

            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-xs text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* CART */}
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 cursor-pointer text-gray-700 transition hover:text-yellow-600" />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
