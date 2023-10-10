"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoupString = void 0;
const SoupElement_1 = require("./SoupElement");
const Type_1 = require("./Type");
class SoupString extends SoupElement_1.SoupElement {
    constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.text = text;
        this.type = Type_1.SoupType.Text;
    }
}
exports.SoupString = SoupString;
SoupString.prototype.toString = function () {
    return this.text;
};
