import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  UseGuards,
  Query,
  Req,
  Headers,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GenerateVietQrDto } from './dto/generate-vietqr.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { RegenerateQrDto } from './dto/regenerate-qr.dto';
import { PaymentStatusQueryDto } from './dto/payment-status-query.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

// NOTE: SimpleRateLimiter is an in-memory rate-limiter suitable for development and demo/thesis projects.
// In a production environment, you should use a distributed rate-limiter like Redis-backed NestJS Throttler.
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private readonly limit: number, // max requests
    private readonly ttlMs: number, // time to live in milliseconds
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const recentTimestamps = timestamps.filter((ts) => now - ts < this.ttlMs);

    if (recentTimestamps.length >= this.limit) {
      return false;
    }

    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);
    return true;
  }
}

@Controller('payment')
export class PaymentController {
  private readonly regenerateLimiter = new SimpleRateLimiter(5, 60 * 1000); // max 5 requests per minute
  private readonly webhookLimiter = new SimpleRateLimiter(30, 60 * 1000);   // max 30 requests per minute

  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

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
  webhook(
    @Body() dto: PaymentWebhookDto,
    @Req() req: Request,
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-webhook-secret') secretHeader?: string,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const limitKey = `webhook-${clientIp}`;
    if (!this.webhookLimiter.isAllowed(limitKey)) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const webhookSecret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET') || 'webhook_secret_key_123';
    let isAuthorized = false;

    if (secretHeader && secretHeader === webhookSecret) {
      isAuthorized = true;
    } else if (signature) {
      const computedSignature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(dto)).digest('hex');
      if (signature === computedSignature) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new UnauthorizedException('Mã xác thực webhook không hợp lệ.');
    }

    return this.paymentService.handleWebhook(dto, dto as any);
  }

  @Get(':id/status')
  @UseGuards(OptionalJwtAuthGuard)
  getStatus(
    @Param('id') id: number,
    @Query() query: PaymentStatusQueryDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.paymentService.getPaymentStatus(+id, query.token, userId);
  }

  @Post(':id/regenerate-qr')
  @UseGuards(OptionalJwtAuthGuard)
  regenerateQr(
    @Param('id') id: number,
    @Body() dto: RegenerateQrDto,
    @Query() query: PaymentStatusQueryDto,
    @Req() req: any,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const limitKey = `regen-${id}-${clientIp}`;
    if (!this.regenerateLimiter.isAllowed(limitKey)) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const userId = req.user?.id;
    return this.paymentService.regenerateQr(+id, dto.machineId, query.token, userId);
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
