import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  // Toggle
  @Post(':userId/:productId')
  toggle(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.toggle(Number(userId), Number(productId));
  }

  // Get wishlist
  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.service.get(Number(userId));
  }

  // Remove
  @Delete(':userId/:productId')
  remove(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.remove(Number(userId), Number(productId));
  }
}
