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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const XLSX = __importStar(require("xlsx"));
const province_entity_1 = require("../locations/entities/province.entity");
const ward_entity_1 = require("../locations/entities/ward.entity");
const user_address_entity_1 = require("../users/entities/user-address.entity");
const order_shipping_address_entity_1 = require("../order/order-shipping-address.entity");
// Load environmental variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'my-backend', '.env') });
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'ecommerce',
    entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: false, // The import script doesn't need to synchronize database schemas
    logging: false,
});
async function run() {
    console.log('--- BẮT ĐẦU IMPORT ĐỊA CHỈ HÀNH CHÍNH VIỆT NAM ---');
    try {
        await dataSource.initialize();
        console.log('Đã kết nối cơ sở dữ liệu thành công.');
    }
    catch (err) {
        console.error('Không thể kết nối cơ sở dữ liệu:', err);
        process.exit(1);
    }
    const provincesFile = path.join(process.cwd(), 'data', 'provinces.xls');
    const wardsFile = path.join(process.cwd(), 'data', 'wards.xls');
    console.log(`Đọc file provinces: ${provincesFile}`);
    console.log(`Đọc file wards: ${wardsFile}`);
    let provincesWorkbook;
    let wardsWorkbook;
    try {
        provincesWorkbook = XLSX.readFile(provincesFile);
        wardsWorkbook = XLSX.readFile(wardsFile);
    }
    catch (err) {
        console.error('Lỗi khi đọc file Excel:', err.message);
        await dataSource.destroy();
        process.exit(1);
    }
    // Parse provinces
    const provinceSheet = provincesWorkbook.Sheets[provincesWorkbook.SheetNames[0]];
    const provinceRows = XLSX.utils.sheet_to_json(provinceSheet);
    // Parse wards
    const wardSheet = wardsWorkbook.Sheets[wardsWorkbook.SheetNames[0]];
    const wardRows = XLSX.utils.sheet_to_json(wardSheet);
    console.log(`Đọc được ${provinceRows.length} dòng tỉnh/thành.`);
    console.log(`Đọc được ${wardRows.length} dòng xã/phường.`);
    // Validation lists
    const validProvinces = [];
    const validWards = [];
    let provinceErrors = 0;
    let wardErrors = 0;
    // Process Provinces
    for (let i = 0; i < provinceRows.length; i++) {
        const row = provinceRows[i];
        const rawCode = row['Mã'];
        const rawName = row['Tên'];
        if (!rawCode || !rawName) {
            console.warn(`[Province Line ${i + 2}] Bỏ qua dòng thiếu thông tin. Mã: ${rawCode}, Tên: ${rawName}`);
            provinceErrors++;
            continue;
        }
        const code = String(rawCode).trim().padStart(2, '0');
        const name = String(rawName).trim();
        validProvinces.push({ code, name });
    }
    // Process Wards
    for (let i = 0; i < wardRows.length; i++) {
        const row = wardRows[i];
        const rawCode = row['Mã'];
        const rawName = row['Tên'];
        const rawProvinceCode = row['Mã TP'];
        if (!rawCode || !rawName || !rawProvinceCode) {
            console.warn(`[Ward Line ${i + 2}] Bỏ qua dòng thiếu thông tin. Mã: ${rawCode}, Tên: ${rawName}, Mã TP: ${rawProvinceCode}`);
            wardErrors++;
            continue;
        }
        const code = String(rawCode).trim().padStart(5, '0');
        const name = String(rawName).trim();
        const provinceCode = String(rawProvinceCode).trim().padStart(2, '0');
        validWards.push({ code, name, provinceCode });
    }
    // RUN IN TRANSACTION
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const manager = queryRunner.manager;
        console.log('Đang thực hiện upsert danh sách tỉnh/thành...');
        // Upsert provinces
        if (validProvinces.length > 0) {
            // TypeORM upsert
            await manager.getRepository(province_entity_1.Province).upsert(validProvinces.map(p => ({
                code: p.code,
                name: p.name,
            })), ['code']);
        }
        console.log(`Đã lưu/cập nhật ${validProvinces.length} tỉnh thành.`);
        // Load provinces map to get actual IDs
        const provincesInDb = await manager.getRepository(province_entity_1.Province).find();
        const provinceCodeToId = new Map();
        const provinceNameToId = new Map();
        for (const p of provincesInDb) {
            provinceCodeToId.set(p.code, p.id);
            // Clean name for fuzzy mapping (e.g. "Thành phố Hà Nội" -> "hà nội")
            const cleanName = p.name.toLowerCase().replace(/^(thành phố|tỉnh)\s+/i, '').trim();
            provinceNameToId.set(cleanName, p.id);
        }
        console.log('Đang thực hiện upsert danh sách xã/phường...');
        // Prepare wards with provinceId
        const mappedWards = [];
        for (const w of validWards) {
            const provinceId = provinceCodeToId.get(w.provinceCode);
            if (!provinceId) {
                console.warn(`[Ward error] Không tìm thấy mã tỉnh ${w.provinceCode} trong DB cho xã ${w.name} (${w.code}). Bỏ qua.`);
                wardErrors++;
                continue;
            }
            mappedWards.push({
                code: w.code,
                name: w.name,
                provinceId: provinceId,
            });
        }
        // Chunk upsert wards to avoid huge parameter limits in postgres (e.g. 500 records at a time)
        const chunkSize = 500;
        for (let i = 0; i < mappedWards.length; i += chunkSize) {
            const chunk = mappedWards.slice(i, i + chunkSize);
            await manager.getRepository(ward_entity_1.Ward).upsert(chunk, ['code']);
        }
        console.log(`Đã lưu/cập nhật ${mappedWards.length} xã/phường.`);
        // Load wards map to get actual IDs and names for migration
        const wardsInDb = await manager.getRepository(ward_entity_1.Ward).find({ relations: ['province'] });
        const wardMapKey = (provId, name) => `${provId}_${name.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim()}`;
        const wardLookup = new Map();
        for (const w of wardsInDb) {
            wardLookup.set(wardMapKey(w.provinceId, w.name), w);
        }
        console.log('--- BẮT ĐẦU MIGRATE DỮ LIỆU CŨ ---');
        // 1. Migrate User Addresses
        const userAddresses = await manager.getRepository(user_address_entity_1.UserAddress).find();
        let migratedUserAddressesCount = 0;
        for (const addr of userAddresses) {
            // Skip if already migrated
            if (addr.provinceId && addr.wardId)
                continue;
            const oldProvName = addr.province || '';
            const oldDistrictName = addr.district || addr.ward || ''; // district/ward held the local commune in old design
            // Match province
            const cleanProvName = oldProvName.toLowerCase().replace(/^(thành phố|tỉnh)\s+/i, '').trim();
            const matchedProvId = provinceNameToId.get(cleanProvName);
            if (matchedProvId) {
                addr.provinceId = matchedProvId;
                // Match ward/district in that province
                const matchedWard = wardLookup.get(wardMapKey(matchedProvId, oldDistrictName));
                if (matchedWard) {
                    addr.wardId = matchedWard.id;
                }
                addr.addressDetail = addr.detail || '';
                await manager.getRepository(user_address_entity_1.UserAddress).save(addr);
                migratedUserAddressesCount++;
            }
        }
        console.log(`Đã migrate thành công ${migratedUserAddressesCount} địa chỉ người dùng cũ.`);
        // 2. Migrate Order Shipping Addresses
        const orderShippingAddresses = await manager.getRepository(order_shipping_address_entity_1.OrderShippingAddress).find();
        let migratedOrderAddressesCount = 0;
        for (const addr of orderShippingAddresses) {
            if (addr.provinceId && addr.wardId)
                continue;
            const oldProvName = addr.province || '';
            const oldDistrictName = addr.district || addr.ward || '';
            const cleanProvName = oldProvName.toLowerCase().replace(/^(thành phố|tỉnh)\s+/i, '').trim();
            const matchedProvId = provinceNameToId.get(cleanProvName);
            if (matchedProvId) {
                addr.provinceId = matchedProvId;
                addr.provinceName = oldProvName;
                const matchedWard = wardLookup.get(wardMapKey(matchedProvId, oldDistrictName));
                if (matchedWard) {
                    addr.wardId = matchedWard.id;
                    addr.wardName = matchedWard.name;
                }
                else {
                    addr.wardName = oldDistrictName;
                }
                addr.addressDetail = addr.detail || '';
                addr.fullAddress = `${addr.addressDetail}, ${addr.wardName}, ${addr.provinceName}`;
                await manager.getRepository(order_shipping_address_entity_1.OrderShippingAddress).save(addr);
                migratedOrderAddressesCount++;
            }
        }
        console.log(`Đã migrate thành công ${migratedOrderAddressesCount} địa chỉ đơn hàng cũ.`);
        await queryRunner.commitTransaction();
        console.log('--- KẾT QUẢ IMPORT & MIGRATION ---');
        console.log(`- Tổng số tỉnh/thành: ${validProvinces.length} (Dòng lỗi: ${provinceErrors})`);
        console.log(`- Tổng số xã/phường: ${mappedWards.length} (Dòng lỗi: ${wardErrors})`);
        console.log(`- Tổng số địa chỉ người dùng được migrate: ${migratedUserAddressesCount}`);
        console.log(`- Tổng số địa chỉ đơn hàng được migrate: ${migratedOrderAddressesCount}`);
        console.log('--------------------------------------------------');
    }
    catch (err) {
        console.error('Lỗi nghiêm trọng trong quá trình import/migration. Đang rollback...', err);
        await queryRunner.rollbackTransaction();
    }
    finally {
        await queryRunner.release();
        await dataSource.destroy();
        console.log('Kết nối database đã đóng.');
    }
}
void run();
