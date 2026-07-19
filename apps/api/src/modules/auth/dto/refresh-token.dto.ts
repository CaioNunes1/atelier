import { IsOptional, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsUUID()
  refresh_token?: string;
}
