import { SoupStrainer } from "./SoupStrainer";
import { TreeBuilder } from "./TreeBuilder";
import { FindParam, FindSiblingsParam, SoupType } from "./Type";

export class SoupElement {
    constructor(parent = undefined, previousElement = undefined, nextElement = undefined) {
        this.parent = parent;
        this.previousElement = previousElement;
        this.nextElement = nextElement;
    }

    protected hidden: boolean;
    protected builder: TreeBuilder;

    public type: SoupType;
    public text: string;
    /** 标签名 */
    public name: string;
    /** 标签属性 */
    public attrs: object;
    /** 当前节点的父节点 */
    public parent: SoupElement;
    /** 当前节点的直接子节点 */
    public contents: SoupElement[];
    /** 当前节点的下一个解析节点 */
    public nextElement: SoupElement;
    /** 当前节点的上一个解析节点 */
    public previousElement: SoupElement;

    /** 当前节点的所有子孙节点 */
    public get descendants(): SoupElement[] {
        const ret = [];
        let cur = this.nextElement;
        while (cur) {
            let parent = cur.parent;
            while (parent && parent != this) {
                parent = parent.parent;
            }
            if (!parent) break;
            ret.push(cur);
            cur = cur.nextElement;
        }
        return ret;
    }

    /** 当前节点的唯一字符子节点 */
    public get string(): SoupElement {
        let cur = this, res;
        if (cur && cur.contents) {
            if (cur.contents.length == 1) {
                while (cur && cur.contents && cur.contents.length == 1) {
                    res = cur.contents[0];
                    // @ts-ignore
                    cur = cur.contents[0];
                }
                if (!res || res.type == SoupType.Tag) return undefined;
                return res;
            } else {
                const newCur = cur.contents.filter(v => v.type == SoupType.Text);
                if (newCur && newCur.length == 1) {
                    return newCur[0];
                }
            }
        }
        return undefined;
    }

