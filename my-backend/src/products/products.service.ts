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
}
