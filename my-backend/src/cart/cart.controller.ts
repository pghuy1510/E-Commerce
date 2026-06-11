import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

interface AddToCartBody {
  productId: number;
  variantId?: number;
  quantity?: number;
}

interface RemoveFromCartBody {
  productId: number;
  variantId?: number;
}

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  // 🛒 GET CART
  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.id);

    if (!userId) throw new BadRequestException('Invalid userId');

    return this.service.getCart(userId);
  }

  // ➕ ADD TO CART
  @UseGuards(JwtAuthGuard)
  @Post('add')
  addToCart(@Req() req: AuthenticatedRequest, @Body() body: AddToCartBody) {
    const userId = Number(req.user.id);
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      throw new BadRequestException('productId is required');
    }

    return this.service.addToCart(userId, productId, variantId, quantity);
  }

  // 🔄 UPDATE
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  update(@Req() req: AuthenticatedRequest, @Body() body: AddToCartBody) {
    const userId = Number(req.user.id);
    const { productId, variantId, quantity } = body;

    if (!productId || quantity === undefined) {
      throw new BadRequestException('productId & quantity required');
    }

    return this.service.updateQuantity(userId, productId, variantId, quantity);
  }

  // ❌ REMOVE
  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  remove(@Req() req: AuthenticatedRequest, @Body() body: RemoveFromCartBody) {
    const userId = Number(req.user.id);
    const { productId, variantId } = body;

    if (!productId) {
      throw new BadRequestException('productId is required');
    }

    return this.service.removeItem(userId, productId, variantId);
  }
}

