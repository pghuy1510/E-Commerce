import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
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
  quantity: number;
}

interface RemoveFromCartBody {
  productId: number;
}

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    return this.service.getCart(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  addToCart(@Req() req: AuthenticatedRequest, @Body() body: AddToCartBody) {
    const { productId, quantity } = body;
    return this.service.addToCart(req.user.id, productId, quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  update(@Req() req: AuthenticatedRequest, @Body() body: AddToCartBody) {
    const { productId, quantity } = body;
    return this.service.updateQuantity(req.user.id, productId, quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  remove(@Req() req: AuthenticatedRequest, @Body() body: RemoveFromCartBody) {
    const { productId } = body;
    return this.service.removeItem(req.user.id, productId);
  }
}
