import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/products.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private itemRepo: Repository<OrderItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    private cartService: CartService,
  ) {}

  async checkout(userId: string) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    let total = 0;

    const orderItems: OrderItem[] = [];

    for (const item of cart.items) {
      const product = await this.productRepo.findOne({
        where: { id: item.product.id },
      });

      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Product ${item.product.name} is out of stock`,
        );
      }

      // trừ kho
      product.stock -= item.quantity;
      await this.productRepo.save(product);

      const orderItem = this.itemRepo.create({
        productId: product.id,
        productName: product.name,
        price: item.price,
        quantity: item.quantity,
      });

      total += item.price * item.quantity;
      orderItems.push(orderItem);
    }

    const order = this.orderRepo.create({
      userId,
      totalAmount: total,
      items: orderItems,
    });

    await this.orderRepo.save(order);

    // 🧹 clear cart
    cart.items = [];
    await this.cartService['cartRepo'].save(cart);

    return order;
  }

  // 📜 Lịch sử đơn
  async getMyOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { id: 'DESC' },
    });
  }

  // 🔍 Chi tiết đơn
  async getOrderById(userId: string, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new BadRequestException('Order not found');

    return order;
  }
}
