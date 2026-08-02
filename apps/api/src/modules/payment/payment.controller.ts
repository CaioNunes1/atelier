import { Body, Controller, Post, UseGuards,Headers,Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentService } from './payment.service';
//import { ConfigService } from '@nestjs/config';

@Controller('api/payments')
export class PaymentController {
  
  constructor(
    private readonly paymentService: PaymentService,
    //private readonly configService: ConfigService
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    const result = await this.paymentService.createCheckout(dto);
    return { data: result };
  }
    // Webhook — sem guard, o MP chama diretamente
/**
   * Webhook do Mercado Pago
   *
   * Aceita notificações vindas de:
   * - Webhook real
   * - Simulador do Mercado Pago
   * - Notificações que enviam data.id via query string
   */
  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Query() query: Record<string, string>,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    console.log('========================================');
    console.log('WEBHOOK MERCADO PAGO RECEBIDO');
    console.log('========================================');

    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('x-signature:', signature);
    console.log('x-request-id:', requestId);

    /**
     * O Mercado Pago normalmente envia:
     *
     * body.data.id
     *
     * Mas algumas notificações podem enviar:
     *
     * query["data.id"]
     *
     * Por isso tentamos os dois.
     */
    const topic = body?.topic ?? query?.topic ?? body?.type;
    const paymentId =
      body?.data?.id ??
      query['data.id'] ??
      query['id'];

    console.log('Webhook topic:', topic);
    console.log('Payment ID:', paymentId);
    
      if (topic === 'merchant_order') {
    // por enquanto ignora ou trata em outro método
    return { received: true, processed: false, topic };
  }

    if (!paymentId) {
      console.warn(
        'Webhook recebido, mas nenhum payment ID foi encontrado.',
      );

      // Respondemos 200 para indicar que a requisição foi recebida.
      return {
        received: true,
        processed: false,
        message: 'Payment ID não encontrado',
      };
    }

    console.log('Payment ID identificado:', paymentId);

    try {
      await this.paymentService.handleWebhook({
        paymentId: String(paymentId),
        body,
        query,
        signature,
        requestId,
      });

      return {
        received: true,
        processed: true,
        paymentId,
      };
    } catch (error) {
      console.error(
        'Erro ao processar webhook:',
        error,
      );

      /**
       * Não lançamos erro aqui.
       *
       * Isso evita que o Mercado Pago fique
       * considerando a requisição como falha.
       */
      return {
        received: true,
        processed: false,
        paymentId,
      };
    }
  }
}
