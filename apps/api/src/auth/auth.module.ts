import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RedisModule } from '../redis/redis.module';
import { RecaptchaController } from './recaptcha.controller';
import { SessionController } from './session.controller';

@Module({
  imports: [RedisModule],
  controllers: [RecaptchaController, SessionController],
  providers: [FirebaseAuthGuard, RolesGuard],
  exports: [FirebaseAuthGuard, RolesGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        }),
      });
    }
  }
}
