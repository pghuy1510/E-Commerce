"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const payment_entity_1 = require("./entities/payment.entity");
const qr_payment_entity_1 = require("./entities/qr-payment.entity");
const payment_log_entity_1 = require("./entities/payment-log.entity");
const order_entity_1 = require("../order/order.entity");
const order_status_log_entity_1 = require("../order/order-status-log.entity");
const cart_entity_1 = require("../cart/cart.entity");
const cart_item_entity_1 = require("../cart/cart-item.entity");
const user_entity_1 = require("../users/entities/user.entity");
const coupon_service_1 = require("../coupons/coupon.service");
const products_entity_1 = require("../products/products.entity");
const order_totals_1 = require("../order/order-totals");
const mail_service_1 = require("../common/mail.service");
let PaymentService = class PaymentService {
    paymentRepo;
    qrPaymentRepo;
    paymentLogRepo;
    orderRepo;
    orderStatusRepo;
    cartRepo;
    cartItemRepo;
    userRepo;
    couponService;
    configService;
    dataSource;
    mailService;
    constructor(paymentRepo, qrPaymentRepo, paymentLogRepo, orderRepo, orderStatusRepo, cartRepo, cartItemRepo, userRepo, couponService, configService, dataSource, mailService) {
        this.paymentRepo = paymentRepo;
        this.qrPaymentRepo = qrPaymentRepo;
        this.paymentLogRepo = paymentLogRepo;
        this.orderRepo = orderRepo;
        this.orderStatusRepo = orderStatusRepo;
        this.cartRepo = cartRepo;
        this.cartItemRepo = cartItemRepo;
        this.userRepo = userRepo;
        this.couponService = couponService;
        this.configService = configService;
        this.dataSource = dataSource;
        this.mailService = mailService;
    }
    webhookFailureCounter = 0;
    lastWebhookFailureTime = 0;
    trackWebhookFailure(paymentId, error) {
        const now = Date.now();
        if (now - this.lastWebhookFailureTime > 60000) {
            this.webhookFailureCounter = 0;
        }
        this.webhookFailureCounter++;
        this.lastWebhookFailureTime = now;
        console.error(`[ALERT] Webhook processing failed for payment ${paymentId}. Error: ${error.message || error}`);
        if (this.webhookFailureCounter >= 5) {
            console.warn(`[CRITICAL ALERT] Webhook failure threshold exceeded! ${this.webhookFailureCounter} failures in the last minute. Redis/Sentry Alert should be triggered here in production.`);
        }
    }
    async create(dto) {
        const payment = this.paymentRepo.create({
            ...dto,
            status: 'pending',
        });
        return this.paymentRepo.save(payment);
    }
    async success(id) {
        return this.paymentRepo.update(id, {
            status: 'paid',
            transaction_id: 'FAKE_TXN_' + Date.now(),
            paid_at: new Date(),
        });
    }
    async fail(id) {
        return this.paymentRepo.update(id, {
            status: 'failed',
        });
    }
    async getByOrder(orderId) {
        return this.paymentRepo.find({
            where: { order_id: orderId },
        });
    }
    async getPaymentStatus(paymentId, token, userId) {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const order = await this.orderRepo.findOne({
            where: { id: payment.order_id },
            relations: ['user'],
        });
        // Check ownership
        let isAuthorized = false;
        // 1. If user is logged in and is the owner
        if (userId && order?.user?.id === userId) {
            isAuthorized = true;
        }
        // 2. If token is provided and matches tokenHash in DB (or matches guest email for fallback)
        if (token) {
            if (payment.tokenHash) {
                const providedHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
                if (payment.tokenHash === providedHash) {
                    isAuthorized = true;
                }
            }
            else if (order?.guestEmail && order.guestEmail === token) {
                // Fallback for legacy payments: authorize and auto-generate tokenHash for future visits
                isAuthorized = true;
                const newToken = `pay_tok_${(0, crypto_1.randomUUID)().replace(/-/g, '')}`;
                payment.tokenHash = (0, crypto_1.createHash)('sha256').update(newToken).digest('hex');
                await this.paymentRepo.save(payment);
            }
        }
        if (!isAuthorized) {
            throw new common_1.BadRequestException('Bạn không có quyền truy cập thông tin thanh toán này.');
        }
        if (payment.method !== 'qr') {
            throw new common_1.BadRequestException('Webhook only supports QR payments');
        }
        const qrPayment = await this.qrPaymentRepo.findOne({
            where: { payment: { id: payment.id } },
            order: { createdAt: 'DESC' },
        });
        // Mask accountNumber if status is not pending
        let maskedAccountNumber = qrPayment?.accountNumber ?? '';
        if (payment.status !== 'pending' && maskedAccountNumber) {
            if (maskedAccountNumber.length > 3) {
                maskedAccountNumber = '*'.repeat(maskedAccountNumber.length - 3) + maskedAccountNumber.slice(-3);
            }
            else {
                maskedAccountNumber = '***';
            }
        }
        return {
            paymentId: payment.id,
            orderId: payment.order_id,
            paymentStatus: payment.status,
            orderStatus: order?.status ?? null,
            amount: payment.amount,
            qr: qrPayment
                ? {
                    qrDataURL: qrPayment.qrDataUrl,
                    addInfo: qrPayment.addInfo,
                    expiredAt: qrPayment.expiredAt?.toISOString() ?? null,
                    qrToken: qrPayment.qrToken,
                    status: qrPayment.status,
                    bankName: qrPayment.bankName,
                    accountName: qrPayment.accountName,
                    accountNumber: maskedAccountNumber,
                }
                : null,
        };
    }
    async regenerateQr(paymentId, machineId, token, userId) {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const order = await this.orderRepo.findOne({
            where: { id: payment.order_id },
            relations: ['user'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        // Check ownership
        let isAuthorized = false;
        if (userId && order.user?.id === userId) {
            isAuthorized = true;
        }
        if (token) {
            if (payment.tokenHash) {
                const providedHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
                if (payment.tokenHash === providedHash) {
                    isAuthorized = true;
                }
            }
            else if (order.guestEmail && order.guestEmail === token) {
                isAuthorized = true;
            }
        }
        if (!isAuthorized) {
            throw new common_1.BadRequestException('Bạn không có quyền truy cập thông tin thanh toán này.');
        }
        if (payment.method !== 'qr') {
            throw new common_1.BadRequestException('Payment method does not support QR.');
        }
        if (payment.status === 'paid') {
            throw new common_1.BadRequestException('Payment already completed.');
        }
        const amount = this.normalizePaymentAmount(payment.amount);
        if (!payment.paymentCode) {
            payment.paymentCode = (0, crypto_1.randomUUID)().toUpperCase();
            await this.paymentRepo.save(payment);
        }
        const qrResponse = await this.generateSePayQr({
            amount,
            paymentCode: payment.paymentCode,
        });
        const now = new Date();
        await this.qrPaymentRepo
            .createQueryBuilder()
            .update(qr_payment_entity_1.QrPayment)
            .set({ status: 'expired', expiredAt: now })
            .where('payment_id = :paymentId', { paymentId })
            .andWhere('status = :status', { status: 'pending' })
            .execute();
        const qrToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const expiredAt = new Date(qrResponse.expiredAt);
        payment.status = 'pending';
        payment.expired_at = expiredAt;
        await this.paymentRepo.save(payment);
        const qrPayment = this.qrPaymentRepo.create({
            order,
            payment,
            qrToken,
            bankName: qrResponse.bankName,
            accountName: qrResponse.accountName,
            accountNumber: qrResponse.accountNumber,
            amount,
            addInfo: qrResponse.addInfo,
            qrDataUrl: qrResponse.qrDataURL,
            status: 'pending',
            expiredAt,
        });
        await this.qrPaymentRepo.save(qrPayment);
        return {
            qrDataURL: qrResponse.qrDataURL,
            addInfo: qrResponse.addInfo,
            expiredAt: qrResponse.expiredAt,
            qrToken,
            amount,
            bankName: qrResponse.bankName,
            accountName: qrResponse.accountName,
            accountNumber: qrResponse.accountNumber,
        };
    }
    normalizePaymentCode(code) {
        // Normalization is required because BIDV Virtual Account transactions through SePay
        // sometimes send the payment code without dashes (e.g. 656D15B036264DA288510E4B6132D975),
        // whereas payment records store the paymentCode with dashes in UUID format.
        return (code || '')
            .replace(/-/g, '')
            .replace(/\s/g, '')
            .trim()
            .toUpperCase();
    }
    async handleWebhook(dto, raw) {
        let payment = null;
        try {
            console.log('========== SEPAY WEBHOOK ==========');
            console.log(JSON.stringify(dto, null, 2));
            console.log('===================================');
            // Attempt to extract the UUID-like token from content if dto.code is empty/not provided
            const uuidMatch = dto.content?.match(/([A-F0-9]{32}|[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12})/i);
            const extractedCode = uuidMatch?.[1] ?? '';
            const incomingCode = this.normalizePaymentCode(dto.code || extractedCode || '');
            console.log('WEBHOOK CODE:', dto.code);
            console.log('WEBHOOK CONTENT:', dto.content);
            console.log('NORMALIZED CODE:', incomingCode);
            if (!incomingCode) {
                await this.paymentLogRepo.save({
                    provider: 'sepay',
                    providerTransactionId: dto.id ? String(dto.id) : null,
                    rawResponse: raw,
                    status: 'ignored',
                });
                return { status: 'ignored' };
            }
            payment = await this.paymentRepo
                .createQueryBuilder('payment')
                .where("REPLACE(UPPER(payment.paymentCode), '-', '') = :code", { code: incomingCode })
                .getOne();
            console.log('MATCHED PAYMENT:', payment?.id);
            if (!payment) {
                throw new common_1.NotFoundException('Payment not found');
            }
            const providerTransactionId = String(dto.id);
            const amount = this.normalizePaymentAmount(payment.amount);
            if (Math.abs(amount - dto.transferAmount) > 0.01) {
                throw new common_1.BadRequestException('Amount mismatch');
            }
            const order = await this.orderRepo.findOne({
                where: { id: payment.order_id },
                relations: ['user'],
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            const qrPayment = await this.qrPaymentRepo.findOne({
                where: { payment: { id: payment.id }, addInfo: payment.paymentCode },
                order: { createdAt: 'DESC' },
            });
            if (!qrPayment) {
                throw new common_1.BadRequestException('Transfer content not recognized');
            }
            if (qrPayment.status !== 'pending') {
                throw new common_1.BadRequestException('QR payment already processed');
            }
            const existingLog = await this.paymentLogRepo.findOne({
                where: { providerTransactionId },
            });
            if (existingLog) {
                return { status: 'duplicate' };
            }
            return this.dataSource.transaction(async (manager) => {
                const paymentRepo = manager.getRepository(payment_entity_1.Payment);
                const orderRepo = manager.getRepository(order_entity_1.Order);
                const qrRepo = manager.getRepository(qr_payment_entity_1.QrPayment);
                const logRepo = manager.getRepository(payment_log_entity_1.PaymentLog);
                const orderStatusRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
                const cartRepo = manager.getRepository(cart_entity_1.Cart);
                const cartItemRepo = manager.getRepository(cart_item_entity_1.CartItem);
                const userRepo = manager.getRepository(user_entity_1.User);
                const now = new Date();
                const currentPayment = await paymentRepo.findOne({
                    where: { id: payment.id },
                });
                if (!currentPayment) {
                    throw new common_1.NotFoundException('Payment not found');
                }
                if (currentPayment.status === 'paid') {
                    await logRepo.save({
                        payment: currentPayment,
                        provider: 'sepay',
                        providerTransactionId,
                        rawResponse: raw,
                        status: 'duplicate',
                    });
                    return { status: 'duplicate' };
                }
                if (currentPayment.status !== 'pending') {
                    await logRepo.save({
                        payment: currentPayment,
                        provider: 'sepay',
                        providerTransactionId,
                        rawResponse: raw,
                        status: 'ignored',
                    });
                    return { status: 'ignored' };
                }
                if (dto.transferType !== 'in') {
                    await logRepo.save({
                        payment: currentPayment,
                        provider: 'sepay',
                        providerTransactionId,
                        rawResponse: raw,
                        status: 'ignored',
                    });
                    return { status: 'ignored' };
                }
                currentPayment.status = 'paid';
                currentPayment.paid_at = now;
                currentPayment.transaction_id = providerTransactionId;
                await paymentRepo.save(currentPayment);
                const currentQr = await qrRepo.findOne({
                    where: { id: qrPayment.id },
                });
                if (currentQr) {
                    currentQr.status = 'paid';
                    currentQr.paidAt = now;
                    await qrRepo.save(currentQr);
                }
                const currentOrder = await orderRepo.findOne({
                    where: { id: order.id },
                    relations: ['user'],
                });
                if (!currentOrder) {
                    throw new common_1.NotFoundException('Order not found');
                }
                const nextOrderStatus = 'confirmed';
                if (currentOrder.status !== nextOrderStatus) {
                    const prevStatus = currentOrder.status;
                    currentOrder.status = nextOrderStatus;
                    await orderRepo.save(currentOrder);
                    await orderStatusRepo.save({
                        order: currentOrder,
                        oldStatus: prevStatus,
                        newStatus: nextOrderStatus,
                        note: 'Payment webhook update',
                    });
                }
                await logRepo.save({
                    payment: currentPayment,
                    provider: 'sepay',
                    providerTransactionId,
                    rawResponse: raw,
                    status: 'paid',
                });
                const userEmail = currentOrder.user?.email || currentOrder.guestEmail;
                if (userEmail) {
                    try {
                        this.mailService.sendPaymentStatus(userEmail, currentOrder.id, true, currentOrder.paymentMethod || 'qr');
                    }
                    catch (e) {
                        console.error('Lỗi khi gửi email thanh toán thành công:', e);
                    }
                }
                if (currentOrder.user?.id) {
                    const cart = await cartRepo.findOne({
                        where: { user: { id: currentOrder.user.id } },
                    });
                    if (cart) {
                        await cartItemRepo.delete({ cart: { id: cart.id } });
                    }
                    await userRepo.increment({ id: currentOrder.user.id }, 'totalSpent', Number(currentOrder.totalAmount));
                    if (currentOrder.couponCodes?.length) {
                        await this.couponService.markCouponsUsedByCodes(currentOrder.couponCodes);
                    }
                }
                return { status: 'ok' };
            });
        }
        catch (error) {
            this.trackWebhookFailure(payment?.id || 0, error);
            throw error;
        }
    }
    async generateSePayQr(dto) {
        const bankName = this.configService.get('SEPAY_BANK_NAME') ?? 'BIDV';
        const accountNumber = this.configService.get('SEPAY_ACCOUNT_NO') ?? '4604996654';
        const accountName = this.configService.get('SEPAY_ACCOUNT_NAME') ?? 'Pham Gia Huy';
        const expireMinutes = Number(this.configService.get('SEPAY_EXPIRE_MINUTES') ?? 15);
        const amount = this.normalizePaymentAmount(dto.amount);
        const paymentCode = dto.paymentCode;
        const expiredAt = new Date(Date.now() + expireMinutes * 60 * 1000);
        const qrDataURL = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${amount}&des=${paymentCode}&template=compact`;
        return {
            qrDataURL,
            amount,
            addInfo: paymentCode,
            expiredAt: expiredAt.toISOString(),
            bankName,
            accountName,
            accountNumber,
        };
    }
    normalizePaymentAmount(amount) {
        const normalized = (0, order_totals_1.toMoneyNumber)(amount, 'Payment amount');
        if (normalized <= 0 || !Number.isInteger(normalized)) {
            throw new common_1.BadRequestException('Invalid payment amount.');
        }
        if (String(Math.abs(normalized)).length > 13) {
            throw new common_1.BadRequestException('Payment amount exceeds the 13-digit limit.');
        }
        return normalized;
    }
    async cleanupExpiredPayments() {
        const now = new Date();
        const expiredPayments = await this.paymentRepo.find({
            where: { status: 'pending', expired_at: (0, typeorm_2.LessThan)(now) },
        });
        if (!expiredPayments.length)
            return;
        for (const payment of expiredPayments) {
            const order = await this.orderRepo.findOne({
                where: { id: payment.order_id },
                relations: ['user'],
            });
            if (!order)
                continue;
            let shouldSendEmail = false;
            let userEmail = null;
            let orderId = null;
            let paymentMethod = null;
            try {
                await this.dataSource.transaction(async (manager) => {
                    const paymentRepo = manager.getRepository(payment_entity_1.Payment);
                    const qrPaymentRepo = manager.getRepository(qr_payment_entity_1.QrPayment);
                    const orderRepo = manager.getRepository(order_entity_1.Order);
                    const orderStatusRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
                    const productRepo = manager.getRepository(products_entity_1.Product);
                    // 1. Lock and check Payment status
                    const currentPayment = await paymentRepo.findOne({
                        where: { id: payment.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!currentPayment || currentPayment.status !== 'pending') {
                        return; // Already processed
                    }
                    currentPayment.status = 'expired';
                    currentPayment.expired_at = now;
                    await paymentRepo.save(currentPayment);
                    // 2. Update QrPayment status
                    await qrPaymentRepo
                        .createQueryBuilder()
                        .update(qr_payment_entity_1.QrPayment)
                        .set({ status: 'expired', expiredAt: now })
                        .where('payment_id = :paymentId', { paymentId: payment.id })
                        .andWhere('status = :status', { status: 'pending' })
                        .execute();
                    // 3. Lock Order, check status and restore stock
                    const currentOrder = await orderRepo.findOne({
                        where: { id: order.id },
                        relations: ['items'],
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (currentOrder && currentOrder.status === 'pending') {
                        // Restore inventory stock
                        if (currentOrder.items) {
                            for (const item of currentOrder.items) {
                                const product = await productRepo.findOne({
                                    where: { id: item.productId },
                                    lock: { mode: 'pessimistic_write' },
                                });
                                if (product) {
                                    product.stock += item.quantity;
                                    await productRepo.save(product);
                                }
                            }
                        }
                        const oldStatus = currentOrder.status;
                        currentOrder.status = 'cancelled';
                        await orderRepo.save(currentOrder);
                        await orderStatusRepo.save({
                            order: currentOrder,
                            oldStatus,
                            newStatus: 'cancelled',
                            note: 'Payment expired',
                        });
                        // Set variables to send email outside transaction
                        shouldSendEmail = true;
                        userEmail = currentOrder.user?.email || currentOrder.guestEmail;
                        orderId = currentOrder.id;
                        paymentMethod = currentOrder.paymentMethod || 'qr';
                    }
                });
                // 4. Send email side-effect outside the transaction
                if (shouldSendEmail && userEmail && orderId) {
                    try {
                        this.mailService.sendPaymentStatus(userEmail, orderId, false, paymentMethod || 'qr');
                    }
                    catch (e) {
                        console.error('Lỗi khi gửi email thanh toán thất bại (hết hạn):', e);
                    }
                }
            }
            catch (err) {
                console.error(`Error during cleanup of expired payment ${payment.id}:`, err);
            }
        }
    }
};
exports.PaymentService = PaymentService;
__decorate([
    (0, schedule_1.Cron)('*/1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentService.prototype, "cleanupExpiredPayments", null);
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(qr_payment_entity_1.QrPayment)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_log_entity_1.PaymentLog)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(4, (0, typeorm_1.InjectRepository)(order_status_log_entity_1.OrderStatusLog)),
    __param(5, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(6, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        coupon_service_1.CouponService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        mail_service_1.MailService])
], PaymentService);
