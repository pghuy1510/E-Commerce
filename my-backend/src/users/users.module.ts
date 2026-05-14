import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserProfile } from './entities/user-profile.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserBank } from './entities/user-bank.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserAddress, UserBank]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // QUAN TRỌNG để Auth dùng
})
export class UsersModule {}
