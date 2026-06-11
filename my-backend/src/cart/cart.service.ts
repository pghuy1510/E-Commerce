import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/products.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { DealsService } from '../deals/deals.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private itemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private readonly dealsService: DealsService,
  ) {}

  private async loadCart(cartId: number) {
    return this.cartRepo.findOne({
      where: { id: cartId },
      relations: {
        items: {
          product: {
            category: true,
          },
          variant: true,
        },
      },
    });
  }

  // 🛒 Lấy cart
  async getCart(userId: number) {
    let cart = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
      },
      relations: {
        items: {
          product: {
            category: true,
          },
          variant: true,
        },
      },
    });

    if (!cart) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newCart = this.cartRepo.create({
        user,
      });

      const savedCart = await this.cartRepo.save(newCart);
      cart = await this.loadCart(savedCart.id);
    }

    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (!cart.items) cart.items = [];

    // Sync product prices with active deals
    for (const item of cart.items) {
      const dealPrice = await this.dealsService.getProductDealPrice(item.product.id);
      if (dealPrice !== null) {
        if (Number(item.price) !== dealPrice) {
          item.price = dealPrice;
          await this.itemRepo.save(item);
        }
      } else {
        const standardPrice = item.variant ? item.variant.price : item.product.price;
        if (Number(item.price) !== Number(standardPrice)) {
          item.price = standardPrice;
          await this.itemRepo.save(item);
        }
      }
    }

    return cart;
  }

  // ➕ Thêm vào cart
  async addToCart(userId: number, productId: number, variantId: number | undefined, quantity: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) throw new BadRequestException('Product not found');

    let variant: ProductVariant | null = null;
    if (variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: variantId, productId },
      });
      if (!variant) throw new BadRequestException('Variant not found');
    } else if (product.type === 'variable') {
      throw new BadRequestException('Vui lòng chọn biến thể sản phẩm.');
    }

    const targetStock = variant ? variant.stock : product.stock;
    const targetReserved = variant ? variant.reservedStock : product.reservedStock;
    const availableStock = targetStock - (targetReserved || 0);

    if (availableStock < quantity) {
      throw new BadRequestException(`Sản phẩm này chỉ còn ${availableStock} sản phẩm trong kho.`);
    }

    const cart = await this.getCart(userId);

    // Match on both product and variant
    let item = cart.items.find((i) => {
      if (variantId) {
        return i.product.id === productId && i.variant?.id === variantId;
      }
      return i.product.id === productId && !i.variant;
    });

    if (item) {
      item.quantity += quantity;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm này chỉ còn ${availableStock} sản phẩm trong kho. Bạn đang có ${item.quantity - quantity} sản phẩm trong giỏ.`
        );
      }

      // Re-sync price in case it's in a deal
      const dealPrice = await this.dealsService.getProductDealPrice(productId);
      item.price = dealPrice !== null ? dealPrice : (variant ? variant.price : product.price);

      await this.itemRepo.save(item);
    } else {
      const dealPrice = await this.dealsService.getProductDealPrice(productId);
      item = this.itemRepo.create({
        cart: { id: cart.id },
        product: { id: product.id },
        variant: variant ? { id: variant.id } : undefined,
        quantity,
        price: dealPrice !== null ? dealPrice : (variant ? variant.price : product.price),
      });

      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  // ❌ Xóa item
  async removeItem(userId: number, productId: number, variantId?: number) {
    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => {
      if (variantId) {
        return i.product.id === productId && i.variant?.id === variantId;
      }
      return i.product.id === productId && !i.variant;
    });
    if (!item) return null;

    await this.itemRepo.delete(item.id);

    return this.getCart(userId);
  }

  // 🔄 Update quantity
  async updateQuantity(userId: number, productId: number, variantId: number | undefined, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be >= 1');
    }

    const cart = await this.getCart(userId);

    const item = cart.items.find((i) => {
      if (variantId) {
        return i.product.id === productId && i.variant?.id === variantId;
      }
      return i.product.id === productId && !i.variant;
    });
    if (!item) throw new BadRequestException('Item not found');

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException('Sản phẩm không tồn tại.');
    }

    let variant: ProductVariant | null = null;
    if (variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: variantId, productId },
      });
      if (!variant) throw new BadRequestException('Variant not found');
    }

    const targetStock = variant ? variant.stock : product.stock;
    const targetReserved = variant ? variant.reservedStock : product.reservedStock;
    const availableStock = targetStock - (targetReserved || 0);

    if (availableStock < quantity) {
      throw new BadRequestException(`Sản phẩm này chỉ còn ${availableStock} sản phẩm trong kho.`);
    }

    item.quantity = quantity;

    await this.itemRepo.save(item);

    return this.getCart(userId);
  }
}
