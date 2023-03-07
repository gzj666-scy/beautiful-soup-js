import { SoupElement } from "./SoupElement";

export enum SoupType {
    Soup = "soup",
    Tag = "tag",
    Text = "text",
    Comment = "comment",
    Directive = "directive"
}

export type FindParam = {
    /** 匹配标签 */
    name?: string | string[] | RegExp;
    /** 匹配属性 */
    // attrs?: { key: string, value: string | string[] | RegExp }[];
    attrs?: { [key: string]: string | string[] | RegExp };
    /** 匹配字符串 */
    string?: string | string[] | RegExp;
    /** 匹配函数 */
    filter?: (tag: SoupElement) => boolean;
}

type FindLimitParam = {
    /** 返回结果数，默认所有 */
    limit?: number;
}

export type FindAllParam = {
    /** 是否递归的匹配所有子节点，默认true */
    recursive?: boolean;
} & FindParam & FindLimitParam

export type FindSiblingsParam = FindParam & FindLimitParam