import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Coupon } from './coupon.entity';
import type { CouponType, DiscountType } from './coupon.entity';
import { UserCoupon } from './user-coupon.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../order/order.entity';
import { Cart } from '../cart/cart.entity';
import type { CartItem } from '../cart/cart-item.entity';
import { WishlistItem } from '../wishlist/entities/wishlist.entity';
import { CategoryView } from '../tracking/entities/category-view.entity';
import { Product } from '../products/products.entity';
import { Category } from '../categories/categories.entity';

type CouponTemplate = {
  code: string;
  name?: string;
  type: CouponType;
  discountType: DiscountType;
  discountValue: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  categoryId?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive?: boolean;
};

type CouponCandidate = {
  userCoupon: UserCoupon;
  discount: number;
  type: CouponType;
};

const WELCOME_MIN_ORDER = 500000;
const VIP_THRESHOLD = 10_000_000;
const FREE_SHIPPING_THRESHOLD = 500000;
const CLEARANCE_STOCK_THRESHOLD = 100;

@Injectable()
export class CouponService {
  private readonly couponPriority: Record<CouponType, number> = {
    shipping: 3,
    shop: 2,
    platform: 1,
  };

  private readonly stackingConfig = {
    allowStacking: true,
    stackableTypes: new Set<CouponType>(['shipping', 'shop', 'platform']),
  };

  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,

    @InjectRepository(UserCoupon)
    private userCouponRepo: Repository<UserCoupon>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(WishlistItem)
    private wishlistRepo: Repository<WishlistItem>,

    @InjectRepository(CategoryView)
    private categoryViewRepo: Repository<CategoryView>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async issueWelcomeCoupon(userId: number, createdAt?: Date) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const created = createdAt ?? user.created_at;
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    if (created < cutoff) return;

    const orderCount = await this.orderRepo.count({
      where: { user: { id: userId } },
    });
    if (orderCount > 0) return;

    const coupon = await this.ensureCouponTemplate({
      code: 'WELCOME10',
      name: 'Welcome Coupon',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 10,
      minOrder: WELCOME_MIN_ORDER,
    });

