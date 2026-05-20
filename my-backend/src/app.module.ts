import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';
import { TrackingModule } from './tracking/tracking.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ContactModule } from './contact/contact.module';
import { CouponModule } from './coupons/coupon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST') || 'localhost',
        port: Number(config.get('DB_PORT')) || 5432,
        username: config.get('DB_USERNAME') || 'postgres',
        password: config.get('DB_PASSWORD') || '123456',
        database: config.get('DB_NAME') || 'ecommerce',
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),

    ProductsModule,
    CategoriesModule,
    CartModule,
    OrderModule,
    AuthModule,
    UsersModule,
    PaymentModule,
    TrackingModule,
    WishlistModule,
    ContactModule,
    CouponModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
