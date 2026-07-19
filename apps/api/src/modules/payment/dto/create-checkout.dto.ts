import { IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  order_id!: string;
}
