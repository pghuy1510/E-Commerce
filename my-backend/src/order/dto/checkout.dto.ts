import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @IsString()
  @MaxLength(100)
  receiverName!: string;

  @IsString()
  @MaxLength(20)
  receiverPhone!: string;

  @IsNumber()
  provinceId!: number;

  @IsNumber()
  wardId!: number;

  @IsString()
  @MaxLength(200)
  addressDetail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  commune?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string;

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

export class GuestCartItemDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class GuestCheckoutDto {
  @IsString()
  @MaxLength(100)
  receiverName!: string;

  @IsString()
  @MaxLength(20)
  receiverPhone!: string;

  @IsNumber()
  provinceId!: number;

  @IsNumber()
  wardId!: number;

  @IsString()
  @MaxLength(200)
  addressDetail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  commune?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string;

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

  @IsString()
  guestEmail!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items!: GuestCartItemDto[];
}
