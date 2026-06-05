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
exports.Deal = void 0;
const typeorm_1 = require("typeorm");
const coupon_entity_1 = require("../../coupons/coupon.entity");
const deal_product_entity_1 = require("./deal-product.entity");
let Deal = class Deal {
    id;
    name;
    description;
    startsAt;
    expiresAt;
    isActive;
    featuredCoupons;
    dealProducts;
    createdAt;
    updatedAt;
};
exports.Deal = Deal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Deal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Deal.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Deal.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'starts_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Deal.prototype, "startsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Deal.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Deal.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => coupon_entity_1.Coupon),
    (0, typeorm_1.JoinTable)({ name: 'deal_featured_coupons' }),
    __metadata("design:type", Array)
], Deal.prototype, "featuredCoupons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => deal_product_entity_1.DealProduct, (dp) => dp.deal),
    __metadata("design:type", Array)
], Deal.prototype, "dealProducts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Deal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Deal.prototype, "updatedAt", void 0);
exports.Deal = Deal = __decorate([
    (0, typeorm_1.Entity)('deals')
], Deal);
