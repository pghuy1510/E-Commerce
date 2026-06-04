import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentWebhookDto {
  @IsNumber()
  @Type(() => Number)
  id!: number; // SePay transaction ID

  @IsString()
  gateway!: string;

  @IsString()
  transactionDate!: string;

  @IsString()
  accountNumber!: string;

  @IsString()
  @IsOptional()
  subAccount?: string;

  @IsString()
  @IsOptional()
  code?: string; // paymentCode

  @IsString()
  content!: string;

  @IsString()
  transferType!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  transferAmount!: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  accumulated?: number;

  @IsString()
  referenceCode!: string;
}
