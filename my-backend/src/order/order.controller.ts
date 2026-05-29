import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto, GuestCheckoutDto } from './dto/checkout.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Req() req: AuthenticatedRequest, @Body() dto: CheckoutDto) {
    return this.service.checkout(req.user.id, dto);
  }

  @Post('checkout-guest')
  checkoutGuest(@Body() dto: GuestCheckoutDto) {
    return this.service.checkoutGuest(dto);
  }

  @Get('guest/:id')
  getGuestOrder(@Param('id') id: string, @Query('email') email: string) {
    return this.service.getGuestOrderById(Number(id), email);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Req() req: AuthenticatedRequest) {
    return this.service.getMyOrders(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getOrderById(req.user.id, Number(id));
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.service.cancelOrder(req.user.id, Number(id), body.reason);
  }

  @Post(':id/return')
  @UseGuards(JwtAuthGuard)
  requestReturn(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string; imageProof?: string }
  ) {
    return this.service.requestReturn(req.user.id, Number(id), body);
  }

  @Get(':id/return')
  @UseGuards(JwtAuthGuard)
  getReturnDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.service.getReturnDetails(req.user.id, Number(id));
  }

  @Post(':id/change-to-cod')
  @UseGuards(JwtAuthGuard)
  changeToCod(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.service.changePaymentMethodToCod(req.user.id, Number(id));
  }
}
