import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { QrPayment } from './entities/qr-payment.entity';
import { PaymentLog } from './entities/payment-log.entity';
import { Order } from '../order/order.entity';
import { OrderStatusLog } from '../order/order-status-log.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { User } from '../users/entities/user.entity';
import { CouponService } from '../coupons/coupon.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { MailService } from '../common/mail.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: any;
  let orderRepo: any;
  let qrPaymentRepo: any;
  let paymentLogRepo: any;
  let dataSource: any;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    paymentRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
    };
    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
    };
    qrPaymentRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
    };
    paymentLogRepo = {
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb({
        getRepository: (entity: any) => {
          if (entity === Payment) return paymentRepo;
          if (entity === Order) return orderRepo;
          if (entity === QrPayment) return qrPaymentRepo;
          if (entity === PaymentLog) return paymentLogRepo;
          if (entity === OrderStatusLog) return { save: jest.fn() };
          if (entity === Cart) return { findOne: jest.fn() };
          if (entity === CartItem) return { delete: jest.fn() };
          if (entity === User) return { increment: jest.fn() };
          return {};
        }
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(QrPayment), useValue: qrPaymentRepo },
        { provide: getRepositoryToken(PaymentLog), useValue: paymentLogRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderStatusLog), useValue: {} },
        { provide: getRepositoryToken(Cart), useValue: {} },
        { provide: getRepositoryToken(CartItem), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: CouponService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePaymentCode', () => {
    it('should remove dashes and spaces, and uppercase the code', () => {
      const result = (service as any).normalizePaymentCode(' 656D15B0-3626-4DA2-8851-0E4B6132D975 ');
      expect(result).toBe('656D15B036264DA288510E4B6132D975');
    });
  });

  describe('handleWebhook', () => {
    it('should match code with dashes using normalized matching', async () => {
      const mockPayment = {
        id: 123,
        order_id: 456,
        amount: 100,
        status: 'pending',
        paymentCode: '656D15B0-3626-4DA2-8851-0E4B6132D975',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockPayment);
      paymentRepo.findOne.mockResolvedValue(mockPayment);
      orderRepo.findOne.mockResolvedValue({ id: 456, status: 'pending' });
      qrPaymentRepo.findOne.mockResolvedValue({ status: 'pending' });
      paymentLogRepo.findOne.mockResolvedValue(null);

      const dto: any = {
        id: 999,
        code: '656d15b0-3626-4da2-8851-0e4b6132d975',
        transferAmount: 100,
        transferType: 'in',
        content: 'some content',
      };

      await service.handleWebhook(dto, {});

      expect(paymentRepo.createQueryBuilder).toHaveBeenCalledWith('payment');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "REPLACE(UPPER(payment.paymentCode), '-', '') = :code",
        { code: '656D15B036264DA288510E4B6132D975' }
      );
    });

    it('should match dash-less code using normalized matching', async () => {
      const mockPayment = {
        id: 123,
        order_id: 456,
        amount: 100,
        status: 'pending',
        paymentCode: '656D15B0-3626-4DA2-8851-0E4B6132D975',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockPayment);
      paymentRepo.findOne.mockResolvedValue(mockPayment);
      orderRepo.findOne.mockResolvedValue({ id: 456, status: 'pending' });
      qrPaymentRepo.findOne.mockResolvedValue({ status: 'pending' });
      paymentLogRepo.findOne.mockResolvedValue(null);

      const dto: any = {
        id: 999,
        code: '656d15b036264da288510e4b6132d975',
        transferAmount: 100,
        transferType: 'in',
        content: 'some content',
      };

      await service.handleWebhook(dto, {});

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "REPLACE(UPPER(payment.paymentCode), '-', '') = :code",
        { code: '656D15B036264DA288510E4B6132D975' }
      );
    });

    it('should fallback to extracting UUID from content if code is empty', async () => {
      const mockPayment = {
        id: 123,
        order_id: 456,
        amount: 100,
        status: 'pending',
        paymentCode: '656D15B0-3626-4DA2-8851-0E4B6132D975',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockPayment);
      paymentRepo.findOne.mockResolvedValue(mockPayment);
      orderRepo.findOne.mockResolvedValue({ id: 456, status: 'pending' });
      qrPaymentRepo.findOne.mockResolvedValue({ status: 'pending' });
      paymentLogRepo.findOne.mockResolvedValue(null);

      const dto: any = {
        id: 999,
        code: '',
        transferAmount: 100,
        transferType: 'in',
        content: '132032401987 0971599019 656D15B036264DA288510E4B6132D975',
      };

      await service.handleWebhook(dto, {});

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "REPLACE(UPPER(payment.paymentCode), '-', '') = :code",
        { code: '656D15B036264DA288510E4B6132D975' }
      );
    });

    it('should fallback to extracting UUID-with-dashes from content if code is empty', async () => {
      const mockPayment = {
        id: 123,
        order_id: 456,
        amount: 100,
        status: 'pending',
        paymentCode: '656D15B0-3626-4DA2-8851-0E4B6132D975',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockPayment);
      paymentRepo.findOne.mockResolvedValue(mockPayment);
      orderRepo.findOne.mockResolvedValue({ id: 456, status: 'pending' });
      qrPaymentRepo.findOne.mockResolvedValue({ status: 'pending' });
      paymentLogRepo.findOne.mockResolvedValue(null);

      const dto: any = {
        id: 999,
        code: '',
        transferAmount: 100,
        transferType: 'in',
        content: 'Some random text 656d15b0-3626-4da2-8851-0e4b6132d975 more text',
      };

      await service.handleWebhook(dto, {});

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "REPLACE(UPPER(payment.paymentCode), '-', '') = :code",
        { code: '656D15B036264DA288510E4B6132D975' }
      );
    });

    it('should ignore webhook if no code can be found', async () => {
      const dto: any = {
        id: 999,
        code: '',
        transferAmount: 100,
        transferType: 'in',
        content: 'No UUID in here',
      };

      const result = await service.handleWebhook(dto, {});
      expect(result).toEqual({ status: 'ignored' });
      expect(paymentLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ignored' })
      );
    });
  });
});
