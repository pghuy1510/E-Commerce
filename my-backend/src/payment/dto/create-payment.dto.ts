export class CreatePaymentDto {
  order_id!: number;
  method!: string;
  amount!: number;
}
