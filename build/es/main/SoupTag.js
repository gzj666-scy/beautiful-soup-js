import { SoupComment } from "./SoupComment";
import { SoupDoctypeString } from "./SoupDoctypeString";
import { SoupElement } from "./SoupElement";
import { SoupStrainer } from "./SoupStrainer";
import { SoupString } from "./SoupString";
import { SoupType } from "./Type";
export class SoupTag extends SoupElement {
    constructor(name, builder, attrs = null, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.name = name;
        this.contents = [];
        this.attrs = attrs || {};
        this.hidden = false;
        this.builder = builder;
        this.type = SoupType.Tag;
    }
    build(children) {
        if (!children || children.length < 1)
            return this;
        let last = this;
        for (let i = 0; i < children.length; ++i) {
            const ele = this.transform(children[i]);
            last.nextElement = ele;
            ele.previousElement = last;
            if (ele instanceof SoupTag) {
                last = ele.build(children[i].children);
            }
            else {
                last = ele;
            }
            this.appendContents(ele);
        }
        return last;
    }
    transform(dom) {
        if (!dom)
            return null;
        if (dom.type === 'text') {
            return new SoupString(dom.data, this);
        }
        else if (dom.type === 'comment') {
            return new SoupComment(dom.data, this);
        }
        else if (dom.type === 'directive') { 
            if (dom.name === '!DOCTYPE') {
                return new SoupDoctypeString(dom.data, this);
            }
        }
        return new SoupTag(dom.name, this.builder, dom.attribs, this);
    }
    appendContents(child) {
        if (child)
            this.contents.push(child);
    }
    find(data) {
        const r = this.findAll(Object.assign(Object.assign({}, data), { limit: 1 }));
        if (r.length > 0)
            return r[0];
        return undefined;
    }
    findAll(data) {
        const results = [];
        const strainer = new SoupStrainer(data);
        const nodes = data.recursive == undefined || data.recursive == null ? this.descendants : this.contents;
        for (let i = 0; i < nodes.length; ++i) {
            if (nodes[i] instanceof SoupElement) {
                const tag = strainer.match(nodes[i]);
                if (tag) {
                    results.push(tag);
                }
                if (data.limit && results.length >= data.limit) {
                    break;
                }
            }
        }
        return results;
    }
    unique_includes(array) {
        let arr = [];
        for (let i = 0; i < array.length; i++) {
            if (!arr.includes(array[i])) {
                arr.push(array[i]);
            }
        }
        return arr;
    }
    selectChild(selector, parent, recursive) {
        var _a, _b, _c;
        const selectorArr = selector.split(',').filter(v => v);
        let resultArr = [];
        for (let index = 0; index < selectorArr.length; index++) {
            const css = selectorArr[index];
            if (css.startsWith("#")) { 
                resultArr = resultArr.concat(parent.findAll({ attrs: { id: css.slice(1) }, recursive: recursive }));
            }
            else if (css.startsWith(".")) { 
                const cssArr = css.split('.').filter(v => v); 
                const arr = parent.findAll({ attrs: { class: cssArr[0] }, recursive: recursive });
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index];
                    const valArr = ((_a = element.attrs['class']) === null || _a === void 0 ? void 0 : _a.split(' ')) || [];
                    if (cssArr.every(v => valArr.includes(v))) {
                        resultArr.push(element);
                    }
                }
            }
            else { 
                if (css.includes('.')) { 
                    const cssArr = css.split('.').filter(v => v);
                    const arr = parent.findAll({ name: cssArr[0], recursive: recursive });
                    for (let index = 0; index < arr.length; index++) {
                        const element = arr[index];
                        const valArr = (((_b = element.attrs['class']) === null || _b === void 0 ? void 0 : _b.split(' ')) || []).filter(v => v);
                        if (cssArr.every(v => valArr.includes(v))) {
                            resultArr.push(element);
                        }
                    }
                }
                else if (css.includes('#')) { 
                    const cssArr = css.split('#').filter(v => v);
                    const arr = parent.findAll({ name: cssArr[0], recursive: recursive });
                    for (let index = 0; index < arr.length; index++) {
                        const element = arr[index];
                        const valArr = (((_c = element.attrs['id']) === null || _c === void 0 ? void 0 : _c.split(' ')) || []).filter(v => v);
                        if (cssArr.every(v => valArr.includes(v))) {
                            resultArr.push(element);
                        }
                    }
                }
                else {
                    resultArr = resultArr.concat(parent.findAll({ name: css, recursive: recursive }));
                }
            }
        }
        return resultArr;
    }
    matchSibling(selector, sibling) {
        var _a, _b, _c, _d;
        const selectorArr = selector.split(',').filter(v => v);
        for (let index = 0; index < selectorArr.length; index++) {
            const css = selectorArr[index];
            if (css.startsWith("#")) { 
                const valArr = ((_a = sibling.attrs['id']) === null || _a === void 0 ? void 0 : _a.split(' ')) || [];
                if (valArr.includes(css.slice(1))) {
                    return sibling;
                }
            }
            else if (css.startsWith(".")) { 
                const cssArr = css.split('.').filter(v => v); 
                const valArr = ((_b = sibling.attrs['class']) === null || _b === void 0 ? void 0 : _b.split(' ')) || [];
                if (cssArr.every(v => valArr.includes(v))) {
                    return sibling;
                }
            }
            else { 
                if (css.includes('.')) { 
                    const cssArr = css.split('.').filter(v => v);
                    const valArr = ((_c = sibling.attrs['class']) === null || _c === void 0 ? void 0 : _c.split(' ')) || [];
                    if (sibling.name == cssArr[0] && cssArr.every(v => valArr.includes(v))) {
                        return sibling;
                    }
                }
                else if (css.includes('#')) { 
                    const cssArr = css.split('#').filter(v => v);
                    const valArr = ((_d = sibling.attrs['id']) === null || _d === void 0 ? void 0 : _d.split(' ')) || [];
                    if (sibling.name == cssArr[0] && cssArr.every(v => valArr.includes(v))) {
                        return sibling;
                    }
                }
                else {
                    if (sibling.name == css) {
                        return sibling;
                    }
                }
            }
        }
        return undefined;
    }
    select(selector) {
        var _a;
        const selectorArr = (_a = selector === null || selector === void 0 ? void 0 : selector.split(' ')) === null || _a === void 0 ? void 0 : _a.filter(v => v);
        if (!selectorArr || !selectorArr.length) {
            throw "selector param error!";
        }
        let results = {};
        let mark = '', index = 0;
        selectorArr.forEach((v, i) => {
            if (i == 0) {
                results[i] = this.selectChild(v, this);
                index++;
            }
            else {
                if (['>', '~', '+'].some(w => v == w)) {
                    mark = v;
                }
                else {
                    let arr = [];
                    if (mark == '>') { 
                        results[index - 1].forEach(w => {
                            arr = arr.concat(this.selectChild(v, w, false));
                        });
                    }
                    else if (mark == '~') { 
                        results[index - 1].forEach((w) => {
                            const nextSiblings = w.nextSiblings;
                            if (nextSiblings) {
                                for (let i = 0; i < nextSiblings.length; i++) {
                                    const tag = this.matchSibling(v, nextSiblings[i]);
                                    if (tag) {
                                        arr.push(tag);
                                    }
                                }
                            }
                        });
                    }
                    else if (mark == '+') { 
                        results[index - 1].forEach((w) => {
                            const nextSiblings = w.nextSiblings;
                            if (nextSiblings) {
                                for (let i = 0; i < nextSiblings.length; i++) {
                                    const tag = this.matchSibling(v, nextSiblings[i]);
                                    if (tag) {
                                        arr.push(tag);
                                        break;
                                    }
                                }
                            }
                        });
                    }
                    else {
                        results[index - 1].forEach(w => {
                            arr = arr.concat(this.selectChild(v, w));
                        });
                    }
                    results[index] = arr;
                    mark = '';
                    index++;
                }
            }
        });
        return this.unique_includes(results[index - 1]);
    }
    append(item) {
        super.append(item);
        let pre = this;
        let next = this.nextElement;
        const appendFirst = item;
        let appendLast = item;
        const itemDescendants = item.descendants;
        if (itemDescendants && itemDescendants.length > 0) {
            appendLast = itemDescendants[itemDescendants.length - 1];
        }
        const descendants = this.descendants;
        if (descendants && descendants.length > 0) {
            pre = descendants[descendants.length - 1];
            next = pre.nextElement;
        }
        if (item.type == SoupType.Text && pre.type == SoupType.Text) {
            pre.text += item.text;
            return;
        }
        appendFirst.previousElement = pre;
        appendLast.nextElement = next;
        if (pre)
            pre.nextElement = appendFirst;
        if (next)
            next.previousElement = appendLast;
        this.contents.push(item);
        item.parent = this;
    }
    insert(index, newElement) {
        super.insert(index, newElement);
        if (newElement.type == SoupType.Soup) {
            newElement.contents.forEach(element => {
                this.insert(index, element);
                ++index;
            });
            return;
        }
        index = Math.min(index, this.contents.length);
        if (typeof newElement == 'string') {
            newElement = new SoupString(newElement);
        }
        if (newElement.parent) {
            if (newElement.parent === this) {
                let curIndex = this.contents.indexOf(newElement);
                if (index == curIndex)
                    return;
                if (index > curIndex) {
                    --index;
                }
            }
            newElement.extract();
        }
        const count = this.contents.length;
        const descendantsOfNewElement = newElement.descendants;
        const lastElementOfNewElement = (descendantsOfNewElement && descendantsOfNewElement.length > 0)
            ? descendantsOfNewElement[descendantsOfNewElement.length - 1]
            : newElement;
        if (index == 0) {
            newElement.previousElement = this;
        }
        else {
            const previousChild = this.contents[index - 1];
            const previousDescendants = previousChild.descendants;
            newElement.previousElement = (previousDescendants && previousDescendants.length > 0)
                ? previousDescendants[previousDescendants.length - 1]
                : previousChild;
        }
        if (newElement.previousElement) {
            newElement.previousElement.nextElement = newElement;
        }
        if (index < count) {
            lastElementOfNewElement.nextElement = this.contents[index];
        }
        else {
            let parent = this;
            let parentNextSibling = null;
            while (!parentNextSibling && parent) {
                parentNextSibling = parent.nextSibling;
                parent = parent.parent;
            }
            if (parentNextSibling) {
                lastElementOfNewElement.nextElement = parentNextSibling;
            }
            else {
                lastElementOfNewElement.nextElement = null;
            }
        }
        if (lastElementOfNewElement.nextElement) {
            lastElementOfNewElement.nextElement.previousElement = lastElementOfNewElement;
        }
        newElement.parent = this;
        this.contents.splice(index, 0, newElement);
    }
}
SoupTag.prototype.toString = function () {
    return this.prettify('', '');
};
