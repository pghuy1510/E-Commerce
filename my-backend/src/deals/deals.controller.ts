import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('active')
  async getActiveDeal() {
    return this.dealsService.getActiveDeal();
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
    },
  ) {
    return this.dealsService.createDeal(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteDeal(@Param('id', ParseIntPipe) id: number) {
    return this.dealsService.deleteDeal(id);
  }
}
