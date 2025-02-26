/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateHoaDonDto } from './order.dto';
import { HOA_DON } from './order.schema';
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
  // @Post()
  // async createOrder(
  //   @Body() createHoaDonDto: CreateHoaDonDto
  // ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
  //   return await this.orderService.create(createHoaDonDto);
  // }

  // @Put(':id')
  // async updateStateOrder(
  //   @Param('id') idSanPham: string,
  //   @Query('s') state: number
  // ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
  //   return this.orderService.updateState(idSanPham, state);
  // }

  // @Delete(':id')
  // async cancelOrder(@Param('id') idSanPham: string): Promise<any> {
  //   return this.orderService.confirmCancel(idSanPham);
  // }

  // @Get()
  // async getAllOrders(@Query('s') state: number = 0) {
  //   return this.orderService.findAll(state);
  // }

  // @Get(':id')
  // async getOrder(@Param('id') idOrder: string) {
  //   return this.orderService.findOne(idOrder);
  // }

  // @Get('user/:id')
  // async getUserOrders(@Param('id') idUser: string) {
  //   return this.orderService.findUserOrders(idUser);
  // }
}
