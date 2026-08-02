import { Injectable } from '@nestjs/common';

@Injectable()
export class ShippingService {
  calculate() {
    //const subtotal = dto.subtotal_in_cents ?? 0;
    //const shipping_in_cents = subtotal >= 30000 ? 0 : 1500;
    return {
      shipping_in_cents:0,
      estimated_days: 5,
    };
  }
}
