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
exports.Coupon = exports.DISCOUNT_TYPES = exports.COUPON_TYPES = void 0;
const typeorm_1 = require("typeorm");
exports.COUPON_TYPES = ['platform', 'shop', 'shipping'];
exports.DISCOUNT_TYPES = ['percentage', 'fixed'];
let Coupon = class Coupon {
    id;
    code;
    name;
    type;
    discountType;
    discountValue;
    minOrder;
    maxDiscount;
    categoryId;
    startsAt;
    expiresAt;
    isActive;
    createdAt;
};
exports.Coupon = Coupon;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Coupon.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Coupon.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Coupon.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: exports.COUPON_TYPES, default: 'platform' }),
    __metadata("design:type", String)
], Coupon.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: exports.DISCOUNT_TYPES, default: 'percentage' }),
    __metadata("design:type", String)
], Coupon.prototype, "discountType", void 0);
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
], Coupon.prototype, "discountValue", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value) => value,
            from: (value) => (value ? parseFloat(value) : null),
        },
    }),
    __metadata("design:type", Object)
], Coupon.prototype, "minOrder", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value) => value,
            from: (value) => (value ? parseFloat(value) : null),
        },
    }),
    __metadata("design:type", Object)
], Coupon.prototype, "maxDiscount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Coupon.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'starts_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Coupon.prototype, "startsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Coupon.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Coupon.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Coupon.prototype, "createdAt", void 0);
exports.Coupon = Coupon = __decorate([
    (0, typeorm_1.Entity)('coupons'),
    (0, typeorm_1.Index)('idx_coupons_code', ['code'], { unique: true }),
    (0, typeorm_1.Index)('idx_coupons_expires_at', ['expiresAt'])
], Coupon);
