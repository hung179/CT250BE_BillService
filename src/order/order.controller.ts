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

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @Body() createHoaDonDto: CreateHoaDonDto
  ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
    return await this.orderService.create(createHoaDonDto);
  }

  @Put(':id')
  async updateStateOrder(
    @Param('id') idSanPham: string,
    @Query('s') state: number
  ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
    return this.orderService.updateState(idSanPham, state);
  }

  @Delete(':id')
  async cancelOrder(@Param('id') idSanPham: string): Promise<any> {
    return this.orderService.confirmCancel(idSanPham);
  }

  @Get()
  async getAllOrders(@Query('s') state: number = 0) {
    return this.orderService.findAll(state);
  }

  @Get(':id')
  async getOrder(@Param('id') idOrder: string) {
    return this.orderService.findOne(idOrder);
  }

  @Get('user/:id')
  async getUserOrders(@Param('id') idUser: string) {
    return this.orderService.findUserOrders(idUser);
  }
}
