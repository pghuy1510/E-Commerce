import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { UserBehavior } from './entities/user-behavior.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBehavior])],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
