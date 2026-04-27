/**
 * Injection token for the shared ioredis client.
 * Kept in its own file so providers can import it without pulling in the
 * entire RedisModule (avoids the "undefined dependency" circular import).
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';
