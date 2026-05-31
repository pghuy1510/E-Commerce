import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // If there is an error or the user is not found, return null (meaning they are anonymous/guest)
    if (err || !user) {
      return null;
    }
    return user;
  }
}
