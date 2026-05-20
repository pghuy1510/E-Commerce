import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { UserBehavior } from './entities/user-behavior.entity';
import { CategoryView } from './entities/category-view.entity';
import { Product } from '../products/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBehavior, CategoryView, Product])],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
