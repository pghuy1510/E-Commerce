import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ProductsController } from './products/products.controller';
@Module({
  imports: [ProductsModule],
  controllers: [AppController, ProductsController],
  providers: [AppService],
})
export class AppModule {}
