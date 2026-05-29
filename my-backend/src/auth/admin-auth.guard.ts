import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Quyền truy cập bị từ chối. Cần quyền Admin.');
    }
    
    return true;
  }
}
