import { Injectable } from '@nestjs/common';

type Product = {
  id: number;
  name: string;
  price: number;
};

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private idCounter = 1;

  findAll() {
    return this.products;
  }

  findOne(id: number) {
    return this.products.find((p) => p.id === id);
  }

  create(product: Omit<Product, 'id'>) {
    const newProduct = {
      id: this.idCounter++,
      ...product,
    };
    this.products.push(newProduct);
    return newProduct;
  }
}
