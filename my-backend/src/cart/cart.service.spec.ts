import { Injectable } from '@nestjs/common';
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

  async getCart(userId: number) {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, items: [] });
      await this.cartRepo.save(cart);
    }

    return cart;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    let cart = await this.getCart(userId);

    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw new Error('Product not found');

    let item = cart.items.find((i) => i.product.id === productId);

    if (item) {
      item.quantity += quantity;
      await this.itemRepo.save(item);
    } else {
      item = this.itemRepo.create({
        product,
        quantity,
        cart,
      });
      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) return null;

    await this.itemRepo.remove(item);

    return this.getCart(userId);
  }
}
