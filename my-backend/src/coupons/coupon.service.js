"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const coupon_entity_1 = require("./coupon.entity");
const user_coupon_entity_1 = require("./user-coupon.entity");
const promotion_log_entity_1 = require("../promotions/entities/promotion-log.entity");
const user_entity_1 = require("../users/entities/user.entity");
const order_entity_1 = require("../order/order.entity");
const cart_entity_1 = require("../cart/cart.entity");
const wishlist_entity_1 = require("../wishlist/entities/wishlist.entity");
const category_view_entity_1 = require("../tracking/entities/category-view.entity");
const products_entity_1 = require("../products/products.entity");
const categories_entity_1 = require("../categories/categories.entity");
const WELCOME_MIN_ORDER = 300000;
const VIP_THRESHOLD = 10_000_000;
const FREE_SHIPPING_THRESHOLD = 500000;
const CLEARANCE_STOCK_THRESHOLD = 100;
let CouponService = class CouponService {
    couponRepo;
    userCouponRepo;
    userRepo;
    orderRepo;
    cartRepo;
    wishlistRepo;
    categoryViewRepo;
    productRepo;
    categoryRepo;
    promotionLogRepo;
    couponPriority = {
        shipping: 3,
        shop: 2,
        platform: 1,
    };
    stackingConfig = {
        allowStacking: true,
        stackableTypes: new Set(['shipping', 'shop', 'platform']),
    };
    constructor(couponRepo, userCouponRepo, userRepo, orderRepo, cartRepo, wishlistRepo, categoryViewRepo, productRepo, categoryRepo, promotionLogRepo) {
        this.couponRepo = couponRepo;
        this.userCouponRepo = userCouponRepo;
        this.userRepo = userRepo;
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
        this.wishlistRepo = wishlistRepo;
        this.categoryViewRepo = categoryViewRepo;
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.promotionLogRepo = promotionLogRepo;
    }
    async issueWelcomeCoupon(userId, createdAt) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return;
        const created = createdAt ?? user.created_at;
        const cutoff = new Date(Date.now() - 5 * 60 * 1000);
        if (created < cutoff)
            return;
        const orderCount = await this.orderRepo.count({
            where: { user: { id: userId } },
        });
        if (orderCount > 0)
            return;
        const coupon = await this.ensureCouponTemplate({
            code: 'WELCOME10',
            name: 'Welcome Coupon',
            type: 'platform',
            discountType: 'percentage',
            discountValue: 10,
            minOrder: 300000,
            maxDiscount: 100000,
            isActive: true,
        });
        await this.assignCouponToUser(userId, coupon, {
            expiresInHours: 24 * 7,
            usageLimit: 1,
            uniqueEver: true,
            source: 'welcome',
        });
    }
    async issueAbandonedCartCoupons() {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);
        const rows = await this.cartRepo.query(`
      SELECT c.user_id, c.updated_at AS last_activity
      FROM carts c
      WHERE c.updated_at <= $1
        AND EXISTS (
          SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id
        )
    `, [cutoff]);
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
            if (!lastActivity)
                continue;
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
            if (recentOrders > 0)
                continue;
            await this.assignCouponToUser(user.id, coupon, {
                expiresInHours: 24 * 7,
                usageLimit: 1,
                source: 'inactive',
            });
        }
    }
    async cleanupExpiredCoupons() {
        const now = new Date();
        await this.couponRepo
            .createQueryBuilder()
            .update(coupon_entity_1.Coupon)
            .set({ isActive: false })
            .where('expires_at IS NOT NULL AND expires_at < :now', { now })
            .execute();
        await this.userCouponRepo
            .createQueryBuilder()
            .delete()
            .from(user_coupon_entity_1.UserCoupon)
            .where('expires_at < :now', { now })
            .execute();
    }
    async getUserCoupons(userId) {
        const now = new Date();
        const userCoupons = await this.userCouponRepo.find({
            where: { user: { id: userId } },
            relations: ['coupon'],
            order: { assignedAt: 'DESC' },
        });
        return userCoupons
            .filter((item) => !item.isUsed &&
            item.usedCount < item.usageLimit &&
            item.expiresAt > now &&
            item.coupon?.isActive &&
            (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
            (!item.coupon.expiresAt || item.coupon.expiresAt >= now))
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
    async getCheckoutProgress(userId, subtotal) {
        const neededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
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
        const validCoupons = userCoupons.filter((item) => !item.isUsed &&
            item.usedCount < item.usageLimit &&
            item.expiresAt > now &&
            item.coupon?.isActive &&
            (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
            (!item.coupon.expiresAt || item.coupon.expiresAt >= now));
        const currentBest = validCoupons
            .map((item) => ({
            item,
            discount: this.calculateDiscount(item, cartItems, subtotal, 0),
        }))
            .sort((a, b) => b.discount - a.discount)[0];
        const currentBestDiscount = currentBest?.discount ?? 0;
        const lockedCoupons = validCoupons
            .filter((item) => item.coupon.minOrder != null &&
            subtotal < (item.coupon.minOrder ?? 0))
            .map((item) => {
            const minOrder = item.coupon.minOrder ?? subtotal;
            const estimateDiscount = this.calculateDiscount(item, cartItems, minOrder, 0);
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
    async applyBestCouponsForUser(userId, cartItems, subtotal, shippingFee = 0) {
        const now = new Date();
        const userCoupons = await this.userCouponRepo.find({
            where: { user: { id: userId } },
            relations: ['coupon'],
        });
        const candidates = userCoupons
            .filter((item) => !item.isUsed &&
            item.usedCount < item.usageLimit &&
            item.expiresAt > now &&
            item.coupon?.isActive &&
            (!item.coupon.startsAt || item.coupon.startsAt <= now) &&
            (!item.coupon.expiresAt || item.coupon.expiresAt >= now))
            .map((item) => ({
            userCoupon: item,
            discount: this.calculateDiscount(item, cartItems, subtotal, shippingFee),
            type: item.coupon.type,
        }))
            .filter((item) => item.discount > 0);
        if (candidates.length === 0) {
            return {
                discountTotal: 0,
                appliedCoupons: [],
                appliedCodes: [],
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
    async applyCouponCodeForUser(userId, code, cartItems, subtotal, shippingFee = 0) {
        const now = new Date();
        let userCoupon = await this.userCouponRepo.findOne({
            where: { user: { id: userId }, code },
            relations: ['coupon'],
        });
        if (!userCoupon) {
            const couponTemplate = await this.couponRepo.findOne({
                where: { code, isActive: true },
            });
            if (couponTemplate) {
                const existingUserCoupon = await this.userCouponRepo.findOne({
                    where: {
                        user: { id: userId },
                        coupon: { id: couponTemplate.id },
                        isUsed: false,
                    },
                    relations: ['coupon'],
                });
                if (existingUserCoupon && existingUserCoupon.expiresAt > now) {
                    userCoupon = existingUserCoupon;
                }
                else {
                    const allUserCoupons = await this.userCouponRepo.find({
                        where: { user: { id: userId }, coupon: { id: couponTemplate.id } }
                    });
                    const totalUsed = allUserCoupons.reduce((sum, uc) => sum + uc.usedCount, 0);
                    if (totalUsed >= 1) {
                        throw new common_1.BadRequestException('Bạn đã sử dụng mã giảm giá này rồi.');
                    }
                    await this.assignCouponToUser(userId, couponTemplate, {
                        usageLimit: 1,
                        source: 'claimed_from_code',
                    });
                    userCoupon = await this.userCouponRepo.findOne({
                        where: {
                            user: { id: userId },
                            coupon: { id: couponTemplate.id },
                            isUsed: false,
                        },
                        relations: ['coupon'],
                    });
                }
            }
        }
        if (!userCoupon) {
            throw new common_1.BadRequestException('Mã coupon không tồn tại hoặc không thuộc sở hữu của bạn.');
        }
        if (!userCoupon.coupon?.isActive) {
            throw new common_1.BadRequestException('Mã coupon này hiện không còn hoạt động.');
        }
        if (userCoupon.isUsed || userCoupon.usedCount >= userCoupon.usageLimit) {
            throw new common_1.BadRequestException('Mã coupon này đã được sử dụng hoặc hết lượt dùng.');
        }
        if (userCoupon.expiresAt <= now || (userCoupon.coupon?.expiresAt && userCoupon.coupon.expiresAt < now)) {
            throw new common_1.BadRequestException('Mã coupon này đã hết hạn sử dụng.');
        }
        if (userCoupon.coupon?.startsAt && userCoupon.coupon.startsAt > now) {
            throw new common_1.BadRequestException('Mã coupon này chưa đến thời gian áp dụng.');
        }
        const coupon = userCoupon.coupon;
        if (coupon.minOrder != null && subtotal < coupon.minOrder) {
            throw new common_1.BadRequestException(`Đơn hàng tối thiểu phải từ ${coupon.minOrder.toLocaleString('vi-VN')}đ để áp dụng coupon này. Hiện tại đơn hàng chỉ có ${subtotal.toLocaleString('vi-VN')}đ.`);
        }
        if (coupon.categoryId) {
            const hasCategory = cartItems.some((item) => item.product?.category?.id === coupon.categoryId);
            if (!hasCategory) {
                throw new common_1.BadRequestException('Mã coupon này chỉ áp dụng cho danh mục sản phẩm cụ thể không có trong giỏ hàng của bạn.');
            }
        }
        const discount = this.calculateDiscount(userCoupon, cartItems, subtotal, shippingFee);
        if (discount <= 0) {
            throw new common_1.BadRequestException('Mã coupon này không phù hợp cho đơn hàng hiện tại.');
        }
        return {
            discountTotal: discount,
            appliedCoupons: [userCoupon],
            appliedCodes: [userCoupon.code],
        };
    }
    async validateCouponCode(userId, code, shippingFee = 0) {
        const cart = await this.cartRepo.findOne({
            where: { user: { id: userId } },
            relations: ['items', 'items.product', 'items.product.category'],
        });
        if (!cart || !cart.items.length) {
            throw new common_1.BadRequestException('Giỏ hàng của bạn đang trống.');
        }
        const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
        const result = await this.applyCouponCodeForUser(userId, code, cart.items, subtotal, shippingFee);
        return {
            valid: true,
            discountTotal: result.discountTotal,
            couponCode: code,
        };
    }
    async validateCouponCodeForGuest(code, cartItems, subtotal, shippingFee = 0) {
        const now = new Date();
        const coupon = await this.couponRepo.findOne({
            where: { code, isActive: true },
        });
        if (!coupon) {
            throw new common_1.BadRequestException('Mã coupon không tồn tại hoặc đã hết hạn.');
        }
        if (coupon.startsAt && coupon.startsAt > now) {
            throw new common_1.BadRequestException('Mã coupon này chưa đến thời gian áp dụng.');
        }
        if (coupon.expiresAt && coupon.expiresAt < now) {
            throw new common_1.BadRequestException('Mã coupon này đã hết hạn sử dụng.');
        }
        if (coupon.minOrder != null && subtotal < coupon.minOrder) {
            throw new common_1.BadRequestException(`Đơn hàng tối thiểu phải từ ${coupon.minOrder.toLocaleString('vi-VN')}đ để áp dụng coupon này. Hiện tại đơn hàng chỉ có ${subtotal.toLocaleString('vi-VN')}đ.`);
        }
        if (coupon.categoryId) {
            let hasCategory = false;
            for (const item of cartItems) {
                const prod = await this.productRepo.findOne({
                    where: { id: item.productId },
                    relations: ['category'],
                });
                if (prod?.category?.id === coupon.categoryId) {
                    hasCategory = true;
                    break;
                }
            }
            if (!hasCategory) {
                throw new common_1.BadRequestException('Mã coupon này chỉ áp dụng cho danh mục sản phẩm cụ thể không có trong giỏ hàng của bạn.');
            }
        }
        let discount = 0;
        if (coupon.type === 'shipping') {
            discount = coupon.discountType === 'fixed'
                ? coupon.discountValue
                : (shippingFee * coupon.discountValue) / 100;
            discount = Math.min(discount, shippingFee);
        }
        else {
            discount = coupon.discountType === 'fixed'
                ? coupon.discountValue
                : (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount != null) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        }
        if (discount <= 0) {
            throw new common_1.BadRequestException('Mã coupon này không phù hợp cho đơn hàng hiện tại.');
        }
        return {
            valid: true,
            discountTotal: discount,
            couponCode: code,
        };
    }
    async markCouponsUsed(coupons) {
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
    async markCouponsUsedByCodes(codes) {
        if (!codes.length)
            return;
        const coupons = await this.userCouponRepo.find({
            where: { code: (0, typeorm_2.In)(codes) },
        });
        if (!coupons.length)
            return;
        await this.markCouponsUsed(coupons);
    }
    selectBestCoupons(candidates) {
        const sorted = [...candidates].sort((a, b) => {
            if (b.discount !== a.discount) {
                return b.discount - a.discount;
            }
            return this.couponPriority[b.type] - this.couponPriority[a.type];
        });
        if (!this.stackingConfig.allowStacking) {
            return sorted.slice(0, 1);
        }
        const applied = [];
        const pickedTypes = new Set();
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
    calculateDiscount(item, cartItems, subtotal, shippingFee) {
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
        let discount = coupon.discountType === 'percentage'
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
    async ensureCouponTemplate(template, updateExisting = false) {
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
    async assignCouponToUser(userId, coupon, options) {
        if (options.uniqueEver) {
            const anyExisting = await this.userCouponRepo.findOne({
                where: { user: { id: userId }, coupon: { id: coupon.id } },
            });
            if (anyExisting)
                return;
        }
        const activeExisting = await this.userCouponRepo.findOne({
            where: { user: { id: userId }, coupon: { id: coupon.id } },
            order: { assignedAt: 'DESC' },
        });
        const now = new Date();
        if (activeExisting &&
            !activeExisting.isUsed &&
            activeExisting.usedCount < activeExisting.usageLimit &&
            activeExisting.expiresAt > now) {
            return;
        }
        const expiresAt = options.expiresAt ??
            new Date(Date.now() + (options.expiresInHours ?? 24 * 7) * 60 * 60 * 1000);
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
    async generateUniqueUserCouponCode(prefix) {
        const normalized = this.normalizePrefix(prefix);
        for (let i = 0; i < 5; i++) {
            const code = `${normalized}-${this.randomCode(5)}`;
            const exists = await this.userCouponRepo.findOne({ where: { code } });
            if (!exists)
                return code;
        }
        return `${normalized}-${this.randomCode(8)}`;
    }
    randomCode(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i += 1) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    normalizePrefix(prefix) {
        const cleaned = prefix
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 12);
        return cleaned.length ? cleaned : 'COUPON';
    }
    /**
     * List all coupon templates for admin management
     */
    async listAllCoupons() {
        return this.couponRepo.find({
            order: { id: 'DESC' },
        });
    }
    /**
     * Find a coupon template with metadata (Admin Controlled)
     */
    async findOneCoupon(id) {
        const coupon = await this.couponRepo.findOne({ where: { id } });
        if (!coupon) {
            throw new common_1.NotFoundException(`Coupon với ID ${id} không tồn tại.`);
        }
        const claimedCount = await this.userCouponRepo.count({
            where: { coupon: { id } },
        });
        return {
            ...coupon,
            claimedCount,
            canEditCode: claimedCount === 0,
        };
    }
    /**
     * Create a new coupon template (Admin Controlled)
     */
    async createCoupon(dto, adminId, performedBy, ipAddress, reason) {
        const codeUpper = dto.code.trim().toUpperCase();
        // Case-insensitive uniqueness check
        const existing = await this.couponRepo.findOne({
            where: { code: codeUpper },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Mã coupon "${codeUpper}" đã tồn tại.`);
        }
        const coupon = this.couponRepo.create({
            code: codeUpper,
            name: dto.name,
            type: dto.type,
            discountType: dto.discountType,
            discountValue: Number(dto.discountValue),
            minOrder: dto.minOrder ? Number(dto.minOrder) : null,
            maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null,
            categoryId: dto.categoryId ? Number(dto.categoryId) : null,
            startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            isActive: dto.isActive !== undefined ? dto.isActive : true,
        });
        const saved = await this.couponRepo.save(coupon);
        // Save Audit Log
        const log = this.promotionLogRepo.create({
            adminId,
            performedBy,
            ipAddress,
            entityType: 'coupon',
            entityId: saved.id,
            action: 'create',
            reason: reason || 'Tạo coupon mới',
            newValue: saved,
        });
        await this.promotionLogRepo.save(log);
        return saved;
    }
    /**
     * Update an existing coupon template (Admin Controlled)
     */
    async updateCoupon(id, dto, adminId, performedBy, ipAddress, reason) {
        const coupon = await this.couponRepo.findOne({ where: { id } });
        if (!coupon) {
            throw new common_1.NotFoundException(`Coupon với ID ${id} không tồn tại.`);
        }
        const oldValue = { ...coupon };
        const codeUpper = dto.code.trim().toUpperCase();
        // Check code lock if coupon has already been claimed (claimedCount > 0)
        const claimedCount = await this.userCouponRepo.count({
            where: { coupon: { id } },
        });
        if (claimedCount > 0 && codeUpper !== coupon.code) {
            throw new common_1.BadRequestException('Không thể chỉnh sửa mã coupon của coupon đã được phát hành cho người dùng.');
        }
        // Case-insensitive uniqueness check if code changed
        if (codeUpper !== coupon.code) {
            const existing = await this.couponRepo.findOne({
                where: { code: codeUpper },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Mã coupon "${codeUpper}" đã tồn tại.`);
            }
        }
        coupon.code = codeUpper;
        coupon.name = dto.name;
        coupon.type = dto.type;
        coupon.discountType = dto.discountType;
        coupon.discountValue = Number(dto.discountValue);
        coupon.minOrder = dto.minOrder ? Number(dto.minOrder) : null;
        coupon.maxDiscount = dto.maxDiscount ? Number(dto.maxDiscount) : null;
        coupon.categoryId = dto.categoryId ? Number(dto.categoryId) : null;
        coupon.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
        coupon.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (dto.isActive !== undefined) {
            coupon.isActive = dto.isActive;
        }
        const saved = await this.couponRepo.save(coupon);
        // Save Audit Log
        const log = this.promotionLogRepo.create({
            adminId,
            performedBy,
            ipAddress,
            entityType: 'coupon',
            entityId: saved.id,
            action: 'update',
            reason: reason || 'Cập nhật thông tin coupon',
            oldValue,
            newValue: saved,
        });
        await this.promotionLogRepo.save(log);
        return saved;
    }
    /**
     * Delete (deactivate) a coupon template
     */
    async deleteCoupon(id, adminId, performedBy, ipAddress, reason) {
        const coupon = await this.couponRepo.findOne({ where: { id } });
        if (!coupon) {
            throw new common_1.NotFoundException(`Coupon với ID ${id} không tồn tại.`);
        }
        const oldValue = { ...coupon };
        coupon.isActive = false;
        const saved = await this.couponRepo.save(coupon);
        // Save Audit Log
        const log = this.promotionLogRepo.create({
            adminId,
            performedBy,
            ipAddress,
            entityType: 'coupon',
            entityId: saved.id,
            action: 'deactivate',
            reason: reason || 'Vô hiệu hóa coupon (Xóa)',
            oldValue,
            newValue: saved,
        });
        await this.promotionLogRepo.save(log);
        return { success: true };
    }
};
exports.CouponService = CouponService;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponService.prototype, "issueAbandonedCartCoupons", null);
__decorate([
    (0, schedule_1.Cron)('5 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponService.prototype, "issueBirthdayCoupons", null);
__decorate([
    (0, schedule_1.Cron)('40 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponService.prototype, "issueInactiveCoupons", null);
__decorate([
    (0, schedule_1.Cron)('15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponService.prototype, "cleanupExpiredCoupons", null);
exports.CouponService = CouponService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(coupon_entity_1.Coupon)),
    __param(1, (0, typeorm_1.InjectRepository)(user_coupon_entity_1.UserCoupon)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(4, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(5, (0, typeorm_1.InjectRepository)(wishlist_entity_1.WishlistItem)),
    __param(6, (0, typeorm_1.InjectRepository)(category_view_entity_1.CategoryView)),
    __param(7, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __param(8, (0, typeorm_1.InjectRepository)(categories_entity_1.Category)),
    __param(9, (0, typeorm_1.InjectRepository)(promotion_log_entity_1.PromotionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CouponService);
