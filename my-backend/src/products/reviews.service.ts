import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from './products.entity';
import { Order } from '../order/order.entity';
import { OrderItem } from '../order/order-item.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,

    private dataSource: DataSource,
  ) {}

  async createReview(
    userId: number,
    dto: {
      productId: number;
      orderId: number;
      rating: number;
      comment: string;
      images?: string[];
    },
  ) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Verify if order exists and is owned by the user and is delivered
    const orderRepo = this.dataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: dto.orderId, user: { id: userId } },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found or not owned by you');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException('You can only review products from delivered orders');
    }

    // Verify product was in this order
    const hasProduct = order.items.some((item) => item.productId === dto.productId);
    if (!hasProduct) {
      throw new BadRequestException('This product was not part of the specified order');
    }

    // Verify user hasn't already reviewed this product for this order
    const existing = await this.reviewRepo.findOne({
      where: {
        product: { id: dto.productId },
        user: { id: userId },
        order: { id: dto.orderId },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already left a review for this product in this order');
    }

    // Create the review
    const review = this.reviewRepo.create({
      rating: dto.rating,
      comment: dto.comment,
      images: dto.images ?? [],
      isVerifiedPurchase: true,
      user: { id: userId } as any,
      product: { id: dto.productId } as Product,
      order: { id: dto.orderId } as Order,
    });

    return this.reviewRepo.save(review);
  }

  async getProductReviews(productId: number) {
    const list = await this.reviewRepo.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { id: 'DESC' },
    });

    // Strip sensitive fields
    return list.map((rev) => ({
      id: rev.id,
      rating: rev.rating,
      comment: rev.comment,
      images: rev.images,
      isVerifiedPurchase: rev.isVerifiedPurchase,
      createdAt: rev.createdAt,
      user: {
        id: rev.user.id,
        username: rev.user.username,
        fullName: rev.user.fullName || rev.user.username,
      },
    }));
  }

  async getRatingSummary(productId: number) {
    const reviews = await this.reviewRepo.find({
      where: { product: { id: productId } },
    });

    const count = reviews.length;
    if (count === 0) {
      return {
        average: 5, // Default rating is 5 stars
        count: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      };
    }

    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const average = Math.round((sum / count) * 10) / 10;

    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach((rev) => {
      const key = rev.rating.toString() as '1' | '2' | '3' | '4' | '5';
      if (distribution[key] !== undefined) {
        distribution[key] += 1;
      }
    });

    return {
      average,
      count,
      distribution,
    };
  }
}
