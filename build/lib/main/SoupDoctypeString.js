"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoupDoctypeString = void 0;
const SoupString_1 = require("./SoupString");
const Type_1 = require("./Type");
class SoupDoctypeString extends SoupString_1.SoupString {
    constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(text, parent, previousElement, nextElement);
        this.type = Type_1.SoupType.Directive;
    }
}
exports.SoupDoctypeString = SoupDoctypeString;
SoupDoctypeString.prototype.toString = function () {
    return "<" + this.text + ">";
};
