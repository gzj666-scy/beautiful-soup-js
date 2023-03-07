import { SoupElement } from "./SoupElement";
import { FindParam } from "./Type";
export declare class SoupStrainer {
    constructor(data: FindParam);
    /** 匹配标签 */
    private name;
    /** 匹配属性 */
    private attrs;
    /** 匹配字符串 */
    private string;
    /** 匹配函数 */
    private filter;
    match(tag: SoupElement): SoupElement;
    private matchItem;
    private matchAttrs;
    private matchString;
    private matchFilter;
}
