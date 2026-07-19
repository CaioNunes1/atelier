import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
  address: true,
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  transactional<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findUserOrderById(userId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: ORDER_INCLUDE,
    });
  }

  findAdminOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        ...ORDER_INCLUDE,
        user: true,
      },
    });
  }

  listUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  listAdminOrders() {
    return this.prisma.order.findMany({
      include: {
        ...ORDER_INCLUDE,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findExpiredPendingOrders() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: {
          lt: new Date(),
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  mapOrder(order: OrderWithRelations) {
    return order;
  }
}
