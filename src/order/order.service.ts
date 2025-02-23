import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHoaDonDto } from './order.dto';
import { HOA_DON, Counter, CounterDocument } from './order.schema';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(HOA_DON.name) private orderModel: Model<HOA_DON>,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
    private readonly redisService: RedisService
  ) {}

  private async generateBillCode(): Promise<string> {
    // 🔥 Lấy số thứ tự và tăng giá trị
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'bill' }, // Chỉ có 1 document duy nhất lưu số thứ tự
      { $inc: { seq: 1 } }, // Tăng giá trị seq lên 1
      { new: true, upsert: true } // Nếu chưa có thì tạo mới
    );

    const seq = counter.seq; // Lấy số thứ tự hiện tại

    // 🛠 Chuyển đổi số thứ tự thành mã AA00000000
    const letters = String.fromCharCode(
      65 + Math.floor(seq / 100_000_000),
      65 + ((seq / 100_000_000) % 26)
    );
    const numbers = String(seq % 100_000_000).padStart(8, '0');

    return `${letters}${numbers}`;
  }

  async create(
    dto: CreateHoaDonDto
  ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
    const { ttSanPham, ttNhanHang, ttMaGiam, ttVanChuyen, idKhachHang } = dto;

    let step1Success = false; // Đánh dấu giảm kho sản phẩm thành công
    let step2Success = false; // Đánh dấu giảm giá sản phẩm thành công
    let step3Success = false; // Đánh dấu sử dụng mã giảm giá thành công
    let step4Success = false; // Đánh dấu lưu hóa đơn thành công

    let hoaDon;

    try {
      // 🔻 Bước 1: Giảm kho sản phẩm
      const stockUpdateResult = await this.redisService.requestResponse(
        'giam_kho_san_pham',
        { ttSanPham }
      );
      if (!stockUpdateResult?.success) {
        throw new Error(stockUpdateResult?.error || 'Lý do không xác định');
      }
      step1Success = true;
      console.log(stockUpdateResult.data);
      // 🔻 Bước 2: Lấy giá khuyến mãi sản phẩm
      const productsResult = await this.redisService.requestResponse(
        'giam_san_pham_khuyen_mai',
        { dsSP: stockUpdateResult.data }
      );
      if (!productsResult?.success) {
        throw new Error(productsResult?.error || 'Lý do không xác định');
      }
      step2Success = true;
      console.log(productsResult.data);
      const productData = productsResult.data as any;
      const chiTietHoaDon = productData.map((item) => ({
        idSanPham_CTHD: item.idSanPham_CTHD,
        idTTBanHang_CTHD: item.idTTBanHang_CTHD,
        soLuong_CTHD: item.soLuong_CTHD,
        giaMua_CTHD: item.giaMua_CTHD,
      }));

      const tongTien = productData.reduce(
        (total: number, sp: { giaMua_CTHD: number; soLuong_CTHD: number }) =>
          total + sp.giaMua_CTHD * sp.soLuong_CTHD,
        0
      );

      // 🔻 Bước 3: Sử dụng mã giảm giá
      const vouchersResult = await this.redisService.requestResponse(
        'su_dung_ma_giam',
        { idKhachHang, dsVoucher: ttMaGiam }
      );
      if (!vouchersResult?.success) {
        throw new Error(vouchersResult?.error || 'Lý do không xác định');
      }
      step3Success = true;
      console.log(vouchersResult.data);
      let giamHoaDon = 0,
        giamVanChuyen = 0;
      const vouchers = vouchersResult.data as any;
      vouchers?.forEach((maGiam) => {
        const mucGiam = maGiam.tyLeGiam_MG
          ? Math.min((tongTien * maGiam.tyLeGiam_MG) / 100, maGiam.mucGiam_MG)
          : maGiam.mucGiam_MG;
        if (maGiam.loaiMa_MG === 0) {
          giamHoaDon += mucGiam;
        } else if (maGiam.loaiMa_MG === 1) {
          giamVanChuyen += mucGiam;
        }
      });

      // 🔻 Bước 4: Lưu hóa đơn vào database
      hoaDon = new this.orderModel({
        ma_HD: await this.generateBillCode(),
        tong_HD: tongTien,
        giamHoaDon_HD: giamHoaDon,
        vanChuyen_HD: ttVanChuyen.giaVanChuyen,
        giamVanChuyen_HD: giamVanChuyen,
        chiTietHoaDon: chiTietHoaDon,
        thongTinNhanHang: ttNhanHang,
        dsMaGiam_HD: ttMaGiam,
      });

      if (idKhachHang) {
        hoaDon.idKhachHang_HD = idKhachHang;
      }

      const hoaDonSaved = await hoaDon.save();
      step4Success = true;

      return { success: true, data: hoaDonSaved };
    } catch (error) {
      console.error('Lỗi khi tạo hóa đơn:', error.message);

      // 🔻 Rollback nếu bất kỳ bước nào thất bại
      try {
        if (step4Success) {
          await this.orderModel.deleteOne({
            ma_HD: hoaDon.ma_HD,
          });
        }

        if (step3Success) {
          await this.redisService.requestResponse('hoan_ma_giam', {
            idKhachHang,
            dsVoucher: ttMaGiam,
          });
        }

        if (step2Success) {
          await this.redisService.requestResponse('hoan_san_pham_khuyen_mai', {
            dsSP: ttSanPham,
          });
        }

        if (step1Success) {
          await this.redisService.requestResponse('hoan_kho_san_pham', {
            ttSanPham,
          });
        }
      } catch (rollbackError) {
        console.error('Lỗi khi rollback:', rollbackError.message);
        return {
          success: false,
          error: `Lỗi khi tạo hóa đơn: ${error.message}. Rollback thất bại: ${rollbackError.message}`,
        };
      }

      return { success: false, error: error.message || 'Lỗi khi lưu hóa đơn' };
    }
  }

  async updateState(
    idDonHang: string,
    trangThaiMoi: number
  ): Promise<{ success: boolean; data?: HOA_DON; error?: string }> {
    // 🔍 Kiểm tra xem đơn hàng có tồn tại không
    const donHang = await this.orderModel.findById(idDonHang);
    if (!donHang) {
      return { success: false, error: `Không tìm thấy đơn hàng ${idDonHang}.` };
    }

    if (trangThaiMoi === 6 && donHang.trangThai_HD !== 1) {
      return {
        success: false,
        error: `Không thể hủy đơn hàng ${idDonHang} do đơn hàng đã xác nhận.`,
      };
    }
    // ✅ Cập nhật trạng thái
    donHang.trangThai_HD = trangThaiMoi;
    const donHangSaved = await donHang.save();

    return { success: true, data: donHangSaved };
  }

  async confirmCancel(idDonHang: string): Promise<any> {
    // 🔍 Kiểm tra đơn hàng có tồn tại không
    const donHang = await this.orderModel.findById(idDonHang);
    if (!donHang) {
      return { success: false, error: `Không tìm thấy đơn hàng ${idDonHang}.` };
    }

    // 🔍 Kiểm tra trạng thái, chỉ được hủy nếu đơn hàng chưa hoàn tất
    if (donHang.trangThai_HD !== 6) {
      return {
        success: false,
        error: `Đơn hàng ${idDonHang} không thể hủy do đã được xử lý.`,
      };
    }

    // ✅ Cập nhật trạng thái thành "đã xác nhận hủy"
    donHang.trangThai_HD = 7;

    try {
      await this.redisService.requestResponse('hoan_san_pham_khuyen_mai', {
        dsSP: donHang.chiTietHoaDon,
      });
      await this.redisService.requestResponse('hoan_ma_giam', {
        idKhachHang: donHang.idKhachHang_HD,
        dsVoucher: donHang.dsMaGiam_HD,
      });
      await this.redisService.requestResponse('hoan_kho_san_pham', {
        ttSanPham: donHang.chiTietHoaDon,
      });

      await donHang.save();
    } catch (error) {
      return { success: false, error: error };
    }
    return { success: true };
  }

  // 🟢 Lấy tất cả hóa đơn theo trạng thái
  async findAll(state: number): Promise<HOA_DON[]> {
    const query = state === 0 ? {} : { trangThai_HD: state };
    return this.orderModel.find(query).exec();
  }

  // 🔵 Lấy một hóa đơn theo ID
  async findOne(idOrder: string): Promise<HOA_DON> {
    const order = await this.orderModel.findById(idOrder).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy hóa đơn với ID: ${idOrder}`);
    }
    return order;
  }

  // 🟠 Lấy tất cả hóa đơn của một người dùng cụ thể
  async findUserOrders(idUser: string): Promise<HOA_DON[]> {
    return this.orderModel.find({ idNguoiDung: idUser }).exec();
  }
}
