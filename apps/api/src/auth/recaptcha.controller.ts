import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, seconds } from '@nestjs/throttler';
import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

class VerifyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token!: string;

  @IsString()
  @IsIn(['admin_login'])
  action!: string;
}

interface GoogleRecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Controller('auth/recaptcha')
export class RecaptchaController {
  private readonly logger = new Logger(RecaptchaController.name);
  private readonly MIN_SCORE = 0.5;

  constructor(private configService: ConfigService) {}

  /**
   * Verifies a reCAPTCHA v3 token.
   * Stricter throttling than the global limit to protect against credential-stuffing
   * attempts that cycle through tokens.
   */
  @Post('verify')
  @HttpCode(200)
  @Throttle({ auth: { limit: 10, ttl: seconds(60) } })
  async verify(@Body() body: VerifyDto): Promise<{ success: boolean }> {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secretKey || secretKey === 'your_recaptcha_v3_secret_key_here') {
      this.logger.error('RECAPTCHA_SECRET_KEY is not configured');
      throw new ServiceUnavailableException('reCAPTCHA not configured on server.');
    }

    const params = new URLSearchParams({
      secret: secretKey,
      response: body.token,
    });

    let data: GoogleRecaptchaResponse;
    try {
      const res = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?${params.toString()}`,
        { method: 'POST' },
      );
      data = (await res.json()) as GoogleRecaptchaResponse;
    } catch (err) {
      this.logger.error('reCAPTCHA verification request failed', err);
      throw new ServiceUnavailableException('Could not reach reCAPTCHA verification service.');
    }

    if (!data.success) {
      this.logger.warn(`reCAPTCHA failed: ${data['error-codes']?.join(',') ?? 'unknown'}`);
      throw new BadRequestException('reCAPTCHA verification failed.');
    }

    // Action mismatch = token reused from a different form (replay attack)
    if (data.action && data.action !== body.action) {
      this.logger.warn(`reCAPTCHA action mismatch: expected ${body.action}, got ${data.action}`);
      throw new BadRequestException('reCAPTCHA action mismatch.');
    }

    // Validate hostname in production to prevent token reuse from other sites
    const allowedHostnames = this.configService
      .get<string>('RECAPTCHA_ALLOWED_HOSTNAMES', 'localhost')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    if (data.hostname && !allowedHostnames.includes(data.hostname)) {
      this.logger.warn(`reCAPTCHA hostname not allowed: ${data.hostname}`);
      throw new BadRequestException('reCAPTCHA hostname mismatch.');
    }

    // Score below threshold = likely bot
    if (data.score !== undefined && data.score < this.MIN_SCORE) {
      this.logger.warn(`reCAPTCHA low score: ${data.score}`);
      throw new BadRequestException('reCAPTCHA score too low.');
    }

    return { success: true };
  }
}
