import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './products.entity';
import { Category } from '../categories/categories.entity';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ProductOption } from './entities/product-option.entity';
import { ProductVariant } from './entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Review, ProductOption, ProductVariant]),
  ],
  controllers: [ProductsController, ReviewsController],
  providers: [ProductsService, ReviewsService],
  exports: [ProductsService, ReviewsService],
})
export class ProductsModule {}

