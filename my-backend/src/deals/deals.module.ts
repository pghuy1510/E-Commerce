import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from './entities/deal.entity';
import { DealProduct } from './entities/deal-product.entity';
import { Product } from '../products/products.entity';
import { Coupon } from '../coupons/coupon.entity';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { PromotionLog } from '../promotions/entities/promotion-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      DealProduct,
      Product,
      Coupon,
      PromotionLog,
    ]),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
