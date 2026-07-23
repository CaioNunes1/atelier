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

  const preference = new Preference(this.mp);

  const shippingInCents = order.shippingInCents ?? 0

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
  external_reference: order.id,
  notification_url: `${webUrl}/api/payments/webhook`,
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

async handleWebhook(body: unknown) {
  // O MP envia diferentes tipos de notificação
  const notification = body as { type?: string; action?: string; data?: { id?: string } }
  
  console.log('Webhook recebido:', JSON.stringify(notification))

  // Só processa notificações de pagamento
  if (notification.type !== 'payment' && notification.action !== 'payment.updated') {
    return
  }

  const paymentId = notification.data?.id
  if (!paymentId) return

  try {
    // Consulta o status do pagamento na API do MP
    const { Payment } = await import('mercadopago')
    const paymentClient = new Payment(this.mp)
    const payment = await paymentClient.get({ id: paymentId })

    console.log('Status do pagamento:', payment.status, 'Order:', payment.external_reference)

    const orderId = payment.external_reference
    if (!orderId) return

    if (payment.status === 'approved') {
      // Muda status do pedido para PAID
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      })
      console.log('Pedido aprovado:', orderId)
    }

    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      })
      console.log('Pedido cancelado:', orderId)
    }

  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    // Não lança exceção — o MP vai retentar se der 500
  }
}
}