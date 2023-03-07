import { SoupString } from "./SoupString";
import { SoupType } from "./Type";

export class SoupDoctypeString extends SoupString {
    constructor(text: string, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(text, parent, previousElement, nextElement);
        this.type = SoupType.Directive
    }
}

SoupDoctypeString.prototype.toString = function () {
    return "<" + this.text + ">";
}