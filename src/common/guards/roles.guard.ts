import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: UserRole } }>();

    const user = req.user;

    // Foydalanuvchi login qilmagan — login sahifasiga redirect
    if (!user) {
      const isApiRoute = req.url?.startsWith('/api/');
      if (!isApiRoute) {
        const res = context.switchToHttp().getResponse<Response>();
        res.redirect('/login');
        return false;
      }
      return false;
    }

    return user.role ? requiredRoles.includes(user.role) : false;
  }
}
