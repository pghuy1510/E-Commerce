"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommuneName = getCommuneName;
exports.formatVietnameseAddress = formatVietnameseAddress;
function cleanPart(value) {
    return value?.trim() ?? "";
}
function getCommuneName(address) {
    return cleanPart(address.commune) || cleanPart(address.district);
}
function formatVietnameseAddress(address) {
    return [
        cleanPart(address.detail),
        getCommuneName(address),
        cleanPart(address.province),
    ]
        .filter(Boolean)
        .join(", ");
}
