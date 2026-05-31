import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  imageProof?: string;
}
