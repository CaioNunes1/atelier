import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(3, 60)
  async register(@Body() dto: RegisterDto, @Req() request: Request) {
    const result = await this.authService.register(dto, request.ip);
    return { data: result };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(5, 60)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto, request.ip);
    this.setRefreshCookie(response, result.refresh_token);

    return {
      data: {
        access_token: result.access_token,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token ?? dto.refresh_token;
    const result = await this.authService.refresh(refreshToken ?? '', request.ip);
    this.setRefreshCookie(response, result.refresh_token);

    return {
      data: {
        access_token: result.access_token,
        user: result.user,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
    @Body() dto: RefreshTokenDto,
  ) {
    const refreshToken = request.cookies?.refresh_token ?? dto.refresh_token;
    const result = await this.authService.logout(refreshToken, request.ip);
    this.clearRefreshCookie(response);
    return { data: result };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle(3, 3600)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    const result = await this.authService.forgotPassword(dto, request.ip);
    return { data: result };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    const result = await this.authService.resetPassword(dto, request.ip);
    return { data: result };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/auth',
    });
  }
}
