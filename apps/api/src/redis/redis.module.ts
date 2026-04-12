import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

export { REDIS_CLIENT };

/**
 * Global Redis module. Exposes a single ioredis client + RedisService helpers.
 *
 * Resilience:
 * - `maxRetriesPerRequest: null` is required by BullMQ and lets the client keep
 *   retrying on transient network failures instead of throwing.
 * - `enableReadyCheck: true` ensures we don't send commands before the server is ready.
 * - `retryStrategy` uses exponential backoff capped at 3s.
 * - Connection events are logged so outages are visible.
 *
 * In production (AWS ElastiCache with TLS), set REDIS_TLS=true.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        const useTls = config.get<string>('REDIS_TLS', 'false') === 'true';

        const client = new Redis(url, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          lazyConnect: false,
          retryStrategy: (times) => Math.min(times * 200, 3000),
          reconnectOnError: (err) => {
            // Reconnect on READONLY (failover) — ElastiCache promotes a replica
            const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
            return targetErrors.some((t) => err.message.includes(t));
          },
          ...(useTls ? { tls: {} } : {}),
        });

        client.on('connect', () => {
          // eslint-disable-next-line no-console
          console.log('[redis] connected');
        });
        client.on('error', (err) => {
          // eslint-disable-next-line no-console
          console.error('[redis] error:', err.message);
        });
        client.on('close', () => {
          // eslint-disable-next-line no-console
          console.warn('[redis] connection closed');
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
