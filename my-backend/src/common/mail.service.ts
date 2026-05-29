import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  sendMail(to: string, subject: string, content: string) {
    console.log('\n============================================================');
    console.log(`[SIMULATED EMAIL SENT]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------------');
    console.log(content);
    console.log('============================================================\n');
  }

  sendWelcome(to: string, username: string) {
    this.sendMail(
      to,
      'Chào mừng bạn đến với ANTIGRAVITY BookStore!',
      `Xin chào ${username},\n\nChúc mừng bạn đã đăng ký tài khoản thành công tại ANTIGRAVITY. Hãy bắt đầu khám phá kho sách khổng lồ của chúng tôi!\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`,
    );
  }

  sendOrderConfirmation(to: string, orderId: number, total: number, items: any[]) {
    const itemsList = items
      .map((item) => `- ${item.productName || item.product?.name} (x${item.quantity}): ${Number((item.price || item.product?.price) * item.quantity).toLocaleString('vi-VN')}đ`)
      .join('\n');
    this.sendMail(
      to,
      `[ANTIGRAVITY] Xác nhận đơn hàng #${orderId}`,
      `Xin chào,\n\nCảm ơn bạn đã đặt hàng tại ANTIGRAVITY. Đơn hàng #${orderId} của bạn đã được tiếp nhận.\n\nChi tiết sản phẩm:\n${itemsList}\n\nTổng cộng: ${total.toLocaleString('vi-VN')}đ\n\nChúng tôi sẽ sớm giao hàng đến bạn.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`,
    );
  }

  sendPaymentStatus(to: string, orderId: number, success: boolean, method: string) {
    const statusText = success ? 'Thanh toán thành công' : 'Thanh toán thất bại';
    const message = success
      ? `Đơn hàng #${orderId} thanh toán qua ${method.toUpperCase()} đã được thanh toán thành công. Cảm ơn quý khách!`
      : `Giao dịch thanh toán cho đơn hàng #${orderId} qua ${method.toUpperCase()} không thành công. Quý khách vui lòng thử lại hoặc đổi sang phương thức COD.`;
    
    this.sendMail(
      to,
      `[ANTIGRAVITY] ${statusText} cho đơn hàng #${orderId}`,
      `Xin chào,\n\n${message}\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`,
    );
  }

  sendShippingNotification(to: string, orderId: number, trackingNumber: string, estDate?: Date) {
    const estDateText = estDate
      ? `\nNgày giao hàng dự kiến: ${new Date(estDate).toLocaleDateString('vi-VN')}`
      : '';
    this.sendMail(
      to,
      `[ANTIGRAVITY] Đơn hàng #${orderId} đang được giao`,
      `Xin chào,\n\nĐơn hàng #${orderId} của bạn đã được bàn giao cho đơn vị vận chuyển.\nMã vận đơn: ${trackingNumber}${estDateText}\n\nQuý khách vui lòng chú ý điện thoại để nhận hàng.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`,
    );
  }

  sendResetPasswordOtp(to: string, token: string) {
    this.sendMail(
      to,
      '[ANTIGRAVITY] Yêu cầu khôi phục mật khẩu',
      `Xin chào,\n\nBạn đã yêu cầu khôi phục mật khẩu. Mã OTP khôi phục mật khẩu của bạn là: **${token}**\n\nMã OTP này có hiệu lực trong vòng 15 phút. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`,
    );
  }
}
