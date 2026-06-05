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
exports.UserAddress = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const province_entity_1 = require("../../locations/entities/province.entity");
const ward_entity_1 = require("../../locations/entities/ward.entity");
let UserAddress = class UserAddress {
    id;
    receiverName;
    receiverPhone;
    province;
    district;
    ward;
    detail;
    provinceId;
    wardId;
    addressDetail;
    provinceObj;
    wardObj;
    label;
    isDefault;
    user;
};
exports.UserAddress = UserAddress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserAddress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "receiverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_phone', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "receiverPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "ward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "detail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'province_id', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], UserAddress.prototype, "provinceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ward_id', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], UserAddress.prototype, "wardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_detail', type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserAddress.prototype, "addressDetail", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => province_entity_1.Province, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'province_id' }),
    __metadata("design:type", province_entity_1.Province)
], UserAddress.prototype, "provinceObj", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ward_entity_1.Ward, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'ward_id' }),
    __metadata("design:type", ward_entity_1.Ward)
], UserAddress.prototype, "wardObj", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'home' }),
    __metadata("design:type", String)
], UserAddress.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_default', default: false }),
    __metadata("design:type", Boolean)
], UserAddress.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.addresses, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserAddress.prototype, "user", void 0);
exports.UserAddress = UserAddress = __decorate([
    (0, typeorm_1.Entity)('user_addresses')
], UserAddress);
