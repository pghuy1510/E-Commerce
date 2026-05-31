import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { Deal } from './entities/deal.entity';
import { DealProduct } from './entities/deal-product.entity';
import { Product } from '../products/products.entity';
import { Coupon } from '../coupons/coupon.entity';
import { PromotionLog } from '../promotions/entities/promotion-log.entity';

describe('DealsService', () => {
  let service: DealsService;

  const mockDeal: Deal = {
    id: 1,
    name: 'Flash Sale Test',
    startsAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
    isActive: true,
    featuredCoupons: [],
    dealProducts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDealProduct: DealProduct = {
    id: 10,
    dealId: 1,
    deal: mockDeal,
    productId: 100,
    product: { id: 100, name: 'Product Test', price: 200000 } as any,
    dealPrice: 140000,
    dealStock: 20,
    soldCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDealRepository = {
    count: jest.fn().mockResolvedValue(1),
    findOne: jest.fn().mockResolvedValue(mockDeal),
  };

  const mockDealProductRepository = {
    find: jest.fn().mockResolvedValue([mockDealProduct]),
    findOne: jest.fn().mockResolvedValue(mockDealProduct),
  };

  const mockProductRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockCouponRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: getRepositoryToken(Deal),
          useValue: mockDealRepository,
        },
        {
          provide: getRepositoryToken(DealProduct),
          useValue: mockDealProductRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Coupon),
          useValue: mockCouponRepository,
        },
        {
          provide: getRepositoryToken(PromotionLog),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((log) => Promise.resolve(log)),
          },
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveDeal', () => {
    it('should return active deal', async () => {
      const result = await service.getActiveDeal();
      expect(result).toBeDefined();
      expect(result?.deal.name).toBe('Flash Sale Test');
    });
  });

  describe('getDealProducts', () => {
    it('should return products under a deal', async () => {
      const products = await service.getDealProducts(1);
      expect(products).toHaveLength(1);
      expect(products[0].dealPrice).toBe(140000);
    });

    it('should throw NotFoundException if deal does not exist', async () => {
      mockDealRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getDealProducts(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProductDealPrice', () => {
    it('should return deal price if product is under active deal with remaining stock', async () => {
      const price = await service.getProductDealPrice(100);
      expect(price).toBe(140000);
    });

    it('should return null if product is not in any active deal', async () => {
      mockDealProductRepository.findOne.mockResolvedValueOnce(null);
      const price = await service.getProductDealPrice(999);
      expect(price).toBeNull();
    });

    it('should return null if deal product has no remaining stock', async () => {
      mockDealProductRepository.findOne.mockResolvedValueOnce({
        ...mockDealProduct,
        dealStock: 10,
        soldCount: 10,
      });
      const price = await service.getProductDealPrice(100);
      expect(price).toBeNull();
    });
  });
});
