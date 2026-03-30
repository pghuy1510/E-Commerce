import { Controller, Post, Body } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() body) {
    const payload = {
      sub: 1, // giả lập user
      username: body.username,
    };

    const token = jwt.sign(payload, 'secretKey', {
      expiresIn: '1h',
    });

    return {
      access_token: token,
    };
  }
}
