"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./order.entity");
const order_item_entity_1 = require("./order-item.entity");
const cart_service_1 = require("../cart/cart.service");
const products_entity_1 = require("../products/products.entity");
let OrderService = class OrderService {
    orderRepo;
    itemRepo;
    productRepo;
    cartService;
    constructor(orderRepo, itemRepo, productRepo, cartService) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.cartService = cartService;
    }
    async checkout(userId) {
        const cart = await this.cartService.getCart(userId);
        if (!cart.items.length) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        let total = 0;
        const orderItems = [];
        for (const item of cart.items) {
            const product = await this.productRepo.findOne({
                where: { id: item.product.id },
            });
            if (!product || product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Product ${item.product.name} is out of stock`);
            }
            // trừ kho
            product.stock -= item.quantity;
            await this.productRepo.save(product);
            const orderItem = this.itemRepo.create({
                productId: product.id,
                productName: product.name,
                price: item.price,
                quantity: item.quantity,
            });
            total += item.price * item.quantity;
            orderItems.push(orderItem);
        }
        const order = this.orderRepo.create({
            user: {
                id: Number(userId),
            },
            totalAmount: total,
            items: orderItems,
        });
        await this.orderRepo.save(order);
        // 🧹 clear cart
        cart.items = [];
        await this.cartService['cartRepo'].save(cart);
        return order;
    }
    // 📜 Lịch sử đơn
    async getMyOrders(userId) {
        return this.orderRepo.find({
            where: { user: { id: Number(userId) } },
            relations: ['items'],
            order: { id: 'DESC' },
        });
    }
    // 🔍 Chi tiết đơn
    async getOrderById(userId, orderId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: Number(userId) } },
            relations: ['items'],
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        return order;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cart_service_1.CartService])
], OrderService);
