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

interface AuthTokenUser {
  id: number;
  username: string;
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
  ) {}

  async register(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const user = await this.usersService.createUser(username, password);

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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<StringValue>('JWT_EXPIRES'),
      }),
    };
  }
}
