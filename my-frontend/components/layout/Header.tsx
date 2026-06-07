"use client";

import {
  Search,
  Heart,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Phone,
  User,
  Package,
  Languages,
  Sparkles,
  Flame,
  TrendingUp,
  Star,
  Gem,
} from "lucide-react";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFacebook } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cartAPI, wishlistAPI, userProfileAPI, categoryAPI, productAPI, type Category } from "@/lib/api";
import { getBrowserToken, setAuthToken, logoutExpiredSession } from "@/lib/auth-token";
import { normalizeCartItems } from "@/lib/cart";
import { usePreferences } from "@/lib/i18n";
import { isTokenExpired } from "@/lib/jwt";

export default function Header() {
  const { language, setLanguage, t, translateCategory, formatPrice } =
    usePreferences();

  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const [openLang, setOpenLang] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  const [hoveredFeatured, setHoveredFeatured] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<string>("newest");
  const [isFading, setIsFading] = useState(false);

  // Key-based cache for preview products (with timestamp for 5 minutes TTL)
  const [previewProducts, setPreviewProducts] = useState<Record<string, { products: any[]; fetchedAt: number }>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

  const activeTabRef = useRef<string>("newest");
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL



  const handleFeaturedHover = useCallback(async (type: string) => {
    setHoveredFeatured(type);
    activeTabRef.current = type;

    const cached = previewProducts[type];
    const now = Date.now();

    // If cache is valid (fetched less than 5 minutes ago), use it
    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      return;
    }

    // If already loading this category, don't initiate duplicate request
    if (previewLoading[type]) {
      return;
    }

    setPreviewLoading(prev => ({ ...prev, [type]: true }));
    try {
      // Call API with limit = 3
      const data = await productAPI.getAll({ sortBy: type, limit: 3 } as any);
      
      // Prevent race conditions: only save cache if user is still hovering this tab
      if (activeTabRef.current === type) {
        setPreviewProducts(prev => ({
          ...prev,
          [type]: {
            products: data.slice(0, 3),
            fetchedAt: Date.now(),
          },
        }));
      }
    } catch (err) {
      console.error(`Error fetching preview for ${type}:`, err);
      if (activeTabRef.current === type) {
        setPreviewProducts(prev => ({
          ...prev,
          [type]: {
            products: [],
            fetchedAt: Date.now(), // Cache empty list to avoid spamming failed calls
          },
        }));
      }
    } finally {
      if (activeTabRef.current === type) {
        setPreviewLoading(prev => ({ ...prev, [type]: false }));
      } else {
        setPreviewLoading(prev => ({ ...prev, [type]: false }));
      }
    }
  }, [previewProducts, previewLoading]);

  const handleMenuHover = useCallback(() => {
    // Lazy-load newest products when the main shop products menu item is hovered
    const cached = previewProducts.newest;
    const now = Date.now();
    if (!cached || now - cached.fetchedAt >= CACHE_TTL) {
      void handleFeaturedHover("newest");
    }
  }, [previewProducts, handleFeaturedHover]);



  // Tab change with smooth fade transition
  useEffect(() => {
    const targetTab = hoveredFeatured || "newest";
    if (targetTab === activePreviewTab) return;

    setIsFading(true);
    const timer = setTimeout(() => {
      setActivePreviewTab(targetTab);
      setIsFading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [hoveredFeatured, activePreviewTab]);

  const tabMetadata = {
    newest: {
      icon: Sparkles,
      iconColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
      title: language === "vi" ? "Hàng Mới Về" : "New Arrivals",
      desc: language === "vi" ? "Cập nhật những xu hướng thời trang mới nhất vừa ra mắt." : "Discover the latest products recently added to our collection.",
      subtitle: language === "vi" ? "Sản phẩm mới cập nhật gần đây" : "Latest products added recently",
      badge: language === "vi" ? "Mới" : "New",
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      bannerImage: "/img/banner-left.jpg",
      bannerTitle: language === "vi" ? "Bộ Sưu Tập Mới" : "New Arrivals Collection",
      bannerDesc: language === "vi" ? "Nâng tầm phong cách với các thiết kế độc đáo vừa lên kệ" : "Elevate your style with our latest unique arrivals",
      fallback: language === "vi" ? "Chưa có sản phẩm mới nào." : "No new products available yet.",
      ctaText: language === "vi" ? "→ SHOP NEW ARRIVALS" : "→ SHOP NEW ARRIVALS",
    },
    "best-selling": {
      icon: Flame,
      iconColor: "text-red-500 bg-red-50 border-red-100",
      title: language === "vi" ? "Bán Chạy Nhất" : "Best Sellers",
      desc: language === "vi" ? "Khám phá các sản phẩm được yêu thích nhất bởi khách hàng." : "Explore the products customers love the most.",
      subtitle: language === "vi" ? "Khách hàng mua nhiều nhất" : "Most purchased by customers",
      badge: "Hot",
      badgeColor: "bg-red-50 text-red-600 border-red-100",
      bannerImage: "/img/banner-right.jpg",
      bannerTitle: language === "vi" ? "Bán Chạy Nhất" : "Best Sellers Selection",
      bannerDesc: language === "vi" ? "Những sản phẩm chất lượng cao được săn đón nhiều nhất" : "The most sought-after products loved by everyone",
      fallback: language === "vi" ? "Chưa có sản phẩm bán chạy." : "No best selling products available yet.",
      ctaText: language === "vi" ? "→ VIEW BEST SELLERS" : "→ VIEW BEST SELLERS",
    },
    trending: {
      icon: TrendingUp,
      iconColor: "text-purple-500 bg-purple-50 border-purple-100",
      title: language === "vi" ? "Đang Thịnh Hành" : "Trending Now",
      desc: language === "vi" ? "Các mặt hàng đang thu hút nhiều sự quan tâm nhất lúc này." : "Products gaining the most attention right now.",
      subtitle: language === "vi" ? "Xu hướng cực hot tuần này" : "Trending this week",
      badge: language === "vi" ? "Thịnh Hành" : "Trending",
      badgeColor: "bg-purple-50 text-purple-600 border-purple-100",
      bannerImage: "/img/sale.jpg",
      bannerTitle: language === "vi" ? "Cực Hot Tuần Này" : "Trending This Week",
      bannerDesc: language === "vi" ? "Đón đầu xu hướng thời trang hiện đại cùng E-Commerce" : "Lead the trend with modern lifestyle essentials",
      fallback: language === "vi" ? "Chưa có sản phẩm thịnh hành." : "No trending products available yet.",
      ctaText: language === "vi" ? "→ EXPLORE TRENDS" : "→ EXPLORE TRENDS",
    },
    "top-rated": {
      icon: Star,
      iconColor: "text-amber-500 bg-amber-50 border-amber-100",
      title: language === "vi" ? "Đánh Giá Cao" : "Top Rated",
      desc: language === "vi" ? "Các sản phẩm chất lượng năm sao được bình chọn bởi cộng đồng." : "Highest rated products based on customer reviews.",
      subtitle: language === "vi" ? "Chất lượng năm sao chọn lọc" : "Highest customer satisfaction",
      badge: "4.8+",
      badgeColor: "bg-amber-50 text-amber-600 border-amber-100",
      bannerImage: "/img/book2.jpg",
      bannerTitle: language === "vi" ? "Được Đánh Giá Cao" : "Top Rated Choices",
      bannerDesc: language === "vi" ? "Sự lựa chọn hoàn hảo dựa trên trải nghiệm thực tế" : "The perfect choice backed by real user reviews",
      fallback: language === "vi" ? "Chưa có đánh giá nào." : "No rated products available yet.",
      ctaText: language === "vi" ? "→ SEE TOP RATED" : "→ SEE TOP RATED",
    },
    "limited-edition": {
      icon: Gem,
      iconColor: "text-rose-500 bg-rose-50 border-rose-100",
      title: language === "vi" ? "Phiên Bản Giới Hạn" : "Limited Edition",
      desc: language === "vi" ? "Bộ sưu tập độc quyền với số lượng phát hành hạn chế." : "Rare products with limited availability.",
      subtitle: language === "vi" ? "Hàng hiệu khan hiếm sắp hết" : "Only few left in stock",
      badge: language === "vi" ? "Giới Hạn" : "Limited",
      badgeColor: "bg-rose-50 text-rose-600 border-rose-100",
      bannerImage: "/img/mobile2.png",
      bannerTitle: language === "vi" ? "Săn Ngay Kẻo Hết" : "Limited Edition Stock",
      bannerDesc: language === "vi" ? "Sở hữu ngay các sản phẩm độc quyền số lượng có hạn" : "Secure exclusive items with strictly limited stock",
      fallback: language === "vi" ? "Hiện chưa có phiên bản giới hạn nào còn hàng." : "No limited edition products available yet.",
      ctaText: language === "vi" ? "→ SHOP BEFORE IT'S GONE" : "→ SHOP BEFORE IT'S GONE",
    },
  };



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
          <div className="group relative" onMouseEnter={handleMenuHover}>
            <div className="flex cursor-pointer items-center gap-1 transition hover:text-brand-primary">
              {t("nav.shopProducts")}

              <ChevronDown size={16} />
            </div>

            {/* MEGA MENU */}
            <div className="invisible absolute left-1/2 top-10 z-50 w-[480px] lg:w-[90vw] lg:max-w-[1100px] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                
                {/* LEFT PANEL: 4 columns in lg */}
                <div className="col-span-12 lg:col-span-4">
                  {/* FEATURED COLUMN (Cards) */}
                  <div className="hidden lg:block">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                      {language === "vi" ? "Bộ Sưu Tập Nổi Bật" : "Featured Collections"}
                    </h3>

                    <div className="space-y-3">
                      {Object.entries(tabMetadata).map(([key, item]) => {
                        const isActive = activePreviewTab === key;
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={key}
                            href={`/shop?sort=${key}`}
                            onMouseEnter={() => handleFeaturedHover(key)}
                            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 ${
                              isActive
                                ? "bg-white border-brand-primary/30 shadow-md translate-x-1"
                                : "bg-gray-50/50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md hover:translate-x-1"
                            }`}
                          >
                            <div className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                              isActive ? item.iconColor : 'text-gray-500 bg-gray-100 border-gray-200'
                            }`}>
                              <IconComponent size={18} className="shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-sm font-bold transition-colors truncate ${
                                  isActive ? 'text-brand-primary' : 'text-gray-800'
                                }`}>
                                  {item.title}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-colors shrink-0 ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              </div>
                              <span className="block text-[11px] text-gray-500 truncate mt-0.5">
                                {item.subtitle}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PREVIEW PANEL - Hidden on mobile/tablet, shown on desktop lg - 8 columns */}
                <div className="hidden lg:block lg:col-span-8 lg:w-full">
                  {(() => {
                    const activeMeta = tabMetadata[activePreviewTab as keyof typeof tabMetadata] || tabMetadata.newest;
                    const cacheEntry = previewProducts[activePreviewTab];
                    const products = cacheEntry?.products || [];
                    const isLoading = previewLoading[activePreviewTab];
                    const hasProducts = products.length > 0;
                    const IconComponent = activeMeta.icon;

                    return (
                      <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-6 min-h-[460px] w-full">
                        <div className={`transition-all duration-150 ${isFading ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}>
                          {/* Hero Banner (170px height) */}
                          <div className="relative h-[170px] w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-inner flex items-center px-8">
                            {/* Background image on the right */}
                            <div className="absolute inset-0 z-0">
                              {activeMeta.bannerImage && (
                                <img
                                  src={activeMeta.bannerImage}
                                  alt={activeMeta.bannerTitle}
                                  className="absolute right-0 top-0 h-full w-2/3 object-cover object-center"
                                />
                              )}
                              {/* Premium gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-transparent" />
                            </div>

                            {/* Text content */}
                            <div className="relative z-10 max-w-[55%] text-left">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg border ${activeMeta.iconColor} shrink-0`}>
                                  <IconComponent size={12} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d8b48f]">
                                  {activeMeta.title}
                                </span>
                              </div>
                              <h4 className="mt-2 text-lg lg:text-xl font-bold text-white leading-tight">
                                {activeMeta.bannerTitle}
                              </h4>
                              <p className="mt-1 text-xs text-neutral-300 leading-relaxed line-clamp-2">
                                {activeMeta.desc}
                              </p>
                            </div>
                          </div>

                          {/* Product Preview Grid (3 horizontal cards) */}
                          <div className="mt-5">
                            {isLoading ? (
                              // Loading Skeletons
                              <div className="grid grid-cols-3 gap-4 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100">
                                    <div className="h-20 w-20 rounded-xl bg-gray-200" />
                                    <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
                                  </div>
                                ))}
                              </div>
                            ) : hasProducts ? (
                              <div className="grid grid-cols-3 gap-4">
                                {products.map((prod) => (
                                  <Link
                                    key={prod.id}
                                    href={`/product/${prod.id}`}
                                    className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 hover:-translate-y-1 border border-transparent hover:border-gray-200/40 transition-all duration-300 group/prod text-center"
                                  >
                                    {/* Product Image (80x80) */}
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200/50 flex items-center justify-center relative">
                                      {prod.image ? (
                                        <img
                                          src={prod.image}
                                          alt={prod.name}
                                          className="h-full w-full object-cover transition duration-300 group-hover/prod:scale-105"
                                        />
                                      ) : (
                                        <ShoppingBag size={24} className="text-gray-400" />
                                      )}
                                    </div>

                                    {/* Product Name */}
                                    <h4 className="mt-3 text-sm font-medium text-gray-800 group-hover/prod:text-brand-primary transition duration-150 line-clamp-2 h-10 flex items-center justify-center">
                                      {prod.name}
                                    </h4>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              // Empty Fallback
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Search size={32} className="text-gray-300 mb-3" />
                                <p className="text-xs font-semibold text-gray-400 leading-relaxed max-w-[200px]">
                                  {activeMeta.fallback}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Full-width CTA Button (56px height, pill shape) */}
                        <Link
                          href={`/shop?sort=${activePreviewTab}`}
                          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-primary text-sm font-bold text-white shadow-lg shadow-brand-primary/10 transition-all duration-300 hover:bg-[#8e643a] hover:shadow-xl hover:shadow-brand-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                        >
                          <span>{activeMeta.ctaText}</span>
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-1 transition hover:text-brand-primary">
              {language === "vi" ? "Danh Mục" : "Categories"}
              <ChevronDown size={16} />
            </div>

            {/* Dropdown Menu */}
            <div className="invisible absolute left-0 top-6 z-50 w-48 rounded-2xl border border-gray-100 bg-white p-3 opacity-0 shadow-xl transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-2">
              <div className="space-y-1">
                {dbCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.name}`}
                    className="block rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition"
                  >
                    {translateCategory(cat.name)}
                  </Link>
                ))}
              </div>
            </div>
          </div>



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
