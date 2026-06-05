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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const location_service_1 = require("./location.service");
const province_response_dto_1 = require("./dto/province-response.dto");
const ward_response_dto_1 = require("./dto/ward-response.dto");
let LocationController = class LocationController {
    locationService;
    constructor(locationService) {
        this.locationService = locationService;
    }
    getProvinces() {
        return this.locationService.getProvinces();
    }
    getWards(id) {
        return this.locationService.getWards(id);
    }
};
exports.LocationController = LocationController;
__decorate([
    (0, common_1.Get)('provinces'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách tất cả các Tỉnh / Thành phố Việt Nam' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Danh sách Tỉnh / Thành phố, được sắp xếp theo bảng chữ cái tiếng Việt.',
        type: province_response_dto_1.ProvinceResponseDto,
        isArray: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getProvinces", null);
__decorate([
    (0, common_1.Get)('provinces/:id/wards'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách Xã / Phường theo ID Tỉnh / Thành phố' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'integer', description: 'ID của Tỉnh / Thành phố' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Danh sách Xã / Phường thuộc Tỉnh / Thành phố tương ứng, sắp xếp theo tên.',
        type: ward_response_dto_1.WardResponseDto,
        isArray: true,
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getWards", null);
exports.LocationController = LocationController = __decorate([
    (0, swagger_1.ApiTags)('locations'),
    (0, common_1.Controller)('locations'),
    __metadata("design:paramtypes", [location_service_1.LocationService])
], LocationController);
