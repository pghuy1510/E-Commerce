import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { ProductsService } from '../products/products.service';
import { CreateProductDto } from '../products/dto/create-product.dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly productsService: ProductsService,
  ) {}

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

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.service.deleteOrder(Number(id));
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

  @Post('returns/:id/received')
  markReceived(@Param('id') id: string) {
    return this.service.markReceived(Number(id));
  }

  @Post('returns/:id/refund')
  startRefund(@Param('id') id: string) {
    return this.service.startRefund(Number(id));
  }

  @Post('returns/:id/complete')
  completeRefund(
    @Param('id') id: string,
    @Body() dto: { refundTransactionId: string; refundMethod: string },
  ) {
    return this.service.completeRefund(Number(id), dto);
  }

  // PRODUCT CRUD
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(Number(id), dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }

  // EXCEL IMPORT/EXPORT
  @Get('products/excel-template')
  getExcelTemplate(@Res() res: any) {
    return this.productsService.getExcelTemplate(res);
  }

  @Get('products/excel-export')
  exportExcel(@Res() res: any) {
    return this.productsService.exportProductsToExcel(res);
  }

  @Post('products/excel-import')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(
    @UploadedFile() file: any,
    @Query('mode') mode?: 'upsert' | 'create' | 'update',
    @Query('dryRun') dryRun?: string,
  ) {
    if (!file) {
      return {
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: 'Vui lòng chọn một file Excel.' }],
      };
    }
    return this.productsService.importProductsFromExcel(file.buffer, {
      mode: mode || 'upsert',
      dryRun: dryRun === 'true',
    });
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

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: {
      username?: string;
      email?: string;
      fullName?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    },
  ) {
    return this.service.updateUser(Number(id), dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.service.deleteUser(Number(id));
  }

  @Get('promotion-logs')
  getPromotionLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: 'coupon' | 'deal',
    @Query('action') action?: string,
  ) {
    return this.service.getPromotionLogs(
      Number(page || 1),
      Number(limit || 20),
      entityType,
      action,
    );
  }
}
