import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDonHangDto } from './order.dto';
import { DON_HANG, Counter, CounterDocument } from './order.schema';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(DON_HANG.name) private orderModel: Model<DON_HANG>,
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

  // async create(
  //   dto: CreateDonHangDto
  // ): Promise<{ success: boolean; data?: DON_HANG; error?: any }> {
  //   const { ttSanPham, ttNhanHang, ttMaGiam, ttVanChuyen, idKhachHang } = dto;

  //   let step1Success = false; // Đánh dấu giảm kho sản phẩm thành công
  //   let step2Success = false; // Đánh dấu giảm giá sản phẩm thành công
  //   let step3Success = false; // Đánh dấu sử dụng mã giảm giá thành công
  //   let step4Success = false; // Đánh dấu lưu hóa đơn thành công

  //   let DonHang;

  //   try {
  //     // 🔻 Bước 1: Giảm kho sản phẩm
  //     const stockUpdateResult = await this.redisService.requestResponse(
  //       'giam_kho_san_pham',
  //       { ttSanPham }
  //     );
  //     if (!stockUpdateResult?.success) {
  //       throw new Error(stockUpdateResult?.error || 'Lý do không xác định');
  //     }
  //     step1Success = true;
  //     // 🔻 Bước 2: Lấy giá khuyến mãi sản phẩm
  //     const productsResult = await this.redisService.requestResponse(
  //       'giam_san_pham_khuyen_mai',
  //       { dsSP: stockUpdateResult.data }
  //     );
  //     if (!productsResult?.success) {
  //       throw new Error(productsResult?.error || 'Lý do không xác định');
  //     }
  //     step2Success = true;
  //     const productData = productsResult.data as any;
  //     const chiTietDonHang = productData.map((item) => ({
  //       idSanPham_CTDH: item.idSanPham_CTDH,
  //       idTTBanHang_CTDH: item.idTTBanHang_CTDH,
  //       soLuong_CTDH: item.soLuong_CTDH,
  //       giaMua_CTDH: item.giaMua_CTDH,
  //     }));

  //     const tongTien = productData.reduce(
  //       (total: number, sp: { giaMua_CTDH: number; soLuong_CTDH: number }) =>
  //         total + sp.giaMua_CTDH * sp.soLuong_CTDH,
  //       0
  //     );

  //     // 🔻 Bước 3: Sử dụng mã giảm giá
  //     const vouchersResult = await this.redisService.requestResponse(
  //       'su_dung_ma_giam',
  //       { idKhachHang, tongTien, dsVoucher: ttMaGiam }
  //     );
  //     if (!vouchersResult?.success) {
  //       throw new Error(vouchersResult?.error || 'Lý do không xác định');
  //     }
  //     step3Success = true;
  //     let giamDonHang = 0,
  //       giamVanChuyen = 0;
  //     const vouchers = vouchersResult.data as any;
  //     vouchers?.forEach((maGiam) => {
  //       const mucGiam = maGiam.tyLeGiam_MG
  //         ? Math.min((tongTien * maGiam.tyLeGiam_MG) / 100, maGiam.mucGiam_MG)
  //         : maGiam.mucGiam_MG;
  //       if (maGiam.loaiMa_MG === 0) {
  //         giamDonHang += mucGiam;
  //       } else if (maGiam.loaiMa_MG === 1) {
  //         giamVanChuyen += mucGiam;
  //       }
  //     });

  //     // 🔻 Bước 4: Lưu hóa đơn vào database
  //     DonHang = new this.orderModel({
  //       ma_DH: await this.generateBillCode(),
  //       tong_DH: tongTien,
  //       giamDonHang_DH: giamDonHang,
  //       vanChuyen_DH: ttVanChuyen.giaVanChuyen,
  //       giamVanChuyen_DH: giamVanChuyen,
  //       chiTiet: chiTietDonHang,
  //       ttNhanHang: ttNhanHang,
  //       dsMaGiam_DH: ttMaGiam,
  //     });

  //     if (idKhachHang) {
  //       DonHang.idKhachHang_DH = idKhachHang;
  //     }

  //     const DonHangSaved = await DonHang.save();
  //     step4Success = true;

  //     return { success: true, data: DonHangSaved };
  //   } catch (error) {
  //     // 🔻 Rollback nếu bất kỳ bước nào thất bại
  //     try {
  //       if (step4Success) {
  //         await this.orderModel.deleteOne({
  //           ma_DH: DonHang.ma_DH,
  //         });
  //       }

  //       if (step3Success) {
  //         await this.redisService.requestResponse('hoan_ma_giam', {
  //           idKhachHang,
  //           dsVoucher: ttMaGiam,
  //         });
  //       }

  //       if (step2Success) {
  //         await this.redisService.requestResponse('hoan_san_pham_khuyen_mai', {
  //           dsSP: ttSanPham,
  //         });
  //       }

  //       if (step1Success) {
  //         await this.redisService.requestResponse('hoan_kho_san_pham', {
  //           ttSanPham,
  //         });
  //       }
  //     } catch (rollbackError) {
  //       return {
  //         success: false,
  //         error: rollbackError,
  //       };
  //     }
  //     return { success: false, error: error };
  //   }
  // }

  async create(
    dto: CreateDonHangDto
  ): Promise<{ success: boolean; data?: DON_HANG; error?: any }> {
    const { ttSanPham, ttNhanHang, giaVanChuyen, idKhachHang } = dto;

    let step1Success = false;
    let step2Success = false;

    let donHang;

    try {
      const productsResult = await this.redisService.requestResponse(
        'giam_kho_san_pham',
        ttSanPham
      );
      if (!productsResult?.success) {
        throw new Error(productsResult?.error || 'Lý do không xác định');
      }
      step1Success = true;

      const productData = productsResult.data as any;

      const chiTietDonHang = productData.map((item) => ({
        idSanPham_CTDH: item.idSanPham_CTDH,
        maSanPham_CTDH: item.maSanPham_CTDH,
        idTTBanHang_CTDH: item.idTTBanHang_CTDH,
        tenSanPham_CTDH: item.tenSanPham_CTDH,
        soLuong_CTDH: item.soLuong_CTDH,
        giaMua_CTDH: item.giaMua_CTDH,
      }));

      donHang = new this.orderModel({
        ma_DH: await this.generateBillCode(),
        vanChuyen_DH: giaVanChuyen,
        chiTiet_DH: chiTietDonHang,
        ttNhanHang_DH: ttNhanHang,
      });

      if (idKhachHang) {
        donHang.idKhachHang_DH = idKhachHang;
      }

      const DonHangSaved = await donHang.save();
      step2Success = true;

      return { success: true, data: DonHangSaved };
    } catch (error) {
      // 🔻 Rollback nếu bất kỳ bước nào thất bại
      try {
        if (step2Success) {
          await this.orderModel.deleteOne({
            ma_DH: donHang.ma_DH,
          });
        }
        if (step1Success) {
          await this.redisService.requestResponse(
            'hoan_kho_san_pham',
            ttSanPham
          );
        }
      } catch (rollbackError) {
        return {
          success: false,
          error: rollbackError,
        };
      }
      return { success: false, error: error };
    }
  }

  async updateState(
    idDonHang: string,
    trangThaiMoi: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // 🔍 Kiểm tra xem đơn hàng có tồn tại không
      const donHang = await this.orderModel.findById(idDonHang);
      if (!donHang) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (trangThaiMoi === 5 && donHang.trangThai_DH > 2) {
        throw new InternalServerErrorException('Không thể hủy đơn hàng');
      }
      // ✅ Cập nhật trạng thái
      donHang.trangThai_DH = trangThaiMoi;
      const donHangSaved = await donHang.save();
      return { success: true, data: donHangSaved };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async confirmCancel(
    idDonHang: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // 🔍 Kiểm tra đơn hàng có tồn tại không
      const donHang = await this.orderModel.findById(idDonHang);
      if (!donHang) {
        throw new NotFoundException('Không tim thấy đơn hàng');
      }

      // 🔍 Kiểm tra trạng thái, chỉ được hủy nếu đơn hàng chưa hoàn tất
      if (donHang.trangThai_DH !== 5) {
        throw new InternalServerErrorException('Không thể hủy đơn hàng');
      }
      donHang.trangThai_DH = 6;
      
      await this.redisService.requestResponse('hoan_kho_san_pham', {
        ttSanPham: donHang.chiTiet_DH,
      });

      await donHang.save();
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy tất cả hóa đơn theo trạng thái
  async findAll(
    state: number,
    page: number,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const query = state === 0 ? {} : { trangThai_DH: state };

      // Đếm tổng số đơn hàng phù hợp
      const total = await this.orderModel.countDocuments(query);

      const data = await this.orderModel
        .find(query)
        .skip(limit * page) // Bỏ qua số lượng sản phẩm đã hiển thị
        .limit(limit) // Giới hạn số lượng sản phẩm trả về
        .exec();

      return { success: true, data: { orders: data, total: total } };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Lấy một hóa đơn theo ID
  async findOne(
    idOrder: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const order = await this.orderModel.findById(idOrder).exec();
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy tất cả hóa đơn của một người dùng cụ thể
  async findUserOrders(
    idUser: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const data = await this.orderModel
        .find({ idKhachHang_DH: idUser })
        .exec();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
