"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const products_module_1 = require("./products/products.module");
const categories_module_1 = require("./categories/categories.module");
const cart_module_1 = require("./cart/cart.module");
const order_module_1 = require("./order/order.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const payment_module_1 = require("./payment/payment.module");
const tracking_module_1 = require("./tracking/tracking.module");
const wishlist_module_1 = require("./wishlist/wishlist.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST') || 'localhost',
                    port: Number(config.get('DB_PORT')) || 5432,
                    username: config.get('DB_USERNAME') || 'postgres',
                    password: config.get('DB_PASSWORD') || '123456',
                    database: config.get('DB_NAME') || 'ecommerce',
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: true,
                }),
            }),
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            cart_module_1.CartModule,
            order_module_1.OrderModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            payment_module_1.PaymentModule,
            tracking_module_1.TrackingModule,
            wishlist_module_1.WishlistModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
