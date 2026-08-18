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

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  updateProfile(id: string, data: { name: string; email: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  anonymizeUser(id: string, anonymizedEmail: string) {
    return this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      this.prisma.favorite.deleteMany({ where: { userId: id } }),
      this.prisma.cart.updateMany({ where: { userId: id }, data: { userId: null } }),
      this.prisma.address.deleteMany({ where: { userId: id } }),
      this.prisma.user.update({
        where: { id },
        data: { name: 'Usuário Removido', email: anonymizedEmail, deletedAt: new Date() },
      }),
    ]);
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

  findActiveRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
}

// Mantenha o findActiveRefreshTokens existente por compatibilidade
// mas não use mais no refresh

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
