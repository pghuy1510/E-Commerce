import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBehavior } from './entities/user-behavior.entity';
import { CategoryView } from './entities/category-view.entity';
import { Repository } from 'typeorm';
import { Product } from '../products/products.entity';
import { CreateBehaviorDto } from './dto/create-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(UserBehavior)
    private repo: Repository<UserBehavior>,

    @InjectRepository(CategoryView)
    private categoryViewRepo: Repository<CategoryView>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
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

    const saved = await this.repo.save(behavior);

    if (dto.product_id) {
      const product = await this.productRepo.findOne({
        where: { id: dto.product_id },
        relations: ['category'],
      });

      if (product?.category?.id) {
        const categoryView = this.categoryViewRepo.create({
          user_id: dto.user_id,
          category_id: product.category.id,
          weight: this.getWeight(dto.action),
        });
        await this.categoryViewRepo.save(categoryView);
      }
    }

    return saved;
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
