import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Province, Ward])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
