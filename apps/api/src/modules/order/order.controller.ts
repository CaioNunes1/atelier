import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.create(user.id, dto);
    return { data: order };
  }

  @Get()
  async findAll(@CurrentUser() user: { id: string }) {
    const orders = await this.orderService.listUserOrders(user.id);
    return { data: orders };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orderService.getUserOrder(user.id, id);
    return { data: order };
  }
}

@Controller('api/admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll() {
    const orders = await this.orderService.listAdminOrders();
    return { data: orders };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orderService.getAdminOrder(id);
    return { data: order };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto) {
    const order = await this.orderService.updateStatus(id, dto);
    return { data: order };
  }
}
