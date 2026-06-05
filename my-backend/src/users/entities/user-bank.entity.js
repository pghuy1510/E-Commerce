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
exports.UserBank = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserBank = class UserBank {
    id;
    user;
    bankName;
    accountName;
    accountNumber;
    createdAt;
};
exports.UserBank = UserBank;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserBank.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.banks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserBank.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_name' }),
    __metadata("design:type", String)
], UserBank.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_name' }),
    __metadata("design:type", String)
], UserBank.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_number' }),
    __metadata("design:type", String)
], UserBank.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserBank.prototype, "createdAt", void 0);
exports.UserBank = UserBank = __decorate([
    (0, typeorm_1.Entity)('user_banks')
], UserBank);
