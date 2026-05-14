import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserBank } from './entities/user-bank.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,

    @InjectRepository(UserAddress)
    private addressRepo: Repository<UserAddress>,

    @InjectRepository(UserBank)
    private bankRepo: Repository<UserBank>,
  ) {}

  async findByUsername(username: string) {
    return this.userRepo.findOne({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
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
    return this.userRepo.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });

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
    const user = await this.userRepo.findOne({ where: { id } });

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
    });

    return this.userRepo.save(user);
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      username: user.username,
      email: user.email ?? null,
      fullName: user.profile?.fullName ?? '',
      phone: user.profile?.phone ?? '',
      gender: user.profile?.gender ?? 'male',
      dateOfBirth: user.profile?.dateOfBirth ?? null,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
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

    let profile = user.profile;
    if (!profile) {
      profile = this.profileRepo.create({ user });
    }

    if (dto.fullName !== undefined) {
      profile.fullName = dto.fullName || null;
    }

    if (dto.phone !== undefined) {
      profile.phone = dto.phone || null;
    }

    if (dto.gender !== undefined) {
      profile.gender = dto.gender || null;
    }

    if (dto.dateOfBirth !== undefined) {
      profile.dateOfBirth = dto.dateOfBirth || null;
    }

    await this.userRepo.save(user);
    await this.profileRepo.save(profile);

    return this.getProfile(userId);
  }

  async getAddress(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['address'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      province: user.address?.province ?? '',
      district: user.address?.district ?? '',
      ward: user.address?.ward ?? '',
      detail: user.address?.detail ?? '',
    };
  }

  async updateAddress(userId: number, dto: UpdateAddressDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['address'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let address = user.address;
    if (!address) {
      address = this.addressRepo.create({ user });
    }

    if (dto.province !== undefined) {
      address.province = dto.province || null;
    }

    if (dto.district !== undefined) {
      address.district = dto.district || null;
    }

    if (dto.ward !== undefined) {
      address.ward = dto.ward || null;
    }

    if (dto.detail !== undefined) {
      address.detail = dto.detail || null;
    }

    await this.addressRepo.save(address);

    return this.getAddress(userId);
  }

  async listBanks(userId: number) {
    return this.bankRepo.find({
      where: { user: { id: userId } },
      order: { id: 'DESC' },
      select: ['id', 'bankName', 'accountName', 'accountNumber'],
    });
  }

  async addBank(userId: number, dto: CreateBankDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

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
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepo.save(user);

    return { success: true };
  }
}
