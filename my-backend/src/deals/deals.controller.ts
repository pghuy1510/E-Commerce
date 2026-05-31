import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    username: string;
    role: string;
  };
};

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('active')
  async getActiveDeal() {
    return this.dealsService.getActiveDeal();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOneDeal(@Param('id', ParseIntPipe) id: number) {
    return this.dealsService.findOneDeal(id);
  }

  @Get(':id/products')
  async getDealProducts(@Param('id', ParseIntPipe) id: number) {
    return this.dealsService.getDealProducts(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAllDeals() {
    return this.dealsService.listAllDeals();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createDeal(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      name: string;
      description?: string;
      startsAt: string;
      expiresAt: string;
      isActive?: boolean;
      featuredCouponIds?: number[];
      products: {
        productId: number;
        dealPrice: number;
        dealStock: number;
      }[];
      reason?: string;
    },
  ) {
    return this.dealsService.createDeal(
      dto,
      Number(req.user.id),
      req.user.username,
      req.ip,
      dto.reason,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateDeal(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      name: string;
      description?: string;
      startsAt: string;
      expiresAt: string;
      isActive?: boolean;
      featuredCouponIds?: number[];
      products: {
        productId: number;
        dealPrice: number;
        dealStock: number;
      }[];
      reason?: string;
    },
  ) {
    return this.dealsService.updateDeal(
      id,
      dto,
      Number(req.user.id),
      req.user.username,
      req.ip,
      dto.reason,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteDeal(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    return this.dealsService.deleteDeal(
      id,
      Number(req.user.id),
      req.user.username,
      req.ip,
      body?.reason,
    );
  }
}
