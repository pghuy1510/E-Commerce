import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LocationService } from './location.service';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';

describe('LocationService', () => {
  let service: LocationService;

  const mockProvinces: Province[] = [
    { id: 2, code: '02', name: 'Hải Phòng', wards: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 1, code: '01', name: 'Hà Nội', wards: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockWards: Ward[] = [
    { id: 10, code: '00010', name: 'Hoàn Kiếm', provinceId: 1, province: {} as any, createdAt: new Date(), updatedAt: new Date() },
    { id: 11, code: '00011', name: 'Lê Chân', provinceId: 2, province: {} as any, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockProvinceRepository = {
    find: jest.fn().mockResolvedValue(mockProvinces),
  };

  const mockWardRepository = {
    find: jest.fn().mockResolvedValue(mockWards),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(Province),
          useValue: mockProvinceRepository,
        },
        {
          provide: getRepositoryToken(Ward),
          useValue: mockWardRepository,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    // Trigger onModuleInit to preload
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProvinces', () => {
    it('should return sorted provinces', () => {
      const provinces = service.getProvinces();
      expect(provinces).toHaveLength(2);
      expect(provinces[0].name).toBe('Hà Nội'); // Sort alphabetical
      expect(provinces[1].name).toBe('Hải Phòng');
    });
  });

  describe('getWards', () => {
    it('should return wards for a valid province sorted by name', () => {
      const wards = service.getWards(1);
      expect(wards).toHaveLength(1);
      expect(wards[0].name).toBe('Hoàn Kiếm');
    });

    it('should throw NotFoundException for invalid provinceId', () => {
      expect(() => service.getWards(999)).toThrow(NotFoundException);
    });
  });

  describe('validateAddress', () => {
    it('should validate valid province/ward combination and return names', () => {
      const result = service.validateAddress(1, 10);
      expect(result.provinceName).toBe('Hà Nội');
      expect(result.wardName).toBe('Hoàn Kiếm');
    });

    it('should throw BadRequestException if ward does not belong to province', () => {
      expect(() => service.validateAddress(1, 11)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if province does not exist', () => {
      expect(() => service.validateAddress(999, 10)).toThrow(BadRequestException);
    });
  });
});
