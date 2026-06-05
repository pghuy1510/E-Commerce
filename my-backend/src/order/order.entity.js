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
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const order_item_entity_1 = require("./order-item.entity");
const user_entity_1 = require("../users/entities/user.entity");
const order_status_log_entity_1 = require("./order-status-log.entity");
let Order = class Order {
    id;
    user;
    guestEmail;
    totalAmount;
    subtotalAmount;
    discountAmount;
    shippingFee;
    couponCodes;
    paymentMethod;
    status;
    deliveredAt;
    created_at;
    items;
    trackingNumber;
    estimatedDeliveryDate;
    statusLogs;
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_email', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "guestEmail", void 0);
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
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Order.prototype, "subtotalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Order.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        name: 'shipping_fee',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Order.prototype, "shippingFee", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Order.prototype, "couponCodes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Order.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (item) => item.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tracking_number', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "trackingNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_delivery_date', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "estimatedDeliveryDate", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_status_log_entity_1.OrderStatusLog, (log) => log.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "statusLogs", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)('idx_orders_created_at', ['created_at'])
], Order);
