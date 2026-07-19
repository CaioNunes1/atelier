import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoriteService } from './favorite.service';

@Controller('api/me/favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  async findAll(@CurrentUser() user: { id: string }) {
    const favorites = await this.favoriteService.findAll(user.id);
    return { data: favorites };
  }

  @Post(':productId')
  async create(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) productId: string) {
    const favorite = await this.favoriteService.create(user.id, productId);
    return { data: favorite };
  }

  @Delete(':productId')
  async remove(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) productId: string) {
    const result = await this.favoriteService.remove(user.id, productId);
    return { data: result };
  }
}
