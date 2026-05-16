import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    Logger,
    Post,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, seconds } from '@nestjs/throttler';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { createHash, randomBytes } from 'crypto';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

class ReportViolationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  path!: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  requiredPermission?: string;
}

const SESSION_COOKIE = '__session';
const SESSION_TTL_SECONDS = 8 * 3600;
const UNAUTHORIZED_LOCK_THRESHOLD = 5; // lock after 5 403 attempts in 1h
const USER_LOCK_DURATION = 3600; // 1 hour

/**
 * Server-side session management.
 *
 * Flow:
 *   1. Client signs in with Firebase and gets an ID token.
 *   2. Client POSTs ID token to /auth/session.
 *   3. Server verifies token, stores opaque sessionId → {uid, role, permissions}
 *      in Redis, sets HttpOnly cookie.
 *   4. Every subsequent request: guard reads cookie → looks up session → enforces
 *      role + permissions + lock state.
 *
 * Security features:
 *   - HttpOnly cookie: XSS cannot steal the session
 *   - Server-side revocation: logout invalidates everywhere instantly
 *   - Lock mechanism: 5 unauthorized attempts → user locked 1h + all sessions killed
 */
@Controller('auth/session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(200)
  @Throttle({ auth: { limit: 10, ttl: seconds(60) } })
  async createSession(
    @Body() body: CreateSessionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ role: string; tenantId: string | null; permissions: string[] }> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(body.idToken, true);
    } catch (err) {
      this.logger.warn(`Session creation failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired ID token.');
    }

    const role = (decoded.role as string) ?? 'customer';
    const tenantId = (decoded['tenantId'] as string | null) ?? null;
    const tokenPermissions = (decoded['permissions'] as string[]) ?? [];
    const permissions = await this.resolvePermissions(role, tokenPermissions, decoded.uid);

    if (role !== 'system_admin' && role !== 'pharmacy_admin') {
      throw new ForbiddenException('This endpoint is for admin and pharmacy portals only.');
    }

    // If this user is currently locked (e.g. they already have one session locked),
    // refuse to create a new one.
    const lockReason = await this.redis.isUserLocked(decoded.uid);
    if (lockReason) {
      throw new ForbiddenException(`Account temporarily locked: ${lockReason}`);
    }

    const [permVersion, userPermVersion] = await Promise.all([
      this.redis.getRolePermissionVersion(role),
      this.redis.getUserPermissionVersion(decoded.uid),
    ]);

    const sessionId = randomBytes(32).toString('base64url');
    await this.redis.setSession(
      sessionId,
      {
        uid: decoded.uid,
        role,
        tenantId,
        permissions,
        email: decoded.email,
        permVersion,
        userPermVersion,
      },
      SESSION_TTL_SECONDS,
    );

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: SESSION_TTL_SECONDS * 1000,
      path: '/',
    });

    return { role, tenantId, permissions };
  }

  /**
   * Resolve effective permissions for a session.
   *
   * Resolution order (highest priority first):
   *   1. UserPermissionOverride.isGranted=true   — force-grant
   *   2. UserPermissionOverride.isGranted=false  — force-revoke (wins over grant)
   *   3. User.roleRef.permissions                — dynamic Role bundle
   *   4. UserTypePermission (legacy role string) — backward-compat fallback
   *   5. tokenPermissions (from Firebase claims) — last-resort fallback
   */
  private async resolvePermissions(
    role: string,
    fallback: string[],
    firebaseUid?: string,
  ): Promise<string[]> {
    // 1. Try the dynamic Role + Override path (requires the user to exist in DB)
    if (firebaseUid) {
      const user = await this.prisma.user.findUnique({
        where: { firebaseUid },
        select: {
          id: true,
          roleRef: {
            select: {
              isActive: true,
              permissions: {
                include: { permission: { select: { permissionCode: true } } },
              },
            },
          },
        },
      });

      if (user?.roleRef?.isActive) {
        const rolePerms = new Set(
          user.roleRef.permissions.map((p) => p.permission.permissionCode),
        );

        // Apply UserPermissionOverride on top
        const overrides = await this.prisma.userPermissionOverride.findMany({
          where: { userId: user.id },
          include: { permission: { select: { permissionCode: true } } },
        });
        for (const o of overrides) {
          if (o.isGranted) rolePerms.add(o.permission.permissionCode);
          else rolePerms.delete(o.permission.permissionCode);
        }

        return Array.from(rolePerms);
      }
    }

    // 2. Legacy fallback — UserTypePermission keyed by role string
    const rows = await this.prisma.userTypePermission.findMany({
      where: { userTypeCode: role, isEnabled: true },
      include: { permission: { select: { permissionCode: true } } },
    });

    const dbPermissions = rows.map((r) => r.permission.permissionCode);
    if (dbPermissions.length > 0) {
      return dbPermissions;
    }

    // 3. Last-resort fallback — Firebase token claims
    return fallback;
  }

  /**
   * Returns current session info. Used by:
   *  - Next.js middleware to authorize route navigation
   *  - Login page to detect already-authenticated users
   */
  @Get()
  async getSession(@Req() req: Request): Promise<{
    authenticated: boolean;
    role?: string;
    tenantId?: string | null;
    permissions?: string[];
    locked?: boolean;
  }> {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (!sessionId || typeof sessionId !== 'string') {
      return { authenticated: false };
    }

    const session = await this.redis.getSession(sessionId);
    if (!session) {
      return { authenticated: false };
    }

    // Short-circuit locked accounts. The cookie exists but the lock overrides.
    const lockReason = await this.redis.isUserLocked(session.uid);
    if (lockReason) {
      return { authenticated: false, locked: true };
    }

    // If role-level OR user-level permissions were updated since this session
    // was created, re-resolve and patch the session in-place (no re-login).
    const [currentRoleVersion, currentUserVersion] = await Promise.all([
      this.redis.getRolePermissionVersion(session.role),
      this.redis.getUserPermissionVersion(session.uid),
    ]);
    let { permissions } = session;
    const roleStale = (session.permVersion ?? 0) < currentRoleVersion;
    const userStale = (session.userPermVersion ?? 0) < currentUserVersion;

    if (roleStale || userStale) {
      permissions = await this.resolvePermissions(session.role, session.permissions, session.uid);
      await this.redis.setSession(
        sessionId,
        {
          ...session,
          permissions,
          permVersion: currentRoleVersion,
          userPermVersion: currentUserVersion,
        },
        SESSION_TTL_SECONDS,
      );
      this.logger.log(
        `Permissions re-resolved for uid=${session.uid} role=${session.role} ` +
        `[role v${session.permVersion ?? 0}→v${currentRoleVersion}, ` +
        `user v${session.userPermVersion ?? 0}→v${currentUserVersion}]`,
      );
    } else {
      // Rolling session: refresh TTL on activity
      await this.redis.extendSession(sessionId, SESSION_TTL_SECONDS);
    }

    return {
      authenticated: true,
      role: session.role,
      tenantId: session.tenantId,
      permissions,
    };
  }

  /**
   * Called by the Next.js middleware when the client navigates to a path their
   * session does NOT grant access to. We count these — 5 in an hour and the user
   * gets locked (all sessions killed, cannot create a new one for 1h).
   *
   * This defeats client-side permission bypass: even if an attacker forges a
   * request to a protected page, they burn through their attempt budget quickly.
   */
  @Post('violation')
  @HttpCode(204)
  @Throttle({ auth: { limit: 20, ttl: seconds(60) } })
  async reportViolation(
    @Body() body: ReportViolationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (!sessionId || typeof sessionId !== 'string') return;

    const session = await this.redis.getSession(sessionId);
    if (!session) return;

    const count = await this.redis.recordUnauthorizedAttempt(session.uid);
    this.logger.warn(
      `Unauthorized attempt #${count} — uid=${session.uid} path=${body.path} needed=${body.requiredPermission ?? 'n/a'}`,
    );

    if (count >= UNAUTHORIZED_LOCK_THRESHOLD) {
      const reason = `Too many unauthorized access attempts (${count})`;
      await this.redis.lockUser(session.uid, reason, USER_LOCK_DURATION);
      const killed = await this.redis.deleteAllSessionsForUser(session.uid);
      this.logger.error(
        `LOCKED uid=${session.uid} — ${reason}. Killed ${killed} session(s).`,
      );

      const isProd = this.config.get<string>('NODE_ENV') === 'production';
      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
      });
    }
  }

  @Delete()
  @HttpCode(204)
  async destroySession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId && typeof sessionId === 'string') {
      await this.redis.deleteSession(sessionId);
    }

    const bearer = req.headers.authorization;
    if (bearer?.startsWith('Bearer ')) {
      const token = bearer.split('Bearer ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        const hash = createHash('sha256').update(token).digest('hex');
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        await this.redis.blacklistToken(hash, ttl);
      } catch {
        /* token already invalid */
      }
    }

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
    });
  }
}
