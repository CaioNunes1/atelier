import { Module } from '@nestjs/common';
import { FavoriteController } from './favorite.controller';
import { FavoriteRepository } from './favorite.repository';
import { FavoriteService } from './favorite.service';

@Module({
  controllers: [FavoriteController],
  providers: [FavoriteService, FavoriteRepository],
  exports: [FavoriteService, FavoriteRepository],
})
export class FavoriteModule {}
