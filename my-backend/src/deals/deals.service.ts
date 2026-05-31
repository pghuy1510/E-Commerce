import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { DealProduct } from './entities/deal-product.entity';
import { Product } from '../products/products.entity';
import { Coupon } from '../coupons/coupon.entity';
import { PromotionLog } from '../promotions/entities/promotion-log.entity';

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

    @InjectRepository(PromotionLog)
    private readonly promotionLogRepo: Repository<PromotionLog>,
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
   * Find a deal by its ID with metadata (Admin Controlled)
   */
  async findOneDeal(id: number) {
    const deal = await this.dealRepo.findOne({
      where: { id },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });

    if (!deal) {
      throw new NotFoundException(`Deal với ID ${id} không tồn tại.`);
    }

    const soldCount = deal.dealProducts.reduce((sum, dp) => sum + dp.soldCount, 0);
    const isExpired = new Date(deal.expiresAt) < new Date();

    return {
      ...deal,
      soldCount,
      canEditProducts: soldCount === 0,
      canEditPrices: soldCount === 0,
      isExpired,
      canEdit: !isExpired,
    };
  }

  /**
   * Create a new deal with deal products
   */
  async createDeal(
    dto: {
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
    },
    adminId?: number,
    performedBy?: string,
    ipAddress?: string,
    reason?: string,
  ): Promise<Deal | null> {
    // Validate dealPrice < product.price
    if (dto.products && dto.products.length > 0) {
      for (const item of dto.products) {
        const prod = await this.productRepo.findOne({ where: { id: item.productId } });
        if (!prod) {
          throw new BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
        }
        if (Number(item.dealPrice) >= Number(prod.price)) {
          throw new BadRequestException(
            `Giá deal (${Number(item.dealPrice).toLocaleString()}đ) phải nhỏ hơn giá gốc (${Number(prod.price).toLocaleString()}đ) của sản phẩm "${prod.name}".`,
          );
        }
      }
    }

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

    const finalDeal = await this.dealRepo.findOne({
      where: { id: savedDeal.id },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });

    // Save Audit Log
    const log = this.promotionLogRepo.create({
      adminId,
      performedBy,
      ipAddress,
      entityType: 'deal',
      entityId: savedDeal.id,
      action: 'create',
      reason: reason || 'Tạo deal flash sale mới',
      newValue: finalDeal,
    });
    await this.promotionLogRepo.save(log);

    return finalDeal;
  }

  /**
   * Update an existing deal and its products
   */
  async updateDeal(
    id: number,
    dto: {
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
    },
    adminId?: number,
    performedBy?: string,
    ipAddress?: string,
    reason?: string,
  ): Promise<Deal | null> {
    const deal = await this.dealRepo.findOne({
      where: { id },
      relations: ['featuredCoupons', 'dealProducts', 'dealProducts.product'],
    });
    if (!deal) {
      throw new NotFoundException(`Deal với ID ${id} không tồn tại.`);
    }

    const oldValue = JSON.parse(JSON.stringify(deal));

    // Safety Constraint 1: Block editing if the deal has already expired
    if (new Date(deal.expiresAt) < new Date()) {
      throw new BadRequestException('Không thể chỉnh sửa deal đã kết thúc.');
    }

    // Resolve sold count across products
    const existingProductsMap = new Map<number, DealProduct>();
    let totalSoldCount = 0;
    for (const dp of deal.dealProducts) {
      existingProductsMap.set(dp.productId, dp);
      totalSoldCount += dp.soldCount;
    }

    // Safety Constraint 2: If soldCount > 0, block modifying products list or their prices
    if (totalSoldCount > 0) {
      // Compare products lists
      if (!dto.products || dto.products.length !== deal.dealProducts.length) {
        throw new BadRequestException('Không thể thêm/xóa sản phẩm khi deal đã có đơn hàng.');
      }
      for (const item of dto.products) {
        const existingDp = existingProductsMap.get(item.productId);
        if (!existingDp) {
          throw new BadRequestException('Không thể thêm/xóa sản phẩm khi deal đã có đơn hàng.');
        }
        if (Number(item.dealPrice) !== Number(existingDp.dealPrice)) {
          throw new BadRequestException('Không thể chỉnh sửa giá deal của sản phẩm khi deal đã có đơn hàng.');
        }
      }
    }

    // Safety Constraint 3: Validate dealStock >= soldCount (taking soldCount from DB)
    if (dto.products) {
      for (const item of dto.products) {
        const existingDp = existingProductsMap.get(item.productId);
        const currentSoldCount = existingDp ? existingDp.soldCount : 0;
        if (Number(item.dealStock) < currentSoldCount) {
          throw new BadRequestException(
            `Số lượng tồn deal cho sản phẩm ID ${item.productId} không được nhỏ hơn số lượng đã bán (${currentSoldCount}).`,
          );
        }

        // Validate dealPrice < product.price
        const prod = await this.productRepo.findOne({ where: { id: item.productId } });
        if (!prod) {
          throw new BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
        }
        if (Number(item.dealPrice) >= Number(prod.price)) {
          throw new BadRequestException(
            `Giá deal (${Number(item.dealPrice).toLocaleString()}đ) phải nhỏ hơn giá gốc (${Number(prod.price).toLocaleString()}đ) của sản phẩm "${prod.name}".`,
          );
        }
      }
    }

    // Resolve featured coupons
    const featuredCoupons: Coupon[] = [];
    if (dto.featuredCouponIds) {
      for (const couponId of dto.featuredCouponIds) {
        const cp = await this.couponRepo.findOne({ where: { id: couponId } });
        if (cp) {
          featuredCoupons.push(cp);
        }
      }
      deal.featuredCoupons = featuredCoupons;
    }

    deal.name = dto.name;
    deal.description = dto.description;
    deal.startsAt = new Date(dto.startsAt);
    deal.expiresAt = new Date(dto.expiresAt);
    if (dto.isActive !== undefined) {
      deal.isActive = dto.isActive;
    }

    await this.dealRepo.save(deal);

    // Delete existing products mapping and re-insert
    await this.dealProductRepo.delete({ dealId: id });

    // Create/update products
    if (dto.products && dto.products.length > 0) {
      for (const item of dto.products) {
        const existingDp = existingProductsMap.get(item.productId);
        const dealProduct = this.dealProductRepo.create({
          deal,
          productId: item.productId,
          dealPrice: Number(item.dealPrice),
          dealStock: Number(item.dealStock),
          soldCount: existingDp ? existingDp.soldCount : 0,
        });
        await this.dealProductRepo.save(dealProduct);
      }
    }

    const updatedDeal = await this.dealRepo.findOne({
      where: { id },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });

    // Save Audit Log
    const log = this.promotionLogRepo.create({
      adminId,
      performedBy,
      ipAddress,
      entityType: 'deal',
      entityId: id,
      action: 'update',
      reason: reason || 'Cập nhật thông tin deal flash sale',
      oldValue,
      newValue: updatedDeal,
    });
    await this.promotionLogRepo.save(log);

    return updatedDeal;
  }

  /**
   * Delete (deactivate) a deal
   */
  async deleteDeal(
    id: number,
    adminId?: number,
    performedBy?: string,
    ipAddress?: string,
    reason?: string,
  ): Promise<{ success: boolean }> {
    const deal = await this.dealRepo.findOne({
      where: { id },
      relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
    });
    if (!deal) {
      throw new NotFoundException(`Deal với ID ${id} không tồn tại.`);
    }

    const oldValue = JSON.parse(JSON.stringify(deal));
    deal.isActive = false;
    const saved = await this.dealRepo.save(deal);

    // Save Audit Log
    const log = this.promotionLogRepo.create({
      adminId,
      performedBy,
      ipAddress,
      entityType: 'deal',
      entityId: saved.id,
      action: 'deactivate',
      reason: reason || 'Vô hiệu hóa deal (Xóa)',
      oldValue,
      newValue: saved,
    });
    await this.promotionLogRepo.save(log);

    return { success: true };
  }
}
