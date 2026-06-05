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
exports.OrderShippingAddress = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
let OrderShippingAddress = class OrderShippingAddress {
    id;
    order;
    receiverName;
    receiverPhone;
    province;
    district;
    ward;
    detail;
    provinceId;
    wardId;
    provinceName;
    wardName;
    addressDetail;
    fullAddress;
    createdAt;
};
exports.OrderShippingAddress = OrderShippingAddress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrderShippingAddress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_entity_1.Order, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], OrderShippingAddress.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_name', type: 'varchar' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "receiverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_phone', type: 'varchar' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "receiverPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "ward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "detail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'province_id', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], OrderShippingAddress.prototype, "provinceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ward_id', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], OrderShippingAddress.prototype, "wardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'province_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "provinceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ward_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "wardName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_detail', type: 'text', nullable: true }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "addressDetail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_address', type: 'text', nullable: true }),
    __metadata("design:type", String)
], OrderShippingAddress.prototype, "fullAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrderShippingAddress.prototype, "createdAt", void 0);
exports.OrderShippingAddress = OrderShippingAddress = __decorate([
    (0, typeorm_1.Entity)('order_shipping_addresses'),
    (0, typeorm_1.Index)('idx_order_shipping_order', ['order'])
], OrderShippingAddress);
