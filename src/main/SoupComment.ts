import { SoupElement } from "./SoupElement";
import { SoupType } from "./Type";

/**
 * 注释节点
 */
export class SoupComment extends SoupElement {
    constructor(text: string, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.text = text;
        this.type = SoupType.Comment;
    }
}