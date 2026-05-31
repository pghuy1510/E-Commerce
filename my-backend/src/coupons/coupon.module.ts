import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './coupon.entity';
import { UserCoupon } from './user-coupon.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { User } from '../users/entities/user.entity';
import { Order } from '../order/order.entity';
import { Cart } from '../cart/cart.entity';
import { WishlistItem } from '../wishlist/entities/wishlist.entity';
import { CategoryView } from '../tracking/entities/category-view.entity';
import { Product } from '../products/products.entity';
import { Category } from '../categories/categories.entity';
import { PromotionLog } from '../promotions/entities/promotion-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      UserCoupon,
      User,
      Order,
      Cart,
      WishlistItem,
      CategoryView,
      Product,
      Category,
      PromotionLog,
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
