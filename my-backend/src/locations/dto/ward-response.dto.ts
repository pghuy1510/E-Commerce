import { ApiProperty } from '@nestjs/swagger';

export class WardResponseDto {
  @ApiProperty({ example: 1, description: 'ID Xã / Phường trong hệ thống' })
  id!: number;

  @ApiProperty({ example: '00001', description: 'Mã hành chính Xã / Phường' })
  code!: string;

  @ApiProperty({ example: 'Phường Hoàn Kiếm', description: 'Tên đầy đủ của Xã / Phường' })
  name!: string;
}
