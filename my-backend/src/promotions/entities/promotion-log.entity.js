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
exports.PromotionLog = void 0;
const typeorm_1 = require("typeorm");
let PromotionLog = class PromotionLog {
    id;
    adminId;
    performedBy;
    ipAddress;
    entityType;
    entityId;
    action;
    reason;
    oldValue;
    newValue;
    createdAt;
    updatedAt;
};
exports.PromotionLog = PromotionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PromotionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "adminId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'performed_by', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', type: 'varchar' }),
    __metadata("design:type", String)
], PromotionLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'int' }),
    __metadata("design:type", Number)
], PromotionLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], PromotionLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "oldValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PromotionLog.prototype, "newValue", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PromotionLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PromotionLog.prototype, "updatedAt", void 0);
exports.PromotionLog = PromotionLog = __decorate([
    (0, typeorm_1.Entity)('promotion_logs')
], PromotionLog);
