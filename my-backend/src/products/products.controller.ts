import { Controller, Get } from '@nestjs/common';

@Controller('api/products')
export class ProductsController {
  @Get()
  getProducts() {
    return [
      { id: 1, name: "Laptop" },
      { id: 2, name: "Phone" }
    ];
  }
}