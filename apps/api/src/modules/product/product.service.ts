import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from '../../common/utils/slug.util';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { ProductRepository } from './product.repository';

interface PaginatedProducts {
  data: ProductEntity[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storageService: StorageService,
  ) {}

  async findPublic(filters: ProductFiltersDto): Promise<PaginatedProducts> {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;

    const { items, total } = await this.productRepository.findPublic(filters);
    return {
      data: items.map((item) => this.toEntity(item)),
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  async findAdmin(filters: ProductFiltersDto): Promise<PaginatedProducts> {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;

    const { items, total } = await this.productRepository.findAdmin(filters);
    return {
      data: items.map((item) => this.toEntity(item)),
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  async findFeatured(): Promise<ProductEntity[]> {
    const products = await this.productRepository.findFeatured();
    return products.map((product) => this.toEntity(product));
  }

  async findBySlug(slug: string): Promise<ProductEntity> {
    const product = await this.productRepository.findPublicBySlug(slug);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return this.toEntity(product);
  }

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    await this.ensureCategoryExists(dto.category_id);
    const slug = await this.ensureUniqueSlug(dto.name);

    const product = await this.productRepository.create({
      category: { connect: { id: dto.category_id } },
      name: dto.name,
      slug,
      description: dto.description ?? null,
      priceInCents: dto.price_in_cents,
      isActive: dto.is_active ?? true,
      isFeatured: dto.is_featured ?? false,
      stock: dto.stock,
    });

    return this.toEntity(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (dto.category_id) {
      await this.ensureCategoryExists(dto.category_id);
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== existing.name) {
      slug = await this.ensureUniqueSlug(dto.name, id);
    }

    const product = await this.productRepository.update(id, {
      ...(dto.category_id ? { category: { connect: { id: dto.category_id } } } : {}),
      ...(dto.name ? { name: dto.name } : {}),
      ...(slug ? { slug } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.price_in_cents !== undefined ? { priceInCents: dto.price_in_cents } : {}),
      ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
      ...(dto.is_featured !== undefined ? { isFeatured: dto.is_featured } : {}),
      ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
    });

    return this.toEntity(product);
  }

  async softDelete(id: string): Promise<{ success: boolean }> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    const relatedOrderItems = await this.productRepository.countOrderItems(id);
    if (relatedOrderItems > 0) {
      throw new NotFoundException('Produto não pode ser desativado pois já possui pedidos');
    }

    await this.productRepository.softDelete(id);
    return { success: true };
  }

  async uploadImage(productId: string, file: Express.Multer.File): Promise<{ id: string; url: string; position: number }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }

    this.validateFile(file);

    const uploaded = await this.storageService.uploadProductImage(file);
    const position = (await this.productRepository.getNextImagePosition(productId)) + 1;
    const image = await this.productRepository.createImage({
      productId,
      url: uploaded.url,
      position,
    });

    return {
      id: image.id,
      url: image.url,
      position: image.position,
    };
  }

  async deleteImage(productId: string, imageId: string): Promise<{ success: boolean }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const image = await this.productRepository.findImageById(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Imagem não encontrada');
    }

    await this.storageService.deleteByUrl(image.url);
    await this.productRepository.deleteImage(imageId);
    return { success: true };
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.productRepository.findCategoryById(categoryId);
    if (!category) {
      throw new BadRequestException('Categoria inválida');
    }
  }

  private async ensureUniqueSlug(name: string, excludedId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;

    while (await this.productRepository.findBySlug(slug, excludedId)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    if (!slug) {
      throw new BadRequestException('Slug de produto inválido');
    }

    return slug;
  }

  private validateFile(file: Express.Multer.File): void {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException('Tipo de imagem inválido');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem excede o limite de 5MB');
    }
  }

  private toEntity(product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceInCents: number;
    isActive: boolean;
    isFeatured: boolean;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
    category: { id: string; name: string; slug: string };
    images: Array<{ id: string; url: string; position: number }>;
    variants: Array<{ id: string; name: string; stock: number; priceModifierInCents: number | null }>;
  }): ProductEntity {
    return {
      id: product.id,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      name: product.name,
      slug: product.slug,
      description: product.description,
      price_in_cents: product.priceInCents,
      is_active: product.isActive,
      is_featured: product.isFeatured,
      stock: product.stock,
      is_available: product.stock > 0,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        position: image.position,
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        stock: variant.stock,
        price_modifier_in_cents: variant.priceModifierInCents,
        is_available: variant.stock > 0,
      })),
    };
  }
}
