import { IsOptional, IsString, Length } from 'class-validator';

export class PaymentStatusQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  token?: string;
}
