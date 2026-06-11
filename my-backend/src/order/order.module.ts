import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderShippingAddress } from './order-shipping-address.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { OrderReturn } from './order-return.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../products/products.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupons/coupon.module';
import { User } from '../users/entities/user.entity';
import { PaymentModule } from '../payment/payment.module';
import { Payment } from '../payment/entities/payment.entity';
import { QrPayment } from '../payment/entities/qr-payment.entity';

import { LocationModule } from '../locations/location.module';
import { DealsModule } from '../deals/deals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderShippingAddress,
      OrderStatusLog,
      OrderReturn,
      Product,
      ProductVariant,
      User,
      Payment,
      QrPayment,
    ]),
    CartModule,
    CouponModule,
    PaymentModule,
    LocationModule,
    DealsModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}

