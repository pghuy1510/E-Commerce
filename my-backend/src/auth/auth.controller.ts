import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './google-login.dto';

interface AuthCredentialsDto {
  username: string;
  password: string;
  email?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body.username, body.password, body.email);
  }

  @Post('login')
  login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body.username, body.password);
  }

  @Post('google')
  googleLogin(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogleIdToken(body.idToken);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-reset-token')
  verifyResetToken(@Body() body: { email: string; token: string }) {
    return this.authService.verifyResetToken(body.email, body.token);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; token: string; newPassword: any }) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword);
  }

  @Post('register-guest-convert')
  registerGuestConvert(@Body() body: { email: string; password: any }) {
    return this.authService.registerGuestConvert(body.email, body.password);
  }
}
