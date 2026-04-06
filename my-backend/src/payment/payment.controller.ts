import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // tạo payment
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
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
