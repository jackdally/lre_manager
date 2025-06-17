"use strict";
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
// To run: npm install typeorm @types/node
// Then: npx ts-node scripts/seed_programs_and_expenses.ts
var typeorm_1 = require("typeorm");
var Program_1 = require("../backend/src/entities/Program");
var LedgerEntry_1 = require("../backend/src/entities/LedgerEntry");
var WbsCategory_1 = require("../backend/src/entities/WbsCategory");
var WbsSubcategory_1 = require("../backend/src/entities/WbsSubcategory");
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomAmount(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}
var vendors = ['Acme Corp', 'Globex', 'Umbrella', 'Wayne Enterprises', 'Stark Industries'];
var categories = ['Labor', 'Materials', 'Travel', 'Equipment'];
var subcategories = ['Engineering', 'Supplies', 'Flights', 'Machinery'];
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, programRepo, ledgerRepo, wbsCategoryRepo, wbsSubcategoryRepo, programs, _i, programs_1, progData, program, catNames, subcatNames, wbsCategories, c, cat, s, subcat, allSubcats, i, subcat, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, typeorm_1.createConnection)()];
                case 1:
                    connection = _a.sent();
                    programRepo = connection.getRepository(Program_1.Program);
                    ledgerRepo = connection.getRepository(LedgerEntry_1.LedgerEntry);
                    wbsCategoryRepo = connection.getRepository(WbsCategory_1.WbsCategory);
                    wbsSubcategoryRepo = connection.getRepository(WbsSubcategory_1.WbsSubcategory);
                    // Remove all existing data
                    return [4 /*yield*/, ledgerRepo.delete({})];
                case 2:
                    // Remove all existing data
                    _a.sent();
                    return [4 /*yield*/, programRepo.delete({})];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, wbsSubcategoryRepo.delete({})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, wbsCategoryRepo.delete({})];
                case 5:
                    _a.sent();
                    programs = [
                        {
                            code: 'POP-001',
                            name: 'Period of Performance Alpha',
                            description: 'PoP program from end of 2024 to start of 2026',
                            status: 'Active',
                            startDate: new Date('2024-12-01'),
                            endDate: new Date('2026-01-31'),
                            totalBudget: 10000000,
                            type: 'Period of Performance',
                        },
                        {
                            code: 'POP-002',
                            name: 'Period of Performance Beta',
                            description: 'PoP program from end of 2024 to start of 2026',
                            status: 'Active',
                            startDate: new Date('2024-12-01'),
                            endDate: new Date('2026-01-31'),
                            totalBudget: 10000000,
                            type: 'Period of Performance',
                        },
                        {
                            code: 'ANNUAL-2025',
                            name: 'Annual Program 2025',
                            description: 'Annual program for 2025',
                            status: 'Active',
                            startDate: new Date('2025-01-01'),
                            endDate: new Date('2025-12-31'),
                            totalBudget: 10000000,
                            type: 'Annual',
                        },
                    ];
                    _i = 0, programs_1 = programs;
                    _a.label = 6;
                case 6:
                    if (!(_i < programs_1.length)) return [3 /*break*/, 22];
                    progData = programs_1[_i];
                    program = programRepo.create(progData);
                    return [4 /*yield*/, programRepo.save(program)];
                case 7:
                    _a.sent();
                    catNames = ['Labor', 'Materials'];
                    subcatNames = [['Engineering', 'Support'], ['Supplies', 'Equipment']];
                    wbsCategories = [];
                    c = 0;
                    _a.label = 8;
                case 8:
                    if (!(c < catNames.length)) return [3 /*break*/, 15];
                    cat = wbsCategoryRepo.create({ name: catNames[c], program: program });
                    return [4 /*yield*/, wbsCategoryRepo.save(cat)];
                case 9:
                    _a.sent();
                    s = 0;
                    _a.label = 10;
                case 10:
                    if (!(s < subcatNames[c].length)) return [3 /*break*/, 13];
                    subcat = wbsSubcategoryRepo.create({ name: subcatNames[c][s], category: cat });
                    return [4 /*yield*/, wbsSubcategoryRepo.save(subcat)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    s++;
                    return [3 /*break*/, 10];
                case 13:
                    wbsCategories.push(cat);
                    _a.label = 14;
                case 14:
                    c++;
                    return [3 /*break*/, 8];
                case 15: return [4 /*yield*/, wbsSubcategoryRepo.find({ where: {}, relations: ['category'] })];
                case 16:
                    allSubcats = _a.sent();
                    i = 0;
                    _a.label = 17;
                case 17:
                    if (!(i < 20)) return [3 /*break*/, 20];
                    subcat = allSubcats[Math.floor(Math.random() * allSubcats.length)];
                    entry = ledgerRepo.create({
                        vendor_name: vendors[Math.floor(Math.random() * vendors.length)],
                        expense_description: "Expense ".concat(i + 1, " for ").concat(program.code),
                        wbs_category: subcat.category.name,
                        wbs_subcategory: subcat.name,
                        baseline_date: randomDate(program.startDate, program.endDate).toISOString().slice(0, 10),
                        baseline_amount: randomAmount(1000, 100000),
                        planned_date: randomDate(program.startDate, program.endDate).toISOString().slice(0, 10),
                        planned_amount: randomAmount(1000, 100000),
                        actual_date: randomDate(program.startDate, program.endDate).toISOString().slice(0, 10),
                        actual_amount: randomAmount(1000, 100000),
                        notes: Math.random() > 0.5 ? 'Urgent' : null,
                        program: program,
                    });
                    return [4 /*yield*/, ledgerRepo.save(entry)];
                case 18:
                    _a.sent();
                    _a.label = 19;
                case 19:
                    i++;
                    return [3 /*break*/, 17];
                case 20:
                    console.log("Seeded program ".concat(program.code, " with 2 WBS categories, 4 subcategories, and 20 expenses."));
                    _a.label = 21;
                case 21:
                    _i++;
                    return [3 /*break*/, 6];
                case 22: return [4 /*yield*/, connection.close()];
                case 23:
                    _a.sent();
                    console.log('Seeding complete.');
                    return [2 /*return*/];
            }
        });
    });
}
seed().catch(function (e) { console.error(e); process.exit(1); });
