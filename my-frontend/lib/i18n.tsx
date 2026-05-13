"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "vi";
export type Currency = "USD" | "VND";

const DEFAULT_LANGUAGE: Language = "en";
const DEFAULT_CURRENCY: Currency = "USD";
const USD_TO_VND = 25000;

const translations: Record<Language, Record<string, string>> = {
  en: {
    "language.english": "English",
    "language.vietnamese": "Vietnamese",
    "header.followers": "{count} Followers",
    "header.logIn": "LOG IN",
    "header.logout": "Logout",
    "header.profile": "Profile",
    "header.orders": "Orders",
    "header.searchPlaceholder": "Search for Products...",
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.newArrivals": "New Arrivals",
    "nav.bestSellers": "Best Sellers",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.categories": "Categories",
    "nav.featured": "Featured",
    "nav.customer": "Customer",
    "nav.trackOrder": "Track Order",
    "nav.wishlist": "Wishlist",
    "nav.cart": "Cart",
    "nav.myAccount": "My Account",
    "nav.orderHistory": "Order History",
    "nav.specialOffer": "Special Offer",
    "nav.summerSale": "Summer Sale",
    "nav.upTo50Selected": "Up to 50% off selected products.",
    "nav.trending": "Trending",
    "nav.topRated": "Top Rated",
    "nav.limitedEdition": "Limited Edition",
    "action.shopNow": "Shop Now →",
    "action.shopNowPlain": "Shop Now",
    "action.shop": "Shop",
    "action.exploreMore": "Explore More →",
    "action.viewMoreBooks": "View More Books →",
    "action.explore": "Explore →",
    "action.addToCart": "Add To Cart",
    "action.placeOrder": "Place Order",
    "action.proceedToCheckout": "Proceed To Checkout",
    "action.subscribe": "Subscribe",
    "action.loginUpper": "LOGIN",
    "action.registerUpper": "REGISTER",
    "action.signUp": "Sign up",
    "action.login": "Login",
    "action.continueWithGoogle": "Continue with Google",
    "action.or": "OR",
    "action.viewAllBooks": "View All Books →",
    "label.stock": "Stock: {count}",
    "label.category": "Category",
    "label.price": "Price",
    "label.quantity": "Quantity",
    "label.subtotal": "Subtotal",
    "label.product": "Product",
    "label.total": "Total",
    "label.shipping": "Shipping",
    "label.free": "Free",
    "label.inStock": "In Stock",
    "label.outOfStock": "Out of Stock",
    "label.inStockOnly": "In Stock Only",
    "label.availability": "Availability:",
    "label.recommendation": "Recommendation",
    "label.relatedProducts": "Related Products",
    "label.customerReviews": "({count} Customer Reviews)",
    "label.loading": "Loading...",
    "label.loadingProducts": "Loading products...",
    "label.loadingCart": "Loading cart...",
    "label.loadingProduct": "Loading product...",
    "label.productNotFound": "Product not found",
    "label.cartEmpty": "Cart is empty",
    "cart.cartTotalTitle": "Cart Total",
    "label.wishlist": "Wishlist",
    "label.shopDetails": "Shop Details",
    "label.shop": "Shop",
    "label.home": "Home",
    "label.checkout": "Checkout",
    "label.billingDetails": "Billing Details",
    "label.yourOrder": "Your Order",
    "label.paymentCashOnDelivery": "Cash on Delivery",
    "label.paymentBankTransfer": "Bank Transfer",
    "label.orderNotesOptional": "Order Notes (optional)",
    "label.fullName": "Full Name",
    "label.phone": "Phone",
    "label.email": "Email",
    "label.address": "Address",
    "label.search": "Search",
    "label.searchHere": "Search here",
    "label.categories": "Categories",
    "label.productStatus": "Product Status",
    "label.filterByPrice": "Filter By Price",
    "label.showingCount": "Showing {count} products",
    "label.sortDefault": "Default",
    "label.sortPriceAsc": "Price ↑",
    "label.sortPriceDesc": "Price ↓",
    "label.noProductsFound": "No products found matching your filters",
    "productDetails.noRelated": "No related products found.",
    "shop.loadError": "Failed to load products",
    "label.categoryFallback": "N/A",
    "label.inStockWithCount": "In Stock ({count})",
    "label.outOfStockShort": "Out of Stock",
    "label.stockShort": "Stock",
    "footer.questionsCall": "Got Questions? Call us",
    "footer.customersSupport": "Customers Support",
    "footer.storeList": "Store List",
    "footer.openingHours": "Opening Hours",
    "footer.contactUs": "Contact Us",
    "footer.returnPolicy": "Return Policy",
    "footer.categories": "Categories",
    "footer.category.novelBooks": "Novel Books",
    "footer.category.poetryBooks": "Poetry Books",
    "footer.category.politicalBooks": "Political Books",
    "footer.category.historyBooks": "History Books",
    "footer.subscribeTitle": "Subscribe.",
    "footer.subscribeTagline": "Our conversation is just getting started",
    "footer.emailPlaceholder": "Enter Your Email",
    "footer.followUs": "Follow Us On",
    "footer.copyright": "© {year} E-Commerce. All rights reserved.",
    "heroBook.editorChoice": "Editor Choice Best Books",
    "heroBook.upTo50Off": "Up to 50% Off",
    "heroBook.titleLine1": "Your Next Favorite Book",
    "heroBook.titleLine2Prefix": "Is Just A",
    "heroBook.titleLine2Highlight": "Click Away",
    "heroBook.subtitle": "Thousands of books. One perfect choice for you.",
    "heroShoe.trend": "Sneaker Trend",
    "heroShoe.title": "STEP INTO STYLE",
    "heroShoe.subtitle": "Discover the shoes that are making waves this year.",
    "heroPhone.newCollection": "New collection",
    "heroPhone.title": "High-end smartphones",
    "heroPhone.subtitle":
      "Luxurious design • Powerful performance • Good prices every day",
    "heroMouse.title": "Ultimate Gaming Mouse",
    "heroMouse.subtitle": "Precision. Speed. RGB Power.",
    "heroComputer.tag": "New Generation Laptop",
    "heroComputer.titleLine1": "Power Meets",
    "heroComputer.titleLine2": "Performance",
    "heroComputer.subtitle":
      "Experience ultra-fast performance with the latest technology.",
    "service.returnRefundTitle": "Return & Refund",
    "service.returnRefundDesc": "Money back guarantee",
    "service.securePaymentTitle": "Secure Payment",
    "service.securePaymentDesc": "30% off by subscribing",
    "service.qualitySupportTitle": "Quality Support",
    "service.qualitySupportDesc": "Always online 24/7",
    "service.dailyOffersTitle": "Daily Offers",
    "service.dailyOffersDesc": "20% off by subscribing",
    "topCategories.title": "Top Categories",
    "topCategories.badge": "Category",
    "featured.title": "Featured Products",
    "topSelling.title": "Top Selling Products",
    "topRating.title": "Product Suggestions",
    "topRating.categoryFallback": "Category",
    "categoryProducts.title": "🔥 {category} Products",
    "parallax.get25Off": "Get 25% OFF",
    "parallax.titleLine1": "Discount In All",
    "parallax.titleLine2": "Kind Of Super Selling",
    "banner.limitedOffer": "Limited Offer",
    "banner.upTo50Off": "Up To 50% Off",
    "banner.allBooks": "All Books",
    "banner.newCollection": "New Collection",
    "banner.discoverNextFavoriteBook": "Discover Your Next Favorite Book",
    "productList.title": "Product List",
    "productList.loading": "Loading...",
    "productList.empty": "No products available.",
    "productList.backendOffline":
      "Cannot connect to backend. Please run my-backend on port 3001.",
    "productList.fetchError": "Failed to load products (HTTP {status}).",
    "productPage.comingSoon": "Product list is being updated.",
    "profile.loginPrompt": "Please login",
    "profile.title": "My Profile",
    "profile.nameLabel": "Name:",
    "profile.emailLabel": "Email:",
    "auth.loginTitle": "Log in",
    "auth.loginSubtitle": "Please fill your information below",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.rememberMe": "Remember me",
    "auth.forgotPassword": "Forgot Password?",
    "auth.noAccount": "Don't have an account yet?",
    "auth.welcomeBackTitle": "Welcome back",
    "auth.welcomeBackSubtitle": "Manage your shop efficiently with our system",
    "auth.registerTitle": "Register",
    "auth.registerSubtitle": "Create your account to get started",
    "auth.usernameValidation":
      "Username ≥ 3 characters, does not contain spaces",
    "auth.passwordValidation": "Password must be at least 6 characters long",
    "auth.haveAccount": "Do you already have an account?",
    "auth.createAccountTitle": "Create account",
    "auth.createAccountSubtitle":
      "Start managing your store with our system today",
    "alert.addedToWishlist": "Added to wishlist",
    "alert.addedToCart": "Added to cart 🛒",
    "alert.addedToCartShort": "Added to cart",
    "alert.loginToAddCart": "Please log in to add to cart.",
    "alert.cartDuplicate": "Product is already in the cart.",
    "alert.wishlistDuplicate": "Product is already in wishlist.",
    "alert.addToCartFailed": "Add to cart failed",
    "alert.registerSuccess": "Registered successfully",
    "alert.accountExists": "Account already exists.",
    "alert.registrationFailed": "Registration failed. Please try again.",
    "alert.loginFailed": "Incorrect username or password",
    "alert.orderSuccess": "Order placed successfully 🚀",
    "label.hot": "Hot",
    "label.unknown": "Unknown",
  },
  vi: {
    "language.english": "English",
    "language.vietnamese": "Tiếng Việt",
    "header.followers": "{count} Người theo dõi",
    "header.logIn": "ĐĂNG NHẬP",
    "header.logout": "Đăng xuất",
    "header.profile": "Hồ sơ",
    "header.orders": "Đơn hàng",
    "header.searchPlaceholder": "Tìm kiếm sản phẩm...",
    "nav.home": "Trang chủ",
    "nav.shop": "Cửa hàng",
    "nav.newArrivals": "Hàng mới",
    "nav.bestSellers": "Bán chạy",
    "nav.blog": "Blog",
    "nav.contact": "Liên hệ",
    "nav.categories": "Danh mục",
    "nav.featured": "Nổi bật",
    "nav.customer": "Khách hàng",
    "nav.trackOrder": "Theo dõi đơn",
    "nav.wishlist": "Yêu thích",
    "nav.cart": "Giỏ hàng",
    "nav.myAccount": "Tài khoản",
    "nav.orderHistory": "Lịch sử đơn",
    "nav.specialOffer": "Ưu đãi đặc biệt",
    "nav.summerSale": "Khuyến mãi mùa hè",
    "nav.upTo50Selected": "Giảm đến 50% cho sản phẩm chọn lọc.",
    "nav.trending": "Xu hướng",
    "nav.topRated": "Đánh giá cao",
    "nav.limitedEdition": "Phiên bản giới hạn",
    "action.shopNow": "Mua ngay →",
    "action.shopNowPlain": "Mua ngay",
    "action.shop": "Mua sắm",
    "action.exploreMore": "Khám phá thêm →",
    "action.viewMoreBooks": "Xem thêm sách →",
    "action.explore": "Khám phá →",
    "action.addToCart": "Thêm vào giỏ",
    "action.placeOrder": "Đặt hàng",
    "action.proceedToCheckout": "Tiến hành thanh toán",
    "action.subscribe": "Đăng ký",
    "action.loginUpper": "ĐĂNG NHẬP",
    "action.registerUpper": "ĐĂNG KÝ",
    "action.signUp": "Đăng ký",
    "action.login": "Đăng nhập",
    "action.continueWithGoogle": "Tiếp tục với Google",
    "action.or": "HOẶC",
    "action.viewAllBooks": "Xem tất cả sách →",
    "label.stock": "Tồn kho: {count}",
    "label.category": "Danh mục",
    "label.price": "Giá",
    "label.quantity": "Số lượng",
    "label.subtotal": "Tạm tính",
    "label.product": "Sản phẩm",
    "label.total": "Tổng cộng",
    "label.shipping": "Vận chuyển",
    "label.free": "Miễn phí",
    "label.inStock": "Còn hàng",
    "label.outOfStock": "Hết hàng",
    "label.inStockOnly": "Chỉ còn hàng",
    "label.availability": "Tình trạng:",
    "label.recommendation": "Gợi ý",
    "label.relatedProducts": "Sản phẩm liên quan",
    "label.customerReviews": "({count} đánh giá)",
    "label.loading": "Đang tải...",
    "label.loadingProducts": "Đang tải sản phẩm...",
    "label.loadingCart": "Đang tải giỏ hàng...",
    "label.loadingProduct": "Đang tải sản phẩm...",
    "label.productNotFound": "Không tìm thấy sản phẩm",
    "label.cartEmpty": "Giỏ hàng trống",
    "cart.cartTotalTitle": "Tổng giỏ hàng",
    "label.wishlist": "Danh sách yêu thích",
    "label.shopDetails": "Chi tiết sản phẩm",
    "label.shop": "Cửa hàng",
    "label.home": "Trang chủ",
    "label.checkout": "Thanh toán",
    "label.billingDetails": "Thông tin thanh toán",
    "label.yourOrder": "Đơn hàng của bạn",
    "label.paymentCashOnDelivery": "Thanh toán khi nhận hàng",
    "label.paymentBankTransfer": "Chuyển khoản ngân hàng",
    "label.orderNotesOptional": "Ghi chú đơn hàng (tuỳ chọn)",
    "label.fullName": "Họ và tên",
    "label.phone": "Số điện thoại",
    "label.email": "Email",
    "label.address": "Địa chỉ",
    "label.search": "Tìm kiếm",
    "label.searchHere": "Tìm kiếm...",
    "label.categories": "Danh mục",
    "label.productStatus": "Tình trạng sản phẩm",
    "label.filterByPrice": "Lọc theo giá",
    "label.showingCount": "Hiển thị {count} sản phẩm",
    "label.sortDefault": "Mặc định",
    "label.sortPriceAsc": "Giá ↑",
    "label.sortPriceDesc": "Giá ↓",
    "label.noProductsFound": "Không tìm thấy sản phẩm phù hợp",
    "productDetails.noRelated": "Không có sản phẩm liên quan.",
    "shop.loadError": "Không thể tải sản phẩm",
    "label.categoryFallback": "Không có",
    "label.inStockWithCount": "Còn hàng ({count})",
    "label.outOfStockShort": "Hết hàng",
    "label.stockShort": "Tồn kho",
    "footer.questionsCall": "Có câu hỏi? Gọi cho chúng tôi",
    "footer.customersSupport": "Hỗ trợ khách hàng",
    "footer.storeList": "Danh sách cửa hàng",
    "footer.openingHours": "Giờ mở cửa",
    "footer.contactUs": "Liên hệ",
    "footer.returnPolicy": "Chính sách đổi trả",
    "footer.categories": "Danh mục",
    "footer.category.novelBooks": "Tiểu thuyết",
    "footer.category.poetryBooks": "Sách thơ",
    "footer.category.politicalBooks": "Chính trị",
    "footer.category.historyBooks": "Lịch sử",
    "footer.subscribeTitle": "Đăng ký.",
    "footer.subscribeTagline": "Hành trình của chúng ta mới chỉ bắt đầu",
    "footer.emailPlaceholder": "Nhập email của bạn",
    "footer.followUs": "Theo dõi chúng tôi",
    "footer.copyright": "© {year} E-Commerce. Mọi quyền được bảo lưu.",
    "heroBook.editorChoice": "Sách được biên tập chọn",
    "heroBook.upTo50Off": "Giảm đến 50%",
    "heroBook.titleLine1": "Cuốn sách yêu thích tiếp theo",
    "heroBook.titleLine2Prefix": "Chỉ cách một cú",
    "heroBook.titleLine2Highlight": "Nhấp chuột",
    "heroBook.subtitle": "Hàng nghìn cuốn sách. Một lựa chọn hoàn hảo cho bạn.",
    "heroShoe.trend": "Xu hướng Sneaker",
    "heroShoe.title": "BƯỚC VÀO PHONG CÁCH",
    "heroShoe.subtitle": "Khám phá những đôi giày đang tạo xu hướng năm nay.",
    "heroPhone.newCollection": "Bộ sưu tập mới",
    "heroPhone.title": "Điện thoại cao cấp",
    "heroPhone.subtitle":
      "Thiết kế sang trọng • Hiệu năng mạnh • Giá tốt mỗi ngày",
    "heroMouse.title": "Chuột gaming tối thượng",
    "heroMouse.subtitle": "Chính xác. Tốc độ. Sức mạnh RGB.",
    "heroComputer.tag": "Laptop thế hệ mới",
    "heroComputer.titleLine1": "Sức mạnh kết hợp",
    "heroComputer.titleLine2": "Hiệu năng",
    "heroComputer.subtitle":
      "Trải nghiệm hiệu năng siêu nhanh với công nghệ mới nhất.",
    "service.returnRefundTitle": "Đổi trả & Hoàn tiền",
    "service.returnRefundDesc": "Hoàn tiền đảm bảo",
    "service.securePaymentTitle": "Thanh toán an toàn",
    "service.securePaymentDesc": "Giảm 30% khi đăng ký",
    "service.qualitySupportTitle": "Hỗ trợ chất lượng",
    "service.qualitySupportDesc": "Luôn trực tuyến 24/7",
    "service.dailyOffersTitle": "Ưu đãi hằng ngày",
    "service.dailyOffersDesc": "Giảm 20% khi đăng ký",
    "topCategories.title": "Danh mục nổi bật",
    "topCategories.badge": "Danh mục",
    "featured.title": "Sản phẩm nổi bật",
    "topSelling.title": "Sản phẩm bán chạy",
    "topRating.title": "Gợi ý sản phẩm",
    "topRating.categoryFallback": "Danh mục",
    "categoryProducts.title": "🔥 Sản phẩm {category}",
    "parallax.get25Off": "Giảm 25%",
    "parallax.titleLine1": "Giảm giá cho tất cả",
    "parallax.titleLine2": "Mặt hàng bán chạy",
    "banner.limitedOffer": "Ưu đãi giới hạn",
    "banner.upTo50Off": "Giảm đến 50%",
    "banner.allBooks": "Tất cả sách",
    "banner.newCollection": "Bộ sưu tập mới",
    "banner.discoverNextFavoriteBook": "Khám phá cuốn sách yêu thích tiếp theo",
    "productList.title": "Danh sách sản phẩm",
    "productList.loading": "Đang tải...",
    "productList.empty": "Chưa có sản phẩm nào.",
    "productList.backendOffline":
      "Không kết nối được backend. Hãy chạy my-backend ở cổng 3001.",
    "productList.fetchError": "Không thể tải sản phẩm (HTTP {status}).",
    "productPage.comingSoon": "Danh sách sản phẩm đang được cập nhật.",
    "profile.loginPrompt": "Vui lòng đăng nhập",
    "profile.title": "Hồ sơ của tôi",
    "profile.nameLabel": "Tên:",
    "profile.emailLabel": "Email:",
    "auth.loginTitle": "Đăng nhập",
    "auth.loginSubtitle": "Vui lòng nhập thông tin bên dưới",
    "auth.username": "Tên đăng nhập",
    "auth.password": "Mật khẩu",
    "auth.rememberMe": "Ghi nhớ đăng nhập",
    "auth.forgotPassword": "Quên mật khẩu?",
    "auth.noAccount": "Chưa có tài khoản?",
    "auth.welcomeBackTitle": "Chào mừng trở lại",
    "auth.welcomeBackSubtitle":
      "Quản lý cửa hàng hiệu quả với hệ thống của chúng tôi",
    "auth.registerTitle": "Đăng ký",
    "auth.registerSubtitle": "Tạo tài khoản để bắt đầu",
    "auth.usernameValidation":
      "Tên đăng nhập ≥ 3 ký tự, không chứa khoảng trắng",
    "auth.passwordValidation": "Mật khẩu phải có ít nhất 6 ký tự",
    "auth.haveAccount": "Bạn đã có tài khoản?",
    "auth.createAccountTitle": "Tạo tài khoản",
    "auth.createAccountSubtitle":
      "Bắt đầu quản lý cửa hàng với hệ thống của chúng tôi ngay hôm nay",
    "alert.addedToWishlist": "Đã thêm vào wishlist",
    "alert.addedToCart": "Đã thêm vào giỏ hàng 🛒",
    "alert.addedToCartShort": "Đã thêm vào giỏ hàng",
    "alert.loginToAddCart": "Vui lòng đăng nhập để thêm vào giỏ hàng.",
    "alert.cartDuplicate": "Sản phẩm đã có trong giỏ hàng.",
    "alert.wishlistDuplicate": "Sản phẩm đã có trong wishlist.",
    "alert.addToCartFailed": "Thêm vào giỏ hàng thất bại",
    "alert.registerSuccess": "Đăng ký thành công",
    "alert.accountExists": "Tài khoản đã tồn tại.",
    "alert.registrationFailed": "Đăng ký thất bại. Vui lòng thử lại.",
    "alert.loginFailed": "Sai tài khoản hoặc mật khẩu",
    "alert.orderSuccess": "Đặt hàng thành công 🚀",
    "label.hot": "Hot",
    "label.unknown": "Không rõ",
  },
};

