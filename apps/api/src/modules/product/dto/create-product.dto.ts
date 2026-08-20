import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';

export class ProductVariantInputDto {
  @IsOptional() @IsUUID() id?: string;
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsInt() @Min(0) stock!: number;
  @IsOptional() @IsInt() price_modifier_in_cents?: number;
  @IsOptional() @IsUrl() image_url?: string;
}

export class CreateProductDto {
  @IsUUID()
  category_id!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsInt()
  @Min(0)
  price_in_cents!: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional() @IsBoolean() is_exclusive?: boolean;
  @IsOptional() @IsBoolean() is_ready_to_ship?: boolean;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];

  @IsInt()
  @Min(0)
  stock!: number;
}
