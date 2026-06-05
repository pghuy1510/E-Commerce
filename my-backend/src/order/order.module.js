"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const order_entity_1 = require("./order.entity");
const order_item_entity_1 = require("./order-item.entity");
const order_shipping_address_entity_1 = require("./order-shipping-address.entity");
const order_status_log_entity_1 = require("./order-status-log.entity");
const order_return_entity_1 = require("./order-return.entity");
const order_service_1 = require("./order.service");
const order_controller_1 = require("./order.controller");
const products_entity_1 = require("../products/products.entity");
const cart_module_1 = require("../cart/cart.module");
const coupon_module_1 = require("../coupons/coupon.module");
const user_entity_1 = require("../users/entities/user.entity");
const payment_module_1 = require("../payment/payment.module");
const payment_entity_1 = require("../payment/entities/payment.entity");
const qr_payment_entity_1 = require("../payment/entities/qr-payment.entity");
const location_module_1 = require("../locations/location.module");
const deals_module_1 = require("../deals/deals.module");
let OrderModule = class OrderModule {
};
exports.OrderModule = OrderModule;
exports.OrderModule = OrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                order_entity_1.Order,
                order_item_entity_1.OrderItem,
                order_shipping_address_entity_1.OrderShippingAddress,
                order_status_log_entity_1.OrderStatusLog,
                order_return_entity_1.OrderReturn,
                products_entity_1.Product,
                user_entity_1.User,
                payment_entity_1.Payment,
                qr_payment_entity_1.QrPayment,
            ]),
            cart_module_1.CartModule,
            coupon_module_1.CouponModule,
            payment_module_1.PaymentModule,
            location_module_1.LocationModule,
            deals_module_1.DealsModule,
        ],
        providers: [order_service_1.OrderService],
        controllers: [order_controller_1.OrderController],
    })
], OrderModule);
