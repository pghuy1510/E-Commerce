import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateBehaviorDto } from './dto/create-tracking.dto';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // lưu hành vi
  @Post()
  track(@Body() dto: CreateBehaviorDto) {
    return this.trackingService.track(dto);
  }

  // lấy theo user
  @Get('user/:id')
  getUser(@Param('id') id: string) {
    return this.trackingService.getUser(+id);
  }

  // (optional) lấy theo product
  @Get('product/:id')
  getProduct(@Param('id') id: string) {
    return this.trackingService.getProductBehaviors(+id);
  }
}
