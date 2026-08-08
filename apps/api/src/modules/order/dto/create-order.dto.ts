import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  address_id!: string;

  @IsString()
  @IsIn(['pickup', 'delivery'])
  shipping_option_id!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @MaxLength(40)
  coupon_code?: string;
}
