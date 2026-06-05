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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const cart_entity_1 = require("../../cart/cart.entity");
const user_address_entity_1 = require("./user-address.entity");
const user_bank_entity_1 = require("./user-bank.entity");
let User = class User {
    id;
    username;
    email;
    password;
    resetPasswordToken;
    resetPasswordExpires;
    role;
    isActive;
    created_at;
    last_login;
    totalSpent;
    // PROFILE
    fullName;
    phone;
    gender;
    dateOfBirth;
    // RELATIONS
    carts;
    banks;
    addresses;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_password_token', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_password_expires', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordExpires", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'user' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "last_login", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', {
        name: 'total_spent',
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], User.prototype, "totalSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cart_entity_1.Cart, (cart) => cart.user),
    __metadata("design:type", Array)
], User.prototype, "carts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_bank_entity_1.UserBank, (bank) => bank.user),
    __metadata("design:type", Array)
], User.prototype, "banks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_address_entity_1.UserAddress, (address) => address.user, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], User.prototype, "addresses", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
