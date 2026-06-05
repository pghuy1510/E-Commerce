"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMoneyNumber = toMoneyNumber;
exports.toVndAmount = toVndAmount;
exports.calculateCartSubtotal = calculateCartSubtotal;
exports.calculateOrderTotals = calculateOrderTotals;
const common_1 = require("@nestjs/common");
function toMoneyNumber(value, fieldName) {
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount)) {
        throw new common_1.BadRequestException(`${fieldName} is invalid.`);
    }
    return amount;
}
function toVndAmount(value, fieldName) {
    const amount = toMoneyNumber(value, fieldName);
    return Math.round(amount);
}
function calculateCartSubtotal(items) {
    return items.reduce((sum, item) => {
        return sum + toVndAmount(item.price, 'Cart item price') * item.quantity;
    }, 0);
}
function calculateOrderTotals(params) {
    const subtotal = toVndAmount(params.subtotal, 'Subtotal');
    const shippingFee = Math.max(0, toVndAmount(params.shippingFee ?? 0, 'Shipping fee'));
    const discountTotal = Math.max(0, toVndAmount(params.discountTotal ?? 0, 'Discount total'));
    const finalTotal = Math.max(0, subtotal + shippingFee - discountTotal);
    return {
        subtotal,
        shippingFee,
        discountTotal,
        finalTotal,
    };
}
