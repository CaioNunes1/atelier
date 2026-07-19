import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from 'eventemitter2';
import { Resend } from 'resend';

type OrderStatusChangedPayload = {
  email: string;
  name: string | null;
  orderId: string;
  status: string;
};

@Injectable()
export class OrderNotificationService implements OnModuleInit {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.emitter.on('order.status.changed', async (payload: OrderStatusChangedPayload) => {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (!apiKey) {
        return;
      }

      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: payload.email,
        subject: `Pedido ${payload.orderId} atualizado`,
        html: `<p>Olá ${payload.name ?? ''},</p><p>O pedido ${payload.orderId} agora está em <strong>${payload.status}</strong>.</p>`,
      });
    });
  }
}
