"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/i18n";
import {
  cartAPI,
  checkoutAPI,
  PaymentMethod,
  userAddressAPI,
  userProfileAPI,
  locationAPI,
  ProvinceOption,
} from "@/lib/api";
import { normalizeCartItems } from "@/lib/cart";
import { toLegacyAddressPayload } from "@/lib/address";
import { calculateCheckoutTotals, toMoneyNumber } from "@/lib/money";
import { validateCheckoutPayload } from "@/lib/validation";
import AddressSelector, {
  ShippingAddress,
} from "@/components/checkout/AddressSelector";
import PaymentMethods from "@/components/checkout/PaymentMethods";
import CouponInput from "@/components/checkout/CouponInput";
import OrderSummary from "@/components/checkout/OrderSummary";
import { getBrowserToken } from "@/lib/auth-token";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    stock: number;
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const { t, formatPrice } = usePreferences();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [address, setAddress] = useState<ShippingAddress>({
    receiverName: "",
    receiverPhone: "",
    province: "",
    commune: "",
    detail: "",
    provinceId: undefined,
    wardId: undefined,
    addressDetail: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const isLoggedIn = typeof window !== "undefined" && !!getBrowserToken();

  const machineId = useMemo(() => {
    if (typeof window === "undefined") return "WEB";
    const key = "checkout-machine-id";
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const next = `MID-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, next);
    return next;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (isLoggedIn) {
          const [cartRes, addressRes, profileRes, provincesData] = await Promise.all([
            cartAPI.get(),
            userAddressAPI.get().catch(() => ({} as any)),
            userProfileAPI.get().catch(() => ({} as any)),
            locationAPI.getProvinces().catch(() => []),
          ]);

          setProvinces(provincesData);
          const items = normalizeCartItems(cartRes.data);
          setCartItems(items);
          
          const hasOutOfStock = items.some(
            (item: any) => item.product && item.quantity > item.product.stock,
          );
          if (hasOutOfStock) {
            setError(
              "Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ số lượng tồn kho. Vui lòng quay lại giỏ hàng để cập nhật.",
            );
          }

          setAddress((prev) => ({
            ...prev,
            receiverName: profileRes.fullName ?? prev.receiverName,
            receiverPhone: profileRes.phone ?? prev.receiverPhone,
            province: addressRes.province ?? prev.province,
            commune: addressRes.commune ?? addressRes.district ?? prev.commune,
            detail: addressRes.detail ?? prev.detail,
            provinceId: addressRes.provinceId ?? prev.provinceId,
            wardId: addressRes.wardId ?? prev.wardId,
            addressDetail: addressRes.addressDetail ?? addressRes.detail ?? prev.addressDetail,
          }));
        } else {
          const [cartRes, provincesData] = await Promise.all([
            cartAPI.get(),
            locationAPI.getProvinces().catch(() => []),
          ]);
          setProvinces(provincesData);
          const items = normalizeCartItems(cartRes.data);
          setCartItems(items);

          const hasOutOfStock = items.some(
            (item: any) => item.product && item.quantity > item.product.stock,
          );
          if (hasOutOfStock) {
            setError(
              "Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ số lượng tồn kho. Vui lòng quay lại giỏ hàng để cập nhật.",
            );
          }
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Không thể tải thông tin đặt hàng.",
        );
      }
    };
    void load();
  }, [isLoggedIn]);

  const shippingFee = 0;
  const discount = couponDiscount;
  const totals = calculateCheckoutTotals({
    items: cartItems.map((item) => ({
      price: toMoneyNumber(item.price),
      quantity: item.quantity,
    })),
    shippingFee,
    discount,
  });

  const handleSubmit = async () => {
    setError("");
    const hasOutOfStock = cartItems.some(
      (item) => item.product && item.quantity > item.product.stock,
    );
    if (hasOutOfStock) {
      setError(
        "Không thể đặt hàng. Có sản phẩm đã hết hàng hoặc không đủ tồn kho.",
      );
      return;
    }

    if (!cartItems.length) {
      setError("Giỏ hàng trống.");
      return;
    }

    if (!isLoggedIn && !guestEmail.trim()) {
      setError("Vui lòng nhập Email để nhận thông tin đơn hàng.");
      return;
    }

    setLoading(true);
    try {
      if (!address.provinceId || !address.wardId || !address.addressDetail) {
        setError("Vui lòng điền đầy đủ thông tin Tỉnh, Xã và Địa chỉ chi tiết.");
        setLoading(false);
        return;
      }

      const payload = {
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        provinceId: address.provinceId,
        wardId: address.wardId,
        addressDetail: address.addressDetail,
        // legacy compat
        province: address.province || "",
        commune: address.commune || "",
        detail: address.detail || "",
        paymentMethod,
        shippingFee: totals.shippingFee,
        couponCode: couponCode || undefined,
        note: note || undefined,
        machineId: paymentMethod === "qr" ? machineId : undefined,
      };

      const validationErrors = validateCheckoutPayload(payload);
      if (validationErrors.length) {
        setError(validationErrors[0]);
        setLoading(false);
        return;
      }

      if (isLoggedIn) {
        const res = await checkoutAPI.create(payload);
        if (paymentMethod === "qr") {
          router.push(`/checkout/payment?paymentId=${res.paymentId}`);
        } else {
          router.push(`/order-success?orderId=${res.orderId}`);
        }
      } else {
        const guestPayload = {
          ...payload,
          guestEmail,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        };
        const res = await checkoutAPI.createGuest(guestPayload);
        localStorage.removeItem("guest-cart");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
        }
        if (paymentMethod === "qr") {
          router.push(`/checkout/payment?paymentId=${res.paymentId}&email=${guestEmail}`);
        } else {
          router.push(`/order-success?orderId=${res.orderId}&email=${guestEmail}`);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể đặt hàng lúc này. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#fbf8f3] min-h-screen">
      <div className="bg-gradient-to-r from-amber-200 via-white to-amber-50 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          {t("label.checkout")}
        </h1>
        <p className="text-gray-500 mt-2">
          {t("label.home")} &gt; {t("label.checkout")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* EMAIL CONTACT FIELD FOR GUESTS */}
          {!isLoggedIn && (
            <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Email liên hệ</h2>
              <p className="text-xs text-gray-500">
                Nhập email của bạn để nhận hóa đơn điện tử và thông tin cập nhật đơn hàng.
              </p>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 text-gray-800"
              />
            </div>
          )}

          <AddressSelector value={address} onChange={setAddress} provinces={provinces} />
          <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />
          
          <CouponInput
            value={couponCode}
            onChange={setCouponCode}
            subtotal={totals.subtotal}
            shippingFee={totals.shippingFee}
            onApplyCoupon={(discount, code) => {
              setCouponDiscount(discount);
              setCouponCode(code);
            }}
            onRemoveCoupon={() => {
              setCouponDiscount(0);
              setCouponCode("");
            }}
            appliedCode={couponCode}
            cartItems={cartItems}
          />
          
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Ghi chú đơn hàng</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm cho người vận chuyển (tùy chọn)"
              className="mt-3 w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 text-gray-800"
            />
          </div>
        </div>

        <div className="space-y-6">
          <OrderSummary
            items={cartItems.map((item) => ({
              id: item.id,
              name: item.product?.name ?? "Sản phẩm",
              price: toMoneyNumber(item.price),
              quantity: item.quantity,
            }))}
            subtotal={totals.subtotal}
            shippingFee={totals.shippingFee}
            discount={totals.discount}
            total={totals.finalTotal}
            formatPrice={formatPrice}
          />

          {error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-3xl bg-amber-500 hover:bg-amber-600 px-6 py-4 text-white font-semibold shadow-md transition disabled:opacity-60 cursor-pointer">
            {loading ? "Đang xử lý..." : t("action.placeOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
