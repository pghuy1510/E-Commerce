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
exports.LocationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const province_entity_1 = require("./entities/province.entity");
const ward_entity_1 = require("./entities/ward.entity");
let LocationService = class LocationService {
    provinceRepo;
    wardRepo;
    provincesMap = new Map();
    wardsMap = new Map();
    constructor(provinceRepo, wardRepo) {
        this.provinceRepo = provinceRepo;
        this.wardRepo = wardRepo;
    }
    async onModuleInit() {
        await this.preloadToMemory();
    }
    /**
     * Preload all locations from PostgreSQL into RAM
     */
    async preloadToMemory() {
        console.log('[LocationService] Đang tải danh sách địa chỉ hành chính vào RAM...');
        try {
            const provinces = await this.provinceRepo.find({
                order: { name: 'ASC' },
            });
            const wards = await this.wardRepo.find({
                order: { name: 'ASC' },
            });
            this.provincesMap.clear();
            for (const p of provinces) {
                this.provincesMap.set(p.id, p);
            }
            this.wardsMap.clear();
            for (const w of wards) {
                this.wardsMap.set(w.id, w);
            }
            console.log(`[LocationService] Đã tải xong: ${this.provincesMap.size} tỉnh/thành, ${this.wardsMap.size} xã/phường.`);
        }
        catch (err) {
            console.error('[LocationService] Lỗi khi preload địa chỉ vào RAM:', err);
        }
    }
    /**
     * Get all provinces from RAM, sorted by name ASC
     */
    getProvinces() {
        return Array.from(this.provincesMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    /**
     * Get wards of a province from RAM, sorted by name ASC
     */
    getWards(provinceId) {
        if (!this.provincesMap.has(provinceId)) {
            throw new common_1.NotFoundException(`Tỉnh/Thành phố với ID ${provinceId} không tồn tại.`);
        }
        return Array.from(this.wardsMap.values())
            .filter((w) => w.provinceId === provinceId)
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    /**
     * Validate if a province & ward combination is correct in O(1) RAM lookup.
     * Returns matching names.
     */
    validateAddress(provinceId, wardId) {
        const province = this.provincesMap.get(provinceId);
        if (!province) {
            throw new common_1.BadRequestException(`Tỉnh/Thành phố với ID ${provinceId} không tồn tại.`);
        }
        const ward = this.wardsMap.get(wardId);
        if (!ward) {
            throw new common_1.BadRequestException(`Xã/Phường với ID ${wardId} không tồn tại.`);
        }
        if (ward.provinceId !== provinceId) {
            throw new common_1.BadRequestException(`Xã/Phường "${ward.name}" (ID ${wardId}) không thuộc Tỉnh/Thành phố "${province.name}" (ID ${provinceId}).`);
        }
        return {
            provinceName: province.name,
            wardName: ward.name,
        };
    }
};
exports.LocationService = LocationService;
exports.LocationService = LocationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(province_entity_1.Province)),
    __param(1, (0, typeorm_1.InjectRepository)(ward_entity_1.Ward)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LocationService);
