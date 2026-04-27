import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const sessionCookie = request.cookies?.__session as string | undefined;

    // Prefer HttpOnly session cookie (web portals) over raw bearer (mobile/API).
    if (sessionCookie) {
      const session = await this.redis.getSession(sessionCookie);
      if (!session) {
        throw new UnauthorizedException('Session expired or invalid');
      }
      request.user = {
        uid: session.uid,
        firebaseUid: session.uid,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
        permissions: [], // claims are already verified at session-creation time
      };
      return true;
    }

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    const tokenHash = createHash('sha256').update(token).digest('hex');

    if (await this.redis.isTokenBlacklisted(tokenHash)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      // checkRevoked: true consults Firebase's server-side revocation list
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      request.user = {
        uid: decodedToken.uid,
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        phone: decodedToken.phone_number,
        role: (decodedToken.role as string) ?? 'customer',
        tenantId: (decodedToken['tenantId'] as string | null) ?? null,
        permissions: (decodedToken['permissions'] as string[]) || [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
