"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
let MailService = class MailService {
    sendMail(to, subject, content) {
        console.log('\n============================================================');
        console.log(`[SIMULATED EMAIL SENT]`);
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('------------------------------------------------------------');
        console.log(content);
        console.log('============================================================\n');
    }
    sendWelcome(to, username) {
        this.sendMail(to, 'Chào mừng bạn đến với E-Commerce!', `Xin chào ${username},\n\nChúc mừng bạn đã đăng ký tài khoản thành công tại E-Commerce. Hãy bắt đầu khám phá kho sách khổng lồ của chúng tôi!\n\nTrân trọng,\nĐội ngũ E-Commerce.`);
    }
    sendOrderConfirmation(to, orderId, total, items) {
        const itemsList = items
            .map((item) => `- ${item.productName || item.product?.name} (x${item.quantity}): ${Number((item.price || item.product?.price) * item.quantity).toLocaleString('vi-VN')}đ`)
            .join('\n');
        this.sendMail(to, `[ANTIGRAVITY] Xác nhận đơn hàng #${orderId}`, `Xin chào,\n\nCảm ơn bạn đã đặt hàng tại ANTIGRAVITY. Đơn hàng #${orderId} của bạn đã được tiếp nhận.\n\nChi tiết sản phẩm:\n${itemsList}\n\nTổng cộng: ${total.toLocaleString('vi-VN')}đ\n\nChúng tôi sẽ sớm giao hàng đến bạn.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`);
    }
    sendPaymentStatus(to, orderId, success, method) {
        const statusText = success ? 'Thanh toán thành công' : 'Thanh toán thất bại';
        const message = success
            ? `Đơn hàng #${orderId} thanh toán qua ${method.toUpperCase()} đã được thanh toán thành công. Cảm ơn quý khách!`
            : `Giao dịch thanh toán cho đơn hàng #${orderId} qua ${method.toUpperCase()} không thành công. Quý khách vui lòng thử lại hoặc đổi sang phương thức COD.`;
        this.sendMail(to, `[ANTIGRAVITY] ${statusText} cho đơn hàng #${orderId}`, `Xin chào,\n\n${message}\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`);
    }
    sendShippingNotification(to, orderId, trackingNumber, estDate) {
        const estDateText = estDate
            ? `\nNgày giao hàng dự kiến: ${new Date(estDate).toLocaleDateString('vi-VN')}`
            : '';
        this.sendMail(to, `[ANTIGRAVITY] Đơn hàng #${orderId} đang được giao`, `Xin chào,\n\nĐơn hàng #${orderId} của bạn đã được bàn giao cho đơn vị vận chuyển.\nMã vận đơn: ${trackingNumber}${estDateText}\n\nQuý khách vui lòng chú ý điện thoại để nhận hàng.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`);
    }
    sendResetPasswordOtp(to, token) {
        this.sendMail(to, '[ANTIGRAVITY] Yêu cầu khôi phục mật khẩu', `Xin chào,\n\nBạn đã yêu cầu khôi phục mật khẩu. Mã OTP khôi phục mật khẩu của bạn là: **${token}**\n\nMã OTP này có hiệu lực trong vòng 15 phút. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.\n\nTrân trọng,\nĐội ngũ ANTIGRAVITY.`);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)()
], MailService);
