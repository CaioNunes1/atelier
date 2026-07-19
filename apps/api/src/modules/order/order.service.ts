import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from 'eventemitter2';
import { CouponRepository } from '../coupon/coupon.repository';
import { CouponService } from '../coupon/coupon.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderRepository } from './order.repository';

const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
  address: true,
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly couponService: CouponService,
    private readonly couponRepository: CouponRepository,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderEntity> {
    return this.orderRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: {
                include: {
                  category: true,
                  images: { orderBy: { position: 'asc' } },
                  variants: true,
                },
              },
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Carrinho vazio');
      }

      const address = await tx.address.findFirst({
        where: {
          id: dto.address_id,
          userId,
        },
      });
      if (!address) {
        throw new NotFoundException('Endereço não encontrado');
      }

      const items = cart.items.map((item) => {
        const product = item.product;
        if (!product.isActive || product.deletedAt) {
          throw new BadRequestException('Produto desativado');
        }

        const variant = item.variant;
        const stock = variant ? variant.stock : product.stock;
        if (stock < item.quantity) {
          throw new BadRequestException('Estoque insuficiente');
        }

        const unitPrice = product.priceInCents + (variant?.priceModifierInCents ?? 0);
        return {
          productId: product.id,
          variantId: item.variantId,
          productName: product.name,
          variantName: variant?.name ?? null,
          unitPriceInCents: unitPrice,
          quantity: item.quantity,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.unitPriceInCents * item.quantity, 0);
      const shipping = subtotal >= 30000 ? 0 : 1500;
      const discountInCents = dto.coupon_code
        ? (await this.couponService.validate({
            code: dto.coupon_code,
            subtotal_in_cents: subtotal,
          })).discount_in_cents
        : 0;
      const total = Math.max(0, subtotal - discountInCents + shipping);

      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalInCents: subtotal,
          discountInCents,
          shippingInCents: shipping,
          totalInCents: total,
          couponCode: dto.coupon_code ?? null,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          items: {
            create: items,
          },
          address: {
            create: {
              zipCode: address.zipCode,
              street: address.street,
              number: address.number,
              complement: address.complement,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
            },
          },
        },
        include: ORDER_INCLUDE,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return this.toEntity(order);
    });
  }

  async listUserOrders(userId: string): Promise<OrderEntity[]> {
    const orders = await this.orderRepository.listUserOrders(userId);
    return orders.map((order) => this.toEntity(order as OrderWithRelations));
  }

  async getUserOrder(userId: string, id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findUserOrderById(userId, id);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return this.toEntity(order as OrderWithRelations);
  }

  async listAdminOrders(): Promise<OrderEntity[]> {
    const orders = await this.orderRepository.listAdminOrders();
    return orders.map((order) => this.toEntity(order as OrderWithRelations));
  }

  async getAdminOrder(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findAdminOrderById(id);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return this.toEntity(order as OrderWithRelations);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderEntity> {
    return this.orderRepository.transactional(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.status === dto.status) {
        return this.toEntity((await tx.order.findUnique({
          where: { id },
          include: ORDER_INCLUDE,
        })) as OrderWithRelations);
      }

      await this.applyStatusTransition(tx, order, dto.status);

      const updated = await tx.order.findUnique({
        where: { id },
        include: ORDER_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Pedido não encontrado');
      }

      this.emitStatusChanged(order.user.email, order.user.name, order.id, dto.status);
      return this.toEntity(updated as OrderWithRelations);
    });
  }

  async cancelExpiredOrders(): Promise<number> {
    const expired = await this.orderRepository.findExpiredPendingOrders();
    let count = 0;

    for (const order of expired) {
      await this.orderRepository.transactional(async (tx) => {
        const locked = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: true,
            user: true,
          },
        });
        if (!locked || locked.status !== OrderStatus.PENDING_PAYMENT || !locked.expiresAt || locked.expiresAt >= new Date()) {
          return;
        }

        await tx.order.update({
          where: { id: locked.id },
          data: { status: OrderStatus.CANCELLED },
        });
        this.emitStatusChanged(locked.user.email, locked.user.name, locked.id, OrderStatus.CANCELLED);
        count += 1;
      });
    }

    return count;
  }

  private async applyStatusTransition(
    tx: Prisma.TransactionClient,
    order: { id: string; status: OrderStatus; items: Array<{ productId: string; variantId: string | null; quantity: number }>; couponCode: string | null },
    nextStatus: OrderStatus,
  ) {
    if (nextStatus === OrderStatus.CANCELLED && (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED)) {
      throw new BadRequestException('Pedido não pode ser cancelado após envio');
    }

    if (nextStatus === OrderStatus.PAID && order.status !== OrderStatus.PAID) {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new NotFoundException('Produto não encontrado');
        }

        if (item.variantId) {
          const variant = product.variants.find((current) => current.id === item.variantId);
          if (!variant || variant.stock < item.quantity) {
            throw new BadRequestException('Estoque insuficiente');
          }
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } },
          });
        } else if (product.stock < item.quantity) {
          throw new BadRequestException('Estoque insuficiente');
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (order.couponCode) {
        const coupon = await this.couponRepository.findByCode(order.couponCode);
        if (coupon) {
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    if (nextStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });
  }

  private emitStatusChanged(email: string, name: string | null, orderId: string, status: OrderStatus) {
    this.emitter.emit('order.status.changed', {
      email,
      name,
      orderId,
      status,
    });
  }

  private toEntity(order: OrderWithRelations): OrderEntity {
    return {
      id: order.id,
      status: order.status,
      subtotal_in_cents: order.subtotalInCents,
      discount_in_cents: order.discountInCents,
      shipping_in_cents: order.shippingInCents,
      total_in_cents: order.totalInCents,
      coupon_code: order.couponCode,
      tracking_code: order.trackingCode,
      expires_at: order.expiresAt,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.productName,
        variant_name: item.variantName,
        unit_price_in_cents: item.unitPriceInCents,
        quantity: item.quantity,
      })),
      address: order.address
        ? {
            id: order.address.id,
            zip_code: order.address.zipCode,
            street: order.address.street,
            number: order.address.number,
            complement: order.address.complement,
            neighborhood: order.address.neighborhood,
            city: order.address.city,
            state: order.address.state,
          }
        : null,
    };
  }
}
