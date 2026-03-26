import { Controller, Post, Param } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout/:userId')
  checkout(@Param('userId') userId: number) {
    return this.orderService.checkout(+userId);
  }
}
