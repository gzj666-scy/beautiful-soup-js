import { TreeBuilder } from "./TreeBuilder";
import { FindParam, FindSiblingsParam, SoupType } from "./Type";
export declare class SoupElement {
    constructor(parent?: any, previousElement?: any, nextElement?: any);
    protected hidden: boolean;
    protected builder: TreeBuilder;
    type: SoupType;
    text: string;
    /** 标签名 */
    name: string;
    /** 标签属性 */
    attrs: object;
    /** 当前节点的父节点 */
    parent: SoupElement;
    /** 当前节点的直接子节点 */
    contents: SoupElement[];
    /** 当前节点的下一个解析节点 */
    nextElement: SoupElement;
    /** 当前节点的上一个解析节点 */
    previousElement: SoupElement;
    /** 当前节点的所有子孙节点 */
    get descendants(): SoupElement[];
    /** 当前节点的唯一字符子节点 */
    get string(): SoupElement;
    /** 当前节点的下一个兄弟节点 */
    get nextSibling(): SoupElement;
    /** 当前节点的上一个兄弟节点 */
    get previousSibling(): SoupElement;
    /** 当前节点后面的所有兄弟节点 */
    get nextSiblings(): SoupElement[];
    /** 当前节点前面的所有兄弟节点 */
    get previousSiblings(): SoupElement[];
    /**
     * 查找一个后面的兄弟节点
     * @param data
     */
    findNextSibling(data: FindParam): SoupElement;
    /**
     * 查找所有后面的兄弟节点
     * @param data
     */
    findNextSiblings(data: FindSiblingsParam): SoupElement[];
    /**
     * 查找一个前面的兄弟节点
     * @param data
     */
    findPreviousSibling(data: FindParam): SoupElement;
    /**
     * 查找所有前面的兄弟节点
     * @param data
     */
    findPreviousSiblings(data: FindSiblingsParam): SoupElement[];
    /**
     * 向标签中添加节点
     * @param item
     */
    append(item: SoupElement): void;
    /**
     * 向标签中插入一个节点
     * @param index
     * @param newElement
     */
    insert(index: number, newElement: SoupElement): void;
    /**
     * 将当前节点移除文档树，返回被移除的节点
     */
    extract(): this;
    /**
     * 移除当前节点，并用新节点替代它，返回被移除的节点
     * @param element
     */
    replaceWith(newElement: SoupElement): this;
    /** 将属性转换为字符串 */
    convertAttrsToString(): string;
    isEmptyElement(): boolean;
    private _prettify;
    /**
     * 将BeautifulSoup的文档树格式化后以Unicode编码输出,每个XML/HTML标签都独占一行
     * @param indent
     * @param breakline
     */
    prettify(indent?: string, breakline?: string): string;
    /**
     * 获取到当前节点中包含的所有文本内容包括子孙节点中的内容,并将结果作为字符串返回
     * @param separator 分隔符
     */
    getText(separator?: string): string;
}
