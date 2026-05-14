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

  findAll() {
    return this.productRepo.find({
      relations: ['category'],
      order: { id: 'DESC' },
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
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('LOWER(category.name) = LOWER(:name)', {
        name: categoryName,
      })
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
