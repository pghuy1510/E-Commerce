import { ApiProperty } from '@nestjs/swagger';

export class ProvinceResponseDto {
  @ApiProperty({ example: 1, description: 'ID Tỉnh / Thành phố trong hệ thống' })
  id!: number;

  @ApiProperty({ example: '01', description: 'Mã hành chính Tỉnh / Thành phố' })
  code!: string;

  @ApiProperty({ example: 'Thành phố Hà Nội', description: 'Tên đầy đủ của Tỉnh / Thành phố' })
  name!: string;
}
