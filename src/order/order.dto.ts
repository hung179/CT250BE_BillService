import {
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class TTSanPhamDto {
  @IsString()
  idSanPham_CTDH: string;

  @IsString()
  idTTBanHang_CTDH: string;

  @IsNumber()
  soLuong_CTDH: number;
}

class DiaChiDto {
  @IsString()
  tinh_DC: string;

  @IsString()
  huyen_DC: string;

  @IsString()
  xa_DC: string;

  @IsString()
  chiTiet_DC: string;
}

class TTNhanHangDto {
  @IsString()
  sdt_NH: string;

  @IsString()
  hoTen_NH: string;

  @ValidateNested()
  @Type(() => DiaChiDto)
  diaChi_NH: DiaChiDto;
}

export class CreateDonHangDto {
  @IsString()
  @IsOptional()
  idKhachHang: string;

  @ValidateNested()
  @Type(() => TTSanPhamDto)
  ttSanPham: TTSanPhamDto[];

  @ValidateNested()
  @Type(() => TTNhanHangDto)
  ttNhanHang: TTNhanHangDto;

  @IsNumber()
  giaVanChuyen: number;
}
