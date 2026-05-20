import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('my')
  getMyCoupons(@Req() req: AuthenticatedRequest) {
    return this.couponService.getUserCoupons(Number(req.user.id));
  }

  @Get('progress')
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
}
