import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from '../lib/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw new UnauthorizedException('No valid session');
      }

      request.user = session.user;
      request.session = session.session;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }
}