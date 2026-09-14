import { createHash } from 'crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GUEST_PRODUCT_LIMIT } from './guest.constants';

type UserRecord = {
  id: number;
  email: string | null;
  nickname: string | null;
  isGuest: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async createGuest(): Promise<AuthTokensDto> {
    const user = await this.prisma.user.create({
      data: { isGuest: true },
    });
    return this.issueTokens(user);
  }

  async register(
    dto: RegisterDto,
    currentUserId?: number,
  ): Promise<AuthTokensDto> {
    if (currentUserId !== undefined) {
      return this.upgradeGuest(currentUserId, dto);
    }
    await this.assertCredentialsFree(dto.email, dto.nickname);
    return this.createRegisteredUser(dto);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.isGuest || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.revokedAt ||
      stored.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toUserDto(user);
  }

  private async upgradeGuest(
    userId: number,
    dto: RegisterDto,
  ): Promise<AuthTokensDto> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!current) {
      throw new UnauthorizedException('User not found');
    }
    if (!current.isGuest) {
      throw new ConflictException('Already registered');
    }

    await this.assertCredentialsFree(dto.email, dto.nickname, userId);
    const passwordHash = await argon2.hash(dto.password);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: dto.email,
          nickname: dto.nickname,
          passwordHash,
          isGuest: false,
        },
      });
      return this.issueTokens(user);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  private async createRegisteredUser(dto: RegisterDto): Promise<AuthTokensDto> {
    const passwordHash = await argon2.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          nickname: dto.nickname,
          passwordHash,
          isGuest: false,
        },
      });
      return this.issueTokens(user);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  private async assertCredentialsFree(
    email: string,
    nickname: string,
    exceptUserId?: number,
  ): Promise<void> {
    const [existingEmail, existingNickname] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findFirst({
        where: { nickname: { equals: nickname, mode: 'insensitive' } },
      }),
    ]);
    if (existingEmail && existingEmail.id !== exceptUserId) {
      throw new ConflictException('Email is already registered');
    }
    if (existingNickname && existingNickname.id !== exceptUserId) {
      throw new ConflictException('Nickname is already taken');
    }
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokensDto> {
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const decoded = this.jwt.decode<{ exp?: number }>(refreshToken);
    if (!decoded?.exp) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: await this.toUserDto(user),
    };
  }

  private async toUserDto(user: UserRecord): Promise<UserResponseDto> {
    const productCount = await this.prisma.product.count({
      where: { userId: user.id },
    });
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isGuest: user.isGuest,
      productLimit: user.isGuest ? GUEST_PRODUCT_LIMIT : null,
      productCount,
    };
  }

  private rethrowUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target.filter((item): item is string => typeof item === 'string')
        : [];
      if (fields.includes('nickname')) {
        throw new ConflictException('Nickname is already taken');
      }
      throw new ConflictException('Email is already registered');
    }
    throw error;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ sub: number }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number | string }>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
      const sub = Number(payload.sub);
      if (!Number.isInteger(sub) || sub < 1) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return { sub };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
