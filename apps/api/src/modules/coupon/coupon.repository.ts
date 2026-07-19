import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCode(code: string) {
    return this.prisma.coupon.findUnique({ where: { code } });
  }

  findById(id: string) {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  listAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: Prisma.CouponCreateInput) {
    return this.prisma.coupon.create({ data });
  }

  update(id: string, data: Prisma.CouponUpdateInput) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  incrementUsedCount(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}
