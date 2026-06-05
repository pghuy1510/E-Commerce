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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./entities/review.entity");
const order_entity_1 = require("../order/order.entity");
let ReviewsService = class ReviewsService {
    reviewRepo;
    dataSource;
    constructor(reviewRepo, dataSource) {
        this.reviewRepo = reviewRepo;
        this.dataSource = dataSource;
    }
    async createReview(userId, dto) {
        if (dto.rating < 1 || dto.rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        // Verify if order exists and is owned by the user and is delivered
        const orderRepo = this.dataSource.getRepository(order_entity_1.Order);
        const order = await orderRepo.findOne({
            where: { id: dto.orderId, user: { id: userId } },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found or not owned by you');
        }
        if (order.status !== 'delivered') {
            throw new common_1.BadRequestException('You can only review products from delivered orders');
        }
        // Verify product was in this order
        const hasProduct = order.items.some((item) => item.productId === dto.productId);
        if (!hasProduct) {
            throw new common_1.BadRequestException('This product was not part of the specified order');
        }
        // Verify user hasn't already reviewed this product for this order
        const existing = await this.reviewRepo.findOne({
            where: {
                product: { id: dto.productId },
                user: { id: userId },
                order: { id: dto.orderId },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('You have already left a review for this product in this order');
        }
        // Create the review
        const review = this.reviewRepo.create({
            rating: dto.rating,
            comment: dto.comment,
            images: dto.images ?? [],
            isVerifiedPurchase: true,
            user: { id: userId },
            product: { id: dto.productId },
            order: { id: dto.orderId },
        });
        return this.reviewRepo.save(review);
    }
    async getProductReviews(productId) {
        const list = await this.reviewRepo.find({
            where: { product: { id: productId } },
            relations: ['user'],
            order: { id: 'DESC' },
        });
        // Strip sensitive fields
        return list.map((rev) => ({
            id: rev.id,
            rating: rev.rating,
            comment: rev.comment,
            images: rev.images,
            isVerifiedPurchase: rev.isVerifiedPurchase,
            createdAt: rev.createdAt,
            user: {
                id: rev.user.id,
                username: rev.user.username,
                fullName: rev.user.fullName || rev.user.username,
            },
        }));
    }
    async getRatingSummary(productId) {
        const reviews = await this.reviewRepo.find({
            where: { product: { id: productId } },
        });
        const count = reviews.length;
        if (count === 0) {
            return {
                average: 5, // Default rating is 5 stars
                count: 0,
                distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            };
        }
        const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
        const average = Math.round((sum / count) * 10) / 10;
        const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        reviews.forEach((rev) => {
            const key = rev.rating.toString();
            if (distribution[key] !== undefined) {
                distribution[key] += 1;
            }
        });
        return {
            average,
            count,
            distribution,
        };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], ReviewsService);
