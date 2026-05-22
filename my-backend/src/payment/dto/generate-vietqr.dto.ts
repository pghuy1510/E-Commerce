import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class GenerateVietQrDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @MaxLength(200)
  addInfo!: string;

  @IsString()
  @MaxLength(50)
  machineId!: string;
}
