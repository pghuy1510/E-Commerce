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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealProduct = void 0;
const typeorm_1 = require("typeorm");
const deal_entity_1 = require("./deal.entity");
const products_entity_1 = require("../../products/products.entity");
let DealProduct = class DealProduct {
    id;
    deal;
    dealId;
    product;
    productId;
    dealPrice;
    dealStock;
    soldCount;
    createdAt;
    updatedAt;
};
exports.DealProduct = DealProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DealProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => deal_entity_1.Deal, (deal) => deal.dealProducts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'deal_id' }),
    __metadata("design:type", deal_entity_1.Deal)
], DealProduct.prototype, "deal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deal_id' }),
    __metadata("design:type", Number)
], DealProduct.prototype, "dealId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => products_entity_1.Product, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", products_entity_1.Product)
], DealProduct.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], DealProduct.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 10,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], DealProduct.prototype, "dealPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deal_stock', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DealProduct.prototype, "dealStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sold_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DealProduct.prototype, "soldCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DealProduct.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DealProduct.prototype, "updatedAt", void 0);
exports.DealProduct = DealProduct = __decorate([
    (0, typeorm_1.Entity)('deal_products')
], DealProduct);
