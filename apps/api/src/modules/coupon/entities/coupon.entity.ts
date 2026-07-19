import { CouponType } from '@prisma/client';

export interface CouponEntity {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  max_uses: number | null;
  used_count: number;
  valid_until: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
