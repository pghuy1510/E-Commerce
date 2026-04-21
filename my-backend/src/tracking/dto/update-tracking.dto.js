"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTrackingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_tracking_dto_1 = require("./create-tracking.dto");
class UpdateTrackingDto extends (0, mapped_types_1.PartialType)(create_tracking_dto_1.CreateBehaviorDto) {
}
exports.UpdateTrackingDto = UpdateTrackingDto;
