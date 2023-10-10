import { SoupElement } from "./SoupElement";
import { TreeBuilder } from "./TreeBuilder";
import { FindAllParam, FindParam } from "./Type";
/**
 * 标签节点
 */
export declare class SoupTag extends SoupElement {
    constructor(name: string, builder: TreeBuilder, attrs?: any, parent?: any, previousElement?: any, nextElement?: any);
    /** 创建 soup 对象树 */
    protected build(children: any): SoupElement;
    private transform;
    private appendContents;
    /**
     * 查找一个子孙节点
     * @param data
     */
    find(data: FindParam): SoupElement;
    /**
     * 查找所有子孙节点
     * @param data
     */
    findAll(data: FindAllParam): SoupElement[];
    private unique_includes;
    private selectChild;
    private matchSibling;
    /**
     * 按css选择器查找。支持标签选择器、id选择器、类选择器。暂不支持伪类选择器、属性选择器
     * @param selector [tag] [#id] [.class] [tag#id] [tag.class] [.class.class] [element,element] [element element] [element > element] [element ~ element] [element + element]
     */
    select(selector: string): SoupElement[];
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
}
