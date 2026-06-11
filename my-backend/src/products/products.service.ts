import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Product, ProductType } from './products.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/categories.entity';
import { CreateProductDto } from './dto/create-product.dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductOption)
    private optionRepo: Repository<ProductOption>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private dataSource: DataSource,
  ) {}
  
  // Find all code... (remains unchanged)


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

    const productIds = entities.map(p => p.id);
    const fullProductsMap = new Map<number, Product>();
    if (productIds.length > 0) {
      const fullProducts = await this.productRepo.find({
        where: { id: In(productIds) },
        relations: ['category', 'options', 'defaultVariant'],
      });
      fullProducts.forEach(p => fullProductsMap.set(p.id, p));
    }

    return entities.map((product, index) => {
      const sold = Number(raw[index]?.sold ?? 0);
      const rating = Number(raw[index]?.avgRating ?? 5.0);
      const fullProduct = fullProductsMap.get(product.id) || product;
      return {
        ...fullProduct,
        sold,
        rating: Math.round(rating * 10) / 10,
      };
    });
  }

  async recalculateParentInventory(productId: number, manager?: any) {
    const repo = manager ? manager.getRepository(Product) : this.productRepo;
    const variantRepo = manager ? manager.getRepository(ProductVariant) : this.variantRepo;

    const product = await repo.findOne({
      where: { id: productId },
    });

    if (!product) return;

    if (product.type === ProductType.VARIABLE) {
      const variants = await variantRepo.find({
        where: { productId },
      });

      const activeVariants = variants.filter((v) => v.isActive);

      const minPrice = activeVariants.length > 0
        ? Math.min(...activeVariants.map((v) => Number(v.price)))
        : Number(product.price) || 0;

      const maxPrice = activeVariants.length > 0
        ? Math.max(...activeVariants.map((v) => Number(v.price)))
        : Number(product.price) || 0;

      const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0);
      const totalReservedStock = activeVariants.reduce((sum, v) => sum + (v.reservedStock || 0), 0);

      product.price = minPrice;
      product.maxPrice = maxPrice;
      product.variantCount = activeVariants.length;
      product.stock = totalStock;
      product.reservedStock = totalReservedStock;
      await repo.save(product);
    } else {
      product.maxPrice = null;
      product.variantCount = 0;
      await repo.save(product);
    }
  }

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'options', 'variants', 'defaultVariant'],
    });
  }

  async create(dto: CreateProductDto) {
    const { options, variants, type, categoryId, ...productData } = dto;

    if (type === ProductType.VARIABLE && variants) {
      const seenOptions = new Set<string>();
      for (const v of variants) {
        const variantOptions = v.options || {};
        const sortedOptions = Object.keys(variantOptions)
          .sort()
          .reduce((acc, key) => {
            acc[key] = variantOptions[key];
            return acc;
          }, {});
        const optionHash = JSON.stringify(sortedOptions);
        if (seenOptions.has(optionHash)) {
          throw new BadRequestException(`Biến thể với cấu hình thuộc tính ${optionHash} đã bị lặp lại. Vui lòng kiểm tra lại.`);
        }
        seenOptions.add(optionHash);
      }
    }

    const category = await this.categoryRepo.findOneBy({ id: categoryId });
    if (!category) {
      throw new BadRequestException(`Danh mục với ID ${categoryId} không tồn tại.`);
    }

    const product = this.productRepo.create({
      ...productData,
      type: (type as ProductType) || ProductType.SIMPLE,
      category,
    });

    const savedProduct = await this.productRepo.save(product);

    if (type === ProductType.VARIABLE && options && variants) {
      // Create options
      const optionEntities = options.map((opt) =>
        this.optionRepo.create({
          name: opt.name,
          values: opt.values,
          productId: savedProduct.id,
        }),
      );
      await this.optionRepo.save(optionEntities);

      // Create variants
      const variantEntities = variants.map((v) =>
        this.variantRepo.create({
          sku: v.sku,
          name: v.name,
          price: v.price,
          stock: v.stock,
          image: v.image,
          options: v.options,
          isActive: v.isActive !== undefined ? v.isActive : true,
          productId: savedProduct.id,
        }),
      );
      const savedVariants = await this.variantRepo.save(variantEntities);

      // Set default variant if provided
      if (savedVariants.length > 0) {
        savedProduct.defaultVariant = savedVariants[0];
        await this.productRepo.save(savedProduct);
      }

      // Compute parent cache
      await this.recalculateParentInventory(savedProduct.id);
    }

    return this.findOne(savedProduct.id);
  }

  async update(id: number, dto: UpdateProductDto) {
    if (!dto) {
      throw new BadRequestException('No data provided');
    }

    const { options, variants, type, categoryId, ...productData } = dto;

    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['options', 'variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (type === ProductType.VARIABLE && variants) {
      const seenOptions = new Set<string>();
      for (const v of variants) {
        const variantOptions = v.options || {};
        const sortedOptions = Object.keys(variantOptions)
          .sort()
          .reduce((acc, key) => {
            acc[key] = variantOptions[key];
            return acc;
          }, {});
        const optionHash = JSON.stringify(sortedOptions);
        if (seenOptions.has(optionHash)) {
          throw new BadRequestException(`Biến thể với cấu hình thuộc tính ${optionHash} đã bị lặp lại. Vui lòng kiểm tra lại.`);
        }
        seenOptions.add(optionHash);
      }
    }

    Object.assign(product, productData);

    if (categoryId !== undefined) {
      const category = await this.categoryRepo.findOneBy({ id: categoryId });
      if (!category) {
        throw new BadRequestException(`Danh mục với ID ${categoryId} không tồn tại.`);
      }
      product.category = category;
    }

    if (type !== undefined) {
      product.type = type as ProductType;
    }

    let savedProduct = await this.productRepo.save(product);

    try {
      if (product.type === ProductType.VARIABLE) {
        if (options !== undefined) {
          // Hard delete old options then create new ones
          await this.optionRepo.delete({ productId: id });
          if (options.length > 0) {
            const optionEntities = options.map((opt) => {
              const entity = new ProductOption();
              entity.name = opt.name;
              entity.values = opt.values;
              entity.productId = id;
              return entity;
            });
            await this.optionRepo.save(optionEntities);
          }
        }

        if (variants !== undefined) {
          // Hard delete old variants then create new ones (avoids unique SKU conflict with soft-deleted rows)
          await this.variantRepo.delete({ productId: id });
          if (variants.length > 0) {
            const variantEntities = variants.map((v) => {
              const entity = new ProductVariant();
              entity.sku = v.sku;
              entity.name = v.name;
              entity.price = v.price;
              entity.stock = v.stock;
              entity.image = v.image;
              entity.options = v.options || {};
              entity.isActive = v.isActive !== undefined ? v.isActive : true;
              entity.productId = id;
              return entity;
            });
            const savedVariants = await this.variantRepo.save(variantEntities);

            // Update default variant
            if (savedVariants.length > 0) {
              await this.productRepo.update(id, { defaultVariant: { id: savedVariants[0].id } as any });
            }
          }

          // Compute parent cache
          await this.recalculateParentInventory(id);
        }
      } else {
        await this.optionRepo.delete({ productId: id });
        await this.variantRepo.delete({ productId: id });
        await this.productRepo.update(id, { defaultVariant: null as any });
      }
    } catch (err) {
      console.error('[ProductsService.update] Error in variable branch:', err);
      throw err;
    }

    return this.findOne(id);
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

    const entities = await qb
      .orderBy('product.id', 'DESC') // mới nhất lên đầu
      .take(10) // limit 10 sp
      .getMany();

    const productIds = entities.map(p => p.id);
    const fullProductsMap = new Map<number, Product>();
    if (productIds.length > 0) {
      const fullProducts = await this.productRepo.find({
        where: { id: In(productIds) },
        relations: ['category', 'options', 'defaultVariant'],
      });
      fullProducts.forEach(p => fullProductsMap.set(p.id, p));
    }

    return entities.map(p => fullProductsMap.get(p.id) || p);
  }

  async getNewArrivals(limit = 12) {
    return this.productRepo.find({
      relations: ['category', 'options', 'defaultVariant'],
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

    const productIds = entities.map(p => p.id);
    const fullProductsMap = new Map<number, Product>();
    if (productIds.length > 0) {
      const fullProducts = await this.productRepo.find({
        where: { id: In(productIds) },
        relations: ['category', 'options', 'defaultVariant'],
      });
      fullProducts.forEach(p => fullProductsMap.set(p.id, p));
    }

    return entities.map((product, index) => {
      const fullProduct = fullProductsMap.get(product.id) || product;
      return {
        ...fullProduct,
        sold: Number(raw[index]?.sold ?? 0),
      };
    });
  }

  getExcelTemplate(res: any) {
    const productsData = [
      {
        'Loại sản phẩm (Type)': 'simple',
        'ID sản phẩm (Product ID)': '',
        'Mã SKU (SKU)': 'BOOK-SIMPLE-001',
        'Mã SKU cha (Parent SKU)': '',
        'Tên sản phẩm (Name)': 'Sách Đắc Nhân Tâm (Bản Thường)',
        'Danh mục (Category)': 'Kỹ năng',
        'Tên thuộc tính (Option Name)': '',
        'Giá trị thuộc tính (Option Value)': '',
        'Giá bán (Price)': 79000,
        'Tồn kho (Stock)': 100,
        'Hình ảnh (Image URL)': 'https://picsum.photos/200/300',
        'Kích hoạt (Is Active)': 'true',
      },
      {
        'Loại sản phẩm (Type)': 'variable',
        'ID sản phẩm (Product ID)': '',
        'Mã SKU (SKU)': 'BOOK-VAR-002',
        'Mã SKU cha (Parent SKU)': '',
        'Tên sản phẩm (Name)': 'Sách Đắc Nhân Tâm (Bản Đặc Biệt)',
        'Danh mục (Category)': 'Kỹ năng',
        'Tên thuộc tính (Option Name)': 'Format, Language',
        'Giá trị thuộc tính (Option Value)': '',
        'Giá bán (Price)': '',
        'Tồn kho (Stock)': '',
        'Hình ảnh (Image URL)': 'https://picsum.photos/200/300',
        'Kích hoạt (Is Active)': 'true',
      },
      {
        'Loại sản phẩm (Type)': 'variant',
        'ID sản phẩm (Product ID)': '',
        'Mã SKU (SKU)': 'BOOK-VAR-002-HC-VI',
        'Mã SKU cha (Parent SKU)': 'BOOK-VAR-002',
        'Tên sản phẩm (Name)': 'Bìa Cứng / Tiếng Việt',
        'Danh mục (Category)': '',
        'Tên thuộc tính (Option Name)': '',
        'Giá trị thuộc tính (Option Value)': 'Bìa Cứng, Tiếng Việt',
        'Giá bán (Price)': 150000,
        'Tồn kho (Stock)': 30,
        'Hình ảnh (Image URL)': 'https://picsum.photos/200/300',
        'Kích hoạt (Is Active)': 'true',
      },
      {
        'Loại sản phẩm (Type)': 'variant',
        'ID sản phẩm (Product ID)': '',
        'Mã SKU (SKU)': 'BOOK-VAR-002-PB-VI',
        'Mã SKU cha (Parent SKU)': 'BOOK-VAR-002',
        'Tên sản phẩm (Name)': 'Bìa Mềm / Tiếng Việt',
        'Danh mục (Category)': '',
        'Tên thuộc tính (Option Name)': '',
        'Giá trị thuộc tính (Option Value)': 'Bìa Mềm, Tiếng Việt',
        'Giá bán (Price)': 95000,
        'Tồn kho (Stock)': 50,
        'Hình ảnh (Image URL)': 'https://picsum.photos/200/300',
        'Kích hoạt (Is Active)': 'true',
      },
    ];

    const instructionsData = [
      {
        'Cột (Column)': 'Loại sản phẩm (Type)',
        'Mô tả (Description)': 'Nhập "simple" (sản phẩm đơn), "variable" (sản phẩm cha có biến thể), hoặc "variant" (chi tiết biến thể).',
        'Bắt buộc (Required)': 'Có (Yes)',
      },
      {
         'Cột (Column)': 'ID sản phẩm (Product ID)',
         'Mô tả (Description)': 'Để trống khi tạo mới. Điền ID số nếu muốn cập nhật sản phẩm đã có (khi export).',
         'Bắt buộc (Required)': 'Không (No)',
      },
      {
        'Cột (Column)': 'Mã SKU (SKU)',
        'Mô tả (Description)': 'Mã định danh duy nhất cho sản phẩm đơn giản (simple) hoặc biến thể (variant). Sản phẩm cha (variable) cũng có thể có SKU để các biến thể liên kết tới.',
        'Bắt buộc (Required)': 'Có đối với simple/variant, Nên có đối với variable (Yes for simple/variant, Recommended for variable)',
      },
      {
        'Cột (Column)': 'Mã SKU cha (Parent SKU)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variant". Phải khớp với Mã SKU của dòng "variable" cha tương ứng.',
        'Bắt buộc (Required)': 'Có đối với variant (Yes for variant)',
      },
      {
        'Cột (Column)': 'Tên sản phẩm (Name)',
        'Mô tả (Description)': 'Tên hiển thị của sản phẩm hoặc biến thể.',
        'Bắt buộc (Required)': 'Có (Yes)',
      },
      {
        'Cột (Column)': 'Danh mục (Category)',
        'Mô tả (Description)': 'Tên danh mục sản phẩm (phải tồn tại trong hệ thống, không phân biệt chữ hoa thường).',
        'Bắt buộc (Required)': 'Có đối với simple/variable (Yes for simple/variable)',
      },
      {
        'Cột (Column)': 'Tên thuộc tính (Option Name)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variable". Liệt kê các thuộc tính cách nhau bằng dấu phẩy. Ví dụ: "Format, Language"',
        'Bắt buộc (Required)': 'Có đối với variable (Yes for variable)',
      },
      {
        'Cột (Column)': 'Giá trị thuộc tính (Option Value)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variant". Liệt kê các giá trị tương ứng theo thứ tự của thuộc tính cha, cách nhau bằng dấu phẩy. Ví dụ: "Bìa Cứng, Tiếng Việt"',
        'Bắt buộc (Required)': 'Có đối với variant (Yes for variant)',
      },
      {
        'Cột (Column)': 'Giá bán (Price)',
        'Mô tả (Description)': 'Giá bán bằng số (VND). Bỏ trống ở dòng variable (sẽ tự động tính giá thấp nhất của các biến thể).',
        'Bắt buộc (Required)': 'Có đối với simple/variant (Yes for simple/variant)',
      },
      {
        'Cột (Column)': 'Tồn kho (Stock)',
        'Mô tả (Description)': 'Số lượng tồn kho bằng số. Bỏ trống ở dòng variable (sẽ tự động cộng tổng tồn kho của các biến thể).',
        'Bắt buộc (Required)': 'Có đối với simple/variant (Yes for simple/variant)',
      },
      {
        'Cột (Column)': 'Hình ảnh (Image URL)',
        'Mô tả (Description)': 'Link hình ảnh sản phẩm (http://...) hoặc đường dẫn tương đối (/uploads/...)',
        'Bắt buộc (Required)': 'Không (No)',
      },
      {
        'Cột (Column)': 'Kích hoạt (Is Active)',
        'Mô tả (Description)': 'Nhập "true" hoặc "false" (Mặc định là true).',
        'Bắt buộc (Required)': 'Không (No)',
      },
    ];

    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(productsData);
    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');
    res.end(buffer);
  }

  async exportProductsToExcel(res: any) {
    const products = await this.productRepo.find({
      relations: ['category', 'options', 'variants'],
      order: { id: 'ASC' },
    });

    const productsData: any[] = [];

    for (const p of products) {
      if (p.type === ProductType.SIMPLE) {
        productsData.push({
          'Loại sản phẩm (Type)': 'simple',
          'ID sản phẩm (Product ID)': p.id,
          'Mã SKU (SKU)': p.sku || '',
          'Mã SKU cha (Parent SKU)': '',
          'Tên sản phẩm (Name)': p.name,
          'Danh mục (Category)': p.category?.name || '',
          'Tên thuộc tính (Option Name)': '',
          'Giá trị thuộc tính (Option Value)': '',
          'Giá bán (Price)': Number(p.price) || 0,
          'Tồn kho (Stock)': p.stock || 0,
          'Hình ảnh (Image URL)': p.image || '',
          'Kích hoạt (Is Active)': 'true',
        });
      } else if (p.type === ProductType.VARIABLE) {
        const optionNames = (p.options || []).map(o => o.name).join(', ');

        productsData.push({
          'Loại sản phẩm (Type)': 'variable',
          'ID sản phẩm (Product ID)': p.id,
          'Mã SKU (SKU)': p.sku || '',
          'Mã SKU cha (Parent SKU)': '',
          'Tên sản phẩm (Name)': p.name,
          'Danh mục (Category)': p.category?.name || '',
          'Tên thuộc tính (Option Name)': optionNames,
          'Giá trị thuộc tính (Option Value)': '',
          'Giá bán (Price)': '',
          'Tồn kho (Stock)': '',
          'Hình ảnh (Image URL)': p.image || '',
          'Kích hoạt (Is Active)': 'true',
        });

        const sortedVariants = (p.variants || []).sort((a, b) => a.id - b.id);
        for (const v of sortedVariants) {
          const parentOptionList = (p.options || []).map(o => o.name);
          const optionValues = parentOptionList.map(name => v.options?.[name] || '').join(', ');

          productsData.push({
            'Loại sản phẩm (Type)': 'variant',
            'ID sản phẩm (Product ID)': '',
            'Mã SKU (SKU)': v.sku || '',
            'Mã SKU cha (Parent SKU)': p.sku || '',
            'Tên sản phẩm (Name)': v.name,
            'Danh mục (Category)': '',
            'Tên thuộc tính (Option Name)': '',
            'Giá trị thuộc tính (Option Value)': optionValues,
            'Giá bán (Price)': Number(v.price) || 0,
            'Tồn kho (Stock)': v.stock || 0,
            'Hình ảnh (Image URL)': v.image || '',
            'Kích hoạt (Is Active)': v.isActive ? 'true' : 'false',
          });
        }
      }
    }

    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(productsData);

    const instructionsData = [
      {
        'Cột (Column)': 'Loại sản phẩm (Type)',
        'Mô tả (Description)': 'Nhập "simple" (sản phẩm đơn), "variable" (sản phẩm cha có biến thể), hoặc "variant" (chi tiết biến thể).',
        'Bắt buộc (Required)': 'Có (Yes)',
      },
      {
         'Cột (Column)': 'ID sản phẩm (Product ID)',
         'Mô tả (Description)': 'Để trống khi tạo mới. Điền ID số nếu muốn cập nhật sản phẩm đã có (khi export).',
         'Bắt buộc (Required)': 'Không (No)',
      },
      {
        'Cột (Column)': 'Mã SKU (SKU)',
        'Mô tả (Description)': 'Mã định danh duy nhất cho sản phẩm đơn giản (simple) hoặc biến thể (variant). Sản phẩm cha (variable) cũng có thể có SKU để các biến thể liên kết tới.',
        'Bắt buộc (Required)': 'Có đối với simple/variant, Nên có đối với variable (Yes for simple/variant, Recommended for variable)',
      },
      {
        'Cột (Column)': 'Mã SKU cha (Parent SKU)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variant". Phải khớp với Mã SKU của dòng "variable" cha tương ứng.',
        'Bắt buộc (Required)': 'Có đối với variant (Yes for variant)',
      },
      {
        'Cột (Column)': 'Tên sản phẩm (Name)',
        'Mô tả (Description)': 'Tên hiển thị của sản phẩm hoặc biến thể.',
        'Bắt buộc (Required)': 'Có (Yes)',
      },
      {
        'Cột (Column)': 'Danh mục (Category)',
        'Mô tả (Description)': 'Tên danh mục sản phẩm (phải tồn tại trong hệ thống, không phân biệt chữ hoa thường).',
        'Bắt buộc (Required)': 'Có đối với simple/variable (Yes for simple/variable)',
      },
      {
        'Cột (Column)': 'Tên thuộc tính (Option Name)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variable". Liệt kê các thuộc tính cách nhau bằng dấu phẩy. Ví dụ: "Format, Language"',
        'Bắt buộc (Required)': 'Có đối với variable (Yes for variable)',
      },
      {
        'Cột (Column)': 'Giá trị thuộc tính (Option Value)',
        'Mô tả (Description)': 'Chỉ điền cho dòng "variant". Liệt kê các giá trị tương ứng theo thứ tự của thuộc tính cha, cách nhau bằng dấu phẩy. Ví dụ: "Bìa Cứng, Tiếng Việt"',
        'Bắt buộc (Required)': 'Có đối với variant (Yes for variant)',
      },
      {
        'Cột (Column)': 'Giá bán (Price)',
        'Mô tả (Description)': 'Giá bán bằng số (VND). Bỏ trống ở dòng variable (sẽ tự động tính giá thấp nhất của các biến thể).',
        'Bắt buộc (Required)': 'Có đối với simple/variant (Yes for simple/variant)',
      },
      {
        'Cột (Column)': 'Tồn kho (Stock)',
        'Mô tả (Description)': 'Số lượng tồn kho bằng số. Bỏ trống ở dòng variable (sẽ tự động cộng tổng tồn kho của các biến thể).',
        'Bắt buộc (Required)': 'Có đối với simple/variant (Yes for simple/variant)',
      },
      {
        'Cột (Column)': 'Hình ảnh (Image URL)',
        'Mô tả (Description)': 'Link hình ảnh sản phẩm (http://...) hoặc đường dẫn tương đối (/uploads/...)',
        'Bắt buộc (Required)': 'Không (No)',
      },
      {
        'Cột (Column)': 'Kích hoạt (Is Active)',
        'Mô tả (Description)': 'Nhập "true" hoặc "false" (Mặc định là true).',
        'Bắt buộc (Required)': 'Không (No)',
      },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
    res.end(buffer);
  }

  async importProductsFromExcel(
    fileBuffer: Buffer,
    opts: { mode: 'upsert' | 'create' | 'update'; dryRun: boolean },
  ) {
    const mode = opts.mode || 'upsert';
    const dryRun = opts.dryRun === true;

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Products'] || workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      return {
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: 'Không tìm thấy sheet chứa dữ liệu sản phẩm.' }],
      };
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (rawRows.length <= 1) {
      return {
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: 'File Excel không có dữ liệu sản phẩm.' }],
      };
    }

    const headerRow = rawRows[0].map(c => String(c || '').toLowerCase().trim());
    
    const colIndex = {
      type: headerRow.findIndex(h => h.includes('type') || h.includes('loại')),
      id: headerRow.findIndex(h => (h.includes('id') || h === 'id') && !h.includes('parent') && !h.includes('cha')),
      sku: headerRow.findIndex(h => h.includes('sku') && !h.includes('parent') && !h.includes('cha')),
      parentSku: headerRow.findIndex(h => h.includes('parent') || h.includes('cha')),
      name: headerRow.findIndex(h => h.includes('name') || h.includes('tên')),
      category: headerRow.findIndex(h => h.includes('category') || h.includes('danh mục')),
      optionName: headerRow.findIndex(h => h.includes('option name') || h.includes('thuộc tính') || h.includes('tên thuộc tính')),
      optionValue: headerRow.findIndex(h => h.includes('option value') || h.includes('giá trị')),
      price: headerRow.findIndex(h => h.includes('price') || h.includes('giá bán') || h === 'giá'),
      stock: headerRow.findIndex(h => h.includes('stock') || h.includes('kho') || h.includes('tồn')),
      image: headerRow.findIndex(h => h.includes('image') || h.includes('ảnh') || h.includes('hình')),
      isActive: headerRow.findIndex(h => h.includes('active') || h.includes('kích hoạt') || h.includes('trạng thái')),
    };

    const validationErrors: Array<{ row: number; message: string }> = [];

    if (colIndex.type === -1 || colIndex.name === -1) {
      return {
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 1, message: 'Thiếu cột bắt buộc "Loại sản phẩm (Type)" hoặc "Tên sản phẩm (Name)" trong file Excel.' }],
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const categories = await manager.getRepository(Category).find();
      const categoryMap = new Map<string, Category>();
      for (const c of categories) {
        categoryMap.set(c.name.toLowerCase().trim(), c);
      }

      interface ParsedRow {
        rowIndex: number;
        type: string;
        id?: number;
        sku?: string;
        parentSku?: string;
        name: string;
        categoryName?: string;
        optionNames: string[];
        optionValueStr?: string;
        price?: number;
        stock?: number;
        image?: string;
        isActive: boolean;
      }

      const parsedRows: ParsedRow[] = [];
      const sheetSkus = new Set<string>();

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
          continue;
        }

        const type = String(row[colIndex.type] || '').trim().toLowerCase();
        const idStr = colIndex.id !== -1 ? String(row[colIndex.id] || '').trim() : '';
        const id = idStr ? Number(idStr) : undefined;
        const sku = colIndex.sku !== -1 ? String(row[colIndex.sku] || '').trim() : '';
        const parentSku = colIndex.parentSku !== -1 ? String(row[colIndex.parentSku] || '').trim() : '';
        const name = String(row[colIndex.name] || '').trim();
        const categoryName = colIndex.category !== -1 ? String(row[colIndex.category] || '').trim() : '';
        const optionNamesStr = colIndex.optionName !== -1 ? String(row[colIndex.optionName] || '').trim() : '';
        const optionValueStr = colIndex.optionValue !== -1 ? String(row[colIndex.optionValue] || '').trim() : '';
        const priceStr = colIndex.price !== -1 ? String(row[colIndex.price] || '').trim() : '';
        const stockStr = colIndex.stock !== -1 ? String(row[colIndex.stock] || '').trim() : '';
        const image = colIndex.image !== -1 ? String(row[colIndex.image] || '').trim() : undefined;
        const isActiveStr = colIndex.isActive !== -1 ? String(row[colIndex.isActive] || '').trim().toLowerCase() : '';
        const isActive = isActiveStr === 'false' ? false : true;

        const rowIndex = i + 1;

        if (!type) {
          validationErrors.push({ row: rowIndex, message: 'Dòng sản phẩm thiếu cột Loại sản phẩm (Type).' });
          continue;
        }

        if (type !== 'simple' && type !== 'variable' && type !== 'variant') {
          validationErrors.push({ row: rowIndex, message: `Loại sản phẩm "${type}" không hợp lệ. Phải là simple, variable hoặc variant.` });
          continue;
        }

        if (!name && type !== 'variant') {
          validationErrors.push({ row: rowIndex, message: 'Thiếu Tên sản phẩm.' });
          continue;
        }

        if (type !== 'variant' && categoryName) {
          const catKey = categoryName.toLowerCase().trim();
          if (!categoryMap.has(catKey)) {
            validationErrors.push({ row: rowIndex, message: `Danh mục "${categoryName}" không tồn tại.` });
            continue;
          }
        } else if (type !== 'variant' && !categoryName) {
          validationErrors.push({ row: rowIndex, message: 'Sản phẩm mới thiếu Danh mục.' });
          continue;
        }

        if (type === 'simple' || type === 'variant') {
          if (!sku && !id) {
            validationErrors.push({ row: rowIndex, message: `Sản phẩm loại "${type}" bắt buộc phải có SKU hoặc Product ID.` });
            continue;
          }
          if (sku) {
            if (sheetSkus.has(sku)) {
              validationErrors.push({ row: rowIndex, message: `Mã SKU "${sku}" bị trùng lặp trong file upload.` });
              continue;
            }
            sheetSkus.add(sku);
          }
        }

        if (type === 'variable' && sku) {
          if (sheetSkus.has(sku)) {
            validationErrors.push({ row: rowIndex, message: `Mã SKU "${sku}" bị trùng lặp trong file upload.` });
            continue;
          }
          sheetSkus.add(sku);
        }

        if (type === 'variant' && !parentSku) {
          validationErrors.push({ row: rowIndex, message: 'Biến thể (variant) bắt buộc phải có Mã SKU cha (Parent SKU) để liên kết.' });
          continue;
        }

        const price = priceStr ? parseFloat(priceStr) : undefined;
        const stock = stockStr ? parseInt(stockStr, 10) : undefined;

        if (type === 'simple' || type === 'variant') {
          if (price === undefined || isNaN(price) || price < 0) {
            validationErrors.push({ row: rowIndex, message: `Giá bán "${priceStr}" không hợp lệ.` });
            continue;
          }
          if (stock === undefined || isNaN(stock) || stock < 0) {
            validationErrors.push({ row: rowIndex, message: `Số lượng tồn kho "${stockStr}" không hợp lệ.` });
            continue;
          }
        }

        const optionNames = optionNamesStr ? optionNamesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        parsedRows.push({
          rowIndex,
          type,
          id,
          sku: sku || undefined,
          parentSku: parentSku || undefined,
          name,
          categoryName: categoryName || undefined,
          optionNames,
          optionValueStr: optionValueStr || undefined,
          price,
          stock,
          image,
          isActive,
        });
      }

      const parentSkuToOptionsMap = new Map<string, string[]>();
      const parentSkuToVariantCombinations = new Map<string, Set<string>>();

      for (const r of parsedRows) {
        if (r.type === 'variable' && r.sku) {
          parentSkuToOptionsMap.set(r.sku, r.optionNames);
          parentSkuToVariantCombinations.set(r.sku, new Set<string>());
        }
      }

      const parseOptionsHelper = (valStr: string, optNames: string[]): Record<string, string> => {
        const result: Record<string, string> = {};
        if (!valStr) return result;
        const parts = valStr.split(',').map(p => p.trim());
        const isKeyValue = parts.every(p => p.includes('='));
        if (isKeyValue) {
          for (const part of parts) {
            const [k, v] = part.split('=').map(x => x.trim());
            if (k && v) result[k] = v;
          }
        } else {
          for (let i = 0; i < optNames.length; i++) {
            const name = optNames[i];
            const val = parts[i] || '';
            if (name && val) result[name] = val;
          }
        }
        return result;
      };

      for (const r of parsedRows) {
        if (r.type === 'variant' && r.parentSku) {
          let optionNames = parentSkuToOptionsMap.get(r.parentSku);
          
          if (!optionNames) {
            const parentProduct = await manager.getRepository(Product).findOne({
              where: { sku: r.parentSku },
              relations: ['options'],
            });
            if (!parentProduct) {
              validationErrors.push({
                row: r.rowIndex,
                message: `Mã SKU cha "${r.parentSku}" không khớp với bất kỳ sản phẩm cha nào trong file hoặc cơ sở dữ liệu.`,
              });
              continue;
            }
            optionNames = (parentProduct.options || []).map(o => o.name);
            parentSkuToOptionsMap.set(r.parentSku, optionNames);
            
            const existingVariants = await manager.getRepository(ProductVariant).find({
              where: { productId: parentProduct.id },
            });
            const existingComboSet = new Set<string>();
            for (const ev of existingVariants) {
              const sortedOptions = Object.keys(ev.options)
                .sort()
                .reduce((acc, key) => {
                  acc[key] = ev.options[key];
                  return acc;
                }, {});
              existingComboSet.add(JSON.stringify(sortedOptions));
            }
            parentSkuToVariantCombinations.set(r.parentSku, existingComboSet);
          }

          if (optionNames.length === 0) {
            validationErrors.push({
              row: r.rowIndex,
              message: `Sản phẩm cha "${r.parentSku}" chưa định nghĩa thuộc tính (Option Name).`,
            });
            continue;
          }

          if (!r.optionValueStr) {
            validationErrors.push({
              row: r.rowIndex,
              message: 'Biến thể thiếu cột Giá trị thuộc tính (Option Value).',
            });
            continue;
          }

          const variantOptions = parseOptionsHelper(r.optionValueStr, optionNames);
          
          const missingOptions = optionNames.filter(name => !variantOptions[name]);
          if (missingOptions.length > 0) {
            validationErrors.push({
              row: r.rowIndex,
              message: `Thiếu giá trị cho các thuộc tính: ${missingOptions.join(', ')}.`,
            });
            continue;
          }

          const sortedOptions = Object.keys(variantOptions)
            .sort()
            .reduce((acc, key) => {
              acc[key] = variantOptions[key];
              return acc;
            }, {});
          const comboHash = JSON.stringify(sortedOptions);
          
          let comboSet = parentSkuToVariantCombinations.get(r.parentSku);
          if (!comboSet) {
            comboSet = new Set<string>();
            parentSkuToVariantCombinations.set(r.parentSku, comboSet);
          }

          if (comboSet.has(comboHash)) {
            validationErrors.push({
              row: r.rowIndex,
              message: `Cấu hình thuộc tính trùng lặp cho biến thể của sản phẩm này (${r.optionValueStr}).`,
            });
            continue;
          }
          comboSet.add(comboHash);
        }
      }

      if (validationErrors.length > 0) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          created: 0,
          updated: 0,
          errors: validationErrors,
        };
      }

      let createdCount = 0;
      let updatedCount = 0;
      
      const skuToProductMap = new Map<string, Product>();
      const productsToRecalculate = new Set<number>();

      for (const r of parsedRows) {
        if (r.type === 'simple' || r.type === 'variable') {
          const category = categoryMap.get(r.categoryName!.toLowerCase().trim())!;
          
          let product: Product | null = null;

          if (r.id) {
            product = await manager.getRepository(Product).findOne({
              where: { id: r.id },
              relations: ['options', 'variants'],
            });
            if (!product && mode === 'update') {
              validationErrors.push({ row: r.rowIndex, message: `Không tìm thấy sản phẩm có ID ${r.id} để cập nhật.` });
              continue;
            }
          }

          if (!product && r.sku) {
            product = await manager.getRepository(Product).findOne({
              where: { sku: r.sku },
              relations: ['options', 'variants'],
            });
            if (product && mode === 'create') {
              validationErrors.push({ row: r.rowIndex, message: `Sản phẩm với SKU "${r.sku}" đã tồn tại. Không thể tạo mới.` });
              continue;
            }
          }

          if (!product) {
            if (mode === 'update') {
              validationErrors.push({ row: r.rowIndex, message: `Không tìm thấy sản phẩm để cập nhật (SKU "${r.sku}" hoặc ID không khớp).` });
              continue;
            }

            product = manager.getRepository(Product).create({
              type: r.type as ProductType,
              sku: r.sku,
              name: r.name,
              description: r.name,
              price: r.price || 0,
              stock: r.stock || 0,
              image: r.image,
              category,
            });
            createdCount++;
          } else {
            if (mode === 'create') {
              validationErrors.push({ row: r.rowIndex, message: `Sản phẩm đã tồn tại. Không thể tạo mới.` });
              continue;
            }

            product.name = r.name;
            product.category = category;
            if (r.image !== undefined) product.image = r.image;
            if (r.price !== undefined) product.price = r.price;
            if (r.stock !== undefined) product.stock = r.stock;
            product.type = r.type as ProductType;
            updatedCount++;
          }

          const savedProduct = await manager.getRepository(Product).save(product);
          if (r.sku) {
            skuToProductMap.set(r.sku, savedProduct);
          }

          if (r.type === 'variable') {
            await manager.getRepository(ProductOption).softDelete({ productId: savedProduct.id });
            
            const optionEntities = r.optionNames.map(optName =>
              manager.getRepository(ProductOption).create({
                name: optName,
                values: [],
                productId: savedProduct.id,
              })
            );
            await manager.getRepository(ProductOption).save(optionEntities);
          } else {
            await manager.getRepository(ProductOption).softDelete({ productId: savedProduct.id });
            await manager.getRepository(ProductVariant).softDelete({ productId: savedProduct.id });
            savedProduct.defaultVariant = null;
            await manager.getRepository(Product).save(savedProduct);
          }
        }
      }

      for (const r of parsedRows) {
        if (r.type === 'variant' && r.parentSku) {
          let parentProduct: Product | null | undefined = skuToProductMap.get(r.parentSku);
          if (!parentProduct) {
            parentProduct = await manager.getRepository(Product).findOne({
              where: { sku: r.parentSku },
              relations: ['options'],
            });
          }

          if (!parentProduct) {
            validationErrors.push({ row: r.rowIndex, message: `Không tìm thấy sản phẩm cha SKU "${r.parentSku}" cho biến thể.` });
            continue;
          }

          const optionNames = parentSkuToOptionsMap.get(r.parentSku) || [];
          const variantOptions = parseOptionsHelper(r.optionValueStr!, optionNames);

          for (const optName of Object.keys(variantOptions)) {
            const optVal = variantOptions[optName];
            const optionEntity = await manager.getRepository(ProductOption).findOne({
              where: { productId: parentProduct.id, name: optName },
            });
            if (optionEntity) {
               if (!optionEntity.values.includes(optVal)) {
                 optionEntity.values = [...optionEntity.values, optVal];
                 await manager.getRepository(ProductOption).save(optionEntity);
               }
            }
          }

          let variant = await manager.getRepository(ProductVariant).findOne({
            where: { sku: r.sku },
          });

          if (variant) {
            if (mode === 'create') {
              validationErrors.push({ row: r.rowIndex, message: `Biến thể với SKU "${r.sku}" đã tồn tại. Không thể tạo mới.` });
              continue;
            }
            if (variant.productId !== parentProduct.id) {
              validationErrors.push({
                row: r.rowIndex,
                message: `Mã SKU "${r.sku}" thuộc về sản phẩm cha khác. Không thể gán sang sản phẩm này.`,
              });
              continue;
            }

            variant.name = r.name || Object.values(variantOptions).join(' / ');
            variant.price = r.price || 0;
            variant.stock = r.stock || 0;
            if (r.image !== undefined) variant.image = r.image;
            variant.options = variantOptions;
            variant.isActive = r.isActive;
            await manager.getRepository(ProductVariant).save(variant);
            updatedCount++;
          } else {
            if (mode === 'update') {
              validationErrors.push({ row: r.rowIndex, message: `Không tìm thấy biến thể SKU "${r.sku}" để cập nhật.` });
              continue;
            }

            variant = manager.getRepository(ProductVariant).create({
              sku: r.sku,
              name: r.name || Object.values(variantOptions).join(' / '),
              price: r.price || 0,
              stock: r.stock || 0,
              image: r.image,
              options: variantOptions,
              isActive: r.isActive,
              productId: parentProduct.id,
            });
            const savedVariant = await manager.getRepository(ProductVariant).save(variant);
            
            if (!parentProduct.defaultVariant) {
              parentProduct.defaultVariant = savedVariant;
              await manager.getRepository(Product).save(parentProduct);
            }
            createdCount++;
          }

          productsToRecalculate.add(parentProduct.id);
        }
      }

      if (validationErrors.length > 0) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          created: 0,
          updated: 0,
          errors: validationErrors,
        };
      }

      for (const productId of productsToRecalculate) {
        await this.recalculateParentInventory(productId, manager);
      }

      if (dryRun) {
        await queryRunner.rollbackTransaction();
      } else {
        await queryRunner.commitTransaction();
      }

      return {
        success: true,
        created: createdCount,
        updated: updatedCount,
        errors: [],
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: `Lỗi hệ thống trong quá trình import: ${err.message}` }],
      };
    } finally {
      await queryRunner.release();
    }
  }
}

