import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WishlistItem } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private repo: Repository<WishlistItem>,
  ) {}

  // Toggle wishlist
  async toggle(userId: number, productId: number) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    if (existing) {
      await this.repo.delete(existing.id);
      return { message: 'Removed from wishlist' };
    }

    const item = this.repo.create({
      user: { id: userId },
      product: { id: productId },
    });

    await this.repo.save(item);

    return { message: 'Added to wishlist' };
  }

  // Get wishlist
  async get(userId: number) {
    return this.repo.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });
  }

  // Remove riêng
  async remove(userId: number, productId: number) {
    return this.repo.delete({
      user: { id: userId },
      product: { id: productId },
    });
  }
}
