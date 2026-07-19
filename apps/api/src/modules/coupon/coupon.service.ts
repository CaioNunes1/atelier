import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { CouponRepository } from './coupon.repository';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponEntity } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.couponRepository.findByCode(dto.code);
    if (!coupon) {
      throw new NotFoundException('Cupom inválido');
    }

    this.assertCouponIsUsable(coupon);
    const discount = this.calculateDiscount(coupon.type, coupon.value, dto.subtotal_in_cents);
    const finalPrice = Math.max(0, dto.subtotal_in_cents - discount);

    return {
      valid: true,
      discount_in_cents: discount,
      final_price_in_cents: finalPrice,
    };
  }

  async listAll(): Promise<CouponEntity[]> {
    const coupons = await this.couponRepository.listAll();
    return coupons.map((coupon) => this.toEntity(coupon));
  }

  async create(dto: CreateCouponDto): Promise<CouponEntity> {
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException('Cupom já cadastrado');
    }

    const coupon = await this.couponRepository.create({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      maxUses: dto.max_uses ?? null,
      validUntil: dto.valid_until ? new Date(dto.valid_until) : null,
      isActive: dto.is_active ?? true,
    });

    return this.toEntity(coupon);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponEntity> {
    const existing = await this.couponRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Cupom não encontrado');
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.couponRepository.findByCode(dto.code);
      if (duplicate) {
        throw new ConflictException('Cupom já cadastrado');
      }
    }

    const coupon = await this.couponRepository.update(id, {
      ...(dto.code ? { code: dto.code } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.value !== undefined ? { value: dto.value } : {}),
      ...(dto.max_uses !== undefined ? { maxUses: dto.max_uses } : {}),
      ...(dto.valid_until !== undefined ? { validUntil: dto.valid_until ? new Date(dto.valid_until) : null } : {}),
      ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
    });

    return this.toEntity(coupon);
  }

  async consumeCoupon(id: string): Promise<void> {
    await this.couponRepository.incrementUsedCount(id);
  }

  private calculateDiscount(type: CouponType, value: number, subtotalInCents: number): number {
    if (type === CouponType.PERCENTAGE) {
      return Math.floor(subtotalInCents * (value / 100));
    }
    return Math.min(value, subtotalInCents);
  }

  private assertCouponIsUsable(coupon: {
    isActive: boolean;
    validUntil: Date | null;
    usedCount: number;
    maxUses: number | null;
  }) {
    if (!coupon.isActive) {
      throw new BadRequestException('Cupom desativado');
    }

    if (coupon.validUntil && coupon.validUntil.getTime() < Date.now()) {
      throw new BadRequestException('Cupom expirado');
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom esgotado');
    }
  }

  private toEntity(coupon: {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    maxUses: number | null;
    usedCount: number;
    validUntil: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CouponEntity {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      max_uses: coupon.maxUses,
      used_count: coupon.usedCount,
      valid_until: coupon.validUntil,
      is_active: coupon.isActive,
      created_at: coupon.createdAt,
      updated_at: coupon.updatedAt,
    };
  }
}
