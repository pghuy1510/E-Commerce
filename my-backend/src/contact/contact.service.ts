import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactRepo: Repository<ContactMessage>,
  ) {}

  private async saveImageProof(base64Data: string): Promise<string> {
    if (!base64Data.startsWith('data:')) {
      throw new BadRequestException('Ảnh minh chứng không hợp lệ.');
    }

    const parts = base64Data.split(';base64,');
    if (parts.length !== 2) {
      throw new BadRequestException('Ảnh minh chứng không hợp lệ.');
    }

    const mimeType = parts[0].replace('data:', '');
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, WEBP.');
    }

    const base64Content = parts[1];
    const approximateSize = (base64Content.length * 3) / 4;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (approximateSize > maxSizeBytes) {
      throw new BadRequestException('Kích thước ảnh minh chứng không được vượt quá 5MB.');
    }

    const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'support');

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      return `/uploads/support/${fileName}`;
    } catch (e) {
      throw new BadRequestException('Không thể lưu ảnh minh chứng.');
    }
  }

  async create(dto: CreateContactDto) {
    let imagePath: string | null = null;
    if (dto.imageProof) {
      imagePath = await this.saveImageProof(dto.imageProof);
    }

    const message = this.contactRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      message: dto.message,
      imageProof: imagePath,
    });

    return this.contactRepo.save(message);
  }
}
