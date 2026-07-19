import { Injectable } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@Injectable()
export class ShippingService {
  calculate(dto: CalculateShippingDto) {
    const subtotal = dto.subtotal_in_cents ?? 0;
    const shipping_in_cents = subtotal >= 30000 ? 0 : 1500;
    return {
      shipping_in_cents,
      estimated_days: 5,
    };
  }
}
