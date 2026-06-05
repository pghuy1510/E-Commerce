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
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deal_entity_1 = require("./entities/deal.entity");
const deal_product_entity_1 = require("./entities/deal-product.entity");
const products_entity_1 = require("../products/products.entity");
const coupon_entity_1 = require("../coupons/coupon.entity");
const promotion_log_entity_1 = require("../promotions/entities/promotion-log.entity");
let DealsService = class DealsService {
    dealRepo;
    dealProductRepo;
    productRepo;
    couponRepo;
    promotionLogRepo;
    constructor(dealRepo, dealProductRepo, productRepo, couponRepo, promotionLogRepo) {
        this.dealRepo = dealRepo;
        this.dealProductRepo = dealProductRepo;
        this.productRepo = productRepo;
        this.couponRepo = couponRepo;
        this.promotionLogRepo = promotionLogRepo;
    }
    /**
     * Fetch the currently active deal event
     */
    async getActiveDeal() {
        const now = new Date();
        const deal = await this.dealRepo.findOne({
            where: {
                isActive: true,
                startsAt: (0, typeorm_2.LessThanOrEqual)(now),
                expiresAt: (0, typeorm_2.MoreThanOrEqual)(now),
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
    async getDealProducts(dealId) {
        const deal = await this.dealRepo.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException(`Deal với ID ${dealId} không tồn tại.`);
        }
        return this.dealProductRepo.find({
            where: { dealId },
            relations: ['product'],
        });
    }
    /**
     * Determine the active deal price of a product, if under an active deal event
     */
    async getProductDealPrice(productId) {
        const now = new Date();
        // Find a deal product that is linked to an active deal
        const dealProduct = await this.dealProductRepo.findOne({
            where: {
                productId,
                deal: {
                    isActive: true,
                    startsAt: (0, typeorm_2.LessThanOrEqual)(now),
                    expiresAt: (0, typeorm_2.MoreThanOrEqual)(now),
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
    async listAllDeals() {
        return this.dealRepo.find({
            relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
            order: { id: 'DESC' },
        });
    }
    /**
     * Find a deal by its ID with metadata (Admin Controlled)
     */
    async findOneDeal(id) {
        const deal = await this.dealRepo.findOne({
            where: { id },
            relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
        });
        if (!deal) {
            throw new common_1.NotFoundException(`Deal với ID ${id} không tồn tại.`);
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
    async createDeal(dto, adminId, performedBy, ipAddress, reason) {
        // Validate dealPrice < product.price
        if (dto.products && dto.products.length > 0) {
            for (const item of dto.products) {
                const prod = await this.productRepo.findOne({ where: { id: item.productId } });
                if (!prod) {
                    throw new common_1.BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
                }
                if (Number(item.dealPrice) >= Number(prod.price)) {
                    throw new common_1.BadRequestException(`Giá deal (${Number(item.dealPrice).toLocaleString()}đ) phải nhỏ hơn giá gốc (${Number(prod.price).toLocaleString()}đ) của sản phẩm "${prod.name}".`);
                }
            }
        }
        const featuredCoupons = [];
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
    async updateDeal(id, dto, adminId, performedBy, ipAddress, reason) {
        const deal = await this.dealRepo.findOne({
            where: { id },
            relations: ['featuredCoupons', 'dealProducts', 'dealProducts.product'],
        });
        if (!deal) {
            throw new common_1.NotFoundException(`Deal với ID ${id} không tồn tại.`);
        }
        const oldValue = JSON.parse(JSON.stringify(deal));
        // Safety Constraint 1: Block editing if the deal has already expired
        if (new Date(deal.expiresAt) < new Date()) {
            throw new common_1.BadRequestException('Không thể chỉnh sửa deal đã kết thúc.');
        }
        // Resolve sold count across products
        const existingProductsMap = new Map();
        let totalSoldCount = 0;
        for (const dp of deal.dealProducts) {
            existingProductsMap.set(dp.productId, dp);
            totalSoldCount += dp.soldCount;
        }
        // Safety Constraint 2: If soldCount > 0, block modifying products list or their prices
        if (totalSoldCount > 0) {
            // Compare products lists
            if (!dto.products || dto.products.length !== deal.dealProducts.length) {
                throw new common_1.BadRequestException('Không thể thêm/xóa sản phẩm khi deal đã có đơn hàng.');
            }
            for (const item of dto.products) {
                const existingDp = existingProductsMap.get(item.productId);
                if (!existingDp) {
                    throw new common_1.BadRequestException('Không thể thêm/xóa sản phẩm khi deal đã có đơn hàng.');
                }
                if (Number(item.dealPrice) !== Number(existingDp.dealPrice)) {
                    throw new common_1.BadRequestException('Không thể chỉnh sửa giá deal của sản phẩm khi deal đã có đơn hàng.');
                }
            }
        }
        // Safety Constraint 3: Validate dealStock >= soldCount (taking soldCount from DB)
        if (dto.products) {
            for (const item of dto.products) {
                const existingDp = existingProductsMap.get(item.productId);
                const currentSoldCount = existingDp ? existingDp.soldCount : 0;
                if (Number(item.dealStock) < currentSoldCount) {
                    throw new common_1.BadRequestException(`Số lượng tồn deal cho sản phẩm ID ${item.productId} không được nhỏ hơn số lượng đã bán (${currentSoldCount}).`);
                }
                // Validate dealPrice < product.price
                const prod = await this.productRepo.findOne({ where: { id: item.productId } });
                if (!prod) {
                    throw new common_1.BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
                }
                if (Number(item.dealPrice) >= Number(prod.price)) {
                    throw new common_1.BadRequestException(`Giá deal (${Number(item.dealPrice).toLocaleString()}đ) phải nhỏ hơn giá gốc (${Number(prod.price).toLocaleString()}đ) của sản phẩm "${prod.name}".`);
                }
            }
        }
        // Resolve featured coupons
        const featuredCoupons = [];
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
    async deleteDeal(id, adminId, performedBy, ipAddress, reason) {
        const deal = await this.dealRepo.findOne({
            where: { id },
            relations: ['dealProducts', 'dealProducts.product', 'featuredCoupons'],
        });
        if (!deal) {
            throw new common_1.NotFoundException(`Deal với ID ${id} không tồn tại.`);
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
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(deal_entity_1.Deal)),
    __param(1, (0, typeorm_1.InjectRepository)(deal_product_entity_1.DealProduct)),
    __param(2, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(coupon_entity_1.Coupon)),
    __param(4, (0, typeorm_1.InjectRepository)(promotion_log_entity_1.PromotionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DealsService);
