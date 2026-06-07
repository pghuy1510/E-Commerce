import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';
import { CreateProductDto } from './dto/create-product.dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async findAll(query?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    sortBy?: string;
    limit?: number;
  }) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
      .leftJoin('reviews', 'r', 'r.product_id = product.id')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
      .addSelect('COALESCE(AVG(r.rating), 5.0)', 'avgRating')
      .groupBy('product.id')
      .addGroupBy('category.id');

    if (query?.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query?.category) {
      if (query.category.toLowerCase() === 'accessories') {
        qb.andWhere('LOWER(category.name) IN (:...catNames)', {
          catNames: ['accessories', 'mouse', 'keyboard'],
        });
      } else {
        qb.andWhere('LOWER(category.name) = LOWER(:category)', {
          category: query.category,
        });
      }
    }

    if (query?.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query?.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query?.inStock) {
      qb.andWhere('product.stock > 0');
    }

    if (query?.rating !== undefined) {
      qb.having('COALESCE(AVG(r.rating), 5.0) >= :rating', {
        rating: query.rating,
      });
    }

    // Sort order:
    // newest, price-asc, price-desc, best-selling, top-rated, trending, limited-edition
    if (query?.sortBy === 'price-asc') {
      qb.orderBy('product.price', 'ASC');
    } else if (query?.sortBy === 'price-desc') {
      qb.orderBy('product.price', 'DESC');
    } else if (query?.sortBy === 'best-selling') {
      qb.orderBy('"sold"', 'DESC');
    } else if (query?.sortBy === 'top-rated') {
      qb.orderBy('"avgRating"', 'DESC');
    } else if (query?.sortBy === 'trending') {
      qb.orderBy('"sold"', 'DESC')
        .addOrderBy('"avgRating"', 'DESC')
        .addOrderBy('product.id', 'DESC');
    } else if (query?.sortBy === 'limited-edition') {
      qb.andWhere('product.stock > 0')
        .andWhere('product.stock <= 20') // Low stock threshold for Limited Edition
        .orderBy('product.stock', 'ASC')
        .addOrderBy('product.id', 'DESC');
    } else {
      qb.orderBy('product.id', 'DESC');
    }

    if (query?.limit !== undefined) {
      qb.limit(query.limit);
    }

    const { raw, entities } = await qb.getRawAndEntities();

    return entities.map((product, index) => {
      const sold = Number(raw[index]?.sold ?? 0);
      const rating = Number(raw[index]?.avgRating ?? 5.0);
      return {
        ...product,
        sold,
        rating: Math.round(rating * 10) / 10,
      };
    });
  }

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepo.create({
      ...dto,
      category: { id: dto.categoryId },
    });

    return this.productRepo.save(product);
  }
  async update(id: number, dto: UpdateProductDto) {
    if (!dto) {
      throw new BadRequestException('No data provided');
    }

    const product = await this.productRepo.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    Object.assign(product, dto);

    if (dto.categoryId !== undefined) {
      product.category = { id: dto.categoryId } as Product['category'];
    }

    return this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.productRepo.remove(product);
  }

  async findByCategory(categoryName: string) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryName.toLowerCase() === 'accessories') {
      qb.where('LOWER(category.name) IN (:...names)', {
        names: ['accessories', 'mouse', 'keyboard'],
      });
    } else {
      qb.where('LOWER(category.name) = LOWER(:name)', {
        name: categoryName,
      });
    }

    return qb
      .orderBy('product.id', 'DESC') // mới nhất lên đầu
      .take(10) // limit 10 sp
      .getMany();
  }

  async getNewArrivals(limit = 12) {
    return this.productRepo.find({
      relations: ['category'],
      order: { id: 'DESC' },
      take: limit,
    });
  }

  async getTopSelling(limit = 10) {
    const { raw, entities } = await this.productRepo
      .createQueryBuilder('product')
      .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
      .leftJoinAndSelect('product.category', 'category')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
      .groupBy('product.id')
      .addGroupBy('category.id')
      .orderBy('sold', 'DESC')
      .limit(limit)
      .getRawAndEntities();

    return entities.map((product, index) => ({
      ...product,
      sold: Number(raw[index]?.sold ?? 0),
    }));
  }
}
