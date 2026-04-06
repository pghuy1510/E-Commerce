import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBehavior } from './entities/user-behavior.entity';
import { Repository } from 'typeorm';
import { CreateBehaviorDto } from './dto/create-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(UserBehavior)
    private repo: Repository<UserBehavior>,
  ) {}

  private getWeight(action: string): number {
    switch (action) {
      case 'view':
        return 1;
      case 'click':
        return 2;
      case 'add_to_cart':
        return 3;
      default:
        return 1;
    }
  }


  async track(dto: CreateBehaviorDto) {
    const behavior = this.repo.create({
      ...dto,
      weight: this.getWeight(dto.action),
    });

    return this.repo.save(behavior);
  }


  async getUser(userId: number) {
    return this.repo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }


  async getProductBehaviors(productId: number) {
    return this.repo.find({
      where: { product_id: productId },
      order: { created_at: 'DESC' },
    });
  }
}
