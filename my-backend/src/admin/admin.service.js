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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_entity_1 = require("../products/products.entity");
const order_entity_1 = require("../order/order.entity");
const order_return_entity_1 = require("../order/order-return.entity");
const order_status_log_entity_1 = require("../order/order-status-log.entity");
const user_entity_1 = require("../users/entities/user.entity");
const categories_entity_1 = require("../categories/categories.entity");
const promotion_log_entity_1 = require("../promotions/entities/promotion-log.entity");
const cart_entity_1 = require("../cart/cart.entity");
const cart_item_entity_1 = require("../cart/cart-item.entity");
const payment_entity_1 = require("../payment/entities/payment.entity");
let AdminService = class AdminService {
    productRepo;
    orderRepo;
    returnRepo;
    userRepo;
    categoryRepo;
    promotionLogRepo;
    dataSource;
    constructor(productRepo, orderRepo, returnRepo, userRepo, categoryRepo, promotionLogRepo, dataSource) {
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
        this.returnRepo = returnRepo;
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
        this.promotionLogRepo = promotionLogRepo;
        this.dataSource = dataSource;
    }
    async getStats() {
        // 1. Total Revenue (delivered orders)
        const deliveredOrders = await this.orderRepo.find({
            where: { status: 'delivered' },
        });
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        // 2. Total Orders
        const totalOrders = await this.orderRepo.count();
        // 3. Total Customers
        const totalCustomers = await this.userRepo.count({
            where: { role: 'user' },
        });
        // 4. Low stock products (stock < 10)
        const lowStockProducts = await this.productRepo.find({
            where: {
                stock: (0, typeorm_2.Between)(0, 10),
            },
            order: { stock: 'ASC' },
            take: 5,
        });
        // 5. Daily Sales Data (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const recentOrders = await this.orderRepo.find({
            where: {
                created_at: (0, typeorm_2.Between)(thirtyDaysAgo, new Date()),
            },
            order: { created_at: 'ASC' },
        });
        const getLocalDateString = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const salesMap = new Map();
        // Pre-populate last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateString(d);
            salesMap.set(dateStr, { revenue: 0, count: 0 });
        }
        recentOrders.forEach((o) => {
            const dateStr = getLocalDateString(new Date(o.created_at));
            if (salesMap.has(dateStr)) {
                const current = salesMap.get(dateStr);
                if (o.status !== 'cancelled') {
                    current.revenue += Number(o.totalAmount);
                    current.count += 1;
                }
            }
        });
        const revenueChart = Array.from(salesMap.entries())
            .map(([date, data]) => ({
            date,
            revenue: Math.round(data.revenue * 100) / 100,
            ordersCount: data.count,
        }))
            .reverse();
        // Latest Orders
        const latestOrders = await this.orderRepo.find({
            relations: ['user'],
            order: { id: 'DESC' },
            take: 5,
        });
        return {
            totalRevenue,
            totalOrders,
            totalCustomers,
            lowStockCount: await this.productRepo.count({
                where: { stock: (0, typeorm_2.Between)(0, 10) },
            }),
            lowStockProducts,
            revenueChart,
            latestOrders: latestOrders.map((o) => ({
                id: o.id,
                fullName: o.user?.fullName || o.user?.username || 'Guest',
                totalAmount: o.totalAmount,
                status: o.status,
                createdAt: o.created_at,
            })),
        };
    }
    async getOrders() {
        return this.orderRepo.find({
            relations: ['user', 'items', 'statusLogs'],
            order: { id: 'DESC' },
        });
    }
    async updateOrderStatus(orderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const productRepo = manager.getRepository(products_entity_1.Product);
            const logRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const order = await orderRepo.findOne({
                where: { id: orderId },
                relations: ['items'],
                lock: { mode: 'pessimistic_write' },
            });
            if (!order) {
                throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
            }
            const oldStatus = order.status;
            order.status = dto.status;
            if (dto.status === 'delivered' && oldStatus !== 'delivered') {
                order.deliveredAt = new Date();
                if (order.paymentMethod === 'cod') {
                    // Subtract stock and release reservation now that COD payment is complete upon delivery
                    for (const item of order.items) {
                        const product = await productRepo.findOne({ where: { id: item.productId } });
                        if (product) {
                            product.reservedStock = Math.max(0, (product.reservedStock || 0) - item.quantity);
                            product.stock -= item.quantity;
                            await productRepo.save(product);
                        }
                    }
                    // Mark payment as paid
                    const paymentRepo = manager.getRepository(payment_entity_1.Payment);
                    const payment = await paymentRepo.findOne({ where: { order_id: order.id } });
                    if (payment && payment.status !== 'paid') {
                        payment.status = 'paid';
                        payment.paid_at = new Date();
                        await paymentRepo.save(payment);
                    }
                }
            }
            else if (dto.status === 'delivered') {
                order.deliveredAt = new Date();
            }
            if (dto.trackingNumber !== undefined) {
                order.trackingNumber = dto.trackingNumber;
            }
            if (dto.estimatedDeliveryDate !== undefined) {
                order.estimatedDeliveryDate = dto.estimatedDeliveryDate ? new Date(dto.estimatedDeliveryDate) : null;
            }
            // Restore inventory or release reservation if status changed to cancelled and it wasn't cancelled before
            if (dto.status === 'cancelled' && oldStatus !== 'cancelled') {
                const paymentRepo = manager.getRepository(payment_entity_1.Payment);
                const payment = await paymentRepo.findOne({ where: { order_id: order.id } });
                // Stock was subtracted if QR payment was paid, or if COD order was delivered
                const wasSubtracted = (order.paymentMethod === 'qr' && payment?.status === 'paid') ||
                    (order.paymentMethod === 'cod' && oldStatus === 'delivered');
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
            }
            // Save Status Log
            const log = logRepo.create({
                order,
                oldStatus,
                newStatus: dto.status,
                note: dto.note || `Trạng thái được cập nhật bởi Admin`,
            });
            await orderRepo.save(order);
            await logRepo.save(log);
            return order;
        });
    }
    async deleteOrder(orderId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        }
        if (order.status !== 'cancelled') {
            throw new common_1.BadRequestException('Chỉ có thể xóa đơn hàng đã bị hủy');
        }
        await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            // Delete associated payments first (no cascade on payment.order_id column)
            await paymentRepo.delete({ order_id: orderId });
            // Delete order (order_items, order_status_logs, order_shipping_addresses, qr_payments CASCADE delete)
            await orderRepo.remove(order);
        });
        return { success: true };
    }
    async getReturns() {
        return this.returnRepo.find({
            relations: ['order', 'order.user', 'order.statusLogs'],
            order: { id: 'DESC' },
        });
    }
    async handleReturn(returnId, dto) {
        const returnReq = await this.returnRepo.findOne({
            where: { id: returnId },
            relations: ['order', 'order.items'],
        });
        if (!returnReq) {
            throw new common_1.NotFoundException('Yêu cầu đổi trả không tồn tại');
        }
        if (returnReq.status !== 'return_requested') {
            throw new common_1.BadRequestException('Yêu cầu đổi trả đã được xử lý hoặc đã bị hủy từ trước');
        }
        const oldOrderStatus = returnReq.order.status;
        if (dto.action === 'approve') {
            returnReq.status = 'return_approved';
            returnReq.order.status = 'return_approved';
            const logRepo = this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog);
            const log = logRepo.create({
                order: returnReq.order,
                oldStatus: oldOrderStatus,
                newStatus: 'return_approved',
                note: dto.note || `Chấp nhận yêu cầu đổi trả: ${returnReq.reason}`,
            });
            await this.orderRepo.save(returnReq.order);
            await logRepo.save(log);
        }
        else {
            returnReq.status = 'return_rejected';
            returnReq.order.status = 'delivered';
            returnReq.rejectionReason = dto.note || 'Không có lý do chi tiết';
            const logRepo = this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog);
            const log = logRepo.create({
                order: returnReq.order,
                oldStatus: oldOrderStatus,
                newStatus: 'delivered',
                note: `Từ chối yêu cầu đổi trả. Lý do: ${returnReq.rejectionReason}`,
            });
            await this.orderRepo.save(returnReq.order);
            await logRepo.save(log);
        }
        return this.returnRepo.save(returnReq);
    }
    async markReceived(returnId) {
        const returnReq = await this.returnRepo.findOne({
            where: { id: returnId },
            relations: ['order'],
        });
        if (!returnReq) {
            throw new common_1.NotFoundException('Yêu cầu đổi trả không tồn tại');
        }
        if (returnReq.status !== 'return_approved') {
            throw new common_1.BadRequestException('Chỉ có thể chuyển sang đã nhận hàng khi yêu cầu đã được duyệt');
        }
        const oldOrderStatus = returnReq.order.status;
        returnReq.status = 'product_received';
        returnReq.order.status = 'product_received';
        const logRepo = this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog);
        const log = logRepo.create({
            order: returnReq.order,
            oldStatus: oldOrderStatus,
            newStatus: 'product_received',
            note: 'Kho đã nhận lại hàng từ khách hàng',
        });
        await this.orderRepo.save(returnReq.order);
        await logRepo.save(log);
        return this.returnRepo.save(returnReq);
    }
    async startRefund(returnId) {
        const returnReq = await this.returnRepo.findOne({
            where: { id: returnId },
            relations: ['order'],
        });
        if (!returnReq) {
            throw new common_1.NotFoundException('Yêu cầu đổi trả không tồn tại');
        }
        if (returnReq.status !== 'product_received') {
            throw new common_1.BadRequestException('Chỉ có thể tiến hành hoàn tiền khi kho đã nhận sản phẩm');
        }
        const oldOrderStatus = returnReq.order.status;
        returnReq.status = 'refund_processing';
        returnReq.order.status = 'refund_processing';
        const logRepo = this.dataSource.getRepository(order_status_log_entity_1.OrderStatusLog);
        const log = logRepo.create({
            order: returnReq.order,
            oldStatus: oldOrderStatus,
            newStatus: 'refund_processing',
            note: 'Kế toán đang xử lý giao dịch hoàn tiền',
        });
        await this.orderRepo.save(returnReq.order);
        await logRepo.save(log);
        return this.returnRepo.save(returnReq);
    }
    async completeRefund(returnId, dto) {
        if (!dto.refundTransactionId || dto.refundTransactionId.trim() === '') {
            throw new common_1.BadRequestException('Vui lòng cung cấp mã giao dịch hoàn tiền');
        }
        if (!dto.refundMethod || dto.refundMethod.trim() === '') {
            throw new common_1.BadRequestException('Vui lòng cung cấp phương thức hoàn tiền');
        }
        return this.dataSource.transaction(async (manager) => {
            const returnRepo = manager.getRepository(order_return_entity_1.OrderReturn);
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const productRepo = manager.getRepository(products_entity_1.Product);
            const logRepo = manager.getRepository(order_status_log_entity_1.OrderStatusLog);
            const initialReq = await returnRepo.findOne({
                where: { id: returnId },
                relations: ['order'],
            });
            if (!initialReq) {
                throw new common_1.NotFoundException('Yêu cầu đổi trả không tồn tại');
            }
            const returnReq = await returnRepo.findOne({
                where: { id: returnId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!returnReq) {
                throw new common_1.NotFoundException('Yêu cầu đổi trả không tồn tại');
            }
            const order = await orderRepo.findOne({
                where: { id: initialReq.order.id },
                relations: ['items'],
            });
            if (!order) {
                throw new common_1.NotFoundException('Đơn hàng không tồn tại');
            }
            returnReq.order = order;
            if (returnReq.status === 'refunded') {
                throw new common_1.BadRequestException('Yêu cầu đổi trả này đã được hoàn tiền từ trước');
            }
            if (returnReq.status !== 'refund_processing') {
                throw new common_1.BadRequestException('Chỉ có thể hoàn thành khi yêu cầu ở trạng thái đang xử lý hoàn tiền');
            }
            const oldOrderStatus = returnReq.order.status;
            returnReq.status = 'refunded';
            returnReq.order.status = 'refunded';
            returnReq.refundTransactionId = dto.refundTransactionId;
            returnReq.refundMethod = dto.refundMethod;
            returnReq.refundedAt = new Date();
            // Restore product stock
            for (const item of returnReq.order.items) {
                const product = await productRepo.findOne({ where: { id: item.productId } });
                if (product) {
                    product.stock += item.quantity;
                    await productRepo.save(product);
                }
            }
            const log = logRepo.create({
                order: returnReq.order,
                oldStatus: oldOrderStatus,
                newStatus: 'refunded',
                note: `Hoàn tiền thành công. Phương thức: ${dto.refundMethod}. Mã giao dịch: ${dto.refundTransactionId}`,
            });
            await orderRepo.save(returnReq.order);
            await logRepo.save(log);
            return returnRepo.save(returnReq);
        });
    }
    // PRODUCT CRUD
    async createProduct(dto) {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!category) {
            throw new common_1.BadRequestException('Không tìm thấy danh mục');
        }
        const product = this.productRepo.create({
            name: dto.name,
            description: dto.description,
            price: dto.price,
            stock: dto.stock,
            image: dto.image,
            category,
        });
        return this.productRepo.save(product);
    }
    async updateProduct(id, dto) {
        const product = await this.productRepo.findOne({ where: { id }, relations: ['category'] });
        if (!product) {
            throw new common_1.NotFoundException('Sản phẩm không tồn tại');
        }
        if (dto.name !== undefined)
            product.name = dto.name;
        if (dto.description !== undefined)
            product.description = dto.description;
        if (dto.price !== undefined)
            product.price = dto.price;
        if (dto.stock !== undefined)
            product.stock = dto.stock;
        if (dto.image !== undefined)
            product.image = dto.image;
        if (dto.categoryId !== undefined) {
            const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
            if (!category) {
                throw new common_1.BadRequestException('Không tìm thấy danh mục');
            }
            product.category = category;
        }
        return this.productRepo.save(product);
    }
    async deleteProduct(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product) {
            throw new common_1.NotFoundException('Sản phẩm không tồn tại');
        }
        await this.productRepo.remove(product);
        return { success: true };
    }
    async listUsers() {
        return this.userRepo.find({
            order: { id: 'ASC' },
            select: ['id', 'username', 'email', 'role', 'isActive', 'created_at', 'totalSpent', 'fullName', 'phone'],
        });
    }
    async updateUser(userId, dto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        if (dto.username !== undefined) {
            const existingUser = await this.userRepo.findOne({ where: { username: dto.username } });
            if (existingUser && existingUser.id !== userId) {
                throw new common_1.BadRequestException('Tên đăng nhập đã tồn tại');
            }
            user.username = dto.username;
        }
        if (dto.email !== undefined) {
            const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existingUser && existingUser.id !== userId) {
                throw new common_1.BadRequestException('Email đã tồn tại');
            }
            user.email = dto.email;
        }
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        if (dto.role !== undefined)
            user.role = dto.role;
        if (dto.isActive !== undefined)
            user.isActive = dto.isActive;
        return this.userRepo.save(user);
    }
    async deleteUser(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        await this.dataSource.transaction(async (manager) => {
            // 1. Set orders user_id = null
            await manager.getRepository(order_entity_1.Order).update({ user: { id: userId } }, { user: null });
            // 2. Delete Carts & Cart Items
            const cartRepo = manager.getRepository(cart_entity_1.Cart);
            const cartItemRepo = manager.getRepository(cart_item_entity_1.CartItem);
            const carts = await cartRepo.find({ where: { user: { id: userId } } });
            for (const cart of carts) {
                await cartItemRepo.delete({ cart: { id: cart.id } });
                await cartRepo.remove(cart);
            }
            // 3. Delete User (Other tables will CASCADE delete automatically)
            await manager.getRepository(user_entity_1.User).remove(user);
        });
        return { success: true };
    }
    async updateUserRole(userId, role) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        user.role = role;
        return this.userRepo.save(user);
    }
    async banUser(userId, isActive) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        user.isActive = isActive;
        return this.userRepo.save(user);
    }
    async getUserOrders(userId) {
        return this.orderRepo.find({
            where: { user: { id: userId } },
            relations: ['items'],
            order: { id: 'DESC' },
        });
    }
    async getPromotionLogs(page = 1, limit = 20, entityType, action) {
        const query = this.promotionLogRepo.createQueryBuilder('log');
        if (entityType) {
            query.andWhere('log.entityType = :entityType', { entityType });
        }
        if (action) {
            query.andWhere('log.action = :action', { action });
        }
        query.orderBy('log.id', 'DESC');
        query.skip((page - 1) * limit);
        query.take(limit);
        const [logs, total] = await query.getManyAndCount();
        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(order_return_entity_1.OrderReturn)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(categories_entity_1.Category)),
    __param(5, (0, typeorm_1.InjectRepository)(promotion_log_entity_1.PromotionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AdminService);