    await this.assignCouponToUser(userId, coupon, {
      expiresInHours: 24 * 7,
      usageLimit: 1,
      uniqueEver: true,
      source: 'welcome',
    });
  }

  @Cron('*/10 * * * *')
  async issueAbandonedCartCoupons() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const rows = await this.cartRepo.query(
      `
      SELECT c.user_id, c.updated_at AS last_activity
      FROM carts c
      WHERE c.updated_at <= $1
        AND EXISTS (
          SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id
        )
    `,
      [cutoff],
    );

    const coupon = await this.ensureCouponTemplate({
      code: 'COME10',
      name: 'Abandoned Cart',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 10,
    });

    for (const row of rows) {
      const userId = Number(row.user_id);
      const lastActivity = row.last_activity
        ? new Date(row.last_activity)
        : null;
      if (!lastActivity) continue;

      const hasRecentOrder = await this.orderRepo
        .createQueryBuilder('orders')
        .where('orders.user_id = :userId', { userId })
        .andWhere('orders.created_at > :lastActivity', { lastActivity })
        .andWhere('orders.status = :status', { status: 'confirmed' })
        .getCount();

      if (hasRecentOrder === 0) {
        await this.assignCouponToUser(userId, coupon, {
          expiresInHours: 24,
          usageLimit: 1,
          source: 'abandoned_cart',
        });
      }
    }
  }

  @Cron('5 0 * * *')
  async issueBirthdayCoupons() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const users = await this.userRepo
      .createQueryBuilder('users')
      .where('users.dateOfBirth IS NOT NULL')
      .andWhere('EXTRACT(MONTH FROM users.dateOfBirth) = :month', { month })
      .andWhere('EXTRACT(DAY FROM users.dateOfBirth) = :day', { day })
      .getMany();

    const coupon = await this.ensureCouponTemplate({
      code: 'HAPPYBDAY',
      name: 'Birthday Coupon',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 20,
    });

    for (const user of users) {
      await this.assignCouponToUser(user.id, coupon, {
        expiresInHours: 24 * 3,
        usageLimit: 1,
        source: 'birthday',
      });
    }
  }

  @Cron('10 0 * * *')
  async issueVipCoupons() {
    const rows = await this.userRepo
      .createQueryBuilder('users')
      .select('users.id', 'user_id')
      .addSelect('users.total_spent', 'total')
      .where('users.total_spent > :threshold', {
        threshold: VIP_THRESHOLD,
      })
      .getRawMany();

    const coupon = await this.ensureCouponTemplate({
      code: 'VIP20',
      name: 'VIP Coupon',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 500000,
    });

    for (const row of rows) {
      const userId = Number(row.user_id);
      if (!userId) continue;
      await this.assignCouponToUser(userId, coupon, {
        expiresInHours: 24 * 7,
        usageLimit: 1,
        source: 'vip',
      });
    }
  }

  @Cron('20 0 * * *')
  async issueCategoryPersonalizedCoupons() {
    const rows = await this.categoryViewRepo.query(`
      SELECT DISTINCT ON (cv.user_id)
        cv.user_id,
        cv.category_id,
        SUM(cv.weight) AS total
      FROM category_views cv
      GROUP BY cv.user_id, cv.category_id
      ORDER BY cv.user_id, total DESC
    `);

    for (const row of rows) {
      const userId = Number(row.user_id);
      const categoryId = Number(row.category_id);
      if (!userId || !categoryId) continue;

      const category = await this.categoryRepo.findOne({
        where: { id: categoryId },
      });
      if (!category) continue;

      const prefix = this.normalizePrefix(category.name);
      const coupon = await this.ensureCouponTemplate({
        code: `${prefix}15`,
        name: `Favorite Category ${category.name}`,
        type: 'shop',
        discountType: 'percentage',
        discountValue: 15,
        categoryId,
      });

      await this.assignCouponToUser(userId, coupon, {
        expiresInHours: 24 * 5,
        usageLimit: 1,
        source: 'favorite_category',
      });
    }
  }

  @Cron('30 0 * * *')
  async issueWishlistCoupons() {
    const rows = await this.wishlistRepo
      .createQueryBuilder('wishlist')
      .select('wishlist.user_id', 'user_id')
      .addSelect('COUNT(*)', 'total')
      .groupBy('wishlist.user_id')
      .getRawMany();

    const coupon = await this.ensureCouponTemplate({
      code: 'WISH10',
      name: 'Wishlist Coupon',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 10,
    });

    for (const row of rows) {
      const userId = Number(row.user_id);
      if (!userId) continue;

      const completedOrders = await this.orderRepo.count({
        where: { user: { id: userId }, status: 'confirmed' },
      });

      if (completedOrders > 0) continue;

      await this.assignCouponToUser(userId, coupon, {
        expiresInHours: 48,
        usageLimit: 1,
        source: 'wishlist',
      });
    }
  }

  @Cron('40 0 * * *')
  async issueInactiveCoupons() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const users = await this.userRepo
      .createQueryBuilder('users')
      .where('users.last_login IS NULL OR users.last_login <= :cutoff', {
        cutoff,
      })
      .getMany();

    const coupon = await this.ensureCouponTemplate({
      code: 'COME15',
      name: 'Comeback Coupon',
      type: 'platform',
      discountType: 'percentage',
      discountValue: 15,
    });

    for (const user of users) {
      const recentOrders = await this.orderRepo
        .createQueryBuilder('orders')
        .where('orders.user_id = :userId', { userId: user.id })
        .andWhere('orders.created_at > :cutoff', { cutoff })
        .andWhere('orders.status = :status', { status: 'confirmed' })
        .getCount();

      if (recentOrders > 0) continue;

      await this.assignCouponToUser(user.id, coupon, {
        expiresInHours: 24 * 7,
        usageLimit: 1,
        source: 'inactive',
      });
    }
  }

  @Cron('0 20 * * 5')
  async issueFlashSaleCoupons() {
    const now = new Date();
    const expiresAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      22,
      0,
      0,
    );

    const coupon = await this.ensureCouponTemplate(
      {
        code: 'FLASH20',
        name: 'Flash Sale',
        type: 'platform',
        discountType: 'percentage',
        discountValue: 20,
        startsAt: now,
        expiresAt,
        isActive: true,
      },
      true,
    );

    const users = await this.userRepo.find({ select: ['id'] });
    for (const user of users) {
      await this.assignCouponToUser(user.id, coupon, {
        expiresAt,
        usageLimit: 1,
        source: 'flash_sale',
      });
    }
  }

  @Cron('50 0 * * *')
  async issueClearanceCoupons() {
    const users = await this.userRepo.find({ select: ['id'] });
    const rows = await this.productRepo.query(
      `
      SELECT p.category_id,
             SUM(p.stock) AS total_stock,
             COALESCE(SUM(oi.quantity), 0) AS total_sales
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.category_id
      HAVING SUM(p.stock) >= $1
      ORDER BY total_stock DESC, total_sales ASC
      LIMIT 5
    `,
      [CLEARANCE_STOCK_THRESHOLD],
    );

    for (const row of rows) {
      const categoryId = Number(row.category_id);
      if (!categoryId) continue;

      const category = await this.categoryRepo.findOne({
        where: { id: categoryId },
      });
      if (!category) continue;

      const prefix = this.normalizePrefix(category.name);
      const coupon = await this.ensureCouponTemplate({
        code: `CLEAR15-${prefix}`,
        name: `Clearance ${category.name}`,
        type: 'shop',
        discountType: 'percentage',
        discountValue: 15,
        categoryId,
      });

      for (const user of users) {
        await this.assignCouponToUser(user.id, coupon, {
          expiresInHours: 24 * 3,
          usageLimit: 1,
          source: 'clearance',
        });
      }
    }
  }

  @Cron('15 * * * *')
  async cleanupExpiredCoupons() {
    const now = new Date();

    await this.couponRepo
      .createQueryBuilder()
      .update(Coupon)
      .set({ isActive: false })
      .where('expires_at IS NOT NULL AND expires_at < :now', { now })
      .execute();

    await this.userCouponRepo
      .createQueryBuilder()
      .delete()
      .from(UserCoupon)
      .where('expires_at < :now', { now })
      .execute();
  }

  async getUserCoupons(userId: number) {
    const now = new Date();
    const userCoupons = await this.userCouponRepo.find({
      where: { user: { id: userId } },
      relations: ['coupon'],
      order: { assignedAt: 'DESC' },
    });

    return userCoupons
      .filter(
        (item) =>
          !item.isUsed &&
          item.usedCount < item.usageLimit &&
          item.expiresAt > now &&
          item.coupon?.isActive &&
          (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
          (!item.coupon.expiresAt || item.coupon.expiresAt >= now),
      )
      .map((item) => ({
        code: item.code,
        expiresAt: item.expiresAt,
        remainingUses: item.usageLimit - item.usedCount,
        source: item.source ?? null,
        coupon: {
          code: item.coupon.code,
          name: item.coupon.name,
          type: item.coupon.type,
          discountType: item.coupon.discountType,
          discountValue: item.coupon.discountValue,
          minOrder: item.coupon.minOrder ?? null,
          maxDiscount: item.coupon.maxDiscount ?? null,
          categoryId: item.coupon.categoryId ?? null,
        },
      }));
  }

  async getCheckoutProgress(userId: number, subtotal: number) {
    const neededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal,
    );

    const now = new Date();
    const userCoupons = await this.userCouponRepo.find({
      where: { user: { id: userId } },
      relations: ['coupon'],
    });

    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.category'],
    });
    const cartItems = cart?.items ?? [];

    const validCoupons = userCoupons.filter(
      (item) =>
        !item.isUsed &&
        item.usedCount < item.usageLimit &&
        item.expiresAt > now &&
        item.coupon?.isActive &&
        (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
        (!item.coupon.expiresAt || item.coupon.expiresAt >= now),
    );

    const currentBest = validCoupons
      .map((item) => ({
        item,
        discount: this.calculateDiscount(item, cartItems, subtotal, 0),
      }))
      .sort((a, b) => b.discount - a.discount)[0];

    const currentBestDiscount = currentBest?.discount ?? 0;

    const lockedCoupons = validCoupons
      .filter(
        (item) =>
          item.coupon.minOrder != null &&
          subtotal < (item.coupon.minOrder ?? 0),
      )
      .map((item) => {
        const minOrder = item.coupon.minOrder ?? subtotal;
        const estimateDiscount = this.calculateDiscount(
          item,
          cartItems,
          minOrder,
          0,
        );
        return {
          item,
          needed: Math.max(0, minOrder - subtotal),
          estimateDiscount,
        };
      })
      .filter((entry) => entry.estimateDiscount > currentBestDiscount)
      .sort((a, b) => {
        if (a.needed !== b.needed) {
          return a.needed - b.needed;
        }
        return b.estimateDiscount - a.estimateDiscount;
      });

    const nextCoupon = lockedCoupons[0];

    return {
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      neededForFreeShipping,
      currentBestSaving: currentBestDiscount,
      nextCoupon: nextCoupon
        ? {
            code: nextCoupon.item.code,
            needed: nextCoupon.needed,
            estimatedSaving: nextCoupon.estimateDiscount,
          }
        : null,
    };
  }

  async applyBestCouponsForUser(
    userId: number,
    cartItems: CartItem[],
    subtotal: number,
    shippingFee = 0,
  ) {
    const now = new Date();
    const userCoupons = await this.userCouponRepo.find({
      where: { user: { id: userId } },
      relations: ['coupon'],
    });

    const candidates = userCoupons
      .filter(
        (item) =>
          !item.isUsed &&
          item.usedCount < item.usageLimit &&
          item.expiresAt > now &&
          item.coupon?.isActive &&
          (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
          (!item.coupon.expiresAt || item.coupon.expiresAt >= now),
      )
      .map((item) => ({
        userCoupon: item,
        discount: this.calculateDiscount(
          item,
          cartItems,
          subtotal,
          shippingFee,
        ),
        type: item.coupon.type,
      }))
      .filter((item) => item.discount > 0);

    if (candidates.length === 0) {
      return {
        discountTotal: 0,
        appliedCoupons: [] as UserCoupon[],
        appliedCodes: [] as string[],
      };
    }

    const applied = this.selectBestCoupons(candidates);
    const discountTotal = applied.reduce((sum, item) => sum + item.discount, 0);

    return {
      discountTotal,
      appliedCoupons: applied.map((item) => item.userCoupon),
      appliedCodes: applied.map((item) => item.userCoupon.code),
    };
  }

  async applyCouponCodeForUser(
    userId: number,
    code: string,
    cartItems: CartItem[],
    subtotal: number,
    shippingFee = 0,
  ) {
    const now = new Date();
    const userCoupon = await this.userCouponRepo.findOne({
      where: { user: { id: userId }, code },
      relations: ['coupon'],
    });

    if (!userCoupon) {
      throw new BadRequestException('Coupon not found');
    }

    if (
      userCoupon.isUsed ||
      userCoupon.usedCount >= userCoupon.usageLimit ||
      userCoupon.expiresAt <= now ||
      !userCoupon.coupon?.isActive ||
      (userCoupon.coupon?.startsAt && userCoupon.coupon.startsAt > now) ||
      (userCoupon.coupon?.expiresAt && userCoupon.coupon.expiresAt < now)
    ) {
      throw new BadRequestException('Coupon is not available');
    }

    const discount = this.calculateDiscount(
      userCoupon,
      cartItems,
      subtotal,
      shippingFee,
    );

    if (discount <= 0) {
      throw new BadRequestException('Coupon is not applicable');
    }

    return {
      discountTotal: discount,
      appliedCoupons: [userCoupon],
      appliedCodes: [userCoupon.code],
    };
  }

  async markCouponsUsed(coupons: UserCoupon[]) {
    const now = new Date();
    for (const coupon of coupons) {
      const usedCount = coupon.usedCount + 1;
      const isUsed = usedCount >= coupon.usageLimit;
      await this.userCouponRepo.update(coupon.id, {
        usedCount,
        isUsed,
        usedAt: isUsed ? now : (coupon.usedAt ?? now),
      });
    }
  }

  async markCouponsUsedByCodes(codes: string[]) {
    if (!codes.length) return;
    const coupons = await this.userCouponRepo.find({
      where: { code: In(codes) },
    });
    if (!coupons.length) return;
    await this.markCouponsUsed(coupons);
  }

  private selectBestCoupons(candidates: CouponCandidate[]) {
    const sorted = [...candidates].sort((a, b) => {
      if (b.discount !== a.discount) {
        return b.discount - a.discount;
      }
      return this.couponPriority[b.type] - this.couponPriority[a.type];
    });

    if (!this.stackingConfig.allowStacking) {
      return sorted.slice(0, 1);
    }

    const applied: CouponCandidate[] = [];
    const pickedTypes = new Set<CouponType>();

    for (const candidate of sorted) {
      if (!this.stackingConfig.stackableTypes.has(candidate.type)) {
        continue;
      }
      if (pickedTypes.has(candidate.type)) {
        continue;
      }
      applied.push(candidate);
      pickedTypes.add(candidate.type);
    }

    return applied;
  }

  private calculateDiscount(
    item: UserCoupon,
    cartItems: CartItem[],
    subtotal: number,
    shippingFee: number,
  ) {
    const coupon = item.coupon;

    if (coupon.minOrder != null && subtotal < coupon.minOrder) {
      return 0;
    }

    let baseAmount = subtotal;
    if (coupon.categoryId) {
      baseAmount = cartItems.reduce((sum, cartItem) => {
        if (cartItem.product?.category?.id === coupon.categoryId) {
          return sum + cartItem.price * cartItem.quantity;
        }
        return sum;
      }, 0);
      if (baseAmount <= 0) {
        return 0;
      }
    }

    let discount =
      coupon.discountType === 'percentage'
        ? (baseAmount * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.type === 'shipping') {
      discount = Math.min(discount, shippingFee);
    }

    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return Math.max(0, discount);
  }

  private async ensureCouponTemplate(
    template: CouponTemplate,
    updateExisting = false,
  ) {
    const existing = await this.couponRepo.findOne({
      where: { code: template.code },
    });

    if (existing) {
      if (!updateExisting) {
        return existing;
      }

      const updated = this.couponRepo.merge(existing, {
        ...template,
        ...(template.isActive !== undefined
          ? { isActive: template.isActive }
          : {}),
      });
      return this.couponRepo.save(updated);
    }

    const coupon = this.couponRepo.create({
      ...template,
      ...(template.isActive !== undefined
        ? { isActive: template.isActive }
        : {}),
    });

    return this.couponRepo.save(coupon);
  }

  private async assignCouponToUser(
    userId: number,
    coupon: Coupon,
    options: {
      expiresInHours?: number;
      expiresAt?: Date;
      usageLimit?: number;
      uniqueEver?: boolean;
      source?: string;
    },
  ) {
    if (options.uniqueEver) {
      const anyExisting = await this.userCouponRepo.findOne({
        where: { user: { id: userId }, coupon: { id: coupon.id } },
      });
      if (anyExisting) return;
    }

    const activeExisting = await this.userCouponRepo.findOne({
      where: { user: { id: userId }, coupon: { id: coupon.id } },
      order: { assignedAt: 'DESC' },
    });

    const now = new Date();
    if (
      activeExisting &&
      !activeExisting.isUsed &&
      activeExisting.usedCount < activeExisting.usageLimit &&
      activeExisting.expiresAt > now
    ) {
      return;
    }

    const expiresAt =
      options.expiresAt ??
      new Date(
        Date.now() + (options.expiresInHours ?? 24 * 7) * 60 * 60 * 1000,
      );

    const code = await this.generateUniqueUserCouponCode(coupon.code);

    const userCoupon = this.userCouponRepo.create({
      user: { id: userId },
      coupon,
      code,
      expiresAt,
      usageLimit: options.usageLimit ?? 1,
      source: options.source ?? null,
      isUsed: false,
      usedCount: 0,
    });

    await this.userCouponRepo.save(userCoupon);
  }

  private async generateUniqueUserCouponCode(prefix: string) {
    const normalized = this.normalizePrefix(prefix);
    for (let i = 0; i < 5; i++) {
      const code = `${normalized}-${this.randomCode(5)}`;
      const exists = await this.userCouponRepo.findOne({ where: { code } });
      if (!exists) return code;
    }

    return `${normalized}-${this.randomCode(8)}`;
  }

  private randomCode(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private normalizePrefix(prefix: string) {
    const cleaned = prefix
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);
    return cleaned.length ? cleaned : 'COUPON';
  }
}
