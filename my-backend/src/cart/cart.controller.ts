import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.service.getCart(+userId);
  }

  @Post('add')
  addToCart(@Body() body) {
    const { userId, productId, quantity } = body;
    return this.service.addToCart(userId, productId, quantity);
  }

  @Post('update')
  update(@Body() body) {
    const { userId, productId, quantity } = body;
    return this.service.updateQuantity(userId, productId, quantity);
  }

  @Post('remove')
  remove(@Body() body) {
    const { userId, productId } = body;
    return this.service.removeItem(userId, productId);
  }
}
