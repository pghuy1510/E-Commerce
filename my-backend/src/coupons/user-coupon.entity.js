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
exports.UserCoupon = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const coupon_entity_1 = require("./coupon.entity");
let UserCoupon = class UserCoupon {
    id;
    user;
    coupon;
    code;
    source;
    isUsed;
    usedCount;
    usageLimit;
    expiresAt;
    usedAt;
    assignedAt;
};
exports.UserCoupon = UserCoupon;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserCoupon.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserCoupon.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => coupon_entity_1.Coupon, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'coupon_id' }),
    __metadata("design:type", coupon_entity_1.Coupon)
], UserCoupon.prototype, "coupon", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserCoupon.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], UserCoupon.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_used', default: false }),
    __metadata("design:type", Boolean)
], UserCoupon.prototype, "isUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_count', default: 0 }),
    __metadata("design:type", Number)
], UserCoupon.prototype, "usedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usage_limit', default: 1 }),
    __metadata("design:type", Number)
], UserCoupon.prototype, "usageLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserCoupon.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], UserCoupon.prototype, "usedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'assigned_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserCoupon.prototype, "assignedAt", void 0);
exports.UserCoupon = UserCoupon = __decorate([
    (0, typeorm_1.Entity)('user_coupons'),
    (0, typeorm_1.Unique)(['code']),
    (0, typeorm_1.Index)('idx_user_coupons_user_id', ['user']),
    (0, typeorm_1.Index)('idx_user_coupons_expires_at', ['expiresAt'])
], UserCoupon);
