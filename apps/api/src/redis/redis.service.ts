import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Redis helpers used across auth:
 *
 * 1. Session store — maps sessionId → Firebase uid + metadata, with TTL
 * 2. Token blacklist — revoke a Firebase token JTI until it naturally expires
 * 3. Per-account login rate limiter — lock accounts after N failed attempts
 *    (separate from IP-based throttling to defeat distributed credential stuffing)
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly loginLimiter: RateLimiterRedis;

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {
    this.loginLimiter = new RateLimiterRedis({
      storeClient: this.client,
      keyPrefix: 'login_fail',
      points: 5,         // 5 failed attempts
      duration: 900,     // per 15 minutes
      blockDuration: 900, // lock for 15 minutes
    });
  }

  get raw(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  // ─── Session store ──────────────────────────────────────────────────────

  /**
   * Store a session: sessionId → { uid, role, tenantId, permissions, createdAt }.
   * TTL matches the server-side session cookie (default 8 hours).
   */
  async setSession(
    sessionId: string,
    data: {
      uid: string;
      role: string;
      tenantId: string | null;
      permissions: string[];
      email?: string;
      permVersion?: number;
      userPermVersion?: number;
    },
    ttlSeconds = 8 * 3600,
  ): Promise<void> {
    await this.client.set(
      `session:${sessionId}`,
      JSON.stringify({ ...data, createdAt: Date.now() }),
      'EX',
      ttlSeconds,
    );
  }

  async getSession(
    sessionId: string,
  ): Promise<{
    uid: string;
    role: string;
    tenantId: string | null;
    permissions: string[];
    email?: string;
    createdAt: number;
    permVersion?: number;
    userPermVersion?: number;
  } | null> {
    const raw = await this.client.get(`session:${sessionId}`);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // Back-compat: sessions created before the permissions field was added
      return { permissions: [], ...parsed };
    } catch {
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(`session:${sessionId}`);
  }

  async extendSession(sessionId: string, ttlSeconds = 8 * 3600): Promise<void> {
    await this.client.expire(`session:${sessionId}`, ttlSeconds);
  }

  // ─── Role permission versioning ─────────────────────────────────────────
  // When a role's permissions change, bump the version. Sessions store the
  // version at creation time; a mismatch forces a permissions re-resolve
  // without requiring a full re-login.

  async bumpRolePermissionVersion(role: string): Promise<number> {
    return this.client.incr(`role_perm_ver:${role}`);
  }

  async getRolePermissionVersion(role: string): Promise<number> {
    const v = await this.client.get(`role_perm_ver:${role}`);
    return v ? parseInt(v, 10) : 0;
  }

  // ─── Per-user permission versioning ─────────────────────────────────────
  // When a single user's permission overrides change, bump THEIR version.
  // The session resolver re-resolves perms for that user on their next request,
  // independent of the role-wide version. Keyed by Firebase UID.

  async bumpUserPermissionVersion(firebaseUid: string): Promise<number> {
    return this.client.incr(`user_perm_ver:${firebaseUid}`);
  }

  async getUserPermissionVersion(firebaseUid: string): Promise<number> {
    const v = await this.client.get(`user_perm_ver:${firebaseUid}`);
    return v ? parseInt(v, 10) : 0;
  }

  // ─── Token blacklist ────────────────────────────────────────────────────

  /**
   * Blacklist a Firebase token (by JTI or hash of token) until it naturally expires.
   * Use TTL = token's remaining lifetime in seconds.
   */
  async blacklistToken(tokenHash: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.client.set(`blacklist:${tokenHash}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    const res = await this.client.get(`blacklist:${tokenHash}`);
    return res !== null;
  }

  // ─── Login attempt lockout ──────────────────────────────────────────────

  /**
   * Check if an email is currently locked out. Throws a consumable error if so.
   */
  async assertLoginAllowed(email: string): Promise<void> {
    const res = await this.loginLimiter.get(email.toLowerCase());
    if (res !== null && res.consumedPoints > 5) {
      const secs = Math.round(res.msBeforeNext / 1000);
      throw new Error(`Account locked. Try again in ${secs}s.`);
    }
  }

  /**
   * Record a failed login. Returns remaining points before lockout.
   */
  async recordLoginFailure(email: string): Promise<number> {
    try {
      const res = await this.loginLimiter.consume(email.toLowerCase(), 1);
      return res.remainingPoints;
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        return 0;
      }
      throw err;
    }
  }

  async clearLoginFailures(email: string): Promise<void> {
    await this.loginLimiter.delete(email.toLowerCase());
  }

  // ─── Unauthorized access lockout ────────────────────────────────────────
  // If a user tries to access routes they don't have permission for repeatedly,
  // we lock them out. This defeats the "shoulder-surf an admin then try to
  // enumerate admin routes" attack.

  /** Lock a user. After this, session lookup + auth guard will reject them. */
  async lockUser(uid: string, reason: string, ttlSeconds = 3600): Promise<void> {
    await this.client.set(`user_locked:${uid}`, reason, 'EX', ttlSeconds);
  }

  async isUserLocked(uid: string): Promise<string | null> {
    return this.client.get(`user_locked:${uid}`);
  }

  async unlockUser(uid: string): Promise<void> {
    await this.client.del(`user_locked:${uid}`);
  }

  /**
   * Record an unauthorized access attempt. Returns the running count.
   * Counter resets after 1 hour of no new attempts.
   */
  async recordUnauthorizedAttempt(uid: string): Promise<number> {
    const key = `unauth_attempts:${uid}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, 3600);
    }
    return count;
  }

  async clearUnauthorizedAttempts(uid: string): Promise<void> {
    await this.client.del(`unauth_attempts:${uid}`);
  }

  /** Invalidate every active session for a user (used on lock). */
  async deleteAllSessionsForUser(uid: string): Promise<number> {
    // Scan for all sessions and remove ones matching uid. In a small system this
    // is fine; at large scale use a secondary index (set) `user_sessions:{uid}`.
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', 'session:*', 'COUNT', 200);
      cursor = next;
      if (keys.length === 0) continue;
      const values = await this.client.mget(...keys);
      const toDelete: string[] = [];
      values.forEach((raw, i) => {
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          if (data.uid === uid) toDelete.push(keys[i]);
        } catch {
          /* skip malformed */
        }
      });
      if (toDelete.length > 0) {
        deleted += await this.client.del(...toDelete);
      }
    } while (cursor !== '0');
    return deleted;
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => {
      this.client.disconnect();
    });
  }
}
