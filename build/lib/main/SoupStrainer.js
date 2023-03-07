"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoupStrainer = void 0;
const Type_1 = require("./Type");
class SoupStrainer {
    constructor(data) {
        this.name = data.name;
        this.attrs = data.attrs;
        this.string = data.string;
        this.filter = data.filter;
    }
    match(tag) {
        if (!this.matchItem(tag.name, this.name))
            return null;
        if (!this.matchAttrs(tag.attrs, this.attrs))
            return null;
        if (!this.matchString(tag, this.string))
            return null;
        if (!this.matchFilter(tag))
            return null;
        return tag;
    }
    matchItem(tagItem, item) {
        if (item == undefined || item == null)
            return true;
        if (Array.isArray(item)) {
            return item.some(v => v == tagItem);
        }
        if (item instanceof RegExp) {
            return item.test(tagItem);
        }
        return tagItem == item;
    }
    matchAttrs(tagAttrs, attrs) {
        var _a;
        if (attrs == undefined || attrs == null)
            return true;
        if (tagAttrs == undefined || tagAttrs == null)
            return false;
        let found = true;
        for (const key in attrs) {
            const arr = (_a = tagAttrs[key]) === null || _a === void 0 ? void 0 : _a.split(' ');
            if (arr == undefined || arr == null) {
                found = false;
                break;
            }
            if (!arr.some(v => this.matchItem(v, attrs[key]))) {
                found = false;
                break;
            }
        }
        return found;
    }
    matchString(tag, string) {
        if (string == undefined || string == null)
            return true;
        if (tag.type == Type_1.SoupType.Tag) {
            if (tag.string) {
                return this.matchItem(tag.string.toString(), string);
            }
            else {
                return false;
            }
        }
        return this.matchItem(tag.toString(), string);
    }
    matchFilter(tag) {
        if (this.filter == undefined || this.filter == null)
            return true;
        return this.filter(tag);
    }
}
exports.SoupStrainer = SoupStrainer;
