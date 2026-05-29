import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyCoupons(@Req() req: AuthenticatedRequest) {
    return this.couponService.getUserCoupons(Number(req.user.id));
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  getProgress(
    @Req() req: AuthenticatedRequest,
    @Query('subtotal') subtotal?: string,
  ) {
    const value = Number(subtotal ?? 0);
    const safeSubtotal = Number.isFinite(value) ? value : 0;
    return this.couponService.getCheckoutProgress(
      Number(req.user.id),
      safeSubtotal,
    );
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validateCoupon(
    @Req() req: AuthenticatedRequest,
    @Body() body: { code: string; shippingFee?: number },
  ) {
    return this.couponService.validateCouponCode(
      Number(req.user.id),
      body.code,
      body.shippingFee ?? 0,
    );
  }

  @Post('validate-guest')
  validateGuestCoupon(
    @Body()
    body: {
      code: string;
      shippingFee?: number;
      items: { productId: number; quantity: number }[];
      subtotal: number;
    },
  ) {
    return this.couponService.validateCouponCodeForGuest(
      body.code,
      body.items ?? [],
      body.subtotal,
      body.shippingFee ?? 0,
    );
  }
}
