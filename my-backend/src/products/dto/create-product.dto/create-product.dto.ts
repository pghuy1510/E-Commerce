import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsNumber()
  categoryId!: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  type?: 'simple' | 'variable';

  @IsString()
  @IsOptional()
  sku?: string;

  @IsOptional()
  options?: Array<{
    name: string;
    values: string[];
  }>;

  @IsOptional()
  variants?: Array<{
    sku?: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
    options: Record<string, string>;
    isActive?: boolean;
  }>;
}
