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
exports.QrPayment = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../../order/order.entity");
const payment_entity_1 = require("./payment.entity");
let QrPayment = class QrPayment {
    id;
    order;
    payment;
    qrToken;
    bankName;
    accountName;
    accountNumber;
    amount;
    addInfo;
    qrDataUrl;
    status;
    expiredAt;
    paidAt;
    createdAt;
};
exports.QrPayment = QrPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QrPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], QrPayment.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", payment_entity_1.Payment)
], QrPayment.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qr_token', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], QrPayment.prototype, "qrToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_name', type: 'varchar' }),
    __metadata("design:type", String)
], QrPayment.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_name', type: 'varchar' }),
    __metadata("design:type", String)
], QrPayment.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_number', type: 'varchar' }),
    __metadata("design:type", String)
], QrPayment.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], QrPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'add_info', type: 'varchar' }),
    __metadata("design:type", String)
], QrPayment.prototype, "addInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qr_data_url', type: 'text' }),
    __metadata("design:type", String)
], QrPayment.prototype, "qrDataUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], QrPayment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expired_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], QrPayment.prototype, "expiredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], QrPayment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], QrPayment.prototype, "createdAt", void 0);
exports.QrPayment = QrPayment = __decorate([
    (0, typeorm_1.Entity)('qr_payments'),
    (0, typeorm_1.Index)('idx_qr_payments_token', ['qrToken'], { unique: true }),
    (0, typeorm_1.Index)('idx_qr_payments_payment', ['payment']),
    (0, typeorm_1.Index)('idx_qr_payments_order', ['order'])
], QrPayment);
