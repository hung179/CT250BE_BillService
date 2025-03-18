import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'ngayTao_DH', updatedAt: 'ngayCapNhat_DH' },
})
export class DON_HANG extends Document {
  @Prop({ unique: true })
  ma_DH?: string;

  @Prop({ default: null })
  idKhachHang_DH?: string;

  @Prop({ required: true, default: 1 }) // Trạng thái hóa đơn [1: Chờ xác nhận / 2: Chờ giao hàng / 3: Đang giao /  4: Đã giao / 5: Hủy đơn / 6: Đã hủy]
  trangThai_DH: number;

  @Prop({ required: true }) // Phí vận chuyển trước giảm giá
  vanChuyen_DH: number;

  // Nhúng thông tin chi tiết hóa đơn (danh sách sản phẩm)
  @Prop({
    type: [
      {
        idSanPham_CTDH: { type: String, required: true },
        maSanPham_CTDH: { type: Number, required: true },
        idTTBanHang_CTDH: { type: String, required: true },
        tenSanPham_CTDH: { type: String, required: true },
        soLuong_CTDH: { type: Number, required: true, min: 1 },
        giaMua_CTDH: { type: Number, required: true },
      },
    ],
    required: true,
  })
  chiTiet_DH: {
    idSanPham_CTDH: string;
    maSanPham_CTDH: number;
    idTTBanHang_CTDH: string;
    tenSanPham_CTDH: string;
    soLuong_CTDH: number;
    giaMua_CTDH: number;
  }[];

  // Nhúng thông tin nhận hàng
  @Prop({
    type: {
      sdt_NH: { type: String, required: true },
      hoTen_NH: { type: String, required: true },
      diaChi_NH: {
        tinh_DC: { type: String, required: true },
        huyen_DC: { type: String, required: true },
        xa_DC: { type: String, required: true },
        chiTiet_DC: { type: String, required: true },
      },
    },
    required: true,
  })
  ttNhanHang_DH: {
    sdt_NH: string;
    hoTen_NH: string;
    diaChi: {
      tinh_DC: string;
      huyen_DC: string;
      xa_DC: string;
      chiTiet_DC: string;
    };
  };
}

export const DON_HANGSchema = SchemaFactory.createForClass(DON_HANG);

export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, default: 1 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
