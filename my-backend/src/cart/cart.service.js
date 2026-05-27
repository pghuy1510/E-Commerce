'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.CartService = void 0;
const common_1 = require('@nestjs/common');
const typeorm_1 = require('@nestjs/typeorm');
const typeorm_2 = require('typeorm');
const cart_entity_1 = require('./cart.entity');
const cart_item_entity_1 = require('./cart-item.entity');
const products_entity_1 = require('../products/products.entity');
let CartService = class CartService {
  cartRepo;
  itemRepo;
  productRepo;
  constructor(cartRepo, itemRepo, productRepo) {
    this.cartRepo = cartRepo;
    this.itemRepo = itemRepo;
    this.productRepo = productRepo;
  }
  // 🛒 Lấy cart
  async getCart(userId) {
    const userIdNum = Number(userId);
    if (!Number.isFinite(userIdNum)) {
      throw new common_1.BadRequestException('Invalid userId');
    }
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userIdNum } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = this.cartRepo.create({ user: { id: userIdNum }, items: [] });
      await this.cartRepo.save(cart);
    }
    return cart;
  }
  // ➕ Thêm vào cart
  async addToCart(userId, productId, quantity) {
    const product = await this.productRepo.findOne({
      where: { id: Number(productId) },
    });
    if (!product) throw new common_1.BadRequestException('Product not found');
    if (product.stock < quantity)
      throw new common_1.BadRequestException('Not enough stock');
    const cart = await this.getCart(userId);
    let item = cart.items.find((i) => i.product.id === Number(productId));
    if (item) {
      item.quantity += quantity;
      if (product.stock < item.quantity) {
        throw new common_1.BadRequestException('Not enough stock');
      }
      await this.itemRepo.save(item);
    } else {
      item = this.itemRepo.create({
        cart: { id: cart.id },
        product: { id: product.id },
        quantity,
        price: product.price, // 🔥 QUAN TRỌNG
      });
      await this.itemRepo.save(item);
    }
    return this.getCart(userId);
  }
  // ❌ Xóa item
  async removeItem(userId, productId) {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) return null;
    await this.itemRepo.delete(item.id); // 🔥 FIX
    return this.getCart(userId);
  }
  // 🔄 Update quantity
  async updateQuantity(userId, productId, quantity) {
    if (quantity < 1) {
      throw new common_1.BadRequestException('Quantity must be >= 1');
    }
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) throw new common_1.BadRequestException('Item not found');
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product || product.stock < quantity) {
      throw new common_1.BadRequestException('Not enough stock');
    }
    item.quantity = quantity;
    await this.itemRepo.save(item);
    return this.getCart(userId);
  }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(2, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata('design:paramtypes', [
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
    ]),
  ],
  CartService,
);
