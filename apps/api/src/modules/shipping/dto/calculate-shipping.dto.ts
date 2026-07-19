import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CalculateShippingDto {
  @IsString()
  zip_code!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  subtotal_in_cents?: number;
}
