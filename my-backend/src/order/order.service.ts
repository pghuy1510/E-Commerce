import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderShippingAddress } from './order-shipping-address.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { OrderReturn } from './order-return.entity';
import { CheckoutDto, GuestCheckoutDto } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/products.entity';
import { CouponService } from '../coupons/coupon.service';
import { Payment } from '../payment/entities/payment.entity';
import { QrPayment } from '../payment/entities/qr-payment.entity';
import { PaymentService } from '../payment/payment.service';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { getCommuneName } from '../common/address';
import { calculateCartSubtotal, calculateOrderTotals } from './order-totals';
import { User } from '../users/entities/user.entity';
import { MailService } from '../common/mail.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    private cartService: CartService,

    private couponService: CouponService,

    private paymentService: PaymentService,

    private dataSource: DataSource,

    private mailService: MailService,
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

    const commune = getCommuneName(dto);
    if (!commune) {
      throw new BadRequestException('Commune is required');
    }

    const subtotal = calculateCartSubtotal(cart.items);
    const baseTotals = calculateOrderTotals({
      subtotal,
      shippingFee: dto.shippingFee ?? 0,
      discountTotal: 0,
    });

    const normalizedCouponCode = dto.couponCode?.trim();
    const couponResult = normalizedCouponCode
      ? await this.couponService.applyCouponCodeForUser(
          userIdNumber,
          normalizedCouponCode,
          cart.items,
          baseTotals.subtotal,
          baseTotals.shippingFee,
        )
      : await this.couponService.applyBestCouponsForUser(
          userIdNumber,
          cart.items,
          baseTotals.subtotal,
          baseTotals.shippingFee,
        );

    const totals = calculateOrderTotals({
      subtotal: baseTotals.subtotal,
      shippingFee: baseTotals.shippingFee,
      discountTotal: couponResult.discountTotal,
    });
    const discountTotal = totals.discountTotal;
    const appliedCoupons = couponResult.appliedCoupons;
    const appliedCodes = couponResult.appliedCodes;
    const totalForPayment = totals.finalTotal;

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

        if (!product) {
          throw new BadRequestException('Sản phẩm không tồn tại.');
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng trong kho (hiện chỉ còn ${product.stock} sản phẩm). Vui lòng quay lại giỏ hàng để cập nhật.`,
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
        totalAmount: totalForPayment,
        subtotalAmount: totals.subtotal,
        discountAmount: discountTotal,
        shippingFee: totals.shippingFee,
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
        district: commune,
        ward: '',
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
        amount: totalForPayment,
        status: 'pending',
      });

      const savedPayment = await paymentRepo.save(payment);

      let qrPayload: {
        qrDataURL: string;
        addInfo: string;
        expiredAt: string;
        qrToken: string;
        amount: number;
      } | null = null;

      if (dto.paymentMethod === 'qr') {
        if (!dto.machineId) {
          throw new BadRequestException('machineId is required for QR payment');
        }

        const addInfoBase = `ORD${savedOrder.id}-PAY${savedPayment.id}`;
        const qrResponse = await this.paymentService.generateVietQr({
          amount: totalForPayment,
          addInfo: addInfoBase,
          machineId: dto.machineId,
        });

        const qrToken = randomUUID().replace(/-/g, '');
        const expiredAt = new Date(qrResponse.expiredAt);

        savedPayment.expired_at = expiredAt;
        await paymentRepo.save(savedPayment);

        const bankInfo = this.paymentService.getVietQrBankInfo();

        const qrPayment = qrPaymentRepo.create({
          order: savedOrder,
          payment: savedPayment,
          qrToken,
          bankName: bankInfo.bankName,
          accountName: bankInfo.accountName,
          accountNumber: bankInfo.accountNumber,
          amount: totalForPayment,
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
          amount: totalForPayment,
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

    try {
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userIdNumber } });
      if (user && user.email) {
        this.mailService.sendOrderConfirmation(
          user.email,
          result.order.id,
          Number(result.order.totalAmount),
          result.order.items,
        );
      }
    } catch (e) {
      console.error('Lỗi khi gửi email xác nhận đơn hàng:', e);
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

  async checkoutGuest(dto: GuestCheckoutDto) {
    const itemsWithProduct: { product: Product; quantity: number; price: number }[] = [];
    let subtotal = 0;
    for (const item of dto.items) {
      const product = await this.dataSource.getRepository(Product).findOne({
        where: { id: item.productId },
        relations: ['category'],
      });
      if (!product) {
        throw new BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng.`);
      }
      subtotal += Number(product.price) * item.quantity;
      itemsWithProduct.push({
        product,
        quantity: item.quantity,
        price: Number(product.price),
      });
    }

    const baseTotals = calculateOrderTotals({
      subtotal,
      shippingFee: dto.shippingFee ?? 0,
      discountTotal: 0,
    });

    let discountTotal = 0;
    let appliedCodes: string[] = [];
    if (dto.couponCode?.trim()) {
      const couponResult = await this.couponService.validateCouponCodeForGuest(
        dto.couponCode.trim(),
        dto.items,
        baseTotals.subtotal,
        baseTotals.shippingFee,
      );
      discountTotal = couponResult.discountTotal;
      appliedCodes = [couponResult.couponCode];
    }

    const totals = calculateOrderTotals({
      subtotal: baseTotals.subtotal,
      shippingFee: baseTotals.shippingFee,
      discountTotal,
    });
    const totalForPayment = totals.finalTotal;

    const result = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const orderShippingRepo = manager.getRepository(OrderShippingAddress);
      const orderStatusRepo = manager.getRepository(OrderStatusLog);
      const paymentRepo = manager.getRepository(Payment);
      const qrPaymentRepo = manager.getRepository(QrPayment);

      const orderItems: OrderItem[] = [];

      for (const item of itemsWithProduct) {
        const product = await productRepo.findOne({
          where: { id: item.product.id },
        });
        if (!product) {
          throw new BadRequestException('Sản phẩm không tồn tại.');
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng trong kho.`,
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
        user: null,
        guestEmail: dto.guestEmail,
        totalAmount: totalForPayment,
        subtotalAmount: totals.subtotal,
        discountAmount: discountTotal,
        shippingFee: totals.shippingFee,
        couponCodes: appliedCodes,
        paymentMethod: dto.paymentMethod,
        status: orderStatus,
        items: orderItems,
      });

      const savedOrder = await orderRepo.save(order);

      const commune = getCommuneName(dto);
      const shipping = orderShippingRepo.create({
        order: savedOrder,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        province: dto.province,
        district: commune || '',
        ward: '',
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
        amount: totalForPayment,
        status: 'pending',
      });

      const savedPayment = await paymentRepo.save(payment);

      let qrPayload: any = null;

      if (dto.paymentMethod === 'qr') {
        if (!dto.machineId) {
          throw new BadRequestException('machineId is required for QR payment');
        }

        const addInfoBase = `ORD${savedOrder.id}-PAY${savedPayment.id}`;
        const qrResponse = await this.paymentService.generateVietQr({
          amount: totalForPayment,
          addInfo: addInfoBase,
          machineId: dto.machineId,
        });

        const qrToken = randomUUID().replace(/-/g, '');
        const expiredAt = new Date(qrResponse.expiredAt);

        savedPayment.expired_at = expiredAt;
        await paymentRepo.save(savedPayment);

        const bankInfo = this.paymentService.getVietQrBankInfo();

        const qrPayment = qrPaymentRepo.create({
          order: savedOrder,
          payment: savedPayment,
          qrToken,
          bankName: bankInfo.bankName,
          accountName: bankInfo.accountName,
          accountNumber: bankInfo.accountNumber,
          amount: totalForPayment,
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
          amount: totalForPayment,
        };
      }

      return {
        order: savedOrder,
        payment: savedPayment,
        qr: qrPayload,
      };
    });

    try {
      this.mailService.sendOrderConfirmation(
        dto.guestEmail,
        result.order.id,
        Number(result.order.totalAmount),
        result.order.items,
      );
    } catch (e) {
      console.error('Lỗi khi gửi email xác nhận đơn hàng cho khách vãng lai:', e);
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

  async getGuestOrderById(orderId: number, email: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, guestEmail: email },
      relations: ['items', 'statusLogs'],
    });
    if (!order) {
      throw new BadRequestException('Không tìm thấy đơn hàng hoặc email không chính xác.');
    }
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
      relations: ['items', 'statusLogs'],
    });

    if (!order) throw new BadRequestException('Order not found');

    const shippingAddress = await this.dataSource
      .getRepository(OrderShippingAddress)
      .findOne({
        where: { order: { id: orderId } },
      });

    const payment = await this.dataSource
      .getRepository(Payment)
      .findOne({
        where: { order_id: orderId },
      });

    return {
      ...order,
      shippingAddress,
      paymentId: payment?.id || null,
      paymentStatus: payment?.status || 'pending',
    };
  }

  async cancelOrder(userId: string, orderId: number, reason: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: Number(userId) } },
      relations: ['items'],
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new BadRequestException('Only pending or confirmed orders can be cancelled');
    }

    const oldStatus = order.status;
    order.status = 'cancelled';

    // Restore inventory
    await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const orderRepo = manager.getRepository(Order);
      const statusLogRepo = manager.getRepository(OrderStatusLog);

      for (const item of order.items) {
        const product = await productRepo.findOne({ where: { id: item.productId } });
        if (product) {
          product.stock += item.quantity;
          await productRepo.save(product);
        }
      }

      await orderRepo.save(order);

      await statusLogRepo.save({
        order,
        oldStatus,
        newStatus: 'cancelled',
        note: reason || 'User requested cancellation',
      });
    });

    return { success: true };
  }

  async requestReturn(
    userId: string,
    orderId: number,
    dto: { reason: string; imageProof?: string }
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: Number(userId) } },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const oldStatus = order.status;
    order.status = 'refund_pending';

    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const returnRepo = manager.getRepository(OrderReturn);
      const statusLogRepo = manager.getRepository(OrderStatusLog);

      const returnRequest = returnRepo.create({
        order,
        reason: dto.reason,
        imageProof: dto.imageProof ?? null,
        status: 'pending',
        refundAmount: order.totalAmount,
      });
      await returnRepo.save(returnRequest);

      await orderRepo.save(order);

      await statusLogRepo.save({
        order,
        oldStatus,
        newStatus: 'refund_pending',
        note: `Yêu cầu trả hàng: ${dto.reason}`,
      });
    });

    return { success: true };
  }

  async getReturnDetails(userId: string, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: Number(userId) } },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const returnRequest = await this.dataSource.getRepository(OrderReturn).findOne({
      where: { order: { id: orderId } },
    });

    return returnRequest || null;
  }

  async changePaymentMethodToCod(userId: string, orderId: number) {
    const userIdNumber = Number(userId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userIdNumber } },
    });

    if (!order) {
      throw new BadRequestException('Không tìm thấy đơn hàng');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể đổi phương thức thanh toán cho đơn hàng đang chờ thanh toán');
    }

    const oldStatus = order.status;
    order.paymentMethod = 'cod';
    order.status = 'confirmed';

    // Update corresponding Payment method
    const paymentRepo = this.dataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { order_id: orderId },
    });

    if (payment) {
      payment.method = 'cod';
      await paymentRepo.save(payment);
    }

    const statusLogRepo = this.dataSource.getRepository(OrderStatusLog);
    const log = statusLogRepo.create({
      order,
      oldStatus,
      newStatus: 'confirmed',
      note: 'Người dùng thay đổi phương thức thanh toán sang COD',
    });

    await this.orderRepo.save(order);
    await statusLogRepo.save(log);

    return { success: true };
  }
}
