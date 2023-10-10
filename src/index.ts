// import htmlparser from "htmlparser";
import htmlparser from "./libs/htmlparser";
import { SoupTag } from "./main/SoupTag";
import { TreeBuilder } from "./main/TreeBuilder";
import { SoupType } from "./main/Type";
// import htmlparser2 from "htmlparser2";

const ROOT_TAG_NAME = '[document]';
export default class BeautifulSoup extends SoupTag {
    constructor(text: string, ignoreWhitespace = true) {
        super(ROOT_TAG_NAME, new TreeBuilder(), null);
        const handler = new htmlparser.DefaultHandler((error, dom) => {
            if (error) {
                console.log(error);
            }
            else { }
        }, { verbose: false, ignoreWhitespace: ignoreWhitespace });

        const parser = new htmlparser.Parser(handler);
        parser.parseComplete(text);

        if (Array.isArray(handler.dom)) {
            this.build(handler.dom);
        } else {
            this.build([handler.dom]);
        }
        // console.log('htmlparser2 parseDOM >> ', htmlparser2.parseDOM(text));
        // console.log('htmlparser2 parseDocument >> ', htmlparser2.parseDocument(text));
        this.hidden = true;
        this.type = SoupType.Soup;
    }
}