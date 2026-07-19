import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductFiltersDto } from './dto/product-filters.dto';

const PRODUCT_INCLUDE = {
  category: true,
  images: {
    orderBy: { position: 'asc' },
  },
  variants: {
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(filters: ProductFiltersDto): Promise<{ items: ProductWithRelations[]; total: number }> {
    const where = this.buildPublicWhere(filters);
    const { skip, take } = this.pagination(filters);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip,
        take,
        orderBy: this.buildOrderBy(filters),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findAdmin(filters: ProductFiltersDto): Promise<{ items: ProductWithRelations[]; total: number }> {
    const where = this.buildAdminWhere(filters);
    const { skip, take } = this.pagination(filters);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip,
        take,
        orderBy: this.buildOrderBy(filters),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  findFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true,
        category: { isActive: true },
      },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        isActive: true,
        category: { isActive: true },
      },
      include: PRODUCT_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }

  findBySlug(slug: string, excludedId?: string) {
    return this.prisma.product.findFirst({
      where: {
        slug,
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
    });
  }

  findCategoryById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  countOrderItems(productId: string) {
    return this.prisma.orderItem.count({
      where: { productId },
    });
  }

  softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      include: PRODUCT_INCLUDE,
    });
  }

  getNextImagePosition(productId: string) {
    return this.prisma.productImage.count({
      where: { productId },
    });
  }

  createImage(data: { productId: string; url: string; position: number }) {
    return this.prisma.productImage.create({
      data,
    });
  }

  findImageById(imageId: string) {
    return this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
  }

  deleteImage(imageId: string) {
    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  private buildPublicWhere(filters: ProductFiltersDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isActive: true,
      category: {
        isActive: true,
        ...(filters.category ? { slug: filters.category } : {}),
      },
    };

    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      where.priceInCents = {
        ...(filters.min_price !== undefined ? { gte: filters.min_price } : {}),
        ...(filters.max_price !== undefined ? { lte: filters.max_price } : {}),
      };
    }

    if (filters.featured !== undefined) {
      where.isFeatured = filters.featured;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildAdminWhere(filters: ProductFiltersDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      ...(filters.category ? { category: { slug: filters.category } } : {}),
    };

    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      where.priceInCents = {
        ...(filters.min_price !== undefined ? { gte: filters.min_price } : {}),
        ...(filters.max_price !== undefined ? { lte: filters.max_price } : {}),
      };
    }

    if (filters.featured !== undefined) {
      where.isFeatured = filters.featured;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(filters: ProductFiltersDto): Prisma.ProductOrderByWithRelationInput {
    const order = filters.order ?? 'desc';
    const sort = filters.sort ?? 'created_at';

    if (sort === 'price') {
      return { priceInCents: order };
    }
    if (sort === 'name') {
      return { name: order };
    }
    return { createdAt: order };
  }

  private pagination(filters: ProductFiltersDto): { skip: number; take: number } {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    return {
      skip: (page - 1) * perPage,
      take: perPage,
    };
  }
}
