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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_entity_1 = require("./products.entity");
let ProductsService = class ProductsService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async findAll(query) {
        const qb = this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
            .leftJoin('reviews', 'r', 'r.product_id = product.id')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
            .addSelect('COALESCE(AVG(r.rating), 5.0)', 'avgRating')
            .groupBy('product.id')
            .addGroupBy('category.id');
        if (query?.search) {
            qb.andWhere('(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)', { search: `%${query.search.toLowerCase()}%` });
        }
        if (query?.category) {
            qb.andWhere('LOWER(category.name) = LOWER(:category)', {
                category: query.category,
            });
        }
        if (query?.minPrice !== undefined) {
            qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
        }
        if (query?.maxPrice !== undefined) {
            qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
        }
        if (query?.inStock) {
            qb.andWhere('product.stock > 0');
        }
        if (query?.rating !== undefined) {
            qb.having('COALESCE(AVG(r.rating), 5.0) >= :rating', {
                rating: query.rating,
            });
        }
        // Sort order:
        // newest, price-asc, price-desc, best-selling, top-rated
        if (query?.sortBy === 'price-asc') {
            qb.orderBy('product.price', 'ASC');
        }
        else if (query?.sortBy === 'price-desc') {
            qb.orderBy('product.price', 'DESC');
        }
        else if (query?.sortBy === 'best-selling') {
            qb.orderBy('sold', 'DESC');
        }
        else if (query?.sortBy === 'top-rated') {
            qb.orderBy('avgRating', 'DESC');
        }
        else {
            qb.orderBy('product.id', 'DESC');
        }
        const { raw, entities } = await qb.getRawAndEntities();
        return entities.map((product, index) => {
            const sold = Number(raw[index]?.sold ?? 0);
            const rating = Number(raw[index]?.avgRating ?? 5.0);
            return {
                ...product,
                sold,
                rating: Math.round(rating * 10) / 10,
            };
        });
    }
    findOne(id) {
        return this.productRepo.findOne({
            where: { id },
            relations: ['category'],
        });
    }
    async create(dto) {
        const product = this.productRepo.create({
            ...dto,
            category: { id: dto.categoryId },
        });
        return this.productRepo.save(product);
    }
    async update(id, dto) {
        if (!dto) {
            throw new common_1.BadRequestException('No data provided');
        }
        const product = await this.productRepo.findOneBy({ id });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        Object.assign(product, dto);
        if (dto.categoryId !== undefined) {
            product.category = { id: dto.categoryId };
        }
        return this.productRepo.save(product);
    }
    async remove(id) {
        const product = await this.productRepo.findOneBy({ id });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return this.productRepo.remove(product);
    }
    async findByCategory(categoryName) {
        return this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .where('LOWER(category.name) = LOWER(:name)', {
            name: categoryName,
        })
            .orderBy('product.id', 'DESC') // mới nhất lên đầu
            .take(10) // limit 10 sp
            .getMany();
    }
    async getNewArrivals(limit = 12) {
        return this.productRepo.find({
            relations: ['category'],
            order: { id: 'DESC' },
            take: limit,
        });
    }
    async getTopSelling(limit = 10) {
        const { raw, entities } = await this.productRepo
            .createQueryBuilder('product')
            .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
            .leftJoinAndSelect('product.category', 'category')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
            .groupBy('product.id')
            .addGroupBy('category.id')
            .orderBy('sold', 'DESC')
            .limit(limit)
            .getRawAndEntities();
        return entities.map((product, index) => ({
            ...product,
            sold: Number(raw[index]?.sold ?? 0),
        }));
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
