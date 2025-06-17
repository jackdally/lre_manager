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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEntry = void 0;
var typeorm_1 = require("typeorm");
var Program_1 = require("./Program");
var LedgerEntry = /** @class */ (function () {
    function LedgerEntry() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "vendor_name", void 0);
    __decorate([
        (0, typeorm_1.Column)('text'),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "expense_description", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "wbs_category", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "wbs_subcategory", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'date', nullable: true }),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "baseline_date", void 0);
    __decorate([
        (0, typeorm_1.Column)('float', { nullable: true }),
        __metadata("design:type", Number)
    ], LedgerEntry.prototype, "baseline_amount", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'date', nullable: true }),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "planned_date", void 0);
    __decorate([
        (0, typeorm_1.Column)('float', { nullable: true }),
        __metadata("design:type", Number)
    ], LedgerEntry.prototype, "planned_amount", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'date', nullable: true }),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "actual_date", void 0);
    __decorate([
        (0, typeorm_1.Column)('float', { nullable: true }),
        __metadata("design:type", Number)
    ], LedgerEntry.prototype, "actual_amount", void 0);
    __decorate([
        (0, typeorm_1.Column)('text', { nullable: true }),
        __metadata("design:type", String)
    ], LedgerEntry.prototype, "notes", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Program_1.Program; }, { onDelete: 'CASCADE' }),
        __metadata("design:type", Program_1.Program)
    ], LedgerEntry.prototype, "program", void 0);
    LedgerEntry = __decorate([
        (0, typeorm_1.Entity)()
    ], LedgerEntry);
    return LedgerEntry;
}());
exports.LedgerEntry = LedgerEntry;
