import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { ProvinceResponseDto } from './dto/province-response.dto';
import { WardResponseDto } from './dto/ward-response.dto';

@ApiTags('locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tất cả các Tỉnh / Thành phố Việt Nam' })
  @ApiOkResponse({
    description: 'Danh sách Tỉnh / Thành phố, được sắp xếp theo bảng chữ cái tiếng Việt.',
    type: ProvinceResponseDto,
    isArray: true,
  })
  getProvinces() {
    return this.locationService.getProvinces();
  }

  @Get('provinces/:id/wards')
  @ApiOperation({ summary: 'Lấy danh sách Xã / Phường theo ID Tỉnh / Thành phố' })
  @ApiParam({ name: 'id', type: 'integer', description: 'ID của Tỉnh / Thành phố' })
  @ApiOkResponse({
    description: 'Danh sách Xã / Phường thuộc Tỉnh / Thành phố tương ứng, sắp xếp theo tên.',
    type: WardResponseDto,
    isArray: true,
  })
  getWards(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.getWards(id);
  }
}
