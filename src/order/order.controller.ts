import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateDonHangDto } from './order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order_create')
  async createOrder(@Payload() createDonHangDto: CreateDonHangDto) {
    return await this.orderService.create(createDonHangDto);
  }

  @MessagePattern('order_update')
  async updateStateOrder(
    @Payload() data: { idSanPham: string; state: number }
  ) {
    return this.orderService.updateState(data.idSanPham, data.state);
  }

  @MessagePattern('order_confirm-cancel')
  async cancelOrder(@Payload() idSanPham: string) {
    return this.orderService.confirmCancel(idSanPham);
  }

  @MessagePattern('order_find-all')
  async getAllOrders(
    @Payload()
    payload: {
      limit: number;
      page: number;
      state: number;
    }
  ) {
    return this.orderService.findAll(
      payload.state,
      payload.page,
      payload.limit
    );
  }

  @MessagePattern('order_find-one')
  async getOrder(@Payload() id: string) {
    return this.orderService.findOne(id);
  }

  @MessagePattern('order_find-user-orders')
  async getUserOrders(@Payload() idUser: string) {
    return this.orderService.findUserOrders(idUser);
  }
}
