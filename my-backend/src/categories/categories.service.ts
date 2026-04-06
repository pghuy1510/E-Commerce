import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.categoryRepo.find({
      relations: ['products'],
    });
  }

  async create(data: { name: string }) {
    const category = this.categoryRepo.create(data);
    return await this.categoryRepo.save(category);
  }

  async findOne(id: number) {
    return await this.categoryRepo.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  async remove(id: number) {
    return await this.categoryRepo.delete(id);
  }
}
