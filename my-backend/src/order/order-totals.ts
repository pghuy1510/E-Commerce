import { BadRequestException } from '@nestjs/common';
import type { CartItem } from '../cart/cart-item.entity';

export type OrderTotals = {
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  finalTotal: number;
};

export function toMoneyNumber(value: unknown, fieldName: string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw new BadRequestException(`${fieldName} is invalid.`);
  }
  return amount;
}

export function toVndAmount(value: unknown, fieldName: string): number {
  const amount = toMoneyNumber(value, fieldName);
  return Math.round(amount);
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + toVndAmount(item.price, 'Cart item price') * item.quantity;
  }, 0);
}

export function calculateOrderTotals(params: {
  subtotal: number;
  shippingFee?: number;
  discountTotal?: number;
}): OrderTotals {
  const subtotal = toVndAmount(params.subtotal, 'Subtotal');
  const shippingFee = Math.max(
    0,
    toVndAmount(params.shippingFee ?? 0, 'Shipping fee'),
  );
  const discountTotal = Math.max(
    0,
    toVndAmount(params.discountTotal ?? 0, 'Discount total'),
  );
  const finalTotal = Math.max(0, subtotal + shippingFee - discountTotal);

  return {
    subtotal,
    shippingFee,
    discountTotal,
    finalTotal,
  };
}