const categoryTranslations: Record<string, { en: string; vi: string }> = {
  Books: { en: "Books", vi: "Sách" },
  Shoes: { en: "Shoes", vi: "Giày" },
  Clothing: { en: "Clothing", vi: "Quần áo" },
  Computers: { en: "Computers", vi: "Máy tính" },
  Phones: { en: "Phones", vi: "Điện thoại" },
  Mouse: { en: "Mouse", vi: "Chuột" },
  Keyboard: { en: "Keyboard", vi: "Bàn phím" },
  "Men Fashion": { en: "Men Fashion", vi: "Thời trang nam" },
  "Women Fashion": { en: "Women Fashion", vi: "Thời trang nữ" },
  Sneakers: { en: "Sneakers", vi: "Giày sneaker" },
  "Sports Shoes": { en: "Sports Shoes", vi: "Giày thể thao" },
  Accessories: { en: "Accessories", vi: "Phụ kiện" },
  "New Arrivals": { en: "New Arrivals", vi: "Hàng mới" },
  "Best Sellers": { en: "Best Sellers", vi: "Bán chạy" },
  Trending: { en: "Trending", vi: "Xu hướng" },
  "Top Rated": { en: "Top Rated", vi: "Đánh giá cao" },
  "Limited Edition": { en: "Limited Edition", vi: "Phiên bản giới hạn" },
};

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

