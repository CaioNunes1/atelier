import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressRepository } from './address.repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressEntity } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepository: AddressRepository) {}

  async findAll(userId: string): Promise<AddressEntity[]> {
    const addresses = await this.addressRepository.findAllByUserId(userId);
    return addresses.map((address) => this.toEntity(address));
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressEntity> {
    const address = await this.addressRepository.create(userId, {
      label: dto.label ?? null,
      zipCode: dto.zip_code,
      street: dto.street,
      number: dto.number,
      complement: dto.complement ?? null,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      isDefault: dto.is_default ?? false,
    });

    if (address.isDefault) {
      await this.addressRepository.setDefault(userId, address.id);
    }

    return this.toEntity(address);
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<AddressEntity> {
    const existing = await this.addressRepository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Endereço não encontrado');
    }

    const address = await this.addressRepository.update(id, {
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.zip_code !== undefined ? { zipCode: dto.zip_code } : {}),
      ...(dto.street !== undefined ? { street: dto.street } : {}),
      ...(dto.number !== undefined ? { number: dto.number } : {}),
      ...(dto.complement !== undefined ? { complement: dto.complement } : {}),
      ...(dto.neighborhood !== undefined ? { neighborhood: dto.neighborhood } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.is_default !== undefined ? { isDefault: dto.is_default } : {}),
    });

    if (dto.is_default) {
      await this.addressRepository.setDefault(userId, id);
    }

    return this.toEntity(address);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.addressRepository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Endereço não encontrado');
    }

    await this.addressRepository.delete(id);
    return { success: true };
  }

  private toEntity(address: {
    id: string;
    label: string | null;
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AddressEntity {
    return {
      id: address.id,
      label: address.label,
      zip_code: address.zipCode,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      is_default: address.isDefault,
      created_at: address.createdAt,
      updated_at: address.updatedAt,
    };
  }
}
