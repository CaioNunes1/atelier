import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  findBySlug(slug: string, excludedId?: string) {
    return this.prisma.category.findFirst({
      where: {
        slug,
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
    });
  }

  create(data: { name: string; slug: string; isActive: boolean }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: { name?: string; slug?: string; isActive?: boolean }) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }
}
