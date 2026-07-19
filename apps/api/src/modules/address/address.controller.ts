import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressService } from './address.service';

@Controller('api/me/addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async findAll(@CurrentUser() user: { id: string }) {
    const addresses = await this.addressService.findAll(user.id);
    return { data: addresses };
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateAddressDto) {
    const address = await this.addressService.create(user.id, dto);
    return { data: address };
  }

  @Patch(':id')
  async update(@CurrentUser() user: { id: string }, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressDto) {
    const address = await this.addressService.update(user.id, id, dto);
    return { data: address };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.addressService.remove(user.id, id);
    return { data: result };
  }
}
