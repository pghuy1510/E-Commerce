import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserBank } from './entities/user-bank.entity';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { formatVietnameseAddress, getCommuneName } from '../common/address';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserAddress)
    private addressRepo: Repository<UserAddress>,

    @InjectRepository(UserBank)
    private bankRepo: Repository<UserBank>,
  ) {}

  async findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto) {
    return this.createUser(
      createUserDto.username,
      createUserDto.password,
      createUserDto.email,
    );
  }

  async findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    return this.userRepo.findOne({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepo.remove(user);
  }

  async createUser(username: string, password: string, email?: string) {
    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      username,
      email,
      password: hashed,
      last_login: new Date(),
    });

    return this.userRepo.save(user);
  }

  async touchLastLogin(userId: number) {
    await this.userRepo.update(userId, {
      last_login: new Date(),
    });
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async getAddress(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultAddress = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

    const address = {
      province: defaultAddress?.province ?? '',
      commune: defaultAddress?.district ?? '',
      district: defaultAddress?.district ?? '',
      detail: defaultAddress?.detail ?? '',
    };

    return {
      ...address,
      formattedAddress: formatVietnameseAddress(address),
    };
  }

  async updateAddress(userId: number, dto: UpdateAddressDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let address = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

    if (!address) {
      address = this.addressRepo.create({
        user,
        isDefault: true,
      });
    }

    if (dto.province !== undefined) {
      address.province = dto.province;
    }

    if (dto.commune !== undefined || dto.district !== undefined) {
      address.district = getCommuneName(dto);
    }

    if (dto.ward !== undefined) {
      address.ward = '';
    }

    if (dto.detail !== undefined) {
      address.detail = dto.detail;
    }

    await this.addressRepo.save(address);

    return this.getAddress(userId);
  }

  async listAddresses(userId: number) {
    const addresses = await this.addressRepo.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', id: 'ASC' },
    });
    return addresses.map((addr) => ({
      ...addr,
      formattedAddress: formatVietnameseAddress({
        province: addr.province ?? '',
        commune: addr.district ?? '',
        district: addr.district ?? '',
        detail: addr.detail ?? '',
      }),
    }));
  }

  async addAddress(userId: number, dto: UpdateAddressDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAddresses = user.addresses && user.addresses.length > 0;
    const shouldBeDefault = dto.isDefault || !hasAddresses;

    if (shouldBeDefault) {
      await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
    }

    const newAddr = this.addressRepo.create({
      user,
      province: dto.province,
      district: getCommuneName(dto) || dto.district,
      ward: dto.ward || '',
      detail: dto.detail,
      receiverName: dto.receiverName || '',
      receiverPhone: dto.receiverPhone || '',
      label: dto.label || 'home',
      isDefault: shouldBeDefault,
    });

    return this.addressRepo.save(newAddr);
  }

  async patchAddress(userId: number, addressId: number, dto: UpdateAddressDto) {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault === true) {
      await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
      address.isDefault = true;
    }

    if (dto.province !== undefined) address.province = dto.province;
    if (dto.commune !== undefined || dto.district !== undefined) {
      address.district = getCommuneName(dto) || dto.district;
    }
    if (dto.ward !== undefined) address.ward = dto.ward;
    if (dto.detail !== undefined) address.detail = dto.detail;
    if (dto.receiverName !== undefined) address.receiverName = dto.receiverName;
    if (dto.receiverPhone !== undefined) address.receiverPhone = dto.receiverPhone;
    if (dto.label !== undefined) address.label = dto.label;

    return this.addressRepo.save(address);
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
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

  async setDefaultAddress(userId: number, addressId: number) {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepo.update({ user: { id: userId } }, { isDefault: false });
    address.isDefault = true;
    await this.addressRepo.save(address);

    return { success: true };
  }

  async listBanks(userId: number) {
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

  async addBank(userId: number, dto: CreateBankDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bank = this.bankRepo.create({
      user: { id: userId } as User,
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

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepo.save(user);

    return {
      success: true,
    };
  }

  async setResetToken(email: string, token: string, expires: Date) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await this.userRepo.save(user);
  }

  async findByResetToken(email: string, token: string) {
    return this.userRepo.findOne({
      where: { email, resetPasswordToken: token },
    });
  }

  async resetPassword(email: string, token: string, newPasswordHash: string) {
    const user = await this.userRepo.findOne({
      where: { email, resetPasswordToken: token },
    });
    if (!user) {
      throw new BadRequestException('Invalid email or reset token');
    }
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }
    user.password = newPasswordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepo.save(user);
  }
}
