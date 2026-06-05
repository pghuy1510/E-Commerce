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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const coupon_service_1 = require("../coupons/coupon.service");
const mail_service_1 = require("../common/mail.service");
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../order/order.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    couponService;
    mailService;
    dataSource;
    constructor(usersService, jwtService, configService, couponService, mailService, dataSource) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.couponService = couponService;
        this.mailService = mailService;
        this.dataSource = dataSource;
    }
    async register(username, password, email) {
        if (!username || !password) {
            throw new common_1.BadRequestException('Username and password are required');
        }
        const existingUser = await this.usersService.findByUsername(username);
        if (existingUser) {
            throw new common_1.BadRequestException('Username already exists');
        }
        if (email) {
            const existingEmail = await this.usersService.findByEmail(email);
            if (existingEmail) {
                throw new common_1.BadRequestException('Email already exists');
            }
        }
        const user = await this.usersService.createUser(username, password, email);
        await this.couponService.issueWelcomeCoupon(user.id, user.created_at);
        if (user.email) {
            this.mailService.sendWelcome(user.email, user.username);
        }
        return this.generateToken(user);
    }
    async registerGuestConvert(email, password) {
        if (!email || !password) {
            throw new common_1.BadRequestException('Email and password are required');
        }
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new common_1.BadRequestException('Email này đã được đăng ký tài khoản.');
        }
        const emailPrefix = email.split('@')[0];
        let username = emailPrefix;
        let suffix = 1;
        while (await this.usersService.findByUsername(username)) {
            username = `${emailPrefix}${suffix}`;
            suffix++;
        }
        const user = await this.usersService.createUser(username, password, email);
        await this.couponService.issueWelcomeCoupon(user.id, user.created_at);
        const orderRepo = this.dataSource.getRepository(order_entity_1.Order);
        const guestOrders = await orderRepo.find({
            where: { guestEmail: email },
        });
        let totalSpent = 0;
        if (guestOrders.length > 0) {
            for (const order of guestOrders) {
                order.user = user;
                if (order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered') {
                    totalSpent += Number(order.totalAmount);
                }
            }
            await orderRepo.save(guestOrders);
            if (totalSpent > 0) {
                await this.dataSource.getRepository(user_entity_1.User).increment({ id: user.id }, 'totalSpent', totalSpent);
            }
        }
        if (user.email) {
            this.mailService.sendWelcome(user.email, user.username);
        }
        return this.generateToken(user);
    }
    async login(username, password) {
        if (!username || !password) {
            throw new common_1.UnauthorizedException('Username and password are required');
        }
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.usersService.touchLastLogin(user.id);
        return this.generateToken(user);
    }
    async loginWithGoogleIdToken(idToken) {
        if (!idToken) {
            throw new common_1.UnauthorizedException('idToken is required');
        }
        const tokenInfo = await this.verifyGoogleIdToken(idToken);
        const email = tokenInfo.email;
        if (!email) {
            throw new common_1.UnauthorizedException('Google token does not contain email');
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            if (!existing.isActive) {
                throw new common_1.UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
            }
            await this.usersService.touchLastLogin(existing.id);
            return this.generateToken(existing);
        }
        const baseUsername = email.split('@')[0] || 'google-user';
        const username = await this.generateUniqueUsername(baseUsername);
        const randomPassword = (0, crypto_1.randomBytes)(32).toString('hex');
        const user = await this.usersService.createUser(username, randomPassword, email);
        await this.couponService.issueWelcomeCoupon(user.id, user.created_at);
        return this.generateToken(user);
    }
    async verifyGoogleIdToken(idToken) {
        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const data = (await res.json());
        const verified = data.email_verified === true || data.email_verified === 'true';
        if (!verified) {
            throw new common_1.UnauthorizedException('Google email is not verified');
        }
        const expectedAud = this.configService.get('GOOGLE_CLIENT_ID');
        if (expectedAud && data.aud && data.aud !== expectedAud) {
            throw new common_1.UnauthorizedException('Google token audience mismatch');
        }
        return data;
    }
    async generateUniqueUsername(base) {
        const normalizedBase = base.trim().slice(0, 40) || 'google-user';
        const direct = await this.usersService.findByUsername(normalizedBase);
        if (!direct) {
            return normalizedBase;
        }
        for (let i = 0; i < 20; i++) {
            const candidate = `${normalizedBase}${Math.floor(Math.random() * 10000)}`;
            const exists = await this.usersService.findByUsername(candidate);
            if (!exists) {
                return candidate;
            }
        }
        return `${normalizedBase}-${Date.now()}`;
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role || 'user',
        };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: this.configService.getOrThrow('JWT_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_EXPIRES'),
            }),
        };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('Email does not exist');
        }
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 15);
        await this.usersService.setResetToken(email, token, expires);
        await this.mailService.sendResetPasswordOtp(email, token);
        return {
            success: true,
            message: 'Password reset OTP sent successfully',
            token, // Return token for development helper
        };
    }
    async verifyResetToken(email, token) {
        const user = await this.usersService.findByResetToken(email, token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or reset token');
        }
        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Reset token has expired');
        }
        return { success: true };
    }
    async resetPassword(email, token, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters long');
        }
        const user = await this.usersService.findByResetToken(email, token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or reset token');
        }
        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Reset token has expired');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.resetPassword(email, token, hashed);
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        coupon_service_1.CouponService,
        mail_service_1.MailService,
        typeorm_1.DataSource])
], AuthService);
