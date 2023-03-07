import { SoupStrainer } from "./SoupStrainer";
import { SoupType } from "./Type";
export class SoupElement {
    constructor(parent = undefined, previousElement = undefined, nextElement = undefined) {
        this.parent = parent;
        this.previousElement = previousElement;
        this.nextElement = nextElement;
    }
    get descendants() {
        const ret = [];
        let cur = this.nextElement;
        while (cur) {
            let parent = cur.parent;
            while (parent && parent != this) {
                parent = parent.parent;
            }
            if (!parent)
                break;
            ret.push(cur);
            cur = cur.nextElement;
        }
        return ret;
    }
    get string() {
        let cur = this, res;
        if (cur && cur.contents) {
            if (cur.contents.length == 1) {
                while (cur && cur.contents && cur.contents.length == 1) {
                    res = cur.contents[0];
                    cur = cur.contents[0];
                }
                if (!res || res.type == SoupType.Tag)
                    return undefined;
                return res;
            }
            else {
                const newCur = cur.contents.filter(v => v.type == SoupType.Text);
                if (newCur && newCur.length == 1) {
                    return newCur[0];
                }
            }
        }
        return undefined;
    }
    get nextSibling() {
        if (!this.parent)
            return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == this.parent.contents.length - 1)
            return undefined;
        return this.parent.contents[index + 1];
    }
    get previousSibling() {
        if (!this.parent)
            return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == 0)
            return undefined;
        return this.parent.contents[index - 1];
    }
    get nextSiblings() {
        if (!this.parent)
            return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == this.parent.contents.length - 1)
            return undefined;
        return this.parent.contents.slice(index + 1);
    }
    get previousSiblings() {
        if (!this.parent)
            return undefined;
        const index = this.parent.contents.indexOf(this);
        if (index == 0)
            return undefined;
        return this.parent.contents.slice(0, index);
    }
    findNextSibling(data) {
        const results = this.findNextSiblings(Object.assign(Object.assign({}, data), { limit: 1 }));
        if (results.length > 0) {
            return results[0];
        }
        return undefined;
    }
    findNextSiblings(data) {
        const results = [];
        let cur = this.nextSibling;
        const strainer = new SoupStrainer(data);
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
    findPreviousSibling(data) {
        const results = this.findPreviousSiblings(Object.assign(Object.assign({}, data), { limit: 1 }));
        if (results.length > 0) {
            return results[0];
        }
        return undefined;
    }
    findPreviousSiblings(data) {
        const results = [];
        let cur = this.previousSibling;
        const strainer = new SoupStrainer(data);
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
    append(item) {
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
    insert(index, newElement) {
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
    extract() {
        const extractFirst = this;
        let extractLast = this;
        const descendants = this.descendants;
        if (descendants && descendants.length) {
            extractLast = descendants[descendants.length - 1];
        }
        const before = this.previousElement;
        const after = extractLast.nextElement;
        extractFirst.previousElement = null;
        extractLast.nextElement = null;
        if (before) {
            before.nextElement = after;
        }
        if (after) {
            after.previousElement = before;
        }
        if (this.parent) {
            const index = this.parent.contents.indexOf(this);
            if (index >= 0) {
                this.parent.contents.splice(index, 1);
            }
        }
        this.parent = null;
        return extractFirst;
    }
    replaceWith(newElement) {
        if (this.parent == null) {
            throw "Cannot replace element without parent!";
        }
        if (newElement === this) {
            return;
        }
        if (newElement === this.parent) {
            throw "Cannot replace element with its parent!";
        }
        let parent = this.parent;
        let index = this.parent.contents.indexOf(this);
        this.extract();
        try {
            parent.insert(index, newElement);
        }
        catch (err) {
            throw 'Cannot replace this element!';
        }
        return this;
    }
    convertAttrsToString() {
        let text = '';
        if (!this.attrs)
            return text;
        for (const key in this.attrs) {
            if (Array.isArray(this.attrs[key])) {
                text += key + '="' + this.attrs[key].join(' ') + '" ';
            }
            else {
                text += key + '="' + this.attrs[key] + '" ';
            }
        }
        text = text.trim();
        return text;
    }
    isEmptyElement() {
        return this.contents && this.contents.length == 0;
    }
    _prettify(indent, breakline, level = 0) {
        let text = '';
        if (this.hidden && level == 0) {
            --level;
        }
        if (!this.hidden) {
            const attrs = this.convertAttrsToString();
            if (attrs) {
                text += indent.repeat(level) + '<' + this.name + ' ' + attrs;
            }
            else {
                text += indent.repeat(level) + '<' + this.name;
            }
        }
        if (!this.hidden) {
            if (this.isEmptyElement() && this.builder.canBeEmptyElement(this.name)) {
                text += ' />' + breakline;
                return text;
            }
            else {
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
                    }
                    else {
                        text += indent.repeat(level + 1) + curText + breakline;
                    }
                }
            }
            else {
                if (this.contents[i].type == SoupType.Comment) {
                    text += indent.repeat(level + 1) + "<!--" + this.contents[i].text + "-->" + breakline;
                }
                else {
                    text += this.contents[i]._prettify(indent, breakline, level + 1);
                }
            }
        }
        if (!this.hidden) {
            text += indent.repeat(level) + '</' + this.name + '>' + breakline;
        }
        return text;
    }
    prettify(indent = ' ', breakline = '\n') {
        return this._prettify(indent, breakline).trim();
    }
    getText(separator = '') {
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
