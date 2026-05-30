import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { DealProduct } from './entities/deal-product.entity';
import { Product } from '../products/products.entity';
import { Coupon } from '../coupons/coupon.entity';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,

    @InjectRepository(DealProduct)
    private readonly dealProductRepo: Repository<DealProduct>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
  ) {}

  /**
   * Fetch the currently active deal event
   */
  async getActiveDeal(): Promise<{ deal: Deal; featuredCoupons: Coupon[] } | null> {
    const now = new Date();
    const deal = await this.dealRepo.findOne({
      where: {
        isActive: true,
        startsAt: LessThanOrEqual(now),
        expiresAt: MoreThanOrEqual(now),
      },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });

    if (!deal) {
      return null;
    }

    return {
      deal,
      featuredCoupons: deal.featuredCoupons ?? [],
    };
  }

  /**
   * Get all products associated with a specific deal
   */
  async getDealProducts(dealId: number): Promise<DealProduct[]> {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException(`Deal với ID ${dealId} không tồn tại.`);
    }

    return this.dealProductRepo.find({
      where: { dealId },
      relations: ['product'],
    });
  }

  /**
   * Determine the active deal price of a product, if under an active deal event
   */
  async getProductDealPrice(productId: number): Promise<number | null> {
    const now = new Date();
    
    // Find a deal product that is linked to an active deal
    const dealProduct = await this.dealProductRepo.findOne({
      where: {
        productId,
        deal: {
          isActive: true,
          startsAt: LessThanOrEqual(now),
          expiresAt: MoreThanOrEqual(now),
        },
      },
      relations: ['deal'],
    });

    if (!dealProduct) {
      return null;
    }

    // Check if remaining deal stock is greater than 0
    if (dealProduct.dealStock - dealProduct.soldCount <= 0) {
      return null;
    }

    return Number(dealProduct.dealPrice);
  }

  /**
   * List all deals in the system for admin management
   */
  async listAllDeals(): Promise<Deal[]> {
    return this.dealRepo.find({
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Create a new deal with deal products
   */
  async createDeal(dto: {
    name: string;
    description?: string;
    startsAt: string;
    expiresAt: string;
    isActive?: boolean;
    featuredCouponIds?: number[];
    products: {
      productId: number;
      dealPrice: number;
      dealStock: number;
    }[];
  }): Promise<Deal | null> {
    const featuredCoupons: Coupon[] = [];
    if (dto.featuredCouponIds && dto.featuredCouponIds.length > 0) {
      for (const id of dto.featuredCouponIds) {
        const cp = await this.couponRepo.findOne({ where: { id } });
        if (cp) {
          featuredCoupons.push(cp);
        }
      }
    }

    const deal = this.dealRepo.create({
      name: dto.name,
      description: dto.description,
      startsAt: new Date(dto.startsAt),
      expiresAt: new Date(dto.expiresAt),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      featuredCoupons,
    });

    const savedDeal = await this.dealRepo.save(deal);

    // Save Deal Products
    if (dto.products && dto.products.length > 0) {
      for (const item of dto.products) {
        const dealProduct = this.dealProductRepo.create({
          deal: savedDeal,
          productId: item.productId,
          dealPrice: Number(item.dealPrice),
          dealStock: Number(item.dealStock),
          soldCount: 0,
        });
        await this.dealProductRepo.save(dealProduct);
      }
    }

    return this.dealRepo.findOne({
      where: { id: savedDeal.id },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });
  }

  /**
   * Delete a deal and its products
   */
  async deleteDeal(id: number): Promise<{ success: boolean }> {
    const deal = await this.dealRepo.findOne({ where: { id } });
    if (!deal) {
      throw new NotFoundException(`Deal với ID ${id} không tồn tại.`);
    }

    await this.dealProductRepo.delete({ dealId: id });
    await this.dealRepo.remove(deal);
    return { success: true };
  }
}
