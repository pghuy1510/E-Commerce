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
exports.OrderStatusLog = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
let OrderStatusLog = class OrderStatusLog {
    id;
    order;
    oldStatus;
    newStatus;
    note;
    createdAt;
};
exports.OrderStatusLog = OrderStatusLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrderStatusLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], OrderStatusLog.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_status', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], OrderStatusLog.prototype, "oldStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_status', type: 'varchar' }),
    __metadata("design:type", String)
], OrderStatusLog.prototype, "newStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], OrderStatusLog.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrderStatusLog.prototype, "createdAt", void 0);
exports.OrderStatusLog = OrderStatusLog = __decorate([
    (0, typeorm_1.Entity)('order_status_logs'),
    (0, typeorm_1.Index)('idx_order_status_logs_order', ['order'])
], OrderStatusLog);
