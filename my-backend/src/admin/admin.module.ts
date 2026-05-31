import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Product } from '../products/products.entity';
import { Order } from '../order/order.entity';
import { OrderReturn } from '../order/order-return.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/categories.entity';
import { PromotionLog } from '../promotions/entities/promotion-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order, OrderReturn, User, Category, PromotionLog]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
