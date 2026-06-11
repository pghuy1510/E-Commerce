import axios from "axios";
import { normalizeCartItems } from "./cart";
import { isTokenExpired } from "./jwt";
import { logoutExpiredSession } from "./auth-token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

export function getBrowserToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      if (storedToken === "test123") {
        localStorage.removeItem("token");
      } else {
        if (isTokenExpired(storedToken)) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          return undefined;
        }
        return storedToken;
      }
    }
  } catch {
    return undefined;
  }

  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (match?.[1]) {
    try {
      const cookieToken = decodeURIComponent(match[1]);
      if (isTokenExpired(cookieToken)) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return undefined;
      }
      return cookieToken;
    } catch {
      if (isTokenExpired(match[1])) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return undefined;
      }
      return match[1];
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cookies = require("js-cookie") as {
      default?: { get: (name: string) => string | undefined };
      get?: (name: string) => string | undefined;
    };
    const jsCookieToken = Cookies.get?.("token") ?? Cookies.default?.get("token");
    if (jsCookieToken && isTokenExpired(jsCookieToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return undefined;
    }
    return jsCookieToken;
  } catch {
    return undefined;
  }
}

function requireAuthToken(): string {
  if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("token");
    if (storedToken && isTokenExpired(storedToken)) {
      const err = new Error("Token đã hết hạn. Vui lòng đăng nhập lại.");
      (err as any).code = "TOKEN_EXPIRED";
      throw err;
    }
  }

  const token = getBrowserToken();
  if (token) {
    return token;
  }

  const err = new Error("Vui lòng đăng nhập để tiếp tục.");
  (err as any).code = "AUTH_REQUIRED";
  throw err;
}

const CART_UPDATED_EVENT = "cart-updated";
const WISHLIST_UPDATED_EVENT = "wishlist-updated";

export function emitCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function emitWishlistUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
  }
}

function createDuplicateError(message: string, code: string): Error {
  const err = new Error(message);
  (err as any).code = code;
  return err;
}

function hasProductIdMatch(item: any, productId: number): boolean {
  if (item?.product?.id != null) {
    return item.product.id === productId;
  }
  if (item?.productId != null) {
    return item.productId === productId;
  }
  return item?.id === productId;
}

api.interceptors.request.use((config) => {
  const token = getBrowserToken();

  const debug = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";
  if (debug) {
    // eslint-disable-next-line no-console
    console.debug("[api] request", {
      url: config.url,
      method: config.method,
      hasToken: Boolean(token),
    });
  }

  if (!token) {
    return config;
  }

  config.headers = config.headers ?? {};
  const headersAny = config.headers as any;
  if (typeof headersAny.set === "function") {
    headersAny.set("Authorization", `Bearer ${token}`);
  } else {
    headersAny.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      void logoutExpiredSession();
    }

    return Promise.reject(error);
  },
);

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  type?: 'simple' | 'variable';
  defaultVariant?: any | null;
  maxPrice?: number | null;
  variantCount?: number | null;
  category: {
    id: number;
    name: string;
  };
  options?: Array<{
    id: number;
    name: string;
    values: string[];
  }>;
  variants?: Array<{
    id: number;
    sku?: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
    options: Record<string, string>;
    isActive: boolean;
  }>;
}

export interface BestSellerProduct extends Product {
  sold: number;
}

export interface UserProfile {
  username: string;
  email?: string | null;
  fullName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string | null;
  role?: string;
}

export interface UserAddress {
  id?: number;
  receiverName?: string;
  receiverPhone?: string;
  province?: string;
  commune?: string;
  district?: string;
  detail?: string;
  label?: string;
  isDefault?: boolean;
  formattedAddress?: string;
  // normalized location properties
  provinceId?: number | null;
  wardId?: number | null;
  addressDetail?: string;
}

export type PaymentMethod = "qr" | "cod";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export interface CheckoutPayload {
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  wardId: number;
  addressDetail: string;
  province?: string;
  commune?: string;
  detail?: string;
  paymentMethod: PaymentMethod;
  shippingFee?: number;
  couponCode?: string;
  note?: string;
  machineId?: string;
}

export interface CheckoutResponse {
  orderId: number;
  paymentId: number;
  paymentToken?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  qr?: {
    qrDataURL: string;
    addInfo: string;
    expiredAt: string;
    qrToken: string;
    amount: number;
  } | null;
}

