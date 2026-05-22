import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GenerateVietQrDto } from './dto/generate-vietqr.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { RegenerateQrDto } from './dto/regenerate-qr.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // tạo payment
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  // generate VietQR
  @Post('vietqr')
  generateVietQr(@Body() dto: GenerateVietQrDto) {
    return this.paymentService.generateVietQr(dto);
  }

  @Post('webhook')
  webhook(@Body() dto: PaymentWebhookDto) {
    return this.paymentService.handleWebhook(dto, dto as any);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: number) {
    return this.paymentService.getPaymentStatus(+id);
  }

  @Post(':id/regenerate-qr')
  regenerateQr(@Param('id') id: number, @Body() dto: RegenerateQrDto) {
    return this.paymentService.regenerateQr(+id, dto.machineId);
  }

  // success
  @Patch(':id/success')
  success(@Param('id') id: number) {
    return this.paymentService.success(+id);
  }

  // fail
  @Patch(':id/fail')
  fail(@Param('id') id: number) {
    return this.paymentService.fail(+id);
  }

  // lấy theo order
  @Get('order/:id')
  getByOrder(@Param('id') id: number) {
    return this.paymentService.getByOrder(+id);
  }
}
