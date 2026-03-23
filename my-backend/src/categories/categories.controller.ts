import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';

type Category = {
  id: number;
  name: string;
};

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: Omit<Category, 'id'>) {
    return this.service.create(body);
  }
}
