import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { HOA_DON, HOA_DONSchema, Counter, CounterSchema } from './order.schema';
import { OrderService } from './order.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HOA_DON.name, schema: HOA_DONSchema }]),
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
