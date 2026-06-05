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
exports.Ward = void 0;
const typeorm_1 = require("typeorm");
const province_entity_1 = require("./province.entity");
let Ward = class Ward {
    id;
    code;
    name;
    provinceId;
    province;
    createdAt;
    updatedAt;
};
exports.Ward = Ward;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Ward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], Ward.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Ward.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'province_id', type: 'integer' }),
    __metadata("design:type", Number)
], Ward.prototype, "provinceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => province_entity_1.Province, (province) => province.wards, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'province_id' }),
    __metadata("design:type", province_entity_1.Province)
], Ward.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Ward.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Ward.prototype, "updatedAt", void 0);
exports.Ward = Ward = __decorate([
    (0, typeorm_1.Entity)('wards'),
    (0, typeorm_1.Index)('idx_ward_code', ['code'], { unique: true }),
    (0, typeorm_1.Index)('idx_ward_name', ['name']),
    (0, typeorm_1.Index)('idx_ward_province_id', ['provinceId'])
], Ward);
