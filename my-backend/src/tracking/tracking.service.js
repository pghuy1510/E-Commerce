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
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_behavior_entity_1 = require("./entities/user-behavior.entity");
const category_view_entity_1 = require("./entities/category-view.entity");
const typeorm_2 = require("typeorm");
const products_entity_1 = require("../products/products.entity");
let TrackingService = class TrackingService {
    repo;
    categoryViewRepo;
    productRepo;
    constructor(repo, categoryViewRepo, productRepo) {
        this.repo = repo;
        this.categoryViewRepo = categoryViewRepo;
        this.productRepo = productRepo;
    }
    getWeight(action) {
        switch (action) {
            case 'view':
                return 1;
            case 'click':
                return 2;
            case 'add_to_cart':
                return 3;
            default:
                return 1;
        }
    }
    async track(dto) {
        const behavior = this.repo.create({
            ...dto,
            weight: this.getWeight(dto.action),
        });
        const saved = await this.repo.save(behavior);
        if (dto.product_id) {
            const product = await this.productRepo.findOne({
                where: { id: dto.product_id },
                relations: ['category'],
            });
            if (product?.category?.id) {
                const categoryView = this.categoryViewRepo.create({
                    user_id: dto.user_id,
                    category_id: product.category.id,
                    weight: this.getWeight(dto.action),
                });
                await this.categoryViewRepo.save(categoryView);
            }
        }
        return saved;
    }
    async getUser(userId) {
        return this.repo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }
    async getProductBehaviors(productId) {
        return this.repo.find({
            where: { product_id: productId },
            order: { created_at: 'DESC' },
        });
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_behavior_entity_1.UserBehavior)),
    __param(1, (0, typeorm_1.InjectRepository)(category_view_entity_1.CategoryView)),
    __param(2, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TrackingService);
