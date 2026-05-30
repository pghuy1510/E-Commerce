import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';

@Injectable()
export class LocationService implements OnModuleInit {
  private provincesMap = new Map<number, Province>();
  private wardsMap = new Map<number, Ward>();

  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,

    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
  ) {}

  async onModuleInit() {
    await this.preloadToMemory();
  }

  /**
   * Preload all locations from PostgreSQL into RAM
   */
  async preloadToMemory() {
    console.log('[LocationService] Đang tải danh sách địa chỉ hành chính vào RAM...');
    try {
      const provinces = await this.provinceRepo.find({
        order: { name: 'ASC' },
      });
      const wards = await this.wardRepo.find({
        order: { name: 'ASC' },
      });

      this.provincesMap.clear();
      for (const p of provinces) {
        this.provincesMap.set(p.id, p);
      }

      this.wardsMap.clear();
      for (const w of wards) {
        this.wardsMap.set(w.id, w);
      }

      console.log(`[LocationService] Đã tải xong: ${this.provincesMap.size} tỉnh/thành, ${this.wardsMap.size} xã/phường.`);
    } catch (err) {
      console.error('[LocationService] Lỗi khi preload địa chỉ vào RAM:', err);
    }
  }

  /**
   * Get all provinces from RAM, sorted by name ASC
   */
  getProvinces() {
    return Array.from(this.provincesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi'),
    );
  }

  /**
   * Get wards of a province from RAM, sorted by name ASC
   */
  getWards(provinceId: number) {
    if (!this.provincesMap.has(provinceId)) {
      throw new NotFoundException(`Tỉnh/Thành phố với ID ${provinceId} không tồn tại.`);
    }

    return Array.from(this.wardsMap.values())
      .filter((w) => w.provinceId === provinceId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  /**
   * Validate if a province & ward combination is correct in O(1) RAM lookup.
   * Returns matching names.
   */
  validateAddress(provinceId: number, wardId: number): { provinceName: string; wardName: string } {
    const province = this.provincesMap.get(provinceId);
    if (!province) {
      throw new BadRequestException(`Tỉnh/Thành phố với ID ${provinceId} không tồn tại.`);
    }

    const ward = this.wardsMap.get(wardId);
    if (!ward) {
      throw new BadRequestException(`Xã/Phường với ID ${wardId} không tồn tại.`);
    }

    if (ward.provinceId !== provinceId) {
      throw new BadRequestException(
        `Xã/Phường "${ward.name}" (ID ${wardId}) không thuộc Tỉnh/Thành phố "${province.name}" (ID ${provinceId}).`,
      );
    }

    return {
      provinceName: province.name,
      wardName: ward.name,
    };
  }
}
