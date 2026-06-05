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
exports.PaymentLog = void 0;
const typeorm_1 = require("typeorm");
const payment_entity_1 = require("./payment.entity");
let PaymentLog = class PaymentLog {
    id;
    payment;
    provider;
    providerTransactionId;
    rawResponse;
    status;
    createdAt;
};
exports.PaymentLog = PaymentLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", payment_entity_1.Payment)
], PaymentLog.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], PaymentLog.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_transaction_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PaymentLog.prototype, "providerTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_response', type: 'jsonb' }),
    __metadata("design:type", Object)
], PaymentLog.prototype, "rawResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], PaymentLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PaymentLog.prototype, "createdAt", void 0);
exports.PaymentLog = PaymentLog = __decorate([
    (0, typeorm_1.Entity)('payment_logs'),
    (0, typeorm_1.Index)('idx_payment_logs_payment', ['payment'])
], PaymentLog);
