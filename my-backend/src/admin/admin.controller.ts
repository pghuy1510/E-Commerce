import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('orders')
  getOrders() {
    return this.service.getOrders();
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: {
      status: string;
      trackingNumber?: string;
      estimatedDeliveryDate?: string;
      note?: string;
    },
  ) {
    return this.service.updateOrderStatus(Number(id), dto);
  }

  @Get('returns')
  getReturns() {
    return this.service.getReturns();
  }

  @Post('returns/:id/action')
  handleReturn(
    @Param('id') id: string,
    @Body() dto: {
      action: 'approve' | 'reject';
      note?: string;
    },
  ) {
    return this.service.handleReturn(Number(id), dto);
  }

  // PRODUCT CRUD
  @Post('products')
  createProduct(
    @Body() dto: {
      name: string;
      description: string;
      price: number;
      stock: number;
      image?: string;
      categoryId: number;
    },
  ) {
    return this.service.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      image?: string;
      categoryId?: number;
    },
  ) {
    return this.service.updateProduct(Number(id), dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.service.deleteProduct(Number(id));
  }

  @Get('users')
  getUsers() {
    return this.service.listUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: { role: string },
  ) {
    return this.service.updateUserRole(Number(id), dto.role);
  }

  @Patch('users/:id/ban')
  banUser(
    @Param('id') id: string,
    @Body() dto: { isActive: boolean },
  ) {
    return this.service.banUser(Number(id), dto.isActive);
  }

  @Get('users/:id/orders')
  getUserOrders(@Param('id') id: string) {
    return this.service.getUserOrders(Number(id));
  }
}
