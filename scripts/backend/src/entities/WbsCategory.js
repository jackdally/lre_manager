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
exports.WbsCategory = void 0;
var typeorm_1 = require("typeorm");
var Program_1 = require("./Program");
var WbsCategory = /** @class */ (function () {
    function WbsCategory() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
        __metadata("design:type", String)
    ], WbsCategory.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], WbsCategory.prototype, "name", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Program_1.Program; }, { onDelete: 'CASCADE' }),
        __metadata("design:type", Program_1.Program)
    ], WbsCategory.prototype, "program", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)('WbsSubcategory', 'category'),
        __metadata("design:type", Array)
    ], WbsCategory.prototype, "subcategories", void 0);
    WbsCategory = __decorate([
        (0, typeorm_1.Entity)()
    ], WbsCategory);
    return WbsCategory;
}());
exports.WbsCategory = WbsCategory;
