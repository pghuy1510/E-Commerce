"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const coupon_entity_1 = require("./coupon.entity");
const user_coupon_entity_1 = require("./user-coupon.entity");
const coupon_service_1 = require("./coupon.service");
const coupon_controller_1 = require("./coupon.controller");
const user_entity_1 = require("../users/entities/user.entity");
const order_entity_1 = require("../order/order.entity");
const cart_entity_1 = require("../cart/cart.entity");
const wishlist_entity_1 = require("../wishlist/entities/wishlist.entity");
const category_view_entity_1 = require("../tracking/entities/category-view.entity");
const products_entity_1 = require("../products/products.entity");
const categories_entity_1 = require("../categories/categories.entity");
const promotion_log_entity_1 = require("../promotions/entities/promotion-log.entity");
let CouponModule = class CouponModule {
};
exports.CouponModule = CouponModule;
exports.CouponModule = CouponModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                coupon_entity_1.Coupon,
                user_coupon_entity_1.UserCoupon,
                user_entity_1.User,
                order_entity_1.Order,
                cart_entity_1.Cart,
                wishlist_entity_1.WishlistItem,
                category_view_entity_1.CategoryView,
                products_entity_1.Product,
                categories_entity_1.Category,
                promotion_log_entity_1.PromotionLog,
            ]),
        ],
        controllers: [coupon_controller_1.CouponController],
        providers: [coupon_service_1.CouponService],
        exports: [coupon_service_1.CouponService],
    })
], CouponModule);
