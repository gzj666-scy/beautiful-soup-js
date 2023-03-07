"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoupComment = void 0;
const SoupElement_1 = require("./SoupElement");
const Type_1 = require("./Type");
class SoupComment extends SoupElement_1.SoupElement {
    constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.text = text;
        this.type = Type_1.SoupType.Comment;
    }
}
exports.SoupComment = SoupComment;
