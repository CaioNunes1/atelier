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

  const preferenceBody = {
    items: order.items.map((item) => ({
      id:          item.productId,
      title:       item.productName,
      quantity:    item.quantity,
      unit_price:  item.unitPriceInCents / 100,
      currency_id: 'BRL',
    })),
    payer: {
      name:  order.user.name ?? order.user.email,
      email: order.user.email,
    },
    back_urls: {
      success: `${webUrl}/checkout/sucesso`,
      failure: `${webUrl}/checkout/falha`,
      pending: `${webUrl}/checkout/pendente`,
    },
    //auto_return: 'approved' as const,
    external_reference: order.id,
    // notification_url removida para teste local
    payment_methods: {
      excluded_payment_types: [],   // não exclui nenhum tipo
      installments: 1,              // só à vista por enquanto
  },
    // expires removido para teste local
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
}