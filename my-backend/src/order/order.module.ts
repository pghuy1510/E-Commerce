import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../products/products.entity';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupons/coupon.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User]),
    CartModule,
    CouponModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
