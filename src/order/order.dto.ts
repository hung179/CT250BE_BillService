import {
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class TTSanPhamDto {
  @IsString()
  idSanPham_CTHD: string;

  @IsString()
  idTTBanHang_CTHD: string;

  @IsNumber()
  soLuong_CTHD: number;
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
  diChi_NH: DiaChiDto;
}

class TTVanChuyenDto {
  @IsNumber()
  giaVanChuyen: number;

  @IsNumber()
  giaVanChuyenVuotMuc: number;

  @IsNumber()
  trongluongVuotMuc: number;
}

export class CreateHoaDonDto {
  @IsString()
  @IsOptional()
  idKhachHang: string;

  @ValidateNested()
  @Type(() => TTSanPhamDto)
  ttSanPham: TTSanPhamDto[];

  @ValidateNested()
  @Type(() => TTNhanHangDto)
  ttNhanHang: TTNhanHangDto;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  ttMaGiam: string[];

  @ValidateNested()
  @Type(() => TTVanChuyenDto)
  ttVanChuyen: TTVanChuyenDto;
}
