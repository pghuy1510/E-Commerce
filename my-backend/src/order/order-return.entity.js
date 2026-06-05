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
exports.OrderReturn = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
let OrderReturn = class OrderReturn {
    id;
    order;
    reason;
    imageProof;
    status;
    rejectionReason;
    refundTransactionId;
    refundMethod;
    refundedAt;
    refundAmount;
    createdAt;
};
exports.OrderReturn = OrderReturn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrderReturn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], OrderReturn.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], OrderReturn.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_proof', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], OrderReturn.prototype, "imageProof", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'return_requested' }),
    __metadata("design:type", String)
], OrderReturn.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejection_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], OrderReturn.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_transaction_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], OrderReturn.prototype, "refundTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_method', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], OrderReturn.prototype, "refundMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refunded_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], OrderReturn.prototype, "refundedAt", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        name: 'refund_amount',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], OrderReturn.prototype, "refundAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrderReturn.prototype, "createdAt", void 0);
exports.OrderReturn = OrderReturn = __decorate([
    (0, typeorm_1.Entity)('order_returns')
], OrderReturn);
