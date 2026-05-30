import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsNumber()
  provinceId?: number;

  @IsOptional()
  @IsNumber()
  wardId?: number;

  @IsOptional()
  @IsString()
  addressDetail?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
