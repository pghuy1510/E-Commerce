import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CheckoutDto {
  @IsString()
  @MaxLength(100)
  receiverName!: string;

  @IsString()
  @MaxLength(20)
  receiverPhone!: string;

  @IsString()
  @MaxLength(100)
  province!: string;

  @IsString()
  @MaxLength(100)
  district!: string;

  @IsString()
  @MaxLength(100)
  ward!: string;

  @IsString()
  @MaxLength(200)
  detail!: string;

  @IsIn(['qr', 'cod'])
  paymentMethod!: 'qr' | 'cod';

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  machineId?: string;
}