    /** 当前节点的下一个兄弟节点 */
    public get nextSibling() {
        if (!this.parent) return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == this.parent.contents.length - 1) return undefined;
        return this.parent.contents[index + 1];
    }

    /** 当前节点的上一个兄弟节点 */
    public get previousSibling() {
        if (!this.parent) return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == 0) return undefined;
        return this.parent.contents[index - 1];
    }

    /** 当前节点后面的所有兄弟节点 */
    public get nextSiblings() {
        if (!this.parent) return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == this.parent.contents.length - 1) return undefined;
        return this.parent.contents.slice(index + 1);
    }

    /** 当前节点前面的所有兄弟节点 */
    public get previousSiblings() {
        if (!this.parent) return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == 0) return undefined;
        return this.parent.contents.slice(0, index);
    }

    /** 
     * 查找一个后面的兄弟节点
     * @param data 
     */
    public findNextSibling(data: FindParam): SoupElement {
        const results = this.findNextSiblings({ ...data, limit: 1 });
        if (results.length > 0) {
            return results[0];
        }
        return undefined;
    }

    /** 
     * 查找所有后面的兄弟节点
     * @param data 
     */
    public findNextSiblings(data: FindSiblingsParam): SoupElement[] {
        const results = [];
        let cur = this.nextSibling;
        const strainer: SoupStrainer = new SoupStrainer(data);
        while (cur) {
            if (cur instanceof SoupElement) {
                const tag = strainer.match(cur);
                if (tag) {
                    results.push(tag);
                    if (data.limit && results.length >= data.limit) {
                        break;
                    }
                }
            }
            cur = cur.nextSibling;
        }
        return results;
    }

    /** 
     * 查找一个前面的兄弟节点
     * @param data 
     */
    public findPreviousSibling(data: FindParam): SoupElement {
        const results = this.findPreviousSiblings({ ...data, limit: 1 });
        if (results.length > 0) {
            return results[0];
        }
        return undefined;
    }

    /** 
     * 查找所有前面的兄弟节点
     * @param data 
     */
    public findPreviousSiblings(data: FindSiblingsParam): SoupElement[] {
        const results = [];
        let cur = this.previousSibling;
        const strainer: SoupStrainer = new SoupStrainer(data);
        while (cur) {
            if (cur instanceof SoupElement) {
                const tag = strainer.match(cur);
                if (tag) {
                    results.push(tag);
                    if (data.limit && results.length >= data.limit) {
                        break;
                    }
                }
            }
            cur = cur.previousSibling;
        }
        return results;
    }

    /**
     * 向标签中添加节点
     * @param item
     */
    public append(item: SoupElement) {
        if (item == null) {
            throw "Cannot append null element!";
        }
        if (item === this) {
            throw "Cannot add one itself!";
        }
        if (!(this.type == SoupType.Tag)) {
            throw "append is not support in " + this.constructor.name;
        }
    }

    /**
     * 向标签中插入一个节点
     * @param index 
     * @param newElement
     */
    public insert(index: number, newElement: SoupElement) {
        if (newElement == null) {
            throw "Cannot insert null element!";
        }
        if (newElement === this) {
            throw "Cannot add one itself!";
        }
        if (!(this.type == SoupType.Tag)) {
            throw "insert is not support in " + this.constructor.name;
        }
        if (index < 0) {
            throw "index cannot be negative!";
        }
    }

    /**
     * 将当前节点移除文档树，返回被移除的节点
     */
    public extract() {
        const extractFirst = this;
        let extractLast = this;
        const descendants = this.descendants;
        if (descendants && descendants.length) {
            // @ts-ignore
            extractLast = descendants[descendants.length - 1];
        }
        // these two maybe null
        const before = this.previousElement;
        const after = extractLast.nextElement;
        // modify extract subtree
        extractFirst.previousElement = null;
        extractLast.nextElement = null;
        if (before) {
            before.nextElement = after;
        }
        if (after) {
            after.previousElement = before;
        }
        //remove node from contents array
        if (this.parent) {
            const index = this.parent.contents.indexOf(this);
            if (index >= 0) {
                this.parent.contents.splice(index, 1);
            }
        }
        this.parent = null;
        return extractFirst;
    }

    /**
     * 移除当前节点，并用新节点替代它，返回被移除的节点
     * @param element
     */
    public replaceWith(newElement: SoupElement) {
        if (this.parent == null) {
            throw "Cannot replace element without parent!";
        }
        if (newElement === this) {
            return;
        }
        if (newElement === this.parent) {
            throw "Cannot replace element with its parent!"
        }

        let parent = this.parent;
        let index = this.parent.contents.indexOf(this);
        this.extract();
        try {
            parent.insert(index, newElement);
        } catch (err) {
            throw 'Cannot replace this element!';
        }
        return this;
    }

    /** 将属性转换为字符串 */
    public convertAttrsToString() {
        let text = '';
        if (!this.attrs) return text;
        for (const key in this.attrs) {
            if (Array.isArray(this.attrs[key])) {
                text += key + '="' + this.attrs[key].join(' ') + '" ';
            } else {
                text += key + '="' + this.attrs[key] + '" ';
            }
        }
        text = text.trim();
        return text;
    }

    public isEmptyElement() {
        return this.contents && this.contents.length == 0;
    }

    private _prettify(indent: string, breakline: string, level = 0) {
        let text = '';
        if (this.hidden && level == 0) {
            --level;
        }
        if (!this.hidden) {
            const attrs = this.convertAttrsToString();
            if (attrs) {
                text += indent.repeat(level) + '<' + this.name + ' ' + attrs;
            } else {
                text += indent.repeat(level) + '<' + this.name;
            }
        }

        // is an element doesn't have any contents, it's a self closing element
        if (!this.hidden) {
            if (this.isEmptyElement() && this.builder.canBeEmptyElement(this.name)) {
                text += ' />' + breakline;
                return text;
            } else {
                text += '>' + breakline;
            }
        }

        for (let i = 0; i < this.contents.length; ++i) {
            if (this.contents[i].type == SoupType.Text) {
                let curText = this.contents[i].toString();
                curText = curText.trim();
                if (curText.length != 0) {
                    if (curText.substring(curText.length - 1) == "\n") {
                        text += indent.repeat(level + 1) + curText;
                    } else {
                        text += indent.repeat(level + 1) + curText + breakline;
                    }
                }
            } else {
                if (this.contents[i].type == SoupType.Comment) {
                    text += indent.repeat(level + 1) + "<!--" + this.contents[i].text + "-->" + breakline;
                } else {
                    text += this.contents[i]._prettify(indent, breakline, level + 1);
                }
            }
        }

        if (!this.hidden) {
            text += indent.repeat(level) + '</' + this.name + '>' + breakline;
        }

        return text;
    }

    /**
     * 将BeautifulSoup的文档树格式化后以Unicode编码输出,每个XML/HTML标签都独占一行
     * @param indent 
     * @param breakline
     */
    public prettify(indent = ' ', breakline = '\n') {
        return this._prettify(indent, breakline).trim();
    }

    /**
     * 获取到当前节点中包含的所有文本内容包括子孙节点中的内容,并将结果作为字符串返回
     * @param separator 分隔符
     */
    public getText(separator = '') {
        const text = [];
        const descendants = this.descendants;
        for (let i = 0; i < descendants.length; ++i) {
            if (descendants[i].type == SoupType.Text) {
                text.push(descendants[i].text);
            }
        }
        return text.join(separator);
    }
}