function translate(
  key: string,
  language: Language,
  params?: Record<string, string | number>,
): string {
  const template = translations[language][key] ?? translations.en[key] ?? key;
  return interpolate(template, params);
}

function convertPrice(amountUsd: number, currency: Currency): number {
  return currency === "VND" ? amountUsd * USD_TO_VND : amountUsd;
}

function formatPrice(amountUsd: number, currency: Currency): string {
  const amount = convertPrice(amountUsd, currency);
  const locale = currency === "VND" ? "vi-VN" : "en-US";
  const options =
    currency === "VND"
      ? { style: "currency", currency: "VND", maximumFractionDigits: 0 }
      : {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        };
  return new Intl.NumberFormat(locale, options).format(amount);
}

export function translateCategory(name: string, language: Language): string {
  const entry = categoryTranslations[name];
  if (!entry) {
    return name;
  }
  return language === "vi" ? entry.vi : entry.en;
}

type PreferencesContextValue = {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amountUsd: number) => string;
  convertPrice: (amountUsd: number) => number;
  translateCategory: (name: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedLanguage = window.localStorage.getItem(
      "preferred-language",
    ) as Language | null;
    const storedCurrency = window.localStorage.getItem(
      "preferred-currency",
    ) as Currency | null;

    if (storedLanguage === "en" || storedLanguage === "vi") {
      setLanguageState(storedLanguage);
    }
    if (storedCurrency === "USD" || storedCurrency === "VND") {
      setCurrencyState(storedCurrency);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("preferred-language", language);
    window.localStorage.setItem("preferred-currency", currency);
    document.documentElement.lang = language;
  }, [language, currency]);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      language,
      currency,
      setLanguage: setLanguageState,
      setCurrency: setCurrencyState,
      t: (key, params) => translate(key, language, params),
      formatPrice: (amountUsd) => formatPrice(amountUsd, currency),
      convertPrice: (amountUsd) => convertPrice(amountUsd, currency),
      translateCategory: (name) => translateCategory(name, language),
    };
  }, [language, currency]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
