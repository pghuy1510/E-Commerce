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
exports.CouponController = void 0;
const common_1 = require("@nestjs/common");
const coupon_service_1 = require("./coupon.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_auth_guard_1 = require("../auth/admin-auth.guard");
let CouponController = class CouponController {
    couponService;
    constructor(couponService) {
        this.couponService = couponService;
    }
    getMyCoupons(req) {
        return this.couponService.getUserCoupons(Number(req.user.id));
    }
    getProgress(req, subtotal) {
        const value = Number(subtotal ?? 0);
        const safeSubtotal = Number.isFinite(value) ? value : 0;
        return this.couponService.getCheckoutProgress(Number(req.user.id), safeSubtotal);
    }
    validateCoupon(req, body) {
        return this.couponService.validateCouponCode(Number(req.user.id), body.code, body.shippingFee ?? 0);
    }
    validateGuestCoupon(body) {
        return this.couponService.validateCouponCodeForGuest(body.code, body.items ?? [], body.subtotal, body.shippingFee ?? 0);
    }
    listAllCoupons() {
        return this.couponService.listAllCoupons();
    }
    findOneCoupon(id) {
        return this.couponService.findOneCoupon(id);
    }
    createCoupon(req, body) {
        return this.couponService.createCoupon(body, Number(req.user.id), req.user.username, req.ip, body.reason);
    }
    updateCoupon(req, id, body) {
        return this.couponService.updateCoupon(id, body, Number(req.user.id), req.user.username, req.ip, body.reason);
    }
    deleteCoupon(req, id, body) {
        return this.couponService.deleteCoupon(id, Number(req.user.id), req.user.username, req.ip, body?.reason);
    }
};
exports.CouponController = CouponController;
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "getMyCoupons", null);
__decorate([
    (0, common_1.Get)('progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subtotal')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "validateCoupon", null);
__decorate([
    (0, common_1.Post)('validate-guest'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "validateGuestCoupon", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_auth_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "listAllCoupons", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_auth_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "findOneCoupon", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_auth_guard_1.AdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "createCoupon", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_auth_guard_1.AdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "updateCoupon", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_auth_guard_1.AdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], CouponController.prototype, "deleteCoupon", null);
exports.CouponController = CouponController = __decorate([
    (0, common_1.Controller)('coupons'),
    __metadata("design:paramtypes", [coupon_service_1.CouponService])
], CouponController);
