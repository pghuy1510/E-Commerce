import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      productId: number;
      orderId: number;
      rating: number;
      comment: string;
      images?: string[];
    },
  ) {
    return this.service.createReview(Number(req.user.id), dto);
  }

  @Get('product/:productId')
  getProductReviews(@Param('productId') productId: string) {
    return this.service.getProductReviews(Number(productId));
  }

  @Get('product/:productId/summary')
  getRatingSummary(@Param('productId') productId: string) {
    return this.service.getRatingSummary(Number(productId));
  }
}
