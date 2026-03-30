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
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req) {
    return this.service.getCart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  addToCart(@Req() req, @Body() body) {
    const { productId, quantity } = body;
    return this.service.addToCart(req.user.userId, productId, quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  update(@Req() req, @Body() body) {
    const { productId, quantity } = body;
    return this.service.updateQuantity(req.user.userId, productId, quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  remove(@Req() req, @Body() body) {
    const { productId } = body;
    return this.service.removeItem(req.user.userId, productId);
  }
}
