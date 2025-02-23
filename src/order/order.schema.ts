import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'ngayTao_HD', updatedAt: 'ngayCapNhat_HD' },
})
export class HOA_DON extends Document {
  @Prop({ unique: true })
  ma_HD?: string;

  @Prop({ default: null })
  idKhachHang_HD?: string;

  @Prop({ required: true, default: 1 }) // Trạng thái hóa đơn [1: Chờ xác nhận / 2: Chờ giao hàng / 3: Đang giao /  4: Đã giao / 5: Đã nhận / 6: Hủy đơn / 7: Đã hủy]
  trangThai_HD: number;

  @Prop({ required: true }) // Tổng giá trị hóa đơn trước giảm giá
  tong_HD: number;

  @Prop({ default: null }) // Tổng sau khi áp dụng mã giảm giá
  giamHoaDon_HD?: number;

  @Prop({ required: true }) // Phí vận chuyển trước giảm giá
  vanChuyen_HD: number;

  @Prop({ default: null }) // Phí vận chuyển sau khi áp dụng mã giảm giá (nếu có)
  giamVanChuyen_HD?: number;

  @Prop({ default: null })
  dsMaGiam_HD?: string[];

  // Nhúng thông tin chi tiết hóa đơn (danh sách sản phẩm)
  @Prop({
    type: [
      {
        idSanPham_CTHD: { type: String, required: true },
        idTTBanHang_CTHD: { type: String, required: true },
        soLuong_CTHD: { type: Number, required: true, min: 1 },
        giaMua_CTHD: { type: Number, required: true },
      },
    ],
    required: true,
  })
  chiTietHoaDon: {
    idSanPham_CTHD: string;
    idTTBanHang_CTHD: string;
    soLuong_CTHD: number;
    giaMua_CTHD: number;
  }[];

  // Nhúng thông tin nhận hàng
  @Prop({
    type: {
      sdt_NH: { type: String, required: true },
      hoTen_NH: { type: String, required: true },
      diChi_NH: {
        tinh_DC: { type: String, required: true },
        huyen_DC: { type: String, required: true },
        xa_DC: { type: String, required: true },
        chiTiet_DC: { type: String, required: true },
      },
    },
    required: true,
  })
  thongTinNhanHang: {
    sdt_NH: string;
    hoTen_NH: string;
    diChi: {
      tinh_DC: string;
      huyen_DC: string;
      xa_DC: string;
      chiTiet_DC: string;
    };
  };
}

export const HOA_DONSchema = SchemaFactory.createForClass(HOA_DON);

export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, default: 1 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
