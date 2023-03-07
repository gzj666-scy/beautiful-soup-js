import { SoupComment } from "./SoupComment";
import { SoupDoctypeString } from "./SoupDoctypeString";
import { SoupElement } from "./SoupElement";
import { SoupStrainer } from "./SoupStrainer";
import { SoupString } from "./SoupString";
import { TreeBuilder } from "./TreeBuilder";
import { FindAllParam, FindParam, SoupType } from "./Type";

/**
 * 标签节点
 */
export class SoupTag extends SoupElement {
    constructor(name: string, builder: TreeBuilder, attrs = null, parent = undefined, previousElement = undefined, nextElement = undefined) {
        super(parent, previousElement, nextElement);
        this.name = name;
        this.contents = [];
        this.attrs = attrs || {};
        this.hidden = false;
        this.builder = builder;
        this.type = SoupType.Tag;
    }

    /** 创建 soup 对象树 */
    protected build(children) {
        if (!children || children.length < 1) return this;
        let last: SoupElement = this;
        for (let i = 0; i < children.length; ++i) {
            const ele = this.transform(children[i]);
            last.nextElement = ele;
            ele.previousElement = last;
            if (ele instanceof SoupTag) {
                last = ele.build(children[i].children);
            } else {
                last = ele;
            }
            this.appendContents(ele);
        }
        return last;
    }

    private transform(dom): SoupElement {
        if (!dom) return null;
        if (dom.type === 'text') {
            return new SoupString(dom.data, this);
        } else if (dom.type === 'comment') {
            return new SoupComment(dom.data, this);
        } else if (dom.type === 'directive') {//<!**
            if (dom.name === '!DOCTYPE') {
                return new SoupDoctypeString(dom.data, this);
            }
        }
        // tag;script;
        return new SoupTag(dom.name, this.builder, dom.attribs, this);
    }

    private appendContents(child: SoupElement) {
        if (child) this.contents.push(child);
    }

    /** 
     * 查找一个子孙节点
     * @param data 
     */
    public find(data: FindParam): SoupElement {
        const r = this.findAll({ ...data, limit: 1 });
        if (r.length > 0) return r[0];
        return undefined;
    }

