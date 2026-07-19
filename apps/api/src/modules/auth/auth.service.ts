import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './user.repository';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string): Promise<{ user: UserEntity }> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    const user = await this.userRepository.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    this.logger.log(`register_success email=${user.email} ip=${ipAddress ?? 'unknown'}`);
    return { user: this.toUserEntity(user) };
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
  ): Promise<{ user: UserEntity; access_token: string; refresh_token: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`login_failed email=${dto.email} ip=${ipAddress ?? 'unknown'}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      this.logger.warn(`login_failed email=${dto.email} ip=${ipAddress ?? 'unknown'}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);
    this.logger.log(`login_success userId=${user.id} ip=${ipAddress ?? 'unknown'}`);

    return {
      user: this.toUserEntity(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string; user: UserEntity }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não informado');
    }

    const storedToken = await this.findMatchingRefreshToken(refreshToken);
    if (!storedToken) {
      this.logger.warn(`refresh_failed ip=${ipAddress ?? 'unknown'}`);
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.userRepository.deleteRefreshTokenById(storedToken.id);
    const newTokens = await this.generateTokens(storedToken.user);

    this.logger.log(`refresh_success userId=${storedToken.user.id} ip=${ipAddress ?? 'unknown'}`);
    return {
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      user: this.toUserEntity(storedToken.user),
    };
  }

  async logout(refreshToken: string | undefined, ipAddress?: string): Promise<{ success: boolean }> {
    if (!refreshToken) {
      return { success: true };
    }

    const storedToken = await this.findMatchingRefreshToken(refreshToken);
    if (storedToken) {
      await this.userRepository.deleteRefreshTokenById(storedToken.id);
      this.logger.log(`logout_success userId=${storedToken.user.id} ip=${ipAddress ?? 'unknown'}`);
    }

    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`forgot_password_user_not_found email=${dto.email} ip=${ipAddress ?? 'unknown'}`);
      return { message: 'Se o email existir, enviaremos as instruções de recuperação.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(resetToken, ARGON2_OPTIONS);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const webUrl = this.configService.get<string>('WEB_URL');
    if (!webUrl) {
      throw new BadRequestException('WEB_URL não configurada');
    }

    const resetUrl = `${webUrl}/reset-password?token=${resetToken}`;
    await this.sendResetEmail(user.email, user.name, resetUrl);

    this.logger.log(`forgot_password_success userId=${user.id} ip=${ipAddress ?? 'unknown'}`);
    return { message: 'Se o email existir, enviaremos as instruções de recuperação.' };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string): Promise<{ success: boolean }> {
    const storedToken = await this.findMatchingPasswordResetToken(dto.token);
    if (!storedToken) {
      this.logger.warn(`reset_password_failed ip=${ipAddress ?? 'unknown'}`);
      throw new UnauthorizedException('Token de recuperação inválido ou expirado');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    await this.userRepository.updateUserPassword(storedToken.user.id, passwordHash);
    await this.userRepository.markPasswordResetTokenAsUsed(storedToken.id);
    await this.userRepository.deleteAllRefreshTokensFromUser(storedToken.user.id);

    this.logger.log(`reset_password_success userId=${storedToken.user.id} ip=${ipAddress ?? 'unknown'}`);
    return { success: true };
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = uuidv4();
    const tokenHash = await argon2.hash(refreshToken, ARGON2_OPTIONS);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private async findMatchingRefreshToken(rawToken: string) {
    const activeTokens = await this.userRepository.findActiveRefreshTokens();
    for (const token of activeTokens) {
      if (await argon2.verify(token.token, rawToken)) {
        return token;
      }
    }
    return null;
  }

  private async findMatchingPasswordResetToken(rawToken: string) {
    const activeTokens = await this.userRepository.findActivePasswordResetTokens();
    for (const token of activeTokens) {
      if (await argon2.verify(token.token, rawToken)) {
        return token;
      }
    }
    return null;
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload: AccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: 900,
    });
  }

  private async sendResetEmail(email: string, name: string | null, resetUrl: string): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('RESEND_API_KEY não configurada');
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Redefinição de senha',
      html: `<p>Olá ${name ?? ''},</p><p>Use o link abaixo para redefinir sua senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 1 hora.</p>`,
    });
  }

  private toUserEntity(user: User): UserEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
