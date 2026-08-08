import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class PaymentService {
  private readonly mp: MercadoPagoConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const token = this.configService.get<string>('MP_ACCESS_TOKEN')
    console.log('MP_ACCESS_TOKEN carregado:', token?.slice(0, 20) + '...')  // mostra só o iníci
    this.mp = new MercadoPagoConfig({
      accessToken: this.configService.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
  }

  async createCheckout(dto: CreateCheckoutDto) {
  console.log('createCheckout chamado com order_id:', dto.order_id)

  const order = await this.prisma.order.findUnique({
    where: { id: dto.order_id },
    include: { items: true, user: true },
  });

  console.log('Pedido encontrado:', order
    ? `status=${order.status}, itens=${order.items.length}`
    : 'NÃO ENCONTRADO')

  if (!order) throw new NotFoundException('Pedido não encontrado');
  if (order.status !== 'PENDING_PAYMENT') {
    throw new BadRequestException('Este pedido não está aguardando pagamento');
  }

  const webUrl = this.configService.get<string>('WEB_URL') ?? 'http://localhost:5173';
  const apiUrl = this.configService.get<string>('API_URL') ?? 'http://localhost:3333'

  const preference = new Preference(this.mp);

  const shippingInCents = order.shippingInCents;

const orderItems = order.items.map((item) => ({
  id:          item.productId,
  title:       item.productName,
  quantity:    item.quantity,
  unit_price:  item.unitPriceInCents / 100,
  currency_id: 'BRL',
}))

if (shippingInCents > 0) {
  orderItems.push({
    id:          'shipping',
    title:       'Frete',
    quantity:    1,
    unit_price:  shippingInCents / 100,
    currency_id: 'BRL',
  })
}

//const isProduction = this.configService.get('NODE_ENV') === 'production'

const preferenceBody = {
  items: orderItems,
  payer: {
    name:  order.user.name ?? order.user.email,
    email: order.user.email,
  },
  back_urls: {
    success: `${webUrl}/checkout/sucesso`,
    failure: `${webUrl}/checkout/falha`,
    pending: `${webUrl}/checkout/pendente`,
  },
  auto_return: 'approved',
  external_reference: order.id,
  notification_url: `${apiUrl}/api/payments/webhook`,
}

  console.log('Enviando para MP:', JSON.stringify(preferenceBody, null, 2))

  const result = await preference.create({ body: preferenceBody })

  console.log('Resposta MP:', result.id, result.init_point)

  await this.prisma.order.update({
    where: { id: order.id },
    data:  { paymentId: result.id },
  });

  return { url: result.init_point! };
}

async handleWebhook(data: {
  paymentId: string;
  body: unknown;
  query: Record<string, string>;
  signature?: string;
  requestId?: string;
}) {
  const {
    paymentId,
    body,
    query,
    signature,
    requestId,
  } = data;

  console.log('========================================');
  console.log('PROCESSANDO WEBHOOK');
  console.log('========================================');

  console.log('Payment ID:', paymentId);
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('Query:', JSON.stringify(query, null, 2));
  console.log('Signature:', signature);
  console.log('Request ID:', requestId);

  try {
    const { Payment } = await import('mercadopago');

    const paymentClient = new Payment(this.mp);

    /**
     * Consulta o pagamento diretamente na API
     * do Mercado Pago.
     */
    const payment = await paymentClient.get({
      id: paymentId,
    });

    console.log('========================================');
    console.log('PAGAMENTO ENCONTRADO');
    console.log('========================================');

    console.log('Payment ID:', payment.id);
    console.log('Status:', payment.status);
    console.log(
      'External Reference:',
      payment.external_reference,
    );

    /**
     * A external_reference é o ID do nosso pedido.
     *
     * No createCheckout nós definimos:
     *
     * external_reference: order.id
     */
    const orderId = payment.external_reference;

    if (!orderId) {
      console.warn(
        'Pagamento encontrado, mas não possui external_reference.',
      );

      return;
    }

    /**
     * Pagamento aprovado
     */
    if (payment.status === 'approved') {
      const order = await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!order) {
        console.warn(
          `Pedido ${orderId} não encontrado.`,
        );

        return;
      }

      /**
       * Evita atualizar novamente um pedido
       * que já está pago.
       */
      if (order.status === 'PAID') {
        console.log(
          `Pedido ${orderId} já está como PAID.`,
        );

        return;
      }

      await this.prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: 'PAID',
        },
      });

      console.log(
        `Pedido ${orderId} atualizado para PAID.`,
      );

      return;
    }

    /**
     * Pagamento rejeitado ou cancelado
     */
    if (
      payment.status === 'rejected' ||
      payment.status === 'cancelled'
    ) {
      await this.prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: 'CANCELLED',
        },
      });

      console.log(
        `Pedido ${orderId} atualizado para CANCELLED.`,
      );

      return;
    }

    /**
     * Outros estados:
     *
     * pending
     * in_process
     * authorized
     *
     * Nesse momento não alteramos o pedido.
     */
    console.log(
      `Pagamento ${paymentId} está com status: ${payment.status}`,
    );
  } catch (error) {
    console.error(
      'Erro ao consultar/processar pagamento:',
      error,
    );

    /**
     * Importante:
     *
     * Relançamos o erro para o Controller saber
     * que o processamento falhou.
     */
    throw error;
  }
}
}