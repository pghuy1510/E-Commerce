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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const payment_service_1 = require("./payment.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const payment_webhook_dto_1 = require("./dto/payment-webhook.dto");
const regenerate_qr_dto_1 = require("./dto/regenerate-qr.dto");
const payment_status_query_dto_1 = require("./dto/payment-status-query.dto");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
// NOTE: SimpleRateLimiter is an in-memory rate-limiter suitable for development and demo/thesis projects.
// In a production environment, you should use a distributed rate-limiter like Redis-backed NestJS Throttler.
class SimpleRateLimiter {
    limit;
    ttlMs;
    requests = new Map();
    constructor(limit, // max requests
    ttlMs) {
        this.limit = limit;
        this.ttlMs = ttlMs;
    }
    isAllowed(key) {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        const recentTimestamps = timestamps.filter((ts) => now - ts < this.ttlMs);
        if (recentTimestamps.length >= this.limit) {
            return false;
        }
        recentTimestamps.push(now);
        this.requests.set(key, recentTimestamps);
        return true;
    }
}
let PaymentController = class PaymentController {
    paymentService;
    configService;
    regenerateLimiter = new SimpleRateLimiter(5, 60 * 1000); // max 5 requests per minute
    webhookLimiter = new SimpleRateLimiter(30, 60 * 1000); // max 30 requests per minute
    constructor(paymentService, configService) {
        this.paymentService = paymentService;
        this.configService = configService;
    }
    // tạo payment
    create(dto) {
        return this.paymentService.create(dto);
    }
    async webhook(dto, req) {
        const clientIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
        const limitKey = `webhook-${clientIp}`;
        if (!this.webhookLimiter.isAllowed(limitKey)) {
            throw new common_1.HttpException('Too many requests. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const authHeader = req.headers['authorization'];
        const webhookSecret = this.configService.get('SEPAY_WEBHOOK_SECRET') || 'webhook_secret_key_123';
        let isAuthorized = false;
        if (authHeader) {
            if (authHeader === `Apikey ${webhookSecret}` || authHeader === webhookSecret) {
                isAuthorized = true;
            }
        }
        console.log('========== WEBHOOK DEBUG ==========');
        console.log('AUTH HEADER:', req.headers['authorization']);
        console.log('ENV SECRET:', process.env.SEPAY_WEBHOOK_SECRET);
        console.log('CONFIG SECRET:', this.configService.get('SEPAY_WEBHOOK_SECRET'));
        console.log('===================================');
        if (!isAuthorized) {
            throw new common_1.UnauthorizedException('Mã xác thực webhook không hợp lệ.');
        }
        const result = await this.paymentService.handleWebhook(dto, dto);
        return { success: true, ...result };
    }
    getStatus(id, query, req) {
        const userId = req.user?.id;
        return this.paymentService.getPaymentStatus(+id, query.token, userId);
    }
    regenerateQr(id, dto, query, req) {
        const clientIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
        const limitKey = `regen-${id}-${clientIp}`;
        if (!this.regenerateLimiter.isAllowed(limitKey)) {
            throw new common_1.HttpException('Too many requests. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const userId = req.user?.id;
        return this.paymentService.regenerateQr(+id, dto.machineId, query.token, userId);
    }
    // success
    success(id) {
        return this.paymentService.success(+id);
    }
    // fail
    fail(id) {
        return this.paymentService.fail(+id);
    }
    // lấy theo order
    getByOrder(id) {
        return this.paymentService.getByOrder(+id);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_webhook_dto_1.PaymentWebhookDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, payment_status_query_dto_1.PaymentStatusQueryDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-qr'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, regenerate_qr_dto_1.RegenerateQrDto,
        payment_status_query_dto_1.PaymentStatusQueryDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "regenerateQr", null);
__decorate([
    (0, common_1.Patch)(':id/success'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "success", null);
__decorate([
    (0, common_1.Patch)(':id/fail'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "fail", null);
__decorate([
    (0, common_1.Get)('order/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "getByOrder", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        config_1.ConfigService])
], PaymentController);
