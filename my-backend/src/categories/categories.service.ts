import { Injectable } from '@nestjs/common';

type Category = {
  id: number;
  name: string;
};

@Injectable()
export class CategoriesService {
  private categories: Category[] = [];
  private idCounter = 1;

  findAll() {
    return this.categories;
  }

  create(category: Omit<Category, 'id'>) {
    const newCategory = {
      id: this.idCounter++,
      ...category,
    };
    this.categories.push(newCategory);
    return newCategory;
  }
}
