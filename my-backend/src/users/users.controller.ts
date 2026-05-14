import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.updateProfile(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/address')
  getAddress(@Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.getAddress(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/address')
  updateAddress(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateAddressDto,
  ) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.updateAddress(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/banks')
  listBanks(@Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.listBanks(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/banks')
  addBank(@Req() req: AuthenticatedRequest, @Body() body: CreateBankDto) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.addBank(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    const userId = Number(req.user.id);
    if (!userId) {
      throw new BadRequestException('Invalid userId');
    }

    return this.usersService.changePassword(userId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
