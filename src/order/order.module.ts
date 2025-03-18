import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import {
  DON_HANG,
  DON_HANGSchema,
  Counter,
  CounterSchema,
} from './order.schema';
import { OrderService } from './order.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DON_HANG.name, schema: DON_HANGSchema },
    ]),
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
