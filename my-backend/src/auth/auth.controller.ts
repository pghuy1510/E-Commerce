import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './google-login.dto';

interface AuthCredentialsDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body.username, body.password);
  }

  @Post('login')
  login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body.username, body.password);
  }

  @Post('google')
  googleLogin(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogleIdToken(body.idToken);
  }
}
