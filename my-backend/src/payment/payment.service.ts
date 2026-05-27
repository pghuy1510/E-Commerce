import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, LessThan, Repository } from 'typeorm';
import axios from 'axios';

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
import { GenerateVietQrDto } from './dto/generate-vietqr.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

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
  ) {}

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

  async getPaymentStatus(paymentId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.method !== 'qr') {
      throw new BadRequestException('Webhook only supports QR payments');
    }

    const order = await this.orderRepo.findOne({
      where: { id: payment.order_id },
    });

    const qrPayment = await this.qrPaymentRepo.findOne({
      where: { payment: { id: payment.id } },
      order: { createdAt: 'DESC' },
    });

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
            accountNumber: qrPayment.accountNumber,
          }
        : null,
    };
  }

  async regenerateQr(paymentId: number, machineId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.method !== 'qr') {
      throw new BadRequestException('Payment method does not support QR.');
    }

    if (payment.status === 'paid') {
      throw new BadRequestException('Payment already completed.');
    }

    const order = await this.orderRepo.findOne({
      where: { id: payment.order_id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const addInfoBase = `ORD${order.id}-PAY${payment.id}`;
    const qrResponse = await this.generateVietQr({
      amount: Number(payment.amount),
      addInfo: addInfoBase,
      machineId,
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

    const bankName =
      this.configService.get<string>('VIETQR_BANK_NAME') ??
      this.configService.get<string>('VIETQR_ACQ_ID') ??
      'VietQR';

    const accountName =
      this.configService.get<string>('VIETQR_ACCOUNT_NAME') ?? '';
    const accountNumber =
      this.configService.get<string>('VIETQR_ACCOUNT_NO') ?? '';

    const qrPayment = this.qrPaymentRepo.create({
      order,
      payment,
      qrToken,
      bankName,
      accountName,
      accountNumber,
      amount: Number(payment.amount),
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
      bankName,
      accountName,
      accountNumber,
    };
  }

  async handleWebhook(dto: PaymentWebhookDto, raw: Record<string, unknown>) {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const amount = Number(payment.amount);
    if (Math.abs(amount - dto.amount) > 0.01) {
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
      where: { payment: { id: payment.id }, addInfo: dto.addInfo },
      order: { createdAt: 'DESC' },
    });

    if (!qrPayment) {
      throw new BadRequestException('Transfer content not recognized');
    }

    if (qrPayment.status !== 'pending') {
      throw new BadRequestException('QR payment already processed');
    }

    const existingLog = await this.paymentLogRepo.findOne({
      where: { providerTransactionId: dto.providerTransactionId },
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
      const newStatus = dto.status as PaymentStatus;

      const currentPayment = await paymentRepo.findOne({
        where: { id: payment.id },
      });

      if (!currentPayment) {
        throw new NotFoundException('Payment not found');
      }

      if (currentPayment.status === 'paid') {
        await logRepo.save({
          payment: currentPayment,
          provider: 'vietqr',
          providerTransactionId: dto.providerTransactionId,
          rawResponse: raw,
          status: 'duplicate',
        });
        return { status: 'duplicate' };
      }

      if (currentPayment.status !== 'pending') {
        await logRepo.save({
          payment: currentPayment,
          provider: 'vietqr',
          providerTransactionId: dto.providerTransactionId,
          rawResponse: raw,
          status: 'ignored',
        });
        return { status: 'ignored' };
      }

      currentPayment.status = newStatus;
      if (newStatus === 'paid') {
        currentPayment.paid_at = now;
        currentPayment.transaction_id = dto.providerTransactionId;
      }
      if (newStatus === 'expired') {
        currentPayment.expired_at = now;
      }
      await paymentRepo.save(currentPayment);

      const currentQr = await qrRepo.findOne({
        where: { id: qrPayment.id },
      });

      if (currentQr) {
        currentQr.status = newStatus;
        if (newStatus === 'paid') {
          currentQr.paidAt = now;
        }
        if (newStatus === 'expired') {
          currentQr.expiredAt = now;
        }
        await qrRepo.save(currentQr);
      }

      const currentOrder = await orderRepo.findOne({
        where: { id: order.id },
        relations: ['user'],
      });

      if (!currentOrder) {
        throw new NotFoundException('Order not found');
      }

      let nextOrderStatus: string | null = null;
      if (newStatus === 'paid') {
        nextOrderStatus = 'confirmed';
      } else if (newStatus === 'refunded') {
        nextOrderStatus = 'refunded';
      } else if (newStatus === 'failed' || newStatus === 'expired') {
        nextOrderStatus = 'cancelled';
      }

      if (nextOrderStatus && currentOrder.status !== nextOrderStatus) {
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
        provider: 'vietqr',
        providerTransactionId: dto.providerTransactionId,
        rawResponse: raw,
        status: newStatus,
      });

      if (newStatus === 'paid' && currentOrder.user?.id) {
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
  }

  async generateVietQr(dto: GenerateVietQrDto) {
    const accountNo = this.configService.get<string>('VIETQR_ACCOUNT_NO');
    const accountName = this.configService.get<string>('VIETQR_ACCOUNT_NAME');
    const acqId = this.configService.get<string>('VIETQR_ACQ_ID');
    const template =
      this.configService.get<string>('VIETQR_TEMPLATE') ?? 'compact';
    const clientId = this.configService.get<string>('VIETQR_CLIENT_ID');
    const apiKey = this.configService.get<string>('VIETQR_API_KEY');
    const expireMinutes = Number(
      this.configService.get('VIETQR_EXPIRE_MINUTES') ?? 15,
    );

    if (!accountNo || !accountName || !acqId) {
      throw new BadRequestException(
        'VietQR configuration is missing (account, name, or acqId).',
      );
    }

    const timestamp = Date.now();
    const addInfo = `${dto.addInfo} | MID:${dto.machineId} | TS:${timestamp}`;
    const expiredAt = new Date(
      Date.now() + Math.max(1, expireMinutes) * 60 * 1000,
    );

    const payload = {
      accountNo,
      accountName,
      acqId,
      amount: dto.amount,
      addInfo,
      format: 'text',
      template,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (clientId && apiKey) {
      headers['x-client-id'] = clientId;
      headers['x-api-key'] = apiKey;
    }

    try {
      const response = await axios.post(
        'https://api.vietqr.io/v2/generate',
        payload,
        { headers, timeout: 10000 },
      );

      const body = response.data;
      if (!body || body.code !== '00') {
        throw new BadRequestException(
          body?.desc ?? 'VietQR generation failed.',
        );
      }

      const qrDataURL =
        body?.data?.qrDataURL ?? body?.data?.qrCode ?? body?.data?.qrDataUrl;

      if (!qrDataURL) {
        throw new BadRequestException('VietQR response missing qrDataURL.');
      }

      return {
        qrDataURL,
        amount: dto.amount,
        addInfo,
        expiredAt: expiredAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ServiceUnavailableException('VietQR service unavailable.');
    }
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
      }
    }
  }
}
