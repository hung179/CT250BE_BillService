import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateHoaDonDto } from './order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order_create')
  async createOrder(@Payload() createHoaDonDto: CreateHoaDonDto) {
    return await this.orderService.create(createHoaDonDto);
  }

  @MessagePattern('order_update')
  async updateStateOrder(@Payload() idSanPham: string, state: number) {
    return this.orderService.updateState(idSanPham, state);
  }

  @MessagePattern('order_confirm-cancel')
  async cancelOrder(@Payload() idSanPham: string) {
    return this.orderService.confirmCancel(idSanPham);
  }

  @MessagePattern('order_find-all')
  async getAllOrders(@Payload() state: number) {
    return this.orderService.findAll(state);
  }

  @MessagePattern('order_find-one')
  async getOrder(@Payload() id: string) {
    return this.orderService.findOne(id);
  }

  @MessagePattern('order_find-user-orders')
  async getUserOrders(@Payload() idUser: string) {
    return this.orderService.findUserOrders(idUser);
  }

  @MessagePattern('order_test')
  test(@Payload() data: string) {
    console.log(data);
    return 'Hello';
  }
}
