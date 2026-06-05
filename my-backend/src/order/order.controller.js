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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const order_service_1 = require("./order.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const checkout_dto_1 = require("./dto/checkout.dto");
let OrderController = class OrderController {
    service;
    constructor(service) {
        this.service = service;
    }
    checkout(req, dto) {
        return this.service.checkout(req.user.id, dto);
    }
    checkoutGuest(dto) {
        return this.service.checkoutGuest(dto);
    }
    getGuestOrder(id, email) {
        return this.service.getGuestOrderById(Number(id), email);
    }
    getMyOrders(req) {
        return this.service.getMyOrders(req.user.id);
    }
    getOrder(req, id) {
        return this.service.getOrderById(req.user.id, Number(id));
    }
    cancelOrder(req, id, body) {
        return this.service.cancelOrder(req.user.id, Number(id), body.reason);
    }
    requestReturn(req, id, body) {
        return this.service.requestReturn(req.user.id, Number(id), body);
    }
    getReturnDetails(req, id) {
        return this.service.getReturnDetails(req.user.id, Number(id), req.user.role);
    }
    cancelReturn(req, id) {
        return this.service.cancelReturn(req.user.id, Number(id));
    }
    changeToCod(req, id) {
        return this.service.changePaymentMethodToCod(req.user.id, Number(id));
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, checkout_dto_1.CheckoutDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('checkout-guest'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_dto_1.GuestCheckoutDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "checkoutGuest", null);
__decorate([
    (0, common_1.Get)('guest/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "getGuestOrder", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "requestReturn", null);
__decorate([
    (0, common_1.Get)(':id/return'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "getReturnDetails", null);
__decorate([
    (0, common_1.Post)(':id/return/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "cancelReturn", null);
__decorate([
    (0, common_1.Post)(':id/change-to-cod'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "changeToCod", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], OrderController);
