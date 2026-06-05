"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const deal_entity_1 = require("./entities/deal.entity");
const deal_product_entity_1 = require("./entities/deal-product.entity");
const products_entity_1 = require("../products/products.entity");
const coupon_entity_1 = require("../coupons/coupon.entity");
const deals_service_1 = require("./deals.service");
const deals_controller_1 = require("./deals.controller");
const promotion_log_entity_1 = require("../promotions/entities/promotion-log.entity");
let DealsModule = class DealsModule {
};
exports.DealsModule = DealsModule;
exports.DealsModule = DealsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                deal_entity_1.Deal,
                deal_product_entity_1.DealProduct,
                products_entity_1.Product,
                coupon_entity_1.Coupon,
                promotion_log_entity_1.PromotionLog,
            ]),
        ],
        controllers: [deals_controller_1.DealsController],
        providers: [deals_service_1.DealsService],
        exports: [deals_service_1.DealsService],
    })
], DealsModule);
