import { Injectable } from '@nestjs/common';

type CartItem = {
  productId: number;
  quantity: number;
};

type Cart = {
  userId: number;
  items: CartItem[];
};

@Injectable()
export class CartService {
  private carts: Cart[] = [];

  getCart(userId: number) {
    return this.carts.find((c) => c.userId === userId) || { userId, items: [] };
  }

  addToCart(userId: number, productId: number, quantity: number) {
    let cart = this.carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = { userId, items: [] };
      this.carts.push(cart);
    }

    const item = cart.items.find((i) => i.productId === productId);

    if (item) {
      item.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    return cart;
  }

  updateQuantity(userId: number, productId: number, quantity: number) {
    const cart = this.carts.find((c) => c.userId === userId);
    if (!cart) return null;

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) return null;

    item.quantity = quantity;
    return cart;
  }

  removeItem(userId: number, productId: number) {
    const cart = this.carts.find((c) => c.userId === userId);
    if (!cart) return null;

    // Xóa item
    cart.items = cart.items.filter((i) => i.productId !== productId);

    // Nếu giỏ rỗng → xóa luôn cart
    if (cart.items.length === 0) {
      this.carts = this.carts.filter((c) => c.userId !== userId);
      return { message: 'Cart deleted' }; // optional
    }

    return cart;
  }
}
