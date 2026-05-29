import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { randomBytes } from 'crypto';
import { CouponService } from '../coupons/coupon.service';
import { MailService } from '../common/mail.service';
import { DataSource } from 'typeorm';
import { Order } from '../order/order.entity';
import { User } from '../users/entities/user.entity';

interface AuthTokenUser {
  id: number;
  username: string;
  role?: string;
}

type GoogleTokenInfoResponse = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private couponService: CouponService,
    private mailService: MailService,
    private dataSource: DataSource,
  ) {}

  async register(username: string, password: string, email?: string) {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    if (email) {
      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    const user = await this.usersService.createUser(username, password, email);
    await this.couponService.issueWelcomeCoupon(user.id, user.created_at);

    if (user.email) {
      this.mailService.sendWelcome(user.email, user.username);
    }

    return this.generateToken(user);
  }

  async registerGuestConvert(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký tài khoản.');
    }

    const emailPrefix = email.split('@')[0];
    let username = emailPrefix;
    let suffix = 1;
    while (await this.usersService.findByUsername(username)) {
      username = `${emailPrefix}${suffix}`;
      suffix++;
    }

    const user = await this.usersService.createUser(username, password, email);
    await this.couponService.issueWelcomeCoupon(user.id, user.created_at);

    const orderRepo = this.dataSource.getRepository(Order);
    const guestOrders = await orderRepo.find({
      where: { guestEmail: email },
    });

    let totalSpent = 0;
    if (guestOrders.length > 0) {
      for (const order of guestOrders) {
        order.user = user;
        if (order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered') {
          totalSpent += Number(order.totalAmount);
        }
      }
      await orderRepo.save(guestOrders);

      if (totalSpent > 0) {
        await this.dataSource.getRepository(User).increment(
          { id: user.id },
          'totalSpent',
          totalSpent,
        );
      }
    }

    if (user.email) {
      this.mailService.sendWelcome(user.email, user.username);
    }

    return this.generateToken(user);
  }

  async login(username: string, password: string) {
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.touchLastLogin(user.id);

    return this.generateToken(user);
  }

  async loginWithGoogleIdToken(idToken: string) {
    if (!idToken) {
      throw new UnauthorizedException('idToken is required');
    }

    const tokenInfo = await this.verifyGoogleIdToken(idToken);
    const email = tokenInfo.email;

    if (!email) {
      throw new UnauthorizedException('Google token does not contain email');
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      if (!existing.isActive) {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }
      await this.usersService.touchLastLogin(existing.id);
      return this.generateToken(existing);
    }

    const baseUsername = email.split('@')[0] || 'google-user';
    const username = await this.generateUniqueUsername(baseUsername);
    const randomPassword = randomBytes(32).toString('hex');

    const user = await this.usersService.createUser(
      username,
      randomPassword,
      email,
    );
    await this.couponService.issueWelcomeCoupon(user.id, user.created_at);
    return this.generateToken(user);
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<GoogleTokenInfoResponse> {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const data = (await res.json()) as GoogleTokenInfoResponse;

    const verified =
      data.email_verified === true || data.email_verified === 'true';
    if (!verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const expectedAud = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (expectedAud && data.aud && data.aud !== expectedAud) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    return data;
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    const normalizedBase = base.trim().slice(0, 40) || 'google-user';

    const direct = await this.usersService.findByUsername(normalizedBase);
    if (!direct) {
      return normalizedBase;
    }

    for (let i = 0; i < 20; i++) {
      const candidate = `${normalizedBase}${Math.floor(Math.random() * 10000)}`;
      const exists = await this.usersService.findByUsername(candidate);
      if (!exists) {
        return candidate;
      }
    }

    return `${normalizedBase}-${Date.now()}`;
  }

  private generateToken(user: AuthTokenUser) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<StringValue>('JWT_EXPIRES'),
      }),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await this.usersService.setResetToken(email, token, expires);

    await this.mailService.sendResetPasswordOtp(email, token);

    return {
      success: true,
      message: 'Password reset OTP sent successfully',
      token, // Return token for development helper
    };
  }

  async verifyResetToken(email: string, token: string) {
    const user = await this.usersService.findByResetToken(email, token);
    if (!user) {
      throw new BadRequestException('Invalid email or reset token');
    }
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }
    return { success: true };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }
    const user = await this.usersService.findByResetToken(email, token);
    if (!user) {
      throw new BadRequestException('Invalid email or reset token');
    }
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.resetPassword(email, token, hashed);
    return { success: true };
  }
}
