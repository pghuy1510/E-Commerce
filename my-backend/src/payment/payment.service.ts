import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, LessThan, Repository } from 'typeorm';
import { randomUUID, createHash } from 'crypto';

import { Payment } from './entities/payment.entity';
import { QrPayment } from './entities/qr-payment.entity';
import { PaymentLog } from './entities/payment-log.entity';
import { Order } from '../order/order.entity';
import { OrderStatusLog } from '../order/order-status-log.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { User } from '../users/entities/user.entity';
import { CouponService } from '../coupons/coupon.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { calculateCartSubtotal, calculateOrderTotals, toMoneyNumber } from '../order/order-totals';
import { MailService } from '../common/mail.service';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,

    @InjectRepository(QrPayment)
    private qrPaymentRepo: Repository<QrPayment>,

    @InjectRepository(PaymentLog)
    private paymentLogRepo: Repository<PaymentLog>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderStatusLog)
    private orderStatusRepo: Repository<OrderStatusLog>,

    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private couponService: CouponService,

    private configService: ConfigService,

    private dataSource: DataSource,

    private mailService: MailService,
  ) {}

  private webhookFailureCounter = 0;
  private lastWebhookFailureTime = 0;

  private trackWebhookFailure(paymentId: number, error: any) {
    const now = Date.now();
    if (now - this.lastWebhookFailureTime > 60000) {
      this.webhookFailureCounter = 0;
    }
    this.webhookFailureCounter++;
    this.lastWebhookFailureTime = now;

    console.error(`[ALERT] Webhook processing failed for payment ${paymentId}. Error: ${error.message || error}`);
    if (this.webhookFailureCounter >= 5) {
      console.warn(`[CRITICAL ALERT] Webhook failure threshold exceeded! ${this.webhookFailureCounter} failures in the last minute. Redis/Sentry Alert should be triggered here in production.`);
    }
  }

  async create(dto: CreatePaymentDto) {
    const payment = this.paymentRepo.create({
      ...dto,
      status: 'pending',
    });

    return this.paymentRepo.save(payment);
  }

  async success(id: number) {
    return this.paymentRepo.update(id, {
      status: 'paid',
      transaction_id: 'FAKE_TXN_' + Date.now(),
      paid_at: new Date(),
    });
  }

  async fail(id: number) {
    return this.paymentRepo.update(id, {
      status: 'failed',
    });
  }

  async getByOrder(orderId: number) {
    return this.paymentRepo.find({
      where: { order_id: orderId },
    });
  }

  async getPaymentStatus(paymentId: number, token?: string, userId?: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const order = await this.orderRepo.findOne({
      where: { id: payment.order_id },
      relations: ['user'],
    });

    // Check ownership
    let isAuthorized = false;

    // 1. If user is logged in and is the owner
    if (userId && order?.user?.id === userId) {
      isAuthorized = true;
    }

    // 2. If token is provided and matches tokenHash in DB (or matches guest email for fallback)
    if (token) {
      if (payment.tokenHash) {
        const providedHash = createHash('sha256').update(token).digest('hex');
        if (payment.tokenHash === providedHash) {
          isAuthorized = true;
        }
      } else if (order?.guestEmail && order.guestEmail === token) {
        // Fallback for legacy payments: authorize and auto-generate tokenHash for future visits
        isAuthorized = true;
        const newToken = `pay_tok_${randomUUID().replace(/-/g, '')}`;
        payment.tokenHash = createHash('sha256').update(newToken).digest('hex');
        await this.paymentRepo.save(payment);
      }
    }

    if (!isAuthorized) {
      throw new BadRequestException('Bạn không có quyền truy cập thông tin thanh toán này.');
    }

    if (payment.method !== 'qr') {
      throw new BadRequestException('Webhook only supports QR payments');
    }

    const qrPayment = await this.qrPaymentRepo.findOne({
      where: { payment: { id: payment.id } },
      order: { createdAt: 'DESC' },
    });

    // Mask accountNumber if status is not pending
    let maskedAccountNumber = qrPayment?.accountNumber ?? '';
    if (payment.status !== 'pending' && maskedAccountNumber) {
      if (maskedAccountNumber.length > 3) {
        maskedAccountNumber = '*'.repeat(maskedAccountNumber.length - 3) + maskedAccountNumber.slice(-3);
      } else {
        maskedAccountNumber = '***';
      }
    }

    return {
      paymentId: payment.id,
      orderId: payment.order_id,
      paymentStatus: payment.status,
      orderStatus: order?.status ?? null,
      amount: payment.amount,
      qr: qrPayment
        ? {
            qrDataURL: qrPayment.qrDataUrl,
            addInfo: qrPayment.addInfo,
            expiredAt: qrPayment.expiredAt?.toISOString() ?? null,
            qrToken: qrPayment.qrToken,
            status: qrPayment.status,
            bankName: qrPayment.bankName,
            accountName: qrPayment.accountName,
            accountNumber: maskedAccountNumber,
          }
        : null,
    };
  }

  async regenerateQr(paymentId: number, machineId: string, token?: string, userId?: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const order = await this.orderRepo.findOne({
      where: { id: payment.order_id },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership
    let isAuthorized = false;
    if (userId && order.user?.id === userId) {
      isAuthorized = true;
    }
    if (token) {
      if (payment.tokenHash) {
        const providedHash = createHash('sha256').update(token).digest('hex');
        if (payment.tokenHash === providedHash) {
          isAuthorized = true;
        }
      } else if (order.guestEmail && order.guestEmail === token) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new BadRequestException('Bạn không có quyền truy cập thông tin thanh toán này.');
    }

    if (payment.method !== 'qr') {
      throw new BadRequestException('Payment method does not support QR.');
    }

    if (payment.status === 'paid') {
      throw new BadRequestException('Payment already completed.');
    }

    const amount = this.normalizePaymentAmount(payment.amount);
    if (!payment.paymentCode) {
      payment.paymentCode = randomUUID().toUpperCase();
      await this.paymentRepo.save(payment);
    }
    const qrResponse = await this.generateSePayQr({
      amount,
      paymentCode: payment.paymentCode,
    });

    const now = new Date();
    await this.qrPaymentRepo
      .createQueryBuilder()
      .update(QrPayment)
      .set({ status: 'expired', expiredAt: now })
      .where('payment_id = :paymentId', { paymentId })
      .andWhere('status = :status', { status: 'pending' })
      .execute();

    const qrToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiredAt = new Date(qrResponse.expiredAt);

    payment.status = 'pending';
    payment.expired_at = expiredAt;
    await this.paymentRepo.save(payment);

    const qrPayment = this.qrPaymentRepo.create({
      order,
      payment,
      qrToken,
      bankName: qrResponse.bankName,
      accountName: qrResponse.accountName,
      accountNumber: qrResponse.accountNumber,
      amount,
      addInfo: qrResponse.addInfo,
      qrDataUrl: qrResponse.qrDataURL,
      status: 'pending',
      expiredAt,
    });

    await this.qrPaymentRepo.save(qrPayment);

    return {
      qrDataURL: qrResponse.qrDataURL,
      addInfo: qrResponse.addInfo,
      expiredAt: qrResponse.expiredAt,
      qrToken,
      amount,
      bankName: qrResponse.bankName,
      accountName: qrResponse.accountName,
      accountNumber: qrResponse.accountNumber,
    };
  }

  async handleWebhook(dto: PaymentWebhookDto, raw: Record<string, unknown>) {
    let payment: Payment | null = null;
    try {
      if (!dto.code) {
        await this.paymentLogRepo.save({
          provider: 'sepay',
          providerTransactionId: dto.id ? String(dto.id) : null,
          rawResponse: raw,
          status: 'ignored',
        } as any);
        return { status: 'ignored' };
      }

      payment = await this.paymentRepo.findOne({
        where: { paymentCode: dto.code.trim().toUpperCase() },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const providerTransactionId = String(dto.id);
      const amount = this.normalizePaymentAmount(payment.amount);
      if (Math.abs(amount - dto.transferAmount) > 0.01) {
        throw new BadRequestException('Amount mismatch');
      }

      const order = await this.orderRepo.findOne({
        where: { id: payment.order_id },
        relations: ['user'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const qrPayment = await this.qrPaymentRepo.findOne({
        where: { payment: { id: payment.id }, addInfo: payment.paymentCode! },
        order: { createdAt: 'DESC' },
      });

      if (!qrPayment) {
        throw new BadRequestException('Transfer content not recognized');
      }

      if (qrPayment.status !== 'pending') {
        throw new BadRequestException('QR payment already processed');
      }

      const existingLog = await this.paymentLogRepo.findOne({
        where: { providerTransactionId },
      });

      if (existingLog) {
        return { status: 'duplicate' };
      }

      return this.dataSource.transaction(async (manager) => {
        const paymentRepo = manager.getRepository(Payment);
        const orderRepo = manager.getRepository(Order);
        const qrRepo = manager.getRepository(QrPayment);
        const logRepo = manager.getRepository(PaymentLog);
        const orderStatusRepo = manager.getRepository(OrderStatusLog);
        const cartRepo = manager.getRepository(Cart);
        const cartItemRepo = manager.getRepository(CartItem);
        const userRepo = manager.getRepository(User);

        const now = new Date();

        const currentPayment = await paymentRepo.findOne({
          where: { id: payment!.id },
        });

        if (!currentPayment) {
          throw new NotFoundException('Payment not found');
        }

        if (currentPayment.status === 'paid') {
          await logRepo.save({
            payment: currentPayment,
            provider: 'sepay',
            providerTransactionId,
            rawResponse: raw,
            status: 'duplicate',
          });
          return { status: 'duplicate' };
        }

        if (currentPayment.status !== 'pending') {
          await logRepo.save({
            payment: currentPayment,
            provider: 'sepay',
            providerTransactionId,
            rawResponse: raw,
            status: 'ignored',
          });
          return { status: 'ignored' };
        }

        if (dto.transferType !== 'in') {
          await logRepo.save({
            payment: currentPayment,
            provider: 'sepay',
            providerTransactionId,
            rawResponse: raw,
            status: 'ignored',
          });
          return { status: 'ignored' };
        }

        currentPayment.status = 'paid';
        currentPayment.paid_at = now;
        currentPayment.transaction_id = providerTransactionId;
        await paymentRepo.save(currentPayment);

        const currentQr = await qrRepo.findOne({
          where: { id: qrPayment.id },
        });

        if (currentQr) {
          currentQr.status = 'paid';
          currentQr.paidAt = now;
          await qrRepo.save(currentQr);
        }

        const currentOrder = await orderRepo.findOne({
          where: { id: order.id },
          relations: ['user'],
        });

        if (!currentOrder) {
          throw new NotFoundException('Order not found');
        }

        const nextOrderStatus = 'confirmed';

        if (currentOrder.status !== nextOrderStatus) {
          const prevStatus = currentOrder.status;
          currentOrder.status = nextOrderStatus;
          await orderRepo.save(currentOrder);
          await orderStatusRepo.save({
            order: currentOrder,
            oldStatus: prevStatus,
            newStatus: nextOrderStatus,
            note: 'Payment webhook update',
          });
        }

        await logRepo.save({
          payment: currentPayment,
          provider: 'sepay',
          providerTransactionId,
          rawResponse: raw,
          status: 'paid',
        });

        const userEmail = currentOrder.user?.email || (currentOrder as any).guestEmail;
        if (userEmail) {
          try {
            this.mailService.sendPaymentStatus(
              userEmail,
              currentOrder.id,
              true,
              currentOrder.paymentMethod || 'qr',
            );
          } catch (e) {
            console.error('Lỗi khi gửi email thanh toán thành công:', e);
          }
        }

        if (currentOrder.user?.id) {
          const cart = await cartRepo.findOne({
            where: { user: { id: currentOrder.user.id } },
          });
          if (cart) {
            await cartItemRepo.delete({ cart: { id: cart.id } });
          }

          await userRepo.increment(
            { id: currentOrder.user.id },
            'totalSpent',
            Number(currentOrder.totalAmount),
          );

          if (currentOrder.couponCodes?.length) {
            await this.couponService.markCouponsUsedByCodes(
              currentOrder.couponCodes,
            );
          }
        }

        return { status: 'ok' };
      });
    } catch (error: any) {
      this.trackWebhookFailure(payment?.id || 0, error);
      throw error;
    }
  }

  async generateSePayQr(dto: { amount: number; paymentCode: string }) {
    const bankName = this.configService.get<string>('SEPAY_BANK_NAME') ?? 'BIDV';
    const accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NO') ?? '4604996654';
    const accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME') ?? 'Pham Gia Huy';
    const expireMinutes = Number(this.configService.get('SEPAY_EXPIRE_MINUTES') ?? 15);
    const amount = this.normalizePaymentAmount(dto.amount);
    const paymentCode = dto.paymentCode;

    const expiredAt = new Date(Date.now() + expireMinutes * 60 * 1000);
    
    const qrDataURL = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${amount}&des=${paymentCode}&template=compact`;

    return {
      qrDataURL,
      amount,
      addInfo: paymentCode,
      expiredAt: expiredAt.toISOString(),
      bankName,
      accountName,
      accountNumber,
    };
  }

  normalizePaymentAmount(amount: number): number {
    const normalized = toMoneyNumber(amount, 'Payment amount');

    if (normalized <= 0 || !Number.isInteger(normalized)) {
      throw new BadRequestException('Invalid payment amount.');
    }

    if (String(Math.abs(normalized)).length > 13) {
      throw new BadRequestException(
        'Payment amount exceeds the 13-digit limit.',
      );
    }

    return normalized;
  }

  @Cron('*/1 * * * *')
  async cleanupExpiredPayments() {
    const now = new Date();
    const expiredPayments = await this.paymentRepo.find({
      where: { status: 'pending', expired_at: LessThan(now) },
    });

    if (!expiredPayments.length) return;

    for (const payment of expiredPayments) {
      await this.paymentRepo.update(payment.id, {
        status: 'expired',
        expired_at: now,
      });

      await this.qrPaymentRepo
        .createQueryBuilder()
        .update(QrPayment)
        .set({ status: 'expired', expiredAt: now })
        .where('payment_id = :paymentId', { paymentId: payment.id })
        .andWhere('status = :status', { status: 'pending' })
        .execute();

      const order = await this.orderRepo.findOne({
        where: { id: payment.order_id },
        relations: ['user'],
      });
      if (!order) continue;

      if (order.status === 'pending') {
        await this.orderRepo.update(order.id, { status: 'cancelled' });
        await this.orderStatusRepo.save({
          order,
          oldStatus: 'pending',
          newStatus: 'cancelled',
          note: 'Payment expired',
        });

        const userEmail = order.user?.email || (order as any).guestEmail;
        if (userEmail) {
          try {
            this.mailService.sendPaymentStatus(
              userEmail,
              order.id,
              false,
              order.paymentMethod || 'qr',
            );
          } catch (e) {
            console.error('Lỗi khi gửi email thanh toán thất bại (hết hạn):', e);
          }
        }
      }
    }
  }
}
