import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email!: string;
}
