import { SoupElement } from "./SoupElement";
import { SoupType } from "./Type";
export class SoupString extends SoupElement {
    constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.text = text;
        this.type = SoupType.Text;
    }
}
SoupString.prototype.toString = function () {
    return this.text;
};
