import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/products.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private itemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // 🛒 Lấy cart
  async getCart(userId: string) {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'], // 🔥 FIX
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, items: [] });
      await this.cartRepo.save(cart);
    }

    return cart;
  }

  // ➕ Thêm vào cart
  async addToCart(userId: string, productId: number, quantity: number) {
    const product = await this.productRepo.findOne({
      where: { id: Number(productId) },
    });

    if (!product) throw new BadRequestException('Product not found');

    if (product.stock < quantity)
      throw new BadRequestException('Not enough stock');

    const cart = await this.getCart(userId);

    let item = cart.items.find((i) => i.product.id === Number(productId));

    if (item) {
      item.quantity += quantity;

      if (product.stock < item.quantity) {
        throw new BadRequestException('Not enough stock');
      }

      await this.itemRepo.save(item);
    } else {
      item = this.itemRepo.create({
        product,
        quantity,
        price: product.price, // 🔥 QUAN TRỌNG
        cart,
      });

      await this.itemRepo.save(item);
    }
    
    return this.getCart(userId);
  }

  // ❌ Xóa item
  async removeItem(userId: string, productId: number) {
    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) return null;

    await this.itemRepo.delete(item.id); // 🔥 FIX

    return this.getCart(userId);
  }

  // 🔄 Update quantity
  async updateQuantity(userId: string, productId: number, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be >= 1');
    }

    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) throw new BadRequestException('Item not found');

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product || product.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    item.quantity = quantity;

    await this.itemRepo.save(item);

    return this.getCart(userId);
  }
}
