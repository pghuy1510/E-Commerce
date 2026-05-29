export type CheckoutTotalInput = {
  items: Array<{
    price: number;
    quantity: number;
  }>;
  shippingFee?: number;
  discount?: number;
};

export type CheckoutTotals = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  finalTotal: number;
};

export function toMoneyNumber(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function toVndAmount(value: unknown): number {
  return Math.round(toMoneyNumber(value));
}

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(toVndAmount(value))} ₫`;
}

export function calculateCartSubtotal(
  items: CheckoutTotalInput["items"],
): number {
  return items.reduce((sum, item) => {
    return sum + toVndAmount(item.price) * toMoneyNumber(item.quantity);
  }, 0);
}

export function calculateCheckoutTotals({
  items,
  shippingFee = 0,
  discount = 0,
}: CheckoutTotalInput): CheckoutTotals {
  const subtotal = calculateCartSubtotal(items);
  const normalizedShippingFee = Math.max(0, toVndAmount(shippingFee));
  const normalizedDiscount = Math.max(0, toVndAmount(discount));

  return {
    subtotal,
    shippingFee: normalizedShippingFee,
    discount: normalizedDiscount,
    finalTotal: Math.max(
      0,
      toVndAmount(subtotal + normalizedShippingFee - normalizedDiscount),
    ),
  };
}
