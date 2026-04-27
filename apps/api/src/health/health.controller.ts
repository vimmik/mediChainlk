import { Controller, Get, HttpCode, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/**
 * Health endpoints for load balancer probes.
 *
 * - /health/live  → process is alive (used by ECS/K8s liveness probe)
 *                   Always 200 unless the Node event loop is dead.
 * - /health/ready → dependencies are reachable (used by ALB target-group health check)
 *                   Returns 503 if DB or Redis is down, so the LB stops sending traffic.
 *
 * Both are excluded from rate limiting so a load balancer storm doesn't deregister
 * healthy instances.
 */
@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'medichainlk-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @HttpCode(200)
  liveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  async readiness() {
    const [dbOk, redisOk] = await Promise.all([
      this.pingDb(),
      this.redis.ping(),
    ]);

    const ok = dbOk && redisOk;
    const body = {
      status: ok ? 'ready' : 'degraded',
      checks: { database: dbOk, redis: redisOk },
      timestamp: new Date().toISOString(),
    };

    if (!ok) {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }

  private async pingDb(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
