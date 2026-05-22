import { IsIn, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class PaymentWebhookDto {
  @IsNumber()
  @Min(1)
  paymentId!: number;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @MaxLength(200)
  addInfo!: string;

  @IsString()
  @MaxLength(100)
  providerTransactionId!: string;

  @IsIn(['paid', 'failed', 'expired', 'refunded'])
  status!: 'paid' | 'failed' | 'expired' | 'refunded';
}
