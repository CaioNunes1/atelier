import { UserRole } from '@prisma/client';

export interface UserEntity {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
