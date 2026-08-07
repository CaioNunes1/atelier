// shipping.service.ts
import { Injectable } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@Injectable()
export class ShippingService {
  calculate(dto: CalculateShippingDto) {
    const subtotal = dto.subtotal_in_cents ?? 0

    return {
      options: [
        {
          id: 'pickup',
          label: 'Retirar no local — Recife/PE',
          shipping_in_cents: 0,
          estimated_days: 0,
        },
        {
          id: 'delivery',
          label: subtotal >= 30000
            ? 'Entrega via Correios — Grátis (acima de R$ 300)'
            : 'Entrega via Correios — R$ 15,00',
          shipping_in_cents: subtotal >= 30000 ? 0 : 1500,
          estimated_days: 7,
        },
      ],
    }
  }
}