export interface PaymentStatusResponse {
  paymentId: number;
  orderId: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus | null;
  amount: number;
  qr?: {
    qrDataURL: string;
    addInfo: string;
    expiredAt: string | null;
    qrToken: string;
    status: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  } | null;
}

export interface UserBank {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  imageProof?: string;
}

export const productAPI = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    sortBy?: string;
  }): Promise<Product[]> => {
    const response = await api.get("/products", { params });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${category}`);
    return response.data;
  },
  getNewArrivals: async (limit = 12): Promise<Product[]> => {
    const response = await api.get("/products/new-arrivals", {
      params: { limit },
    });
    return response.data;
  },
  getTopSelling: async (): Promise<BestSellerProduct[]> => {
    const res = await api.get("/products/top-selling");
    return res.data;
  },
};

export const wishlistAPI = {
  toggle: async (userId: number, productId: number) => {
    const list = await wishlistAPI.get(userId);
    const items = Array.isArray(list) ? list : (list?.items ?? []);
    const exists = items.some((item: any) =>
      hasProductIdMatch(item, productId),
    );
    if (exists) {
      throw createDuplicateError(
        "Sản phẩm đã có trong wishlist.",
        "WISHLIST_DUPLICATE",
      );
    }

    const res = await api.post(`/wishlist/${userId}/${productId}`);
    emitWishlistUpdated();
    return res;
  },

  get: async (userId: number) => {
    const res = await api.get(`/wishlist/${userId}`);
    return res.data;
  },

  remove: async (userId: number, productId: number) => {
    const res = await api.delete(`/wishlist/${userId}/${productId}`);
    emitWishlistUpdated();
    return res;
  },
};

export const cartAPI = {
  add: async (productId: number, quantity = 1, variantId?: number) => {
    const token = getBrowserToken();
    if (!token) {
      const localCartStr = localStorage.getItem("guest-cart");
      const localCart = localCartStr ? JSON.parse(localCartStr) : [];
      const exists = localCart.some((item: any) => {
        if (variantId) {
          return (item.product?.id === productId || item.productId === productId) && item.variantId === variantId;
        }
        return (item.product?.id === productId || item.productId === productId) && !item.variantId;
      });
      if (exists) {
        throw createDuplicateError(
          "Sản phẩm đã có trong giỏ hàng.",
          "CART_DUPLICATE",
        );
      }

      const product = await productAPI.getById(productId);
      let variant: any = null;
      if (variantId) {
        variant = product.variants?.find(v => v.id === variantId);
      }
      
      const targetStock = variant ? variant.stock : product.stock;
      if (targetStock < quantity) {
        throw new Error(`Sản phẩm này chỉ còn ${targetStock} sản phẩm trong kho.`);
      }

      localCart.push({
        id: variantId ? `${productId}-${variantId}` : productId,
        productId,
        variantId,
        quantity,
        price: variant ? variant.price : product.price,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
        },
        variant,
      });

      localStorage.setItem("guest-cart", JSON.stringify(localCart));
      emitCartUpdated();
      return { data: { items: localCart } };
    }

    const current = await api.get("/cart");
    const items = normalizeCartItems(current.data);
    const exists = items.some((item: any) => {
      if (variantId) {
        return (item.product?.id === productId || item.productId === productId) && item.variant?.id === variantId;
      }
      return (item.product?.id === productId || item.productId === productId) && !item.variant;
    });
    if (exists) {
      throw createDuplicateError(
        "Sản phẩm đã có trong giỏ hàng.",
        "CART_DUPLICATE",
      );
    }

    const res = await api.post("/cart/add", {
      productId,
      quantity,
      variantId,
    });
    emitCartUpdated();
    return res;
  },

  get: async () => {
    const token = getBrowserToken();
    if (!token) {
      const localCartStr = localStorage.getItem("guest-cart");
      const items = localCartStr ? JSON.parse(localCartStr) : [];
      return { data: { items } };
    }
    return api.get("/cart");
  },

  remove: async (productId: number, variantId?: number) => {
    const token = getBrowserToken();
    if (!token) {
      const localCartStr = localStorage.getItem("guest-cart");
      let localCart = localCartStr ? JSON.parse(localCartStr) : [];
      localCart = localCart.filter((item: any) => {
        if (variantId) {
          return !(item.productId === productId && item.variantId === variantId);
        }
        return !(item.productId === productId && !item.variantId);
      });
      localStorage.setItem("guest-cart", JSON.stringify(localCart));
      emitCartUpdated();
      return { data: { items: localCart } };
    }
    const res = await api.delete("/cart/remove", {
      data: { productId, variantId },
    });
    emitCartUpdated();
    return res;
  },

  update: async (productId: number, quantity: number, variantId?: number) => {
    const token = getBrowserToken();
    if (!token) {
      const localCartStr = localStorage.getItem("guest-cart");
      const localCart = localCartStr ? JSON.parse(localCartStr) : [];
      const item = localCart.find((item: any) => {
        if (variantId) {
          return item.productId === productId && item.variantId === variantId;
        }
        return item.productId === productId && !item.variantId;
      });
      if (!item) throw new Error("Sản phẩm không có trong giỏ hàng.");
      
      const stock = item.variant ? item.variant.stock : (item.product?.stock ?? 999);
      if (stock < quantity) {
        throw new Error(`Sản phẩm này chỉ còn ${stock} sản phẩm trong kho.`);
      }

      item.quantity = quantity;
      localStorage.setItem("guest-cart", JSON.stringify(localCart));
      emitCartUpdated();
      return { data: { items: localCart } };
    }
    const res = await api.patch("/cart/update", {
      productId,
      quantity,
      variantId,
    });
    emitCartUpdated();
    return res;
  },
};

export const userProfileAPI = {
  get: async (): Promise<UserProfile> => {
    requireAuthToken();
    const res = await api.get("/users/me/profile");
    return res.data;
  },
  update: async (payload: Partial<UserProfile>): Promise<UserProfile> => {
    requireAuthToken();
    const res = await api.patch("/users/me/profile", payload);
    return res.data;
  },
  uploadAvatar: async (payload: FormData) => {
    requireAuthToken();
    const res = await api.patch("/users/me/avatar", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export const userAddressAPI = {
  get: async (): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.get("/users/me/address");
    return res.data;
  },
  update: async (payload: UserAddress): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.patch("/users/me/address", payload);
    return res.data;
  },
  list: async (): Promise<UserAddress[]> => {
    requireAuthToken();
    const res = await api.get("/users/me/addresses");
    return res.data;
  },
  add: async (payload: UserAddress & { receiverName?: string; receiverPhone?: string; label?: string; isDefault?: boolean }): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.post("/users/me/addresses", payload);
    return res.data;
  },
  patch: async (id: number, payload: Partial<UserAddress & { receiverName?: string; receiverPhone?: string; label?: string; isDefault?: boolean }>): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.patch(`/users/me/addresses/${id}`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<{ success: boolean }> => {
    requireAuthToken();
    const res = await api.delete(`/users/me/addresses/${id}`);
    return res.data;
  },
  setDefault: async (id: number): Promise<{ success: boolean }> => {
    requireAuthToken();
    const res = await api.patch(`/users/me/addresses/${id}/default`);
    return res.data;
  },
};

export const userBankAPI = {
  list: async (): Promise<UserBank[]> => {
    requireAuthToken();
    const res = await api.get("/users/me/banks");
    return res.data;
  },
  create: async (payload: Omit<UserBank, "id">): Promise<UserBank> => {
    requireAuthToken();
    const res = await api.post("/users/me/banks", payload);
    return res.data;
  },
};

export const userPasswordAPI = {
  change: async (payload: { currentPassword: string; newPassword: string }) => {
    requireAuthToken();
    return api.patch("/users/me/password", payload);
  },
};

export const forgotPasswordAPI = {
  forgot: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
  verifyToken: async (email: string, token: string) => {
    const res = await api.post("/auth/verify-reset-token", { email, token });
    return res.data;
  },
  reset: async (payload: { email: string; token: string; newPassword: string }) => {
    const res = await api.post("/auth/reset-password", payload);
    return res.data;
  },
};

export const contactAPI = {
  create: async (payload: ContactPayload) => {
    const res = await api.post("/contact", payload);
    return res.data;
  },
};

export const checkoutAPI = {
  create: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    requireAuthToken();
    const res = await api.post("/orders/checkout", payload);
    return res.data;
  },
  createGuest: async (payload: CheckoutPayload & { guestEmail: string; items: { productId: number; quantity: number }[] }): Promise<CheckoutResponse> => {
    const res = await api.post("/orders/checkout-guest", payload);
    return res.data;
  },
};

export const orderAPI = {
  list: async () => {
    requireAuthToken();
    const res = await api.get("/orders/my");
    return res.data;
  },
  getById: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  getGuestOrder: async (id: number, email: string) => {
    const res = await api.get(`/orders/guest/${id}`, { params: { email } });
    return res.data;
  },
  cancel: async (id: number, reason: string) => {
    requireAuthToken();
    const res = await api.post(`/orders/${id}/cancel`, { reason });
    return res.data;
  },
  requestReturn: async (id: number, payload: { reason: string; imageProof?: string }) => {
    requireAuthToken();
    const res = await api.post(`/orders/${id}/return`, payload);
    return res.data;
  },
  getReturn: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/orders/${id}/return`);
    return res.data;
  },
  getOrderReturn: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/orders/${id}/return`);
    return res.data;
  },
  cancelReturnRequest: async (id: number) => {
    requireAuthToken();
    const res = await api.post(`/orders/${id}/return/cancel`);
    return res.data;
  },
  changeToCod: async (id: number) => {
    requireAuthToken();
    const res = await api.post(`/orders/${id}/change-to-cod`);
    return res.data;
  },
};

export const paymentAPI = {
  getStatus: async (paymentId: number, token?: string): Promise<PaymentStatusResponse> => {
    const res = await api.get(`/payment/${paymentId}/status`, {
      params: token ? { token } : undefined,
    });
    return res.data;
  },
  regenerateQr: async (
    paymentId: number,
    machineId: string,
    token?: string,
  ): Promise<
    CheckoutResponse["qr"] & {
      bankName: string;
      accountName: string;
      accountNumber: string;
      amount: number;
    }
  > => {
    const res = await api.post(
      `/payment/${paymentId}/regenerate-qr`,
      { machineId },
      { params: token ? { token } : undefined },
    );
    return res.data;
  },
};

export const reviewsAPI = {
  create: async (payload: {
    productId: number;
    orderId?: number;
    rating: number;
    comment: string;
    images?: string[];
  }) => {
    requireAuthToken();
    const res = await api.post("/reviews", payload);
    return res.data;
  },
  getByProduct: async (productId: number) => {
    const res = await api.get(`/reviews/product/${productId}`);
    return res.data;
  },
  getSummary: async (productId: number) => {
    const res = await api.get(`/reviews/product/${productId}/summary`);
    return res.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    requireAuthToken();
    const res = await api.get("/admin/stats");
    return res.data;
  },
  getOrders: async () => {
    requireAuthToken();
    const res = await api.get("/admin/orders");
    return res.data;
  },
  updateOrderStatus: async (id: number, payload: {
    status: string;
    trackingNumber?: string;
    estimatedDeliveryDate?: string;
    note?: string;
  }) => {
    requireAuthToken();
    const res = await api.patch(`/admin/orders/${id}/status`, payload);
    return res.data;
  },
  deleteOrder: async (id: number) => {
    requireAuthToken();
    const res = await api.delete(`/admin/orders/${id}`);
    return res.data;
  },
  getReturns: async () => {
    requireAuthToken();
    const res = await api.get("/admin/returns");
    return res.data;
  },
  handleReturn: async (id: number, payload: {
    action: "approve" | "reject";
    note?: string;
  }) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/action`, payload);
    return res.data;
  },
  approveReturn: async (id: number) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/action`, { action: "approve" });
    return res.data;
  },
  rejectReturn: async (id: number, note: string) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/action`, { action: "reject", note });
    return res.data;
  },
  markReturnReceived: async (id: number) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/received`);
    return res.data;
  },
  startReturnRefund: async (id: number) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/refund`);
    return res.data;
  },
  completeReturnRefund: async (id: number, payload: { refundTransactionId: string; refundMethod: string }) => {
    requireAuthToken();
    const res = await api.post(`/admin/returns/${id}/complete`, payload);
    return res.data;
  },
  createProduct: async (payload: {
    name: string;
    description: string;
    price: number;
    stock: number;
    image?: string;
    categoryId: number;
    type?: 'simple' | 'variable';
    options?: Array<{
      name: string;
      values: string[];
    }>;
    variants?: Array<{
      sku?: string;
      name: string;
      price: number;
      stock: number;
      image?: string;
      options: Record<string, string>;
      isActive?: boolean;
    }>;
  }) => {
    requireAuthToken();
    const res = await api.post("/admin/products", payload);
    return res.data;
  },
  updateProduct: async (id: number, payload: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    image?: string;
    categoryId?: number;
    type?: 'simple' | 'variable';
    options?: Array<{
      name: string;
      values: string[];
    }>;
    variants?: Array<{
      sku?: string;
      name: string;
      price: number;
      stock: number;
      image?: string;
      options: Record<string, string>;
      isActive?: boolean;
    }>;
  }) => {
    requireAuthToken();
    const res = await api.patch(`/admin/products/${id}`, payload);
    return res.data;
  },
  deleteProduct: async (id: number) => {
    requireAuthToken();
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },
  getUsers: async () => {
    requireAuthToken();
    const res = await api.get("/admin/users");
    return res.data;
  },
  updateUserRole: async (id: number, role: string) => {
    requireAuthToken();
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },
  banUser: async (id: number, isActive: boolean) => {
    requireAuthToken();
    const res = await api.patch(`/admin/users/${id}/ban`, { isActive });
    return res.data;
  },
  getUserOrders: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/admin/users/${id}/orders`);
    return res.data;
  },
  updateUser: async (id: number, payload: {
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    requireAuthToken();
    const res = await api.patch(`/admin/users/${id}`, payload);
    return res.data;
  },
  deleteUser: async (id: number) => {
    requireAuthToken();
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  // ADMIN PROMOTIONS
  listCoupons: async (): Promise<Coupon[]> => {
    requireAuthToken();
    const res = await api.get<Coupon[]>("/coupons");
    return res.data;
  },
  createCoupon: async (payload: Partial<Coupon>): Promise<Coupon> => {
    requireAuthToken();
    const res = await api.post<Coupon>("/coupons", payload);
    return res.data;
  },
  deleteCoupon: async (id: number, reason?: string): Promise<{ success: boolean }> => {
    requireAuthToken();
    const res = await api.delete<{ success: boolean }>(`/coupons/${id}`, { data: { reason } });
    return res.data;
  },
  updateCoupon: async (id: number, payload: Partial<Coupon>): Promise<Coupon> => {
    requireAuthToken();
    const res = await api.patch<Coupon>(`/coupons/${id}`, payload);
    return res.data;
  },
  listDeals: async (): Promise<{ id: number; name: string; description?: string; bannerEnabled: boolean; bannerUrl?: string; bannerTitle?: string; bannerSubtitle?: string; bannerButtonText?: string; bannerButtonUrl?: string; startsAt: string; expiresAt: string; isActive: boolean; dealProducts: DealProduct[]; featuredCoupons: Coupon[] }[]> => {
    requireAuthToken();
    const res = await api.get<{ id: number; name: string; description?: string; bannerEnabled: boolean; bannerUrl?: string; bannerTitle?: string; bannerSubtitle?: string; bannerButtonText?: string; bannerButtonUrl?: string; startsAt: string; expiresAt: string; isActive: boolean; dealProducts: DealProduct[]; featuredCoupons: Coupon[] }[]>("/deals");
    return res.data;
  },
  createDeal: async (payload: {
    name: string;
    description?: string;
    bannerEnabled?: boolean;
    bannerUrl?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    bannerButtonText?: string;
    bannerButtonUrl?: string;
    startsAt: string;
    expiresAt: string;
    isActive?: boolean;
    featuredCouponIds?: number[];
    products: {
      productId: number;
      dealPrice: number;
      dealStock: number;
    }[];
  }) => {
    requireAuthToken();
    const res = await api.post("/deals", payload);
    return res.data;
  },
  deleteDeal: async (id: number, reason?: string): Promise<{ success: boolean }> => {
    requireAuthToken();
    const res = await api.delete<{ success: boolean }>(`/deals/${id}`, { data: { reason } });
    return res.data;
  },
  updateDeal: async (id: number, payload: {
    name: string;
    description?: string;
    bannerEnabled?: boolean;
    bannerUrl?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    bannerButtonText?: string;
    bannerButtonUrl?: string;
    startsAt: string;
    expiresAt: string;
    isActive?: boolean;
    featuredCouponIds?: number[];
    products: {
      productId: number;
      dealPrice: number;
      dealStock: number;
    }[];
  }) => {
    requireAuthToken();
    const res = await api.patch(`/deals/${id}`, payload);
    return res.data;
  },
  getCoupon: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/coupons/${id}`);
    return res.data;
  },
  getDeal: async (id: number) => {
    requireAuthToken();
    const res = await api.get(`/deals/${id}`);
    return res.data;
  },
  getPromotionLogs: async (params?: { page?: number; limit?: number; entityType?: string; action?: string }) => {
    requireAuthToken();
    const res = await api.get("/admin/promotion-logs", { params });
    return res.data;
  },
  downloadExcelTemplate: async () => {
    requireAuthToken();
    const res = await api.get("/admin/products/excel-template", {
      responseType: "blob",
    });
    return res.data;
  },
  exportExcelProducts: async () => {
    requireAuthToken();
    const res = await api.get("/admin/products/excel-export", {
      responseType: "blob",
    });
    return res.data;
  },
  importExcelProducts: async (file: File, mode = "upsert", dryRun = false) => {
    requireAuthToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/admin/products/excel-import", formData, {
      params: { mode, dryRun },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};

