import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@Controller('api/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: { id: string }) {
    const cart = await this.cartService.getCart(user.id);
    return { data: cart };
  }

  @Post('items')
  async addItem(@CurrentUser() user: { id: string }, @Body() dto: CreateCartItemDto) {
    const cart = await this.cartService.addItem(user.id, dto);
    return { data: cart };
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser() user: { id: string },
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateItem(user.id, itemId, dto);
    return { data: cart };
  }

  @Delete('items/:itemId')
  async removeItem(@CurrentUser() user: { id: string }, @Param('itemId', ParseUUIDPipe) itemId: string) {
    const cart = await this.cartService.removeItem(user.id, itemId);
    return { data: cart };
  }

  @Delete()
  async clearCart(@CurrentUser() user: { id: string }) {
    const cart = await this.cartService.clearCart(user.id);
    return { data: cart };
  }

  @Post('merge')
  async mergeCart(@CurrentUser() user: { id: string }, @Body() dto: MergeCartDto) {
    const cart = await this.cartService.mergeCart(user.id, dto);
    return { data: cart };
  }
}
