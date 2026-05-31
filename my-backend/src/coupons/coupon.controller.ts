import { Controller, Get, Post, Patch, Delete, Body, Query, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';
import { CouponType, DiscountType } from './coupon.entity';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    username: string;
    role: string;
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

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAllCoupons() {
    return this.couponService.listAllCoupons();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.findOneCoupon(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  createCoupon(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      code: string;
      name?: string;
      type: CouponType;
      discountType: DiscountType;
      discountValue: number;
      minOrder?: number | null;
      maxDiscount?: number | null;
      categoryId?: number | null;
      startsAt?: string | null;
      expiresAt?: string | null;
      isActive?: boolean;
      reason?: string;
    },
  ) {
    return this.couponService.createCoupon(
      body,
      Number(req.user.id),
      req.user.username,
      req.ip,
      body.reason,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCoupon(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      code: string;
      name?: string;
      type: CouponType;
      discountType: DiscountType;
      discountValue: number;
      minOrder?: number | null;
      maxDiscount?: number | null;
      categoryId?: number | null;
      startsAt?: string | null;
      expiresAt?: string | null;
      isActive?: boolean;
      reason?: string;
    },
  ) {
    return this.couponService.updateCoupon(
      id,
      body,
      Number(req.user.id),
      req.user.username,
      req.ip,
      body.reason,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteCoupon(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    return this.couponService.deleteCoupon(
      id,
      Number(req.user.id),
      req.user.username,
      req.ip,
      body?.reason,
    );
  }
}
