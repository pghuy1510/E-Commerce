import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { QrPayment } from './entities/qr-payment.entity';
import { PaymentLog } from './entities/payment-log.entity';
import { Order } from '../order/order.entity';
import { OrderStatusLog } from '../order/order-status-log.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { User } from '../users/entities/user.entity';
import { CouponModule } from '../coupons/coupon.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../common/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      QrPayment,
      PaymentLog,
      Order,
      OrderStatusLog,
      Cart,
      CartItem,
      User,
    ]),
    CouponModule,
    AuthModule,
    MailModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
