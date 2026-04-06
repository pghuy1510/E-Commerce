import { PartialType } from '@nestjs/mapped-types';
import { CreateBehaviorDto } from './create-tracking.dto';

export class UpdateTrackingDto extends PartialType(CreateBehaviorDto) {}
