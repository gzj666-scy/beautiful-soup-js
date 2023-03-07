import { SoupElement } from "./SoupElement";
import { FindParam, SoupType } from "./Type";

export class SoupStrainer {
    constructor(data: FindParam) {
        this.name = data.name;
        this.attrs = data.attrs;
        this.string = data.string;
        this.filter = data.filter;
    }

    /** 匹配标签 */
    private name: string | string[] | RegExp;
    /** 匹配属性 */
    private attrs: { [key: string]: string | string[] | RegExp };
    /** 匹配字符串 */
    private string: string | string[] | RegExp;
    /** 匹配函数 */
    private filter: (tag: SoupElement) => boolean;

    public match(tag: SoupElement) {
        if (!this.matchItem(tag.name, this.name)) return null;
        if (!this.matchAttrs(tag.attrs, this.attrs)) return null;
        if (!this.matchString(tag, this.string)) return null;
        if (!this.matchFilter(tag)) return null;
        return tag;
    }

    private matchItem(tagItem: string, item: string | string[] | RegExp) {
        if (item == undefined || item == null) return true;
        if (Array.isArray(item)) {
            return item.some(v => v == tagItem);
        }
        if (item instanceof RegExp) {
            return item.test(tagItem);
        }
        return tagItem == item;
    }

    private matchAttrs(tagAttrs: object, attrs: { [key: string]: string | string[] | RegExp }) {
        if (attrs == undefined || attrs == null) return true;
        if (tagAttrs == undefined || tagAttrs == null) return false;
        let found = true;
        for (const key in attrs) {
            const arr = tagAttrs[key]?.split(' ');
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

    private matchString(tag: SoupElement, string: string | string[] | RegExp) {
        if (string == undefined || string == null) return true;
        if (tag.type == SoupType.Tag) {
            if (tag.string) {
                return this.matchItem(tag.string.toString(), string);
            } else {
                return false;
            }
        }
        return this.matchItem(tag.toString(), string);
    }

    private matchFilter(tag: SoupElement) {
        if (this.filter == undefined || this.filter == null) return true;
        return this.filter(tag);
    }
}