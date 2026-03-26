import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart/cart-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,

    private cartService: CartService,
  ) {}

  async checkout(userId: number) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    let total = 0;

    // 👉 Tính tổng tiền
    const orderItemsData = cart.items.map((item) => {
      const price = item.price; // 🔥 dùng price trong cart

      total += price * item.quantity;

      return {
        productId: item.product.id,
        quantity: item.quantity,
        price,
      };
    });

    // 👉 Tạo order
    const order = this.orderRepo.create({
      userId,
      totalAmount: total,
    });

    const savedOrder = await this.orderRepo.save(order);

    // 👉 Tạo order items
    const items = orderItemsData.map((i) =>
      this.orderItemRepo.create({
        ...i,
        order: savedOrder,
      }),
    );

    await this.orderItemRepo.save(items);

    // 👉 clear cart (QUAN TRỌNG)
    await this.cartService.clearCart(userId);

    return savedOrder;
  }
}