export interface CouponInfo {
  code: string;
  expiresAt: string;
  remainingUses: number;
  source: string | null;
  coupon: {
    code: string;
    name: string;
    type: "shipping" | "shop" | "platform";
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrder: number | null;
    maxDiscount: number | null;
    categoryId: number | null;
  };
}

export interface CouponProgress {
  freeShippingThreshold: number;
  neededForFreeShipping: number;
  currentBestSaving: number;
  nextCoupon: {
    code: string;
    needed: number;
    estimatedSaving: number;
  } | null;
}

export const couponAPI = {
  getMyCoupons: async (): Promise<CouponInfo[]> => {
    requireAuthToken();
    const res = await api.get<CouponInfo[]>("/coupons/my");
    return res.data;
  },
  getProgress: async (subtotal: number): Promise<CouponProgress> => {
    requireAuthToken();
    const res = await api.get<CouponProgress>("/coupons/progress", {
      params: { subtotal },
    });
    return res.data;
  },
  validate: async (code: string, subtotal: number, shippingFee?: number): Promise<{ valid: boolean; discountTotal: number; couponCode: string }> => {
    requireAuthToken();
    const res = await api.post<{ valid: boolean; discountTotal: number; couponCode: string }>("/coupons/validate", {
      code,
      subtotal,
      shippingFee,
    });
    return res.data;
  },
  validateGuest: async (
    code: string,
    subtotal: number,
    items: { productId: number; quantity: number }[],
    shippingFee?: number,
  ): Promise<{ valid: boolean; discountTotal: number; couponCode: string }> => {
    const res = await api.post<{ valid: boolean; discountTotal: number; couponCode: string }>("/coupons/validate-guest", {
      code,
      subtotal,
      items,
      shippingFee,
    });
    return res.data;
  },
};

