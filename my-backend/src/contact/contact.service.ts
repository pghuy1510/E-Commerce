import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactRepo: Repository<ContactMessage>,
  ) {}

  async create(dto: CreateContactDto) {
    const message = this.contactRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      message: dto.message,
    });

    return this.contactRepo.save(message);
  }
}
