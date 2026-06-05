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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./cart.entity");
const cart_item_entity_1 = require("./cart-item.entity");
const products_entity_1 = require("../products/products.entity");
const user_entity_1 = require("../users/entities/user.entity");
const deals_service_1 = require("../deals/deals.service");
let CartService = class CartService {
    cartRepo;
    itemRepo;
    productRepo;
    userRepo;
    dealsService;
    constructor(cartRepo, itemRepo, productRepo, userRepo, dealsService) {
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
        this.dealsService = dealsService;
    }
    async loadCart(cartId) {
        return this.cartRepo.findOne({
            where: { id: cartId },
            relations: {
                items: {
                    product: {
                        category: true,
                    },
                },
            },
        });
    }
    // 🛒 Lấy cart
    async getCart(userId) {
        let cart = await this.cartRepo.findOne({
            where: {
                user: { id: userId },
            },
            relations: {
                items: {
                    product: {
                        category: true,
                    },
                },
            },
        });
        if (!cart) {
            const user = await this.userRepo.findOne({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const newCart = this.cartRepo.create({
                user,
            });
            const savedCart = await this.cartRepo.save(newCart);
            cart = await this.loadCart(savedCart.id);
        }
        if (!cart) {
            throw new common_1.BadRequestException('Cart not found');
        }
        if (!cart.items)
            cart.items = [];
        // Sync product prices with active deals
        for (const item of cart.items) {
            const dealPrice = await this.dealsService.getProductDealPrice(item.product.id);
            if (dealPrice !== null) {
                if (Number(item.price) !== dealPrice) {
                    item.price = dealPrice;
                    await this.itemRepo.save(item);
                }
            }
            else {
                if (Number(item.price) !== Number(item.product.price)) {
                    item.price = item.product.price;
                    await this.itemRepo.save(item);
                }
            }
        }
        return cart;
    }
    // ➕ Thêm vào cart
    async addToCart(userId, productId, quantity) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
        });
        if (!product)
            throw new common_1.BadRequestException('Product not found');
        if (product.stock < quantity) {
            throw new common_1.BadRequestException(`Sản phẩm này chỉ còn ${product.stock} sản phẩm trong kho.`);
        }
        const cart = await this.getCart(userId);
        let item = cart.items.find((i) => i.product.id === productId);
        if (item) {
            item.quantity += quantity;
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Sản phẩm này chỉ còn ${product.stock} sản phẩm trong kho. Bạn đang có ${item.quantity - quantity} sản phẩm trong giỏ.`);
            }
            // Re-sync price in case it's in a deal
            const dealPrice = await this.dealsService.getProductDealPrice(productId);
            item.price = dealPrice !== null ? dealPrice : product.price;
            await this.itemRepo.save(item);
        }
        else {
            const dealPrice = await this.dealsService.getProductDealPrice(productId);
            item = this.itemRepo.create({
                cart: { id: cart.id },
                product: { id: product.id },
                quantity,
                price: dealPrice !== null ? dealPrice : product.price,
            });
            await this.itemRepo.save(item);
        }
        return this.getCart(userId);
    }
    // ❌ Xóa item
    async removeItem(userId, productId) {
        const cart = await this.getCart(userId);
        const item = cart.items.find((i) => i.product.id === productId);
        if (!item)
            return null;
        await this.itemRepo.delete(item.id);
        return this.getCart(userId);
    }
    // 🔄 Update quantity
    async updateQuantity(userId, productId, quantity) {
        if (quantity < 1) {
            throw new common_1.BadRequestException('Quantity must be >= 1');
        }
        const cart = await this.getCart(userId);
        const item = cart.items.find((i) => i.product.id === productId);
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        const product = await this.productRepo.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.BadRequestException('Sản phẩm không tồn tại.');
        }
        if (product.stock < quantity) {
            throw new common_1.BadRequestException(`Sản phẩm này chỉ còn ${product.stock} sản phẩm trong kho.`);
        }
        item.quantity = quantity;
        await this.itemRepo.save(item);
        await this.cartRepo.save(cart);
        return this.getCart(userId);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(2, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        deals_service_1.DealsService])
], CartService);
