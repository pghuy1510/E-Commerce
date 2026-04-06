import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post('checkout')
  checkout(@Req() req: AuthenticatedRequest) {
    return this.service.checkout(req.user.id);
  }

  @Get('my')
  getMyOrders(@Req() req: AuthenticatedRequest) {
    return this.service.getMyOrders(req.user.id);
  }

  @Get(':id')
  getOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getOrderById(req.user.id, Number(id));
  }
}
