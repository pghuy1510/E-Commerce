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
exports.ProvinceResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ProvinceResponseDto {
    id;
    code;
    name;
}
exports.ProvinceResponseDto = ProvinceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID Tỉnh / Thành phố trong hệ thống' }),
    __metadata("design:type", Number)
], ProvinceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '01', description: 'Mã hành chính Tỉnh / Thành phố' }),
    __metadata("design:type", String)
], ProvinceResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Thành phố Hà Nội', description: 'Tên đầy đủ của Tỉnh / Thành phố' }),
    __metadata("design:type", String)
], ProvinceResponseDto.prototype, "name", void 0);
