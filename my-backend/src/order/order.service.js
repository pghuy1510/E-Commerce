"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const order_entity_1 = require("./order.entity");
const order_item_entity_1 = require("./order-item.entity");
const order_shipping_address_entity_1 = require("./order-shipping-address.entity");
const order_status_log_entity_1 = require("./order-status-log.entity");
const order_return_entity_1 = require("./order-return.entity");
const cart_service_1 = require("../cart/cart.service");
const products_entity_1 = require("../products/products.entity");
const coupon_service_1 = require("../coupons/coupon.service");
const payment_entity_1 = require("../payment/entities/payment.entity");
const qr_payment_entity_1 = require("../payment/entities/qr-payment.entity");
const payment_service_1 = require("../payment/payment.service");
const cart_entity_1 = require("../cart/cart.entity");
const cart_item_entity_1 = require("../cart/cart-item.entity");
const order_totals_1 = require("./order-totals");
const user_entity_1 = require("../users/entities/user.entity");
const mail_service_1 = require("../common/mail.service");
const location_service_1 = require("../locations/location.service");
const deals_service_1 = require("../deals/deals.service");
const deal_product_entity_1 = require("../deals/entities/deal-product.entity");
let OrderService = class OrderService {
    orderRepo;
    cartService;
    couponService;
    paymentService;
    dataSource;
    mailService;
    locationService;
    dealsService;
    constructor(orderRepo, cartService, couponService, paymentService, dataSource, mailService, locationService, dealsService) {
        this.orderRepo = orderRepo;
        this.cartService = cartService;
        this.couponService = couponService;
        this.paymentService = paymentService;
        this.dataSource = dataSource;
        this.mailService = mailService;
        this.locationService = locationService;
        this.dealsService = dealsService;
    }
    async checkout(userId, dto) {
        const userIdNumber = Number(userId);
        if (!userIdNumber) {
            throw new common_1.BadRequestException('Invalid userId');
        }
        const cart = await this.cartService.getCart(userIdNumber);
        if (!cart.items.length) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        if (!dto.provinceId || !dto.wardId || !dto.addressDetail?.trim() || !dto.receiverName?.trim() || !dto.receiverPhone?.trim()) {
            throw new common_1.BadRequestException('Thông tin địa chỉ nhận hàng không đầy đủ.');
        }
        const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);
        const subtotal = (0, order_totals_1.calculateCartSubtotal)(cart.items);
        const baseTotals = (0, order_totals_1.calculateOrderTotals)({
            subtotal,
            shippingFee: dto.shippingFee ?? 0,
            discountTotal: 0,
        });
        const normalizedCouponCode = dto.couponCode?.trim();
        const couponResult = normalizedCouponCode
            ? await this.couponService.applyCouponCodeForUser(userIdNumber, normalizedCouponCode, cart.items, baseTotals.subtotal, baseTotals.shippingFee)
            : await this.couponService.applyBestCouponsForUser(userIdNumber, cart.items, baseTotals.subtotal, baseTotals.shippingFee);
        const totals = (0, order_totals_1.calculateOrderTotals)({
            subtotal: baseTotals.subtotal,
            shippingFee: baseTotals.shippingFee,
            discountTotal: couponResult.discountTotal,
        });
        const discountTotal = totals.discountTotal;
        const appliedCoupons = couponResult.appliedCoupons;
        const appliedCodes = couponResult.appliedCodes;
        const totalForPayment = totals.finalTotal;
        const result = await this.dataSource.transaction(async (manager) => {
            const cartRepo = manager.getRepository(cart_entity_1.Cart);
            const cartItemRepo = manager.getRepository(cart_item_entity_1.CartItem);
            const productRepo = manager.getRepository(products_entity_1.Product);
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const orderItemRepo = manager.getRepository(order_item_entity_1.OrderItem);
            const orderShippingRepo = manager.getRepository(order_shipping_address_entity_1.OrderShippingAddress);
            const orderStatusRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const qrPaymentRepo = manager.getRepository(qr_payment_entity_1.QrPayment);
            const currentCart = await cartRepo.findOne({
                where: { user: { id: userIdNumber } },
                relations: ['items', 'items.product', 'items.product.category'],
            });
            if (!currentCart || !currentCart.items.length) {
                throw new common_1.BadRequestException('Cart is empty');
            }
            const orderItems = [];
            for (const item of currentCart.items) {
                const product = await productRepo.findOne({
                    where: { id: item.product.id },
                });
                if (!product) {
                    throw new common_1.BadRequestException('Sản phẩm không tồn tại.');
                }
                const availableStock = product.stock - (product.reservedStock || 0);
                if (availableStock < item.quantity) {
                    throw new common_1.BadRequestException(`Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng trong kho (hiện chỉ còn ${availableStock} sản phẩm). Vui lòng quay lại giỏ hàng để cập nhật.`);
                }
                // Check active deal for this product
                const dealProduct = await manager.getRepository(deal_product_entity_1.DealProduct).findOne({
                    where: {
                        productId: product.id,
                        deal: {
                            isActive: true,
                            startsAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
                            expiresAt: (0, typeorm_2.MoreThanOrEqual)(new Date()),
                        },
                    },
                    relations: ['deal'],
                });
                let purchasePrice = Number(product.price);
                if (dealProduct) {
                    if (dealProduct.dealStock - dealProduct.soldCount < item.quantity) {
                        throw new common_1.BadRequestException(`Sản phẩm "${product.name}" đã hết số lượng giảm giá Flash Sale.`);
                    }
                    dealProduct.soldCount += item.quantity;
                    await manager.save(dealProduct);
                    purchasePrice = Number(dealProduct.dealPrice);
                }
                product.reservedStock = (product.reservedStock || 0) + item.quantity;
                await productRepo.save(product);
                const orderItem = orderItemRepo.create({
                    productId: product.id,
                    productName: product.name,
                    price: purchasePrice,
                    quantity: item.quantity,
                });
                orderItems.push(orderItem);
            }
            const orderStatus = dto.paymentMethod === 'cod' ? 'confirmed' : 'pending';
            const order = orderRepo.create({
                user: { id: userIdNumber },
                totalAmount: totalForPayment,
                subtotalAmount: totals.subtotal,
                discountAmount: discountTotal,
                shippingFee: totals.shippingFee,
                couponCodes: appliedCodes,
                paymentMethod: dto.paymentMethod,
                status: orderStatus,
                items: orderItems,
            });
            const savedOrder = await orderRepo.save(order);
            const shipping = orderShippingRepo.create({
                order: savedOrder,
                receiverName: dto.receiverName,
                receiverPhone: dto.receiverPhone,
                province: provinceName,
                district: '',
                ward: wardName,
                detail: dto.addressDetail,
                provinceId: dto.provinceId,
                wardId: dto.wardId,
                provinceName,
                wardName,
                addressDetail: dto.addressDetail,
                fullAddress: `${dto.addressDetail}, ${wardName}, ${provinceName}`,
            });
            await orderShippingRepo.save(shipping);
            await orderStatusRepo.save({
                order: savedOrder,
                oldStatus: null,
                newStatus: orderStatus,
                note: dto.note ?? null,
            });
            const paymentToken = `pay_tok_${(0, crypto_1.randomUUID)().replace(/-/g, '')}`;
            const tokenHash = (0, crypto_1.createHash)('sha256').update(paymentToken).digest('hex');
            const paymentCode = (0, crypto_1.randomUUID)().toUpperCase();
            const payment = paymentRepo.create({
                order_id: savedOrder.id,
                method: dto.paymentMethod,
                amount: totalForPayment,
                status: 'pending',
                tokenHash,
                paymentCode,
            });
            const savedPayment = await paymentRepo.save(payment);
            let qrPayload = null;
            if (dto.paymentMethod === 'qr') {
                if (!dto.machineId) {
                    throw new common_1.BadRequestException('machineId is required for QR payment');
                }
                const qrResponse = await this.paymentService.generateSePayQr({
                    amount: totalForPayment,
                    paymentCode,
                });
                const qrToken = (0, crypto_1.randomUUID)().replace(/-/g, '');
                const expiredAt = new Date(qrResponse.expiredAt);
                savedPayment.expired_at = expiredAt;
                await paymentRepo.save(savedPayment);
                const qrPayment = qrPaymentRepo.create({
                    order: savedOrder,
                    payment: savedPayment,
                    qrToken,
                    bankName: qrResponse.bankName,
                    accountName: qrResponse.accountName,
                    accountNumber: qrResponse.accountNumber,
                    amount: totalForPayment,
                    addInfo: qrResponse.addInfo,
                    qrDataUrl: qrResponse.qrDataURL,
                    status: 'pending',
                    expiredAt,
                });
                await qrPaymentRepo.save(qrPayment);
                qrPayload = {
                    qrDataURL: qrResponse.qrDataURL,
                    addInfo: qrResponse.addInfo,
                    expiredAt: qrResponse.expiredAt,
                    qrToken,
                    amount: totalForPayment,
                };
            }
            await cartItemRepo.delete({
                cart: { id: currentCart.id },
            });
            return {
                order: savedOrder,
                payment: savedPayment,
                qr: qrPayload,
                paymentToken,
            };
        });
        if (dto.paymentMethod === 'cod' && appliedCoupons.length > 0) {
            await this.couponService.markCouponsUsed(appliedCoupons);
        }
        try {
            const user = await this.dataSource.getRepository(user_entity_1.User).findOne({ where: { id: userIdNumber } });
            if (user && user.email) {
                this.mailService.sendOrderConfirmation(user.email, result.order.id, Number(result.order.totalAmount), result.order.items);
            }
        }
        catch (e) {
            console.error('Lỗi khi gửi email xác nhận đơn hàng:', e);
        }
        return {
            orderId: result.order.id,
            paymentId: result.payment.id,
            paymentToken: result.paymentToken,
            orderStatus: result.order.status,
            paymentStatus: result.payment.status,
            amount: result.payment.amount,
            paymentMethod: dto.paymentMethod,
            qr: result.qr,
        };
    }
    async checkoutGuest(dto) {
        const itemsWithProduct = [];
        let subtotal = 0;
        for (const item of dto.items) {
            const product = await this.dataSource.getRepository(products_entity_1.Product).findOne({
                where: { id: item.productId },
                relations: ['category'],
            });
            if (!product) {
                throw new common_1.BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
            }
            const availableStock = product.stock - (product.reservedStock || 0);
            if (availableStock < item.quantity) {
                throw new common_1.BadRequestException(`Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng (hiện chỉ còn ${availableStock} sản phẩm).`);
            }
            const dealPrice = await this.dealsService.getProductDealPrice(product.id);
            const finalPrice = dealPrice !== null ? dealPrice : Number(product.price);
            subtotal += finalPrice * item.quantity;
            itemsWithProduct.push({
                product,
                quantity: item.quantity,
                price: finalPrice,
            });
        }
        if (!dto.provinceId || !dto.wardId || !dto.addressDetail?.trim() || !dto.receiverName?.trim() || !dto.receiverPhone?.trim()) {
            throw new common_1.BadRequestException('Thông tin địa chỉ nhận hàng không đầy đủ.');
        }
        const { provinceName, wardName } = this.locationService.validateAddress(dto.provinceId, dto.wardId);
        const baseTotals = (0, order_totals_1.calculateOrderTotals)({
            subtotal,
            shippingFee: dto.shippingFee ?? 0,
            discountTotal: 0,
        });
        let discountTotal = 0;
        let appliedCodes = [];
        if (dto.couponCode?.trim()) {
            const couponResult = await this.couponService.validateCouponCodeForGuest(dto.couponCode.trim(), dto.items, baseTotals.subtotal, baseTotals.shippingFee);
            discountTotal = couponResult.discountTotal;
            appliedCodes = [couponResult.couponCode];
        }
        const totals = (0, order_totals_1.calculateOrderTotals)({
            subtotal: baseTotals.subtotal,
            shippingFee: baseTotals.shippingFee,
            discountTotal,
        });
        const totalForPayment = totals.finalTotal;
        const result = await this.dataSource.transaction(async (manager) => {
            const productRepo = manager.getRepository(products_entity_1.Product);
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const orderItemRepo = manager.getRepository(order_item_entity_1.OrderItem);
            const orderShippingRepo = manager.getRepository(order_shipping_address_entity_1.OrderShippingAddress);
            const orderStatusRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const qrPaymentRepo = manager.getRepository(qr_payment_entity_1.QrPayment);
            const orderItems = [];
            for (const item of itemsWithProduct) {
                const product = await productRepo.findOne({
                    where: { id: item.product.id },
                });
                if (!product) {
                    throw new common_1.BadRequestException('Sản phẩm không tồn tại.');
                }
                const availableStock = product.stock - (product.reservedStock || 0);
                if (availableStock < item.quantity) {
                    throw new common_1.BadRequestException(`Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng trong kho (hiện chỉ còn ${availableStock} sản phẩm).`);
                }
                // Check active deal for this product
                const dealProduct = await manager.getRepository(deal_product_entity_1.DealProduct).findOne({
                    where: {
                        productId: product.id,
                        deal: {
                            isActive: true,
                            startsAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
                            expiresAt: (0, typeorm_2.MoreThanOrEqual)(new Date()),
                        },
                    },
                    relations: ['deal'],
                });
                let purchasePrice = item.price;
                if (dealProduct) {
                    if (dealProduct.dealStock - dealProduct.soldCount < item.quantity) {
                        throw new common_1.BadRequestException(`Sản phẩm "${product.name}" đã hết số lượng giảm giá Flash Sale.`);
                    }
                    dealProduct.soldCount += item.quantity;
                    await manager.save(dealProduct);
                    purchasePrice = Number(dealProduct.dealPrice);
                }
                product.reservedStock = (product.reservedStock || 0) + item.quantity;
                await productRepo.save(product);
                const orderItem = orderItemRepo.create({
                    productId: product.id,
                    productName: product.name,
                    price: purchasePrice,
                    quantity: item.quantity,
                });
                orderItems.push(orderItem);
            }
            const orderStatus = dto.paymentMethod === 'cod' ? 'confirmed' : 'pending';
            const order = orderRepo.create({
                user: null,
                guestEmail: dto.guestEmail,
                totalAmount: totalForPayment,
                subtotalAmount: totals.subtotal,
                discountAmount: discountTotal,
                shippingFee: totals.shippingFee,
                couponCodes: appliedCodes,
                paymentMethod: dto.paymentMethod,
                status: orderStatus,
                items: orderItems,
            });
            const savedOrder = await orderRepo.save(order);
            const shipping = orderShippingRepo.create({
                order: savedOrder,
                receiverName: dto.receiverName,
                receiverPhone: dto.receiverPhone,
                province: provinceName,
                district: '',
                ward: wardName,
                detail: dto.addressDetail,
                provinceId: dto.provinceId,
                wardId: dto.wardId,
                provinceName,
                wardName,
                addressDetail: dto.addressDetail,
                fullAddress: `${dto.addressDetail}, ${wardName}, ${provinceName}`,
            });
            await orderShippingRepo.save(shipping);
            await orderStatusRepo.save({
                order: savedOrder,
                oldStatus: null,
                newStatus: orderStatus,
                note: dto.note ?? null,
            });
            const paymentToken = `pay_tok_${(0, crypto_1.randomUUID)().replace(/-/g, '')}`;
            const tokenHash = (0, crypto_1.createHash)('sha256').update(paymentToken).digest('hex');
            const paymentCode = (0, crypto_1.randomUUID)().toUpperCase();
            const payment = paymentRepo.create({
                order_id: savedOrder.id,
                method: dto.paymentMethod,
                amount: totalForPayment,
                status: 'pending',
                tokenHash,
                paymentCode,
            });
            const savedPayment = await paymentRepo.save(payment);
            let qrPayload = null;
            if (dto.paymentMethod === 'qr') {
                if (!dto.machineId) {
                    throw new common_1.BadRequestException('machineId is required for QR payment');
                }
                const qrResponse = await this.paymentService.generateSePayQr({
                    amount: totalForPayment,
                    paymentCode,
                });
                const qrToken = (0, crypto_1.randomUUID)().replace(/-/g, '');
                const expiredAt = new Date(qrResponse.expiredAt);
                savedPayment.expired_at = expiredAt;
                await paymentRepo.save(savedPayment);
                const qrPayment = qrPaymentRepo.create({
                    order: savedOrder,
                    payment: savedPayment,
                    qrToken,
                    bankName: qrResponse.bankName,
                    accountName: qrResponse.accountName,
                    accountNumber: qrResponse.accountNumber,
                    amount: totalForPayment,
                    addInfo: qrResponse.addInfo,
                    qrDataUrl: qrResponse.qrDataURL,
                    status: 'pending',
                    expiredAt,
                });
                await qrPaymentRepo.save(qrPayment);
                qrPayload = {
                    qrDataURL: qrResponse.qrDataURL,
                    addInfo: qrResponse.addInfo,
                    expiredAt: qrResponse.expiredAt,
                    qrToken,
                    amount: totalForPayment,
                };
            }
            return {
                order: savedOrder,
                payment: savedPayment,
                qr: qrPayload,
                paymentToken,
            };
        });
        try {
            this.mailService.sendOrderConfirmation(dto.guestEmail, result.order.id, Number(result.order.totalAmount), result.order.items);
        }
        catch (e) {
            console.error('Lỗi khi gửi email xác nhận đơn hàng cho khách vãng lai:', e);
        }
        return {
            orderId: result.order.id,
            paymentId: result.payment.id,
            paymentToken: result.paymentToken,
            orderStatus: result.order.status,
            paymentStatus: result.payment.status,
            amount: result.payment.amount,
            paymentMethod: dto.paymentMethod,
            qr: result.qr,
        };
    }
    async getGuestOrderById(orderId, email) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, guestEmail: email },
            relations: ['items', 'statusLogs'],
        });
        if (!order) {
            throw new common_1.BadRequestException('Không tìm thấy đơn hàng hoặc email không chính xác.');
        }
        return order;
    }
    // 📜 Lịch sử đơn
    async getMyOrders(userId) {
        return this.orderRepo.find({
            where: { user: { id: Number(userId) } },
            relations: ['items'],
            order: { id: 'DESC' },
        });
    }
    // 🔍 Chi tiết đơn
    async getOrderById(userId, orderId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: Number(userId) } },
            relations: ['items', 'statusLogs'],
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        const shippingAddress = await this.dataSource
            .getRepository(order_shipping_address_entity_1.OrderShippingAddress)
            .findOne({
            where: { order: { id: orderId } },
        });
        const payment = await this.dataSource
            .getRepository(payment_entity_1.Payment)
            .findOne({
            where: { order_id: orderId },
        });
        return {
            ...order,
            shippingAddress,
            paymentId: payment?.id || null,
            paymentStatus: payment?.status || 'pending',
        };
    }
    async cancelOrder(userId, orderId, reason) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: Number(userId) } },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        if (order.status !== 'pending' && order.status !== 'confirmed') {
            throw new common_1.BadRequestException('Only pending or confirmed orders can be cancelled');
        }
        const oldStatus = order.status;
        order.status = 'cancelled';
        // Restore inventory
        await this.dataSource.transaction(async (manager) => {
            const productRepo = manager.getRepository(products_entity_1.Product);
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const statusLogRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const payment = await paymentRepo.findOne({ where: { order_id: order.id } });
            const wasSubtracted = order.paymentMethod === 'qr' && payment?.status === 'paid';
            for (const item of order.items) {
                const product = await productRepo.findOne({ where: { id: item.productId } });
                if (product) {
                    if (wasSubtracted) {
                        product.stock += item.quantity;
                    }
                    else {
                        product.reservedStock = Math.max(0, (product.reservedStock || 0) - item.quantity);
                    }
                    await productRepo.save(product);
                }
            }
            await orderRepo.save(order);
            await statusLogRepo.save({
                order,
                oldStatus,
                newStatus: 'cancelled',
                note: reason || 'User requested cancellation',
            });
        });
        return { success: true };
    }
    async saveImageProof(base64Data) {
        if (!base64Data.startsWith('data:')) {
            throw new common_1.BadRequestException('Ảnh minh chứng không hợp lệ.');
        }
        const parts = base64Data.split(';base64,');
        if (parts.length !== 2) {
            throw new common_1.BadRequestException('Ảnh minh chứng không hợp lệ.');
        }
        const mimeType = parts[0].replace('data:', '');
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new common_1.BadRequestException('Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, WEBP.');
        }
        const base64Content = parts[1];
        const approximateSize = (base64Content.length * 3) / 4;
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (approximateSize > maxSizeBytes) {
            throw new common_1.BadRequestException('Kích thước ảnh minh chứng không được vượt quá 5MB.');
        }
        const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
        const fileName = `${(0, crypto_1.randomUUID)()}.${extension}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'returns');
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const buffer = Buffer.from(base64Content, 'base64');
            fs.writeFileSync(path.join(uploadDir, fileName), buffer);
            return `/uploads/returns/${fileName}`;
        }
        catch (error) {
            throw new common_1.BadRequestException('Không thể lưu ảnh minh chứng. Vui lòng thử lại.');
        }
    }
    async requestReturn(userId, orderId, dto) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: Number(userId) } },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        if (order.status !== 'delivered') {
            throw new common_1.BadRequestException('Only delivered orders can be returned');
        }
        // deliveredAt verification (7 days limit)
        if (!order.deliveredAt) {
            // Fallback
            const deliveryLog = await this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog).findOne({
                where: { order: { id: orderId }, newStatus: 'delivered' },
                order: { id: 'DESC' }
            });
            if (deliveryLog) {
                order.deliveredAt = deliveryLog.createdAt;
            }
        }
        if (order.deliveredAt) {
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - order.deliveredAt.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 7) {
                throw new common_1.BadRequestException('Đơn hàng đã quá thời hạn 7 ngày đổi trả kể từ ngày nhận hàng thành công.');
            }
        }
        const oldStatus = order.status;
        order.status = 'return_requested';
        let imagePath = null;
        if (dto.imageProof) {
            imagePath = await this.saveImageProof(dto.imageProof);
        }
        await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const returnRepo = manager.getRepository(order_return_entity_1.OrderReturn);
            const statusLogRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const returnRequest = returnRepo.create({
                order,
                reason: dto.reason,
                imageProof: imagePath,
                status: 'return_requested',
                refundAmount: order.totalAmount,
            });
            await returnRepo.save(returnRequest);
            await orderRepo.save(order);
            await statusLogRepo.save({
                order,
                oldStatus,
                newStatus: 'return_requested',
                note: `Yêu cầu trả hàng: ${dto.reason}`,
            });
        });
        return { success: true };
    }
    async cancelReturn(userId, orderId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: Number(userId) } },
        });
        if (!order) {
            throw new common_1.BadRequestException('Không tìm thấy đơn hàng.');
        }
        const returnRepo = this.dataSource.getRepository(order_return_entity_1.OrderReturn);
        const activeReturn = await returnRepo.findOne({
            where: { order: { id: orderId } },
            order: { id: 'DESC' }
        });
        if (!activeReturn) {
            throw new common_1.BadRequestException('Không tìm thấy yêu cầu đổi trả.');
        }
        if (activeReturn.status !== 'return_requested') {
            throw new common_1.BadRequestException('Chỉ có thể hủy yêu cầu đổi trả khi đang chờ duyệt.');
        }
        const oldStatus = order.status;
        order.status = 'delivered';
        activeReturn.status = 'return_cancelled';
        await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const returnRepo = manager.getRepository(order_return_entity_1.OrderReturn);
            const statusLogRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            await returnRepo.save(activeReturn);
            await orderRepo.save(order);
            await statusLogRepo.save({
                order,
                oldStatus,
                newStatus: 'delivered',
                note: 'Khách hàng tự hủy yêu cầu đổi trả',
            });
        });
        return { success: true };
    }
    async getReturnDetails(userId, orderId, role) {
        const whereCondition = { id: orderId };
        if (role !== 'admin') {
            whereCondition.user = { id: Number(userId) };
        }
        const order = await this.orderRepo.findOne({
            where: whereCondition,
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        const returnRequest = await this.dataSource.getRepository(order_return_entity_1.OrderReturn).findOne({
            where: { order: { id: orderId } },
            order: { id: 'DESC' },
        });
        return returnRequest || null;
    }
    async changePaymentMethodToCod(userId, orderId) {
        const userIdNumber = Number(userId);
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: userIdNumber } },
        });
        if (!order) {
            throw new common_1.BadRequestException('Không tìm thấy đơn hàng');
        }
        if (order.status !== 'pending') {
            throw new common_1.BadRequestException('Chỉ có thể đổi phương thức thanh toán cho đơn hàng đang chờ thanh toán');
        }
        const oldStatus = order.status;
        order.paymentMethod = 'cod';
        order.status = 'confirmed';
        // Update corresponding Payment method
        const paymentRepo = this.dataSource.getRepository(payment_entity_1.Payment);
        const payment = await paymentRepo.findOne({
            where: { order_id: orderId },
        });
        if (payment) {
            payment.method = 'cod';
            await paymentRepo.save(payment);
        }
        const statusLogRepo = this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog);
        const log = statusLogRepo.create({
            order,
            oldStatus,
            newStatus: 'confirmed',
            note: 'Người dùng thay đổi phương thức thanh toán sang COD',
        });
        await this.orderRepo.save(order);
        await statusLogRepo.save(log);
        return { success: true };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cart_service_1.CartService,
        coupon_service_1.CouponService,
        payment_service_1.PaymentService,
        typeorm_2.DataSource,
        mail_service_1.MailService,
        location_service_1.LocationService,
        deals_service_1.DealsService])
], OrderService);
