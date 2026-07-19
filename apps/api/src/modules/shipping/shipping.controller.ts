import { Body, Controller, Post } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { ShippingService } from './shipping.service';

@Controller('api/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  async calculate(@Body() dto: CalculateShippingDto) {
    const result = await this.shippingService.calculate(dto);
    return { data: result };
  }
}
