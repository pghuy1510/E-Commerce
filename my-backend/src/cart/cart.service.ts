import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, items: [] });
      await this.cartRepo.save(cart);
    }

    return cart;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const cart = await this.getCart(userId);
    const product = await this.productRepo.findOneBy({ id: productId });

    if (!product) throw new NotFoundException('Product not found');

    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    let item = cart.items.find((i) => i.product.id === productId);

    if (item) {
      item.quantity += quantity;

      if (item.quantity > product.stock) {
        throw new BadRequestException('Exceeds stock');
      }

      await this.itemRepo.save(item);
    } else {
      item = this.itemRepo.create({
        product,
        quantity,
        cart,
        price: product.price,
      });

      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) throw new NotFoundException('Item not found');

    const product = await this.productRepo.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    item.quantity = quantity;
    await this.itemRepo.save(item);

    return this.getCart(userId);
  }

  async removeItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) throw new NotFoundException('Item not found');

    await this.itemRepo.remove(item);

    return this.getCart(userId);
  }

  async clearCart(userId: number) {
    const cart = await this.getCart(userId);

    await this.itemRepo.delete({ cart: { id: cart.id } });

    return this.getCart(userId);
  }
}
