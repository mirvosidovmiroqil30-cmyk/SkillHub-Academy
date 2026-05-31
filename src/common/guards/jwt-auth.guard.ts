import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const req = context
      .switchToHttp()
      .getRequest<{ user?: { id?: number; role?: string } }>();
    if (req.user?.id) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const req = context.switchToHttp().getRequest<{ url?: string }>();
      const res = context.switchToHttp().getResponse<Response>();

      const isApiRoute = req.url?.startsWith('/api/');
      if (isApiRoute) {
        return super.handleRequest(err, user, _info, context);
      }

      res.redirect('/login');
      return user;
    }
    return user;
  }
}
