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
exports.Payment = void 0;
const typeorm_1 = require("typeorm");
let Payment = class Payment {
    id;
    order_id;
    method; // COD | MOMO | VNPAY
    amount;
    status; // pending | paid | failed | expired | refunded
    transaction_id;
    tokenHash;
    paymentCode;
    paid_at;
    expired_at;
    created_at;
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Payment.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payment.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal'),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_hash', nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "tokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_code', type: 'varchar', unique: true, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "paymentCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "paid_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expired_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "expired_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "created_at", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments')
], Payment);
