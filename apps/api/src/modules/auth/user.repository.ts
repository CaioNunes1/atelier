import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  createUser(params: { name: string; email: string; passwordHash: string }) {
    const { name, email, passwordHash } = params;
    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
  }

  createRefreshToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    const { userId, tokenHash, expiresAt } = params;
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token: tokenHash,
        expiresAt,
      },
      include: {
        user: true,
      },
    });
  }

  findActiveRefreshTokens() {
    return this.prisma.refreshToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  deleteRefreshTokenById(id: string) {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  deleteAllRefreshTokensFromUser(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  createPasswordResetToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    const { userId, tokenHash, expiresAt } = params;
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        token: tokenHash,
        expiresAt,
      },
      include: {
        user: true,
      },
    });
  }

  findActivePasswordResetTokens() {
    return this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  markPasswordResetTokenAsUsed(id: string) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }

  updateUserPassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }
}
