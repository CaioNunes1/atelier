import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.address.findUnique({ where: { id } });
  }

  create(
    userId: string,
    data: Omit<Prisma.AddressUncheckedCreateInput, 'userId'>,
  ) {
    return this.prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  update(id: string, data: Prisma.AddressUncheckedUpdateInput) {
    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.address.delete({ where: { id } });
  }

  setDefault(userId: string, id: string) {
    return this.prisma.$transaction([
      this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      this.prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }
}
