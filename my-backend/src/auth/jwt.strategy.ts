import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 🔥 lấy từ header
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // 🔥 phải giống lúc sign token
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload); // 🔥 debug payload
    return {
      id: payload.sub,
      username: payload.username,
    };
  }
}
