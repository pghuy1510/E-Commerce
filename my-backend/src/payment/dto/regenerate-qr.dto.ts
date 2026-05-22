import { IsString, MaxLength } from 'class-validator';

export class RegenerateQrDto {
  @IsString()
  @MaxLength(50)
  machineId!: string;
}
