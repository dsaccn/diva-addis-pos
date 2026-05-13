"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require('bcryptjs');
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminHash, admin, managerHash, cashierHash, waiterHash, starters, mainCourse, juices, beer, spirits, cocktails, foodItems, drinkItems, _i, foodItems_1, item, _a, drinkItems_1, item, tableNumbers, _b, tableNumbers_1, number;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🌱 Seeding Diva Addis Lounge POS...');
                    return [4 /*yield*/, bcrypt.hash('admin123', 10)];
                case 1:
                    adminHash = _c.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: 'admin' },
                            update: {},
                            create: { username: 'admin', passwordHash: adminHash, fullName: 'System Admin', role: 'ADMIN' },
                        })];
                case 2:
                    admin = _c.sent();
                    console.log('✅ Admin user created: admin / admin123');
                    return [4 /*yield*/, bcrypt.hash('manager123', 10)];
                case 3:
                    managerHash = _c.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: 'manager' },
                            update: {},
                            create: { username: 'manager', passwordHash: managerHash, fullName: 'Selam Tesfaye', role: 'MANAGER', phone: '+251911223344' },
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, bcrypt.hash('cashier123', 10)];
                case 5:
                    cashierHash = _c.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: 'cashier' },
                            update: {},
                            create: { username: 'cashier', passwordHash: cashierHash, fullName: 'Biruk Alemu', role: 'CASHIER', phone: '+251922334455' },
                        })];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, bcrypt.hash('waiter123', 10)];
                case 7:
                    waiterHash = _c.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: 'waiter1' },
                            update: {},
                            create: { username: 'waiter1', passwordHash: waiterHash, fullName: 'Tigist Haile', role: 'WAITER', phone: '+251933445566' },
                        })];
                case 8:
                    _c.sent();
                    console.log('✅ Sample staff created');
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'starters' }, update: {}, create: { id: 'starters', name: 'Starters', type: 'FOOD' } })];
                case 9:
                    starters = _c.sent();
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'main' }, update: {}, create: { id: 'main', name: 'Main Course', type: 'FOOD' } })];
                case 10:
                    mainCourse = _c.sent();
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'juices' }, update: {}, create: { id: 'juices', name: 'Juices', type: 'DRINK' } })];
                case 11:
                    juices = _c.sent();
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'beer' }, update: {}, create: { id: 'beer', name: 'Beer', type: 'DRINK' } })];
                case 12:
                    beer = _c.sent();
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'spirits' }, update: {}, create: { id: 'spirits', name: 'Spirits', type: 'DRINK' } })];
                case 13:
                    spirits = _c.sent();
                    return [4 /*yield*/, prisma.category.upsert({ where: { id: 'cocktails' }, update: {}, create: { id: 'cocktails', name: 'Cocktails', type: 'DRINK' } })];
                case 14:
                    cocktails = _c.sent();
                    console.log('✅ Categories created');
                    foodItems = [
                        { id: 'f1', name: 'Tibs', description: 'Sautéed beef with spices', price: 280, categoryId: mainCourse.id },
                        { id: 'f2', name: 'Kitfo', description: 'Ethiopian steak tartare', price: 320, categoryId: mainCourse.id },
                        { id: 'f3', name: 'Doro Wat', description: 'Spicy chicken stew with injera', price: 260, categoryId: mainCourse.id },
                        { id: 'f4', name: 'Shiro Wat', description: 'Chickpea flour stew', price: 180, categoryId: mainCourse.id },
                        { id: 'f5', name: 'Sambusa (3 pcs)', description: 'Crispy fried pastry', price: 120, categoryId: starters.id },
                        { id: 'f6', name: 'Salad', description: 'Fresh mixed salad', price: 150, categoryId: starters.id },
                        { id: 'f7', name: 'French Fries', description: 'Crispy golden fries', price: 130, categoryId: starters.id },
                        { id: 'f8', name: 'Firfir', description: 'Shredded injera with berbere', price: 200, categoryId: mainCourse.id },
                    ];
                    drinkItems = [
                        { id: 'd1', name: 'Heineken', price: 120, categoryId: beer.id, stockQuantity: 48, lowStockThreshold: 10 },
                        { id: 'd2', name: 'Dashen Beer', price: 100, categoryId: beer.id, stockQuantity: 60, lowStockThreshold: 12 },
                        { id: 'd3', name: 'Meta Beer', price: 90, categoryId: beer.id, stockQuantity: 72, lowStockThreshold: 12 },
                        { id: 'd4', name: 'Bedele Beer', price: 85, categoryId: beer.id, stockQuantity: 48, lowStockThreshold: 10 },
                        { id: 'd5', name: 'Johnnie Walker Red', price: 350, categoryId: spirits.id, stockQuantity: 12, lowStockThreshold: 3 },
                        { id: 'd6', name: 'Jack Daniel\'s', price: 400, categoryId: spirits.id, stockQuantity: 8, lowStockThreshold: 3 },
                        { id: 'd7', name: 'Tej (Local Wine)', price: 150, categoryId: spirits.id, stockQuantity: 24, lowStockThreshold: 5 },
                        { id: 'd8', name: 'Mango Juice', price: 80, categoryId: juices.id, stockQuantity: 30, lowStockThreshold: 8 },
                        { id: 'd9', name: 'Avocado Juice', price: 90, categoryId: juices.id, stockQuantity: 25, lowStockThreshold: 8 },
                        { id: 'd10', name: 'Mojito', price: 200, categoryId: cocktails.id, stockQuantity: 0, lowStockThreshold: 5 },
                        { id: 'd11', name: 'Piña Colada', price: 220, categoryId: cocktails.id, stockQuantity: 0, lowStockThreshold: 5 },
                        { id: 'd12', name: 'Soft Drink (Can)', price: 60, categoryId: juices.id, stockQuantity: 100, lowStockThreshold: 20 },
                        { id: 'd13', name: 'Water (500ml)', price: 30, categoryId: juices.id, stockQuantity: 200, lowStockThreshold: 30 },
                    ];
                    _i = 0, foodItems_1 = foodItems;
                    _c.label = 15;
                case 15:
                    if (!(_i < foodItems_1.length)) return [3 /*break*/, 18];
                    item = foodItems_1[_i];
                    return [4 /*yield*/, prisma.menuItem.upsert({ where: { id: item.id }, update: {}, create: __assign(__assign({}, item), { stockQuantity: 0, lowStockThreshold: 0 }) })];
                case 16:
                    _c.sent();
                    _c.label = 17;
                case 17:
                    _i++;
                    return [3 /*break*/, 15];
                case 18:
                    _a = 0, drinkItems_1 = drinkItems;
                    _c.label = 19;
                case 19:
                    if (!(_a < drinkItems_1.length)) return [3 /*break*/, 22];
                    item = drinkItems_1[_a];
                    return [4 /*yield*/, prisma.menuItem.upsert({ where: { id: item.id }, update: {}, create: item })];
                case 20:
                    _c.sent();
                    _c.label = 21;
                case 21:
                    _a++;
                    return [3 /*break*/, 19];
                case 22:
                    console.log('✅ Menu items seeded');
                    tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', 'VIP 1', 'VIP 2', 'Bar 1', 'Bar 2'];
                    _b = 0, tableNumbers_1 = tableNumbers;
                    _c.label = 23;
                case 23:
                    if (!(_b < tableNumbers_1.length)) return [3 /*break*/, 26];
                    number = tableNumbers_1[_b];
                    return [4 /*yield*/, prisma.table.upsert({ where: { number: number }, update: {}, create: { number: number } })];
                case 24:
                    _c.sent();
                    _c.label = 25;
                case 25:
                    _b++;
                    return [3 /*break*/, 23];
                case 26:
                    console.log('✅ Tables created:', tableNumbers.join(', '));
                    console.log('\n🎉 Seed complete! Login with:');
                    console.log('   Admin:   admin / admin123');
                    console.log('   Manager: manager / manager123');
                    console.log('   Cashier: cashier / cashier123');
                    console.log('   Waiter:  waiter1 / waiter123');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) { console.error(e); process.exit(1); }).finally(function () { return prisma.$disconnect(); });
