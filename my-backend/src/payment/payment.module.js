"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const qr_payment_entity_1 = require("./entities/qr-payment.entity");
const payment_log_entity_1 = require("./entities/payment-log.entity");
const order_entity_1 = require("../order/order.entity");
const order_status_log_entity_1 = require("../order/order-status-log.entity");
const cart_entity_1 = require("../cart/cart.entity");
const cart_item_entity_1 = require("../cart/cart-item.entity");
const user_entity_1 = require("../users/entities/user.entity");
const coupon_module_1 = require("../coupons/coupon.module");
const payment_service_1 = require("./payment.service");
const payment_controller_1 = require("./payment.controller");
const auth_module_1 = require("../auth/auth.module");
const mail_module_1 = require("../common/mail.module");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                payment_entity_1.Payment,
                qr_payment_entity_1.QrPayment,
                payment_log_entity_1.PaymentLog,
                order_entity_1.Order,
                order_status_log_entity_1.OrderStatusLog,
                cart_entity_1.Cart,
                cart_item_entity_1.CartItem,
                user_entity_1.User,
            ]),
            coupon_module_1.CouponModule,
            auth_module_1.AuthModule,
            mail_module_1.MailModule,
        ],
        controllers: [payment_controller_1.PaymentController],
        providers: [payment_service_1.PaymentService],
        exports: [payment_service_1.PaymentService],
    })
], PaymentModule);
