import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post('checkout')
  checkout(@Req() req) {
    return this.service.checkout(req.user.id);
  }

  @Get('my')
  getMyOrders(@Req() req) {
    return this.service.getMyOrders(req.user.id);
  }

  @Get(':id')
  getOrder(@Req() req, @Param('id') id: string) {
    return this.service.getOrderById(req.user.id, Number(id));
  }
}
