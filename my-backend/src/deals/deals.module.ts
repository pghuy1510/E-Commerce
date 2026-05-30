import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from './entities/deal.entity';
import { DealProduct } from './entities/deal-product.entity';
import { Product } from '../products/products.entity';
import { Coupon } from '../coupons/coupon.entity';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      DealProduct,
      Product,
      Coupon,
    ]),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