export interface Category {
  id: number;
  name: string;
}

export const categoryAPI = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>("/categories");
    return res.data;
  },
};

export interface ProvinceOption {
  id: number;
  code: string;
  name: string;
}

export interface WardOption {
  id: number;
  code: string;
  name: string;
}

let provincesCache: ProvinceOption[] | null = null;
const wardsCache = new Map<number, WardOption[]>();

export const locationAPI = {
  getProvinces: async (): Promise<ProvinceOption[]> => {
    if (provincesCache) return provincesCache;
    const res = await api.get<ProvinceOption[]>("/locations/provinces");
    provincesCache = res.data;
    return provincesCache;
  },
  getWards: async (provinceId: number): Promise<WardOption[]> => {
    if (wardsCache.has(provinceId)) return wardsCache.get(provinceId)!;
    const res = await api.get<WardOption[]>(`/locations/provinces/${provinceId}/wards`);
    wardsCache.set(provinceId, res.data);
    return res.data;
  },
};

export interface Coupon {
  id: number;
  code: string;
  name?: string;
  type: "shipping" | "shop" | "platform";
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  categoryId?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface Deal {
  id: number;
  name: string;
  description?: string;
  bannerEnabled: boolean;
  bannerUrl?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerButtonText?: string;
  bannerButtonUrl?: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface DealProduct {
  id: number;
  dealPrice: number;
  dealStock: number;
  soldCount: number;
  product: Product;
}

export const dealAPI = {
  getActiveDeal: async (): Promise<{ deal: Deal; featuredCoupons: Coupon[]; serverTime: string } | null> => {
    const res = await api.get<{ deal: Deal; featuredCoupons: Coupon[]; serverTime: string } | null>("/deals/active");
    return res.data;
  },
  getDealProducts: async (dealId: number): Promise<DealProduct[]> => {
    const res = await api.get<DealProduct[]>(`/deals/${dealId}/products`);
    return res.data;
  },
};
