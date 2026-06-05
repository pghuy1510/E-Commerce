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
exports.GuestCheckoutDto = exports.GuestCartItemDto = exports.CheckoutDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CheckoutDto {
    receiverName;
    receiverPhone;
    provinceId;
    wardId;
    addressDetail;
    province;
    commune;
    district;
    ward;
    detail;
    paymentMethod;
    shippingFee;
    couponCode;
    note;
    machineId;
}
exports.CheckoutDto = CheckoutDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CheckoutDto.prototype, "receiverName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CheckoutDto.prototype, "receiverPhone", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "provinceId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "wardId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CheckoutDto.prototype, "addressDetail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CheckoutDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CheckoutDto.prototype, "commune", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CheckoutDto.prototype, "district", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CheckoutDto.prototype, "ward", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CheckoutDto.prototype, "detail", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['qr', 'cod']),
    __metadata("design:type", String)
], CheckoutDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "shippingFee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CheckoutDto.prototype, "couponCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CheckoutDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CheckoutDto.prototype, "machineId", void 0);
class GuestCartItemDto {
    productId;
    quantity;
}
exports.GuestCartItemDto = GuestCartItemDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GuestCartItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GuestCartItemDto.prototype, "quantity", void 0);
class GuestCheckoutDto {
    receiverName;
    receiverPhone;
    provinceId;
    wardId;
    addressDetail;
    province;
    commune;
    district;
    ward;
    detail;
    paymentMethod;
    shippingFee;
    couponCode;
    note;
    machineId;
    guestEmail;
    items;
}
exports.GuestCheckoutDto = GuestCheckoutDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "receiverName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "receiverPhone", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GuestCheckoutDto.prototype, "provinceId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GuestCheckoutDto.prototype, "wardId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "addressDetail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "commune", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "district", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "ward", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "detail", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['qr', 'cod']),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GuestCheckoutDto.prototype, "shippingFee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "couponCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "machineId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GuestCheckoutDto.prototype, "guestEmail", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GuestCartItemDto),
    __metadata("design:type", Array)
], GuestCheckoutDto.prototype, "items", void 0);
