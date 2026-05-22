import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderShippingAddress } from './order-shipping-address.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/products.entity';
import { CouponService } from '../coupons/coupon.service';
import { Payment } from '../payment/entities/payment.entity';
import { QrPayment } from '../payment/entities/qr-payment.entity';
import { PaymentService } from '../payment/payment.service';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    private cartService: CartService,

    private couponService: CouponService,

    private paymentService: PaymentService,

    private configService: ConfigService,

    private dataSource: DataSource,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const userIdNumber = Number(userId);
    if (!userIdNumber) {
      throw new BadRequestException('Invalid userId');
    }

    const cart = await this.cartService.getCart(userIdNumber);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const shippingFee = Math.max(0, dto.shippingFee ?? 0);

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const normalizedCouponCode = dto.couponCode?.trim();
    const couponResult = normalizedCouponCode
      ? await this.couponService.applyCouponCodeForUser(
          userIdNumber,
          normalizedCouponCode,
          cart.items,
          subtotal,
          shippingFee,
        )
      : await this.couponService.applyBestCouponsForUser(
          userIdNumber,
          cart.items,
          subtotal,
          shippingFee,
        );

    const discountTotal = couponResult.discountTotal;
    const appliedCoupons = couponResult.appliedCoupons;
    const appliedCodes = couponResult.appliedCodes;

    const total = Math.max(0, subtotal + shippingFee - discountTotal);

    const result = await this.dataSource.transaction(async (manager) => {
      const cartRepo = manager.getRepository(Cart);
      const cartItemRepo = manager.getRepository(CartItem);
      const productRepo = manager.getRepository(Product);
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const orderShippingRepo = manager.getRepository(OrderShippingAddress);
      const orderStatusRepo = manager.getRepository(OrderStatusLog);
      const paymentRepo = manager.getRepository(Payment);
      const qrPaymentRepo = manager.getRepository(QrPayment);

      const currentCart = await cartRepo.findOne({
        where: { user: { id: userIdNumber } },
        relations: ['items', 'items.product', 'items.product.category'],
      });

      if (!currentCart || !currentCart.items.length) {
        throw new BadRequestException('Cart is empty');
      }

      const orderItems: OrderItem[] = [];

      for (const item of currentCart.items) {
        const product = await productRepo.findOne({
          where: { id: item.product.id },
        });

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Product ${item.product.name} is out of stock`,
          );
        }

        product.stock -= item.quantity;
        await productRepo.save(product);

        const orderItem = orderItemRepo.create({
          productId: product.id,
          productName: product.name,
          price: item.price,
          quantity: item.quantity,
        });

        orderItems.push(orderItem);
      }

      const orderStatus = dto.paymentMethod === 'cod' ? 'confirmed' : 'pending';

      const order = orderRepo.create({
        user: { id: userIdNumber },
        totalAmount: total,
        subtotalAmount: subtotal,
        discountAmount: discountTotal,
        shippingFee,
        couponCodes: appliedCodes,
        paymentMethod: dto.paymentMethod,
        status: orderStatus,
        items: orderItems,
      });

      const savedOrder = await orderRepo.save(order);

      const shipping = orderShippingRepo.create({
        order: savedOrder,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        detail: dto.detail,
      });
      await orderShippingRepo.save(shipping);

      await orderStatusRepo.save({
        order: savedOrder,
        oldStatus: null,
        newStatus: orderStatus,
        note: dto.note ?? null,
      });

      const payment = paymentRepo.create({
        order_id: savedOrder.id,
        method: dto.paymentMethod,
        amount: total,
        status: 'pending',
      });

      const savedPayment = await paymentRepo.save(payment);

      let qrPayload: {
        qrDataURL: string;
        addInfo: string;
        expiredAt: string;
        qrToken: string;
      } | null = null;

      if (dto.paymentMethod === 'qr') {
        if (!dto.machineId) {
          throw new BadRequestException('machineId is required for QR payment');
        }

        const addInfoBase = `ORD${savedOrder.id}-PAY${savedPayment.id}`;
        const qrResponse = await this.paymentService.generateVietQr({
          amount: total,
          addInfo: addInfoBase,
          machineId: dto.machineId,
        });

        const qrToken = randomUUID().replace(/-/g, '');
        const expiredAt = new Date(qrResponse.expiredAt);

        savedPayment.expired_at = expiredAt;
        await paymentRepo.save(savedPayment);

        const bankName =
          this.configService.get<string>('VIETQR_BANK_NAME') ??
          this.configService.get<string>('VIETQR_ACQ_ID') ??
          'VietQR';

        const accountName =
          this.configService.get<string>('VIETQR_ACCOUNT_NAME') ?? '';
        const accountNumber =
          this.configService.get<string>('VIETQR_ACCOUNT_NO') ?? '';

        const qrPayment = qrPaymentRepo.create({
          order: savedOrder,
          payment: savedPayment,
          qrToken,
          bankName,
          accountName,
          accountNumber,
          amount: total,
          addInfo: qrResponse.addInfo,
          qrDataUrl: qrResponse.qrDataURL,
          status: 'pending',
          expiredAt,
        });
        await qrPaymentRepo.save(qrPayment);

        qrPayload = {
          qrDataURL: qrResponse.qrDataURL,
          addInfo: qrResponse.addInfo,
          expiredAt: qrResponse.expiredAt,
          qrToken,
        };
      }

      if (dto.paymentMethod === 'cod') {
        await cartItemRepo.delete({
          cart: { id: currentCart.id },
        });
      }

      return {
        order: savedOrder,
        payment: savedPayment,
        qr: qrPayload,
      };
    });

    if (dto.paymentMethod === 'cod' && appliedCoupons.length > 0) {
      await this.couponService.markCouponsUsed(appliedCoupons);
    }

    return {
      orderId: result.order.id,
      paymentId: result.payment.id,
      orderStatus: result.order.status,
      paymentStatus: result.payment.status,
      amount: result.payment.amount,
      paymentMethod: dto.paymentMethod,
      qr: result.qr,
    };
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
