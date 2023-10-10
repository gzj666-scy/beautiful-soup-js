"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeBuilder = void 0;
class TreeBuilder {
    constructor() {
        this.EMPTY_ELEMENT_TAGS = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
            'basefont', 'bgsound', 'command', 'frame', 'image', 'isindex', 'nextid', 'spacer'
        ]);
    }
    canBeEmptyElement(name) {
        return this.EMPTY_ELEMENT_TAGS.has(name);
    }
}
exports.TreeBuilder = TreeBuilder;
