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
  couponAPI,
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

type CartItem = {
  id: number;
  quantity: number;
  price: number;
  product?: {
    name: string;
    stock: number;
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const { t, formatPrice } = usePreferences();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<ShippingAddress>({
    receiverName: "",
    receiverPhone: "",
    province: "",
    commune: "",
    detail: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const [cartRes, addressRes, profileRes] = await Promise.all([
          cartAPI.get(),
          userAddressAPI.get(),
          userProfileAPI.get(),
        ]);

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
        }));
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Failed to load checkout details.",
        );
      }
    };
    void load();
  }, []);

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
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...toLegacyAddressPayload(address),
        commune: address.commune,
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

      const res = await checkoutAPI.create(payload);

      if (paymentMethod === "qr") {
        router.push(`/checkout/payment?paymentId=${res.paymentId}`);
      } else {
        router.push(`/order-success?orderId=${res.orderId}`);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to place order. Please try again.",
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
          <AddressSelector value={address} onChange={setAddress} />
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
          />
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Order note</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the courier"
              className="mt-3 w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="space-y-6">
          <OrderSummary
            items={cartItems.map((item) => ({
              id: item.id,
              name: item.product?.name ?? "Item",
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
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-3xl bg-amber-500 px-6 py-4 text-white font-semibold shadow-md hover:bg-amber-600 transition disabled:opacity-60">
            {loading ? "Processing..." : t("action.placeOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
