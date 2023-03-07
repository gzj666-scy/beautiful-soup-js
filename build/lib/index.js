"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const htmlparser_1 = __importDefault(require("htmlparser"));
const SoupTag_1 = require("./main/SoupTag");
const TreeBuilder_1 = require("./main/TreeBuilder");
const Type_1 = require("./main/Type");
const ROOT_TAG_NAME = '[document]';
class BeautifulSoup extends SoupTag_1.SoupTag {
    constructor(text, ignoreWhitespace = true) {
        super(ROOT_TAG_NAME, new TreeBuilder_1.TreeBuilder(), null);
        const handler = new htmlparser_1.default.DefaultHandler((error, dom) => {
            if (error) {
                console.log(error);
            }
            else { }
        }, { verbose: false, ignoreWhitespace: ignoreWhitespace });
        const parser = new htmlparser_1.default.Parser(handler);
        parser.parseComplete(text);
        if (Array.isArray(handler.dom)) {
            this.build(handler.dom);
        }
        else {
            this.build([handler.dom]);
        }
        this.hidden = true;
        this.type = Type_1.SoupType.Soup;
    }
}
exports.default = BeautifulSoup;
