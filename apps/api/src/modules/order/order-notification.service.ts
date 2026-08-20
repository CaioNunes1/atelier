import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { EmailService } from '../email/email.service';

type OrderStatusChangedPayload = {
  email: string;
  name: string | null;
  orderId: string;
  status: string;
  trackingCode?: string;
};

@Injectable()
export class OrderNotificationService implements OnModuleInit {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.emitter.on('order.status.changed', async (payload: OrderStatusChangedPayload) => {
      const messages: Record<string, string> = { PAID: 'Pagamento aprovado.', PROCESSING: 'Seu pedido está em preparação.', SHIPPED: 'Seu pedido foi enviado.', DELIVERED: 'Seu pedido foi entregue.', CANCELLED: 'Seu pedido foi cancelado.' };
      const message = payload.status === 'SHIPPED' && payload.trackingCode ? `${messages.SHIPPED} Código de rastreio: ${payload.trackingCode}.` : messages[payload.status];
      await this.emailService.order(payload.email, payload.name, payload.orderId, message ?? 'O status do pedido foi atualizado.');
    });
    this.emitter.on('order.created', (payload: OrderStatusChangedPayload) => this.emailService.orderCreated(payload.email, payload.name, payload.orderId));
  }
}
