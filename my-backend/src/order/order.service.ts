import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
import { LocationService } from '../locations/location.service';
import { DealsService } from '../deals/deals.service';
import { DealProduct } from '../deals/entities/deal-product.entity';

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

    private locationService: LocationService,

    private dealsService: DealsService,
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

    if (!dto.provinceId || !dto.wardId || !dto.addressDetail?.trim() || !dto.receiverName?.trim() || !dto.receiverPhone?.trim()) {
      throw new BadRequestException('Thông tin địa chỉ nhận hàng không đầy đủ.');
    }

    const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);

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

        // Check active deal for this product
        const dealProduct = await manager.getRepository(DealProduct).findOne({
          where: {
            productId: product.id,
            deal: {
              isActive: true,
              startsAt: LessThanOrEqual(new Date()),
              expiresAt: MoreThanOrEqual(new Date()),
            },
          },
          relations: ['deal'],
        });

        let purchasePrice = Number(product.price);
        if (dealProduct) {
          if (dealProduct.dealStock - dealProduct.soldCount < item.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${product.name}" đã hết số lượng giảm giá Flash Sale.`,
            );
          }
          dealProduct.soldCount += item.quantity;
          await manager.save(dealProduct);
          purchasePrice = Number(dealProduct.dealPrice);
        }

        product.stock -= item.quantity;
        await productRepo.save(product);

        const orderItem = orderItemRepo.create({
          productId: product.id,
          productName: product.name,
          price: purchasePrice,
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
        province: provinceName,
        district: '',
        ward: wardName,
        detail: dto.addressDetail,
        provinceId: dto.provinceId,
        wardId: dto.wardId,
        provinceName,
        wardName,
        addressDetail: dto.addressDetail,
        fullAddress: `${dto.addressDetail}, ${wardName}, ${provinceName}`,
      });
      await orderShippingRepo.save(shipping);

      await orderStatusRepo.save({
        order: savedOrder,
        oldStatus: null,
        newStatus: orderStatus,
        note: dto.note ?? null,
      });

      const paymentToken = `pay_tok_${randomUUID().replace(/-/g, '')}`;
      const tokenHash = createHash('sha256').update(paymentToken).digest('hex');

      const paymentCode = randomUUID().toUpperCase();
      const payment = paymentRepo.create({
        order_id: savedOrder.id,
        method: dto.paymentMethod,
        amount: totalForPayment,
        status: 'pending',
        tokenHash,
        paymentCode,
      } as any) as unknown as Payment;

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

        const qrResponse = await this.paymentService.generateSePayQr({
          amount: totalForPayment,
          paymentCode,
        });

        const qrToken = randomUUID().replace(/-/g, '');
        const expiredAt = new Date(qrResponse.expiredAt);

        savedPayment.expired_at = expiredAt;
        await paymentRepo.save(savedPayment);

        const qrPayment = qrPaymentRepo.create({
          order: savedOrder,
          payment: savedPayment,
          qrToken,
          bankName: qrResponse.bankName,
          accountName: qrResponse.accountName,
          accountNumber: qrResponse.accountNumber,
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
        paymentToken,
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
      paymentToken: result.paymentToken,
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
      
      const dealPrice = await this.dealsService.getProductDealPrice(product.id);
      const finalPrice = dealPrice !== null ? dealPrice : Number(product.price);
      
      subtotal += finalPrice * item.quantity;
      itemsWithProduct.push({
        product,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    if (!dto.provinceId || !dto.wardId || !dto.addressDetail?.trim() || !dto.receiverName?.trim() || !dto.receiverPhone?.trim()) {
      throw new BadRequestException('Thông tin địa chỉ nhận hàng không đầy đủ.');
    }

    const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);

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

        // Check active deal for this product
        const dealProduct = await manager.getRepository(DealProduct).findOne({
          where: {
            productId: product.id,
            deal: {
              isActive: true,
              startsAt: LessThanOrEqual(new Date()),
              expiresAt: MoreThanOrEqual(new Date()),
            },
          },
          relations: ['deal'],
        });

        let purchasePrice = item.price;
        if (dealProduct) {
          if (dealProduct.dealStock - dealProduct.soldCount < item.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${product.name}" đã hết số lượng giảm giá Flash Sale.`,
            );
          }
          dealProduct.soldCount += item.quantity;
          await manager.save(dealProduct);
          purchasePrice = Number(dealProduct.dealPrice);
        }

        product.stock -= item.quantity;
        await productRepo.save(product);

        const orderItem = orderItemRepo.create({
          productId: product.id,
          productName: product.name,
          price: purchasePrice,
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

      const shipping = orderShippingRepo.create({
        order: savedOrder,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        province: provinceName,
        district: '',
        ward: wardName,
        detail: dto.addressDetail,
        provinceId: dto.provinceId,
        wardId: dto.wardId,
        provinceName,
        wardName,
        addressDetail: dto.addressDetail,
        fullAddress: `${dto.addressDetail}, ${wardName}, ${provinceName}`,
      });
      await orderShippingRepo.save(shipping);

      await orderStatusRepo.save({
        order: savedOrder,
        oldStatus: null,
        newStatus: orderStatus,
        note: dto.note ?? null,
      });

      const paymentToken = `pay_tok_${randomUUID().replace(/-/g, '')}`;
      const tokenHash = createHash('sha256').update(paymentToken).digest('hex');

      const paymentCode = randomUUID().toUpperCase();
      const payment = paymentRepo.create({
        order_id: savedOrder.id,
        method: dto.paymentMethod,
        amount: totalForPayment,
        status: 'pending',
        tokenHash,
        paymentCode,
      } as any) as unknown as Payment;

      const savedPayment = await paymentRepo.save(payment);

      let qrPayload: any = null;

      if (dto.paymentMethod === 'qr') {
        if (!dto.machineId) {
          throw new BadRequestException('machineId is required for QR payment');
        }

        const qrResponse = await this.paymentService.generateSePayQr({
          amount: totalForPayment,
          paymentCode,
        });

        const qrToken = randomUUID().replace(/-/g, '');
        const expiredAt = new Date(qrResponse.expiredAt);

        savedPayment.expired_at = expiredAt;
        await paymentRepo.save(savedPayment);

        const qrPayment = qrPaymentRepo.create({
          order: savedOrder,
          payment: savedPayment,
          qrToken,
          bankName: qrResponse.bankName,
          accountName: qrResponse.accountName,
          accountNumber: qrResponse.accountNumber,
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
        paymentToken,
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
      paymentToken: result.paymentToken,
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

  private async saveImageProof(base64Data: string): Promise<string> {
    if (!base64Data.startsWith('data:')) {
      throw new BadRequestException('Ảnh minh chứng không hợp lệ.');
    }

    const parts = base64Data.split(';base64,');
    if (parts.length !== 2) {
      throw new BadRequestException('Ảnh minh chứng không hợp lệ.');
    }

    const mimeType = parts[0].replace('data:', '');
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, WEBP.');
    }

    const base64Content = parts[1];
    const approximateSize = (base64Content.length * 3) / 4;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (approximateSize > maxSizeBytes) {
      throw new BadRequestException('Kích thước ảnh minh chứng không được vượt quá 5MB.');
    }

    const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'returns');

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      
      return `/uploads/returns/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Không thể lưu ảnh minh chứng. Vui lòng thử lại.');
    }
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

    // deliveredAt verification (7 days limit)
    if (!order.deliveredAt) {
      // Fallback
      const deliveryLog = await this.dataSource.getRepository(OrderStatusLog).findOne({
        where: { order: { id: orderId }, newStatus: 'delivered' },
        order: { id: 'DESC' }
      });
      if (deliveryLog) {
        order.deliveredAt = deliveryLog.createdAt;
      }
    }

    if (order.deliveredAt) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - order.deliveredAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        throw new BadRequestException('Đơn hàng đã quá thời hạn 7 ngày đổi trả kể từ ngày nhận hàng thành công.');
      }
    }

    const oldStatus = order.status;
    order.status = 'return_requested';

    let imagePath: string | null = null;
    if (dto.imageProof) {
      imagePath = await this.saveImageProof(dto.imageProof);
    }

    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const returnRepo = manager.getRepository(OrderReturn);
      const statusLogRepo = manager.getRepository(OrderStatusLog);

      const returnRequest = returnRepo.create({
        order,
        reason: dto.reason,
        imageProof: imagePath,
        status: 'return_requested',
        refundAmount: order.totalAmount,
      });
      await returnRepo.save(returnRequest);

      await orderRepo.save(order);

      await statusLogRepo.save({
        order,
        oldStatus,
        newStatus: 'return_requested',
        note: `Yêu cầu trả hàng: ${dto.reason}`,
      });
    });

    return { success: true };
  }

  async cancelReturn(userId: string, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: Number(userId) } },
    });

    if (!order) {
      throw new BadRequestException('Không tìm thấy đơn hàng.');
    }

    const returnRepo = this.dataSource.getRepository(OrderReturn);
    const activeReturn = await returnRepo.findOne({
      where: { order: { id: orderId } },
      order: { id: 'DESC' }
    });

    if (!activeReturn) {
      throw new BadRequestException('Không tìm thấy yêu cầu đổi trả.');
    }

    if (activeReturn.status !== 'return_requested') {
      throw new BadRequestException('Chỉ có thể hủy yêu cầu đổi trả khi đang chờ duyệt.');
    }

    const oldStatus = order.status;
    order.status = 'delivered';
    activeReturn.status = 'return_cancelled';

    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const returnRepo = manager.getRepository(OrderReturn);
      const statusLogRepo = manager.getRepository(OrderStatusLog);

      await returnRepo.save(activeReturn);
      await orderRepo.save(order);

      await statusLogRepo.save({
        order,
        oldStatus,
        newStatus: 'delivered',
        note: 'Khách hàng tự hủy yêu cầu đổi trả',
      });
    });

    return { success: true };
  }

  async getReturnDetails(userId: string, orderId: number, role?: string) {
    const whereCondition: any = { id: orderId };
    if (role !== 'admin') {
      whereCondition.user = { id: Number(userId) };
    }
    
    const order = await this.orderRepo.findOne({
      where: whereCondition,
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const returnRequest = await this.dataSource.getRepository(OrderReturn).findOne({
      where: { order: { id: orderId } },
      order: { id: 'DESC' },
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
