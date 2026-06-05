"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_address_entity_1 = require("./entities/user-address.entity");
const user_bank_entity_1 = require("./entities/user-bank.entity");
const bcrypt = __importStar(require("bcrypt"));
const location_service_1 = require("../locations/location.service");
let UsersService = class UsersService {
    userRepo;
    addressRepo;
    bankRepo;
    locationService;
    constructor(userRepo, addressRepo, bankRepo, locationService) {
        this.userRepo = userRepo;
        this.addressRepo = addressRepo;
        this.bankRepo = bankRepo;
        this.locationService = locationService;
    }
    async findByUsername(username) {
        return this.userRepo.findOne({
            where: { username },
        });
    }
    async findByEmail(email) {
        return this.userRepo.findOne({
            where: { email },
        });
    }
    async create(createUserDto) {
        return this.createUser(createUserDto.username, createUserDto.password, createUserDto.email);
    }
    async findAll() {
        return this.userRepo.find();
    }
    async findOne(id) {
        return this.userRepo.findOne({
            where: { id },
        });
    }
    async update(id, updateUserDto) {
        const user = await this.userRepo.findOne({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateUserDto.username !== undefined) {
            user.username = updateUserDto.username;
        }
        if (updateUserDto.password !== undefined) {
            user.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.userRepo.save(user);
    }
    async remove(id) {
        const user = await this.userRepo.findOne({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.userRepo.remove(user);
    }
    async createUser(username, password, email) {
        const hashed = await bcrypt.hash(password, 10);
        const user = this.userRepo.create({
            username,
            email,
            password: hashed,
            last_login: new Date(),
        });
        return this.userRepo.save(user);
    }
    async touchLastLogin(userId) {
        await this.userRepo.update(userId, {
            last_login: new Date(),
        });
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            username: user.username,
            email: user.email ?? '',
            fullName: user.fullName ?? '',
            phone: user.phone ?? '',
            gender: user.gender ?? '',
            dateOfBirth: user.dateOfBirth ?? null,
            role: user.role,
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.username !== undefined) {
            user.username = dto.username;
        }
        if (dto.email !== undefined) {
            user.email = dto.email;
        }
        if (dto.fullName !== undefined) {
            user.fullName = dto.fullName;
        }
        if (dto.phone !== undefined) {
            user.phone = dto.phone;
        }
        if (dto.gender !== undefined) {
            user.gender = dto.gender;
        }
        if (dto.dateOfBirth !== undefined) {
            user.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
        }
        const saved = await this.userRepo.save(user);
        return saved;
    }
    async getAddress(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['addresses', 'addresses.provinceObj', 'addresses.wardObj'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const defaultAddress = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
        if (!defaultAddress) {
            return {
                provinceId: null,
                wardId: null,
                addressDetail: '',
                province: '',
                commune: '',
                district: '',
                detail: '',
                formattedAddress: '',
            };
        }
        const provinceName = defaultAddress.provinceObj?.name ?? defaultAddress.province ?? '';
        const wardName = defaultAddress.wardObj?.name ?? defaultAddress.ward ?? '';
        const detail = defaultAddress.addressDetail ?? defaultAddress.detail ?? '';
        const formattedAddress = [detail, wardName, provinceName].filter(Boolean).join(', ');
        return {
            id: defaultAddress.id,
            provinceId: defaultAddress.provinceId ?? null,
            wardId: defaultAddress.wardId ?? null,
            addressDetail: detail,
            province: provinceName,
            commune: wardName,
            district: '',
            detail: detail,
            formattedAddress,
        };
    }
    async updateAddress(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['addresses'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let address = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
        if (!address) {
            address = this.addressRepo.create({
                user,
                isDefault: true,
            });
        }
        if (dto.provinceId !== undefined && dto.wardId !== undefined) {
            const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);
            address.provinceId = dto.provinceId;
            address.wardId = dto.wardId;
            address.province = provinceName;
            address.ward = wardName;
            address.district = '';
        }
        if (dto.addressDetail !== undefined) {
            address.addressDetail = dto.addressDetail;
            address.detail = dto.addressDetail;
        }
        if (address.provinceId && address.wardId && address.addressDetail) {
            const duplicate = await this.addressRepo.findOne({
                where: {
                    user: { id: userId },
                    provinceId: address.provinceId,
                    wardId: address.wardId,
                    addressDetail: address.addressDetail,
                },
            });
            if (duplicate && duplicate.id !== address.id) {
                throw new common_1.BadRequestException('Địa chỉ này đã tồn tại trong sổ địa chỉ của bạn.');
            }
        }
        await this.addressRepo.save(address);
        return this.getAddress(userId);
    }
    async listAddresses(userId) {
        const addresses = await this.addressRepo.find({
            where: { user: { id: userId } },
            relations: ['provinceObj', 'wardObj'],
            order: { isDefault: 'DESC', id: 'ASC' },
        });
        return addresses.map((addr) => {
            const provinceName = addr.provinceObj?.name ?? addr.province ?? '';
            const wardName = addr.wardObj?.name ?? addr.ward ?? '';
            const detail = addr.addressDetail ?? addr.detail ?? '';
            return {
                ...addr,
                province: provinceName,
                commune: wardName,
                district: '',
                detail: detail,
                formattedAddress: [detail, wardName, provinceName].filter(Boolean).join(', '),
            };
        });
    }
    async addAddress(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['addresses'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!dto.provinceId || !dto.wardId || !dto.addressDetail) {
            throw new common_1.BadRequestException('Vui lòng cung cấp đầy đủ thông tin địa chỉ.');
        }
        // Check duplicate
        const duplicate = await this.addressRepo.findOne({
            where: {
                user: { id: userId },
                provinceId: dto.provinceId,
                wardId: dto.wardId,
                addressDetail: dto.addressDetail.trim(),
            },
        });
        if (duplicate) {
            throw new common_1.BadRequestException('Địa chỉ này đã tồn tại trong sổ địa chỉ của bạn.');
        }
        const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);
        const hasAddresses = user.addresses && user.addresses.length > 0;
        const shouldBeDefault = dto.isDefault || !hasAddresses;
        if (shouldBeDefault) {
            await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
        }
        const newAddr = this.addressRepo.create({
            user,
            provinceId: dto.provinceId,
            wardId: dto.wardId,
            addressDetail: dto.addressDetail.trim(),
            // legacy compatibility
            province: provinceName,
            district: '',
            ward: wardName,
            detail: dto.addressDetail.trim(),
            receiverName: dto.receiverName || '',
            receiverPhone: dto.receiverPhone || '',
            label: dto.label || 'home',
            isDefault: shouldBeDefault,
        });
        return this.addressRepo.save(newAddr);
    }
    async patchAddress(userId, addressId, dto) {
        const address = await this.addressRepo.findOne({
            where: { id: addressId, user: { id: userId } },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        if (dto.isDefault === true) {
            await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
            address.isDefault = true;
        }
        let pId = dto.provinceId !== undefined ? dto.provinceId : address.provinceId;
        let wId = dto.wardId !== undefined ? dto.wardId : address.wardId;
        let detail = dto.addressDetail !== undefined ? dto.addressDetail.trim() : address.addressDetail;
        if (dto.provinceId !== undefined || dto.wardId !== undefined) {
            if (!pId || !wId) {
                throw new common_1.BadRequestException('Tỉnh và Xã không hợp lệ.');
            }
            const { provinceName, wardName } = this.locationService.validateAddress(pId, wId);
            address.provinceId = pId;
            address.wardId = wId;
            address.province = provinceName;
            address.ward = wardName;
            address.district = '';
        }
        if (dto.addressDetail !== undefined) {
            address.addressDetail = detail;
            address.detail = detail;
        }
        if (dto.receiverName !== undefined)
            address.receiverName = dto.receiverName;
        if (dto.receiverPhone !== undefined)
            address.receiverPhone = dto.receiverPhone;
        if (dto.label !== undefined)
            address.label = dto.label;
        if (address.provinceId && address.wardId && address.addressDetail) {
            const duplicate = await this.addressRepo.findOne({
                where: {
                    user: { id: userId },
                    provinceId: address.provinceId,
                    wardId: address.wardId,
                    addressDetail: address.addressDetail,
                },
            });
            if (duplicate && duplicate.id !== address.id) {
                throw new common_1.BadRequestException('Địa chỉ này đã tồn tại trong sổ địa chỉ của bạn.');
            }
        }
        return this.addressRepo.save(address);
    }
    async deleteAddress(userId, addressId) {
        const address = await this.addressRepo.findOne({
            where: { id: addressId, user: { id: userId } },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        const wasDefault = address.isDefault;
        await this.addressRepo.remove(address);
        if (wasDefault) {
            const nextAddress = await this.addressRepo.findOne({
                where: { user: { id: userId } },
                order: { id: 'ASC' },
            });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await this.addressRepo.save(nextAddress);
            }
        }
        return { success: true };
    }
    async setDefaultAddress(userId, addressId) {
        const address = await this.addressRepo.findOne({
            where: { id: addressId, user: { id: userId } },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
        address.isDefault = true;
        await this.addressRepo.save(address);
        return { success: true };
    }
    async listBanks(userId) {
        return this.bankRepo.find({
            where: {
                user: {
                    id: userId,
                },
            },
            order: {
                id: 'DESC',
            },
            select: ['id', 'bankName', 'accountName', 'accountNumber'],
        });
    }
    async addBank(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const bank = this.bankRepo.create({
            user: { id: userId },
            bankName: dto.bankName,
            accountName: dto.accountName,
            accountNumber: dto.accountNumber,
        });
        const saved = await this.bankRepo.save(bank);
        return {
            id: saved.id,
            bankName: saved.bankName,
            accountName: saved.accountName,
            accountNumber: saved.accountNumber,
        };
    }
    async changePassword(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        user.password = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepo.save(user);
        return {
            success: true,
        };
    }
    async setResetToken(email, token, expires) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException('No user found with this email');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await this.userRepo.save(user);
    }
    async findByResetToken(email, token) {
        return this.userRepo.findOne({
            where: { email, resetPasswordToken: token },
        });
    }
    async resetPassword(email, token, newPasswordHash) {
        const user = await this.userRepo.findOne({
            where: { email, resetPasswordToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or reset token');
        }
        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Reset token has expired');
        }
        user.password = newPasswordHash;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await this.userRepo.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_address_entity_1.UserAddress)),
    __param(2, (0, typeorm_1.InjectRepository)(user_bank_entity_1.UserBank)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        location_service_1.LocationService])
], UsersService);
