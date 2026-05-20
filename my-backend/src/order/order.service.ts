import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/products.entity';
import { CouponService } from '../coupons/coupon.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private itemRepo: Repository<OrderItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private cartService: CartService,

    private couponService: CouponService,
  ) {}

  async checkout(userId: string) {
    const cart = await this.cartService.getCart(Number(userId));

    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = 0;

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

      subtotal += item.price * item.quantity;
      orderItems.push(orderItem);
    }

    const { discountTotal, appliedCoupons, appliedCodes } =
      await this.couponService.applyBestCouponsForUser(
        Number(userId),
        cart.items,
        subtotal,
      );

    const total = Math.max(0, subtotal - discountTotal);

    const order = this.orderRepo.create({
      user: {
        id: Number(userId),
      },
      totalAmount: total,
      subtotalAmount: subtotal,
      discountAmount: discountTotal,
      couponCodes: appliedCodes,
      status: 'COMPLETED',
      items: orderItems,
    });

    await this.orderRepo.save(order);

    await this.userRepo.increment(
      { id: Number(userId) },
      'totalSpent',
      total,
    );

    if (appliedCoupons.length > 0) {
      await this.couponService.markCouponsUsed(appliedCoupons);
    }

    // 🧹 clear cart
    cart.items = [];
    await this.cartService['cartRepo'].save(cart);

    return order;
  }

  // 📜 Lịch sử đơn
  async getMyOrders(userId: string) {
    return this.orderRepo.find({
      where: { user: { id: Number(userId) } },
      relations: ['items'],
      order: { id: 'DESC' },
    });
  }

  // 🔍 Chi tiết đơn
  async getOrderById(userId: string, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: Number(userId) } },
      relations: ['items'],
    });

    if (!order) throw new BadRequestException('Order not found');

    return order;
  }
}
