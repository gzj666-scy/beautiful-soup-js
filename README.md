BeautifulSoup
=============================
BeautifulSoup 的js实现。功能参考 Beautiful Soup 4.4.0 文档：https://beautifulsoup.readthedocs.io/zh_CN/v4.4.0/#。 基于 JSSoup-0.0.15 修改，添加了TypeScript支持，增加了部分方法，感谢原作者。
**BeautifulSoup** 使用 [tautologistics/node-htmlparser](https://github.com/tautologistics/node-htmlparser) 作为 HTML dom parser。 
BeautifulSoup 支持在 **node** and **browser**  使用。  

# Install
```
$ npm install beautiful-soup-js 
```

# How to use BeautifulSoup
### Import
```javascript
// es6
import BeautifulSoup from 'beautiful-soup-js'; 
// nodejs
var BeautifulSoup = require('beautiful-soup-js').default;
// iife
<script type="text/javascript" src="beautiful.soup.min.js"></script>;
```

### Make Soup
```javascript
var soup = new BeautifulSoup('<html><head>hello</head></html>');
```
> 默认情况下，只包含空格的文本元素将被忽略。要禁用此功能，请设置第二个参数BeautifulSoup的值设置为false。此参数为“ignoreWhitespace”，将传递给htmlparser。
```javascript
var soup = new BeautifulSoup('<html><head>hello</head></html>', false);
```

### Name
```javascript
var soup = new BeautifulSoup('<html><head>hello</head></html>');
var tag = soup.find({name:'head'});
```

### Attributes
```javascript
var soup = new BeautifulSoup('<html><head>hello</head><body><tag id="hi" class="banner">hello</tag></body></html>');
var tag = soup.find({attrs:{id:'hi'}});
```

### NodeType
#### SoupTag
#### SoupString
#### SoupComment
#### SoupDoctypeString

### Navigation
#### .previousElement, .nextElement
#### .previousSibling, .nextSibling
#### .previousSiblings, .nextSiblings
#### .contents
#### .descendants
#### .parent
#### .string

### Edit
#### .extract()
#### .append()
#### .insert(position, new Element)
#### .replaceWith(new Element)

### Search
#### .find()
#### .findAll()
#### .findNextSibling()
#### .findNextSiblings()
#### .findPreviousSibling()
#### .findPreviousSiblings()
#### .select()

### Output
#### .prettify()
#### .getText(), .text