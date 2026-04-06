import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto) {
    const payment = this.paymentRepo.create({
      ...dto,
      status: 'pending',
    });

    return this.paymentRepo.save(payment);
  }

  async success(id: number) {
    return this.paymentRepo.update(id, {
      status: 'success',
      transaction_id: 'FAKE_TXN_' + Date.now(),
    });
  }

  async fail(id: number) {
    return this.paymentRepo.update(id, {
      status: 'failed',
    });
  }

  async getByOrder(orderId: number) {
    return this.paymentRepo.find({
      where: { order_id: orderId },
    });
  }
}
