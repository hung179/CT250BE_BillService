import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy
  ) {}

  // 🔥 Gửi sự kiện (Fire-and-Forget)
  publish(channel: string, message: any) {
    this.redisClient.emit(channel, message);
  }

  // 🔥 Gửi request và chờ phản hồi (Request-Response)
  async requestResponse<T>(
    channel: string,
    message: any
  ): Promise<{ success: boolean; data?: T; error?: any }> {
    return lastValueFrom(this.redisClient.send(channel, message));
  }
}
