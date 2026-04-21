"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWishlistDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_wishlist_dto_1 = require("./create-wishlist.dto");
class UpdateWishlistDto extends (0, mapped_types_1.PartialType)(create_wishlist_dto_1.CreateWishlistDto) {
}
exports.UpdateWishlistDto = UpdateWishlistDto;
