"use client";

import {
  Search,
  Heart,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  Phone,
  User,
  Package,
  Languages,
} from "lucide-react";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFacebook } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cartAPI, wishlistAPI, userProfileAPI, categoryAPI, type Category } from "@/lib/api";
import { getBrowserToken, setAuthToken, logoutExpiredSession } from "@/lib/auth-token";
import { normalizeCartItems } from "@/lib/cart";
import { usePreferences } from "@/lib/i18n";
import { isTokenExpired } from "@/lib/jwt";

export default function Header() {
  const { language, setLanguage, t, translateCategory } =
    usePreferences();

  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const [openLang, setOpenLang] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  // Fetch categories once on mount
  useEffect(() => {
    categoryAPI.getAll()
      .then((data) => {
        const filtered = (data || []).filter(
          (cat) => cat.name !== "Books" && cat.name !== "Mouse" && cat.name !== "Keyboard"
        );
        setDbCategories(filtered);
      })
      .catch((err) => {
        console.error("Error fetching categories in header:", err);
      });
  }, []);

  const { data: session } = useSession();
  const router = useRouter();

  const userId = 1;

  /* =========================
     CLOSE DROPDOWN
  ========================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) {
        setOpenLang(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* =========================
     LOAD USER
  ========================= */
  useEffect(() => {
    const token = getBrowserToken();
    const storedUsername = localStorage.getItem("username");

    if (token) {
      if (storedUsername) {
        setLocalUsername(storedUsername);
      }
      userProfileAPI.get()
        .then((profile) => {
          const name = profile.username || profile.email || "User";
          localStorage.setItem("username", name);
          setLocalUsername(name);
          setUserRole(profile.role || "user");
        })
        .catch((err) => {
          if (err.code === "TOKEN_EXPIRED") {
            void logoutExpiredSession();
          } else if (err.response?.status === 401 || err.code === "AUTH_REQUIRED") {
            setAuthToken(null);
            localStorage.removeItem("username");
            setLocalUsername(null);
            setUserRole(null);
          } else {
            console.error("Error fetching user profile in header:", err);
          }
        });
      return;
    }

    setLocalUsername(null);
    setUserRole(null);
  }, []);

  useEffect(() => {
    if (!session) {
      if (!getBrowserToken()) {
        setLocalUsername(null);
        setUserRole(null);
      }
      return;
    }

    if (!session.backendAccessToken) return;

    if (isTokenExpired(session.backendAccessToken)) {
      void logoutExpiredSession();
      return;
    }

    setAuthToken(session.backendAccessToken);

    const name = session.user?.name || session.user?.email || "google-user";

    localStorage.setItem("username", name);
    setLocalUsername(name);

    userProfileAPI.get()
      .then((profile) => {
        setUserRole(profile.role || "user");
      })
      .catch((err) => {
        if (err.code === "TOKEN_EXPIRED") {
          void logoutExpiredSession();
        } else if (err.response?.status === 401 || err.code === "AUTH_REQUIRED") {
          setAuthToken(null);
          localStorage.removeItem("username");
          setLocalUsername(null);
          setUserRole(null);
        } else {
          console.error("Error fetching user profile in header:", err);
        }
      });
  }, [session]);

  const displayName = session?.user?.name || localUsername;

  const languageLabel =
    language === "en" ? t("language.english") : t("language.vietnamese");

  /* =========================
     CART COUNT
  ========================= */
  const refreshCartCount = useCallback(async () => {
    if (!getBrowserToken()) {
      try {
        const localCartStr = localStorage.getItem("guest-cart");
        if (localCartStr) {
          const items = JSON.parse(localCartStr);
          const count = items.reduce(
            (sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 0),
            0,
          );
          setCartCount(count);
          return;
        }
      } catch (e) {
        console.error("Lỗi parse giỏ hàng khách:", e);
      }
      setCartCount(0);
      return;
    }

    try {
      const res = await cartAPI.get();

      const items = normalizeCartItems(res.data);

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
    setAuthToken(null);
    localStorage.removeItem("username");

    setLocalUsername(null);
    setUserRole(null);
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
            <FaFacebook className="h-4 w-4 text-brand-primary" />
            {t("header.followers", {
              count: "7.5k",
            })}
          </span>

          <div className="h-4 w-px bg-gray-300" />

          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-primary" />
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
              }}
              className="flex cursor-pointer items-center gap-2 hover:text-brand-primary">
              <Languages size={16} className="text-brand-primary" />
              <span>{languageLabel}</span>

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
                  <span className="transition-colors duration-200 group-hover:text-brand-primary">
                    {t("language.english")}
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>

                <div
                  onClick={() => {
                    setLanguage("vi");
                    setOpenLang(false);
                  }}
                  className="group relative cursor-pointer px-4 py-2">
                  <span className="transition-colors duration-200 group-hover:text-brand-primary">
                    {t("language.vietnamese")}
                  </span>

                  <span className="absolute bottom-1 left-4 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-[calc(100%-32px)]"></span>
                </div>
              </div>
            )}
          </div>

          {/* TRACK ORDER */}
          <Link
            href={displayName ? "/orders" : "/login"}
            className="group relative hidden md:flex items-center gap-2 font-medium text-gray-600 transition-all duration-200 hover:text-brand-primary"
          >
            <Package
              size={16}
              className="text-brand-primary transition-transform group-hover:translate-x-0.5"
            />
            <span>{t("header.trackOrder")}</span>
            <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-full" />
          </Link>

          {/* USER */}
          {displayName ? (
            <div className="group relative cursor-pointer">
              <div className="flex items-center gap-2 hover:text-brand-primary">
                <User className="h-5 w-5" />

                <span className="font-medium">{displayName}</span>

                <ChevronDown size={16} />
              </div>

              <div className="invisible absolute right-0 z-50 mt-3 w-40 rounded bg-white opacity-0 shadow-lg transition-all duration-300 group-hover:visible group-hover:opacity-100">
                {userRole === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="block px-4 py-2 hover:text-brand-primary transition">
                    {t("header.adminPanel")}
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:text-brand-primary">
                  {t("header.profile")}
                </Link>

                <Link
                  href="/profile/settings"
                  className="block px-4 py-2 hover:text-brand-primary">
                  {t("header.settings")}
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
              className="cursor-pointer hover:text-brand-primary">
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
          <div className="rounded-full bg-brand-primary p-3">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>

          <span className="text-2xl font-bold text-gray-900">E-Commerce</span>
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-8 font-medium text-gray-700 md:flex">
          {/* HOME */}
          <Link
            href="/"
            className="group relative transition hover:text-brand-primary">
            {t("nav.home")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>


          {/* SHOP PRODUCTS */}
          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-1 transition hover:text-brand-primary">
              {t("nav.shopProducts")}

              <ChevronDown size={16} />
            </div>

            {/* MEGA MENU */}
            <div className="invisible absolute left-1/2 top-10 z-50 w-[720px] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-3 gap-8 p-8">
                {/* CATEGORIES */}
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900">
                    {t("nav.categories")}
                  </h3>

                  <div className="space-y-3">
                    {dbCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.name}`}
                        className="block text-sm text-gray-600 transition hover:text-brand-primary">
                        {translateCategory(cat.name)}
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
                        className="block text-sm text-gray-600 transition hover:text-brand-primary">
                        {translateCategory(item.name)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* PROMO */}
                <div className="flex flex-col justify-between rounded-2xl border border-brand-primary-light bg-brand-primary-light/20 p-5">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-brand-primary">
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
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800">
                    {t("action.shopNowPlain")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* NEW ARRIVALS */}
          <Link
            href="/new-arrivals"
            className="group relative transition hover:text-brand-primary">
            {t("nav.newArrivals")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* BEST SELLERS */}
          <Link
            href="/best-sellers"
            className="group relative transition hover:text-brand-primary">
            {t("nav.bestSellers")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* CONTACT */}
          <Link
            href="/contact"
            className="group relative transition hover:text-brand-primary">
            {t("nav.contact")}

            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-brand-primary transition-all duration-300 group-hover:w-full"></span>
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
            <Heart className="h-5 w-5 cursor-pointer text-gray-700 transition hover:text-brand-primary" />

            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* CART */}
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 cursor-pointer text-gray-700 transition hover:text-brand-primary" />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