    /** 
     * 查找所有子孙节点
     * @param data 
     */
    public findAll(data: FindAllParam): SoupElement[] {
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

    private unique_includes<T>(array: T[]): T[] {
        let arr = []
        for (let i = 0; i < array.length; i++) {
            if (!arr.includes(array[i])) {
                arr.push(array[i])
            }
        }
        return arr;
    }

    private selectChild(selector: string, parent: SoupTag, recursive?: boolean) {
        const selectorArr = selector.split(',').filter(v => v);
        let resultArr: SoupElement[] = [];
        for (let index = 0; index < selectorArr.length; index++) {
            const css = selectorArr[index];
            if (css.startsWith("#")) {//id选择器
                resultArr = resultArr.concat(parent.findAll({ attrs: { id: css.slice(1) }, recursive: recursive }));
            } else if (css.startsWith(".")) {//class选择器
                const cssArr = css.split('.').filter(v => v); //处理 .a.b 这类选择器
                const arr = parent.findAll({ attrs: { class: cssArr[0] }, recursive: recursive });
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index];
                    const valArr = element.attrs['class']?.split(' ') || [];
                    if (cssArr.every(v => valArr.includes(v))) {
                        resultArr.push(element);
                    }
                }
            } else {//标签选择器
                if (css.includes('.')) { //处理 div.b 这类选择器
                    const cssArr = css.split('.').filter(v => v);
                    const arr = parent.findAll({ name: cssArr[0], recursive: recursive });
                    for (let index = 0; index < arr.length; index++) {
                        const element = arr[index];
                        const valArr = (element.attrs['class']?.split(' ') || []).filter(v => v);
                        if (cssArr.every(v => valArr.includes(v))) {
                            resultArr.push(element);
                        }
                    }
                } else if (css.includes('#')) { //处理 div#b 这类选择器
                    const cssArr = css.split('#').filter(v => v);
                    const arr = parent.findAll({ name: cssArr[0], recursive: recursive });
                    for (let index = 0; index < arr.length; index++) {
                        const element = arr[index];
                        const valArr = (element.attrs['id']?.split(' ') || []).filter(v => v);
                        if (cssArr.every(v => valArr.includes(v))) {
                            resultArr.push(element);
                        }
                    }
                } else {
                    resultArr = resultArr.concat(parent.findAll({ name: css, recursive: recursive }));
                }
            }
        }
        return resultArr;
    }

    private matchSibling(selector: string, sibling: SoupElement) {
        const selectorArr = selector.split(',').filter(v => v);
        for (let index = 0; index < selectorArr.length; index++) {
            const css = selectorArr[index];
            if (css.startsWith("#")) {//id选择器
                const valArr = sibling.attrs['id']?.split(' ') || [];
                if (valArr.includes(css.slice(1))) {
                    return sibling;
                }
            } else if (css.startsWith(".")) {//class选择器
                const cssArr = css.split('.').filter(v => v); //处理 .a.b 这类选择器
                const valArr = sibling.attrs['class']?.split(' ') || [];
                if (cssArr.every(v => valArr.includes(v))) {
                    return sibling;
                }
            } else {//标签选择器
                if (css.includes('.')) { //处理 div.b 这类选择器
                    const cssArr = css.split('.').filter(v => v);
                    const valArr = sibling.attrs['class']?.split(' ') || [];
                    if (sibling.name == cssArr[0] && cssArr.every(v => valArr.includes(v))) {
                        return sibling;
                    }
                } else if (css.includes('#')) { //处理 div#b 这类选择器
                    const cssArr = css.split('#').filter(v => v);
                    const valArr = sibling.attrs['id']?.split(' ') || [];
                    if (sibling.name == cssArr[0] && cssArr.every(v => valArr.includes(v))) {
                        return sibling;
                    }
                } else {
                    if (sibling.name == css) {
                        return sibling;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * 按css选择器查找。支持标签选择器、id选择器、类选择器。暂不支持伪类选择器、属性选择器
     * @param selector [tag] [#id] [.class] [tag#id] [tag.class] [.class.class] [element,element] [element element] [element > element] [element ~ element] [element + element]
     */
    public select(selector: string): SoupElement[] {
        const selectorArr = selector?.split(' ')?.filter(v => v);
        if (!selectorArr || !selectorArr.length) {
            throw "selector param error!";
        }
        let results = {};
        let mark = '', index = 0;
        selectorArr.forEach((v, i) => {
            if (i == 0) {
                results[i] = this.selectChild(v, this);
                index++;
            } else {
                if (['>', '~', '+'].some(w => v == w)) {
                    mark = v;
                } else {
                    let arr = [];
                    if (mark == '>') {// 查找直接子元素
                        results[index - 1].forEach(w => {
                            arr = arr.concat(this.selectChild(v, w, false));
                        });
                    } else if (mark == '~') {// 查找后面兄弟元素
                        results[index - 1].forEach((w: SoupElement) => {
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
                    } else if (mark == '+') {// 查找紧跟兄弟元素
                        results[index - 1].forEach((w: SoupElement) => {
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
                    } else {
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

    /**
     * 向标签中添加节点
     * @param item
     */
    public append(item: SoupElement) {
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
            // @ts-ignore
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

    /**
     * 向标签中插入一个节点
     * @param index 
     * @param newElement
     */
    public insert(index: number, newElement: SoupElement) {
        super.insert(index, newElement);
        if (newElement.type == SoupType.Soup) {
            newElement.contents.forEach(element => {
                this.insert(index, element);
                ++index;
            });
            return
        }

        index = Math.min(index, this.contents.length);

        if (typeof newElement == 'string') {
            newElement = new SoupString(newElement);
        }

        if (newElement.parent) {
            if (newElement.parent === this) {
                let curIndex = this.contents.indexOf(newElement);
                if (index == curIndex) return;
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
        // handle previous element of newElement
        if (index == 0) {
            newElement.previousElement = this;
        } else {
            const previousChild = this.contents[index - 1]
            const previousDescendants = previousChild.descendants
            newElement.previousElement = (previousDescendants && previousDescendants.length > 0)
                ? previousDescendants[previousDescendants.length - 1]
                : previousChild;
        }
        if (newElement.previousElement) {
            newElement.previousElement.nextElement = newElement;
        }
        // handle next element of newElement
        if (index < count) {
            lastElementOfNewElement.nextElement = this.contents[index];
        } else {
            let parent = this;
            let parentNextSibling = null;
            while (!parentNextSibling && parent) {
                parentNextSibling = parent.nextSibling;
                // @ts-ignore
                parent = parent.parent;
            }

            if (parentNextSibling) {
                lastElementOfNewElement.nextElement = parentNextSibling
            } else {
                lastElementOfNewElement.nextElement = null
            }
        }
        if (lastElementOfNewElement.nextElement) {
            lastElementOfNewElement.nextElement.previousElement = lastElementOfNewElement
        }

        newElement.parent = this;
        this.contents.splice(index, 0, newElement);
    }
}

SoupTag.prototype.toString = function () {
    return this.prettify('', '');
}