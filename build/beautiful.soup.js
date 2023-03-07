this.BeautifulSoup = (function () {
	'use strict';

	function commonjsRequire() {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var htmlparser = createCommonjsModule(function (module, exports) {
		(function () {
			function runningInNode() {
				return true;
				return (
					(typeof commonjsRequire) == "function"
					&&
					('object') == "object"
					&&
					('object') == "object"
					&&
					(typeof __filename) == "string"
					&&
					(typeof __dirname) == "string"
				);
			}
			if (!runningInNode()) {
				if (!this.Tautologistics)
					this.Tautologistics = {};
				else if (this.Tautologistics.NodeHtmlParser)
					return;
				this.Tautologistics.NodeHtmlParser = {};
				exports = this.Tautologistics.NodeHtmlParser;
			}
			var ElementType = {
				Text: "text"
				, Directive: "directive"
				, Comment: "comment"
				, Script: "script"
				, Style: "style"
				, Tag: "tag"
			};
			function Parser(handler, options) {
				this._options = options ? options : {};
				if (this._options.includeLocation == undefined) {
					this._options.includeLocation = false;
				}
				this.validateHandler(handler);
				this._handler = handler;
				this.reset();
			}
			Parser._reTrim = /(^\s+|\s+$)/g;
			Parser._reTrimComment = /(^\!--|--$)/g;
			Parser._reWhitespace = /\s/g;
			Parser._reTagName = /^\s*(\/?)\s*([^\s\/]+)/;
			Parser._reAttrib =
				/([^=<>\"\'\s]+)\s*=\s*"([^"]*)"|([^=<>\"\'\s]+)\s*=\s*'([^']*)'|([^=<>\"\'\s]+)\s*=\s*([^'"\s]+)|([^=<>\"\'\s\/]+)/g;
			Parser._reTags = /[\<\>]/g;
			Parser.prototype.parseComplete = function Parser$parseComplete(data) {
				this.reset();
				this.parseChunk(data);
				this.done();
			};
			Parser.prototype.parseChunk = function Parser$parseChunk(data) {
				if (this._done)
					this.handleError(new Error("Attempted to parse chunk after parsing already done"));
				this._buffer += data;
				this.parseTags();
			};
			Parser.prototype.done = function Parser$done() {
				if (this._done)
					return;
				this._done = true;
				if (this._buffer.length) {
					var rawData = this._buffer;
					this._buffer = "";
					var element = {
						raw: rawData
						, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
						, type: this._parseState
					};
					if (this._parseState == ElementType.Tag || this._parseState == ElementType.Script || this._parseState == ElementType.Style)
						element.name = this.parseTagName(element.data);
					this.parseAttribs(element);
					this._elements.push(element);
				}
				this.writeHandler();
				this._handler.done();
			};
			Parser.prototype.reset = function Parser$reset() {
				this._buffer = "";
				this._done = false;
				this._elements = [];
				this._elementsCurrent = 0;
				this._current = 0;
				this._next = 0;
				this._location = {
					row: 0
					, col: 0
					, charOffset: 0
					, inBuffer: 0
				};
				this._parseState = ElementType.Text;
				this._prevTagSep = '';
				this._tagStack = [];
				this._handler.reset();
			};
			Parser.prototype._options = null;
			Parser.prototype._handler = null;
			Parser.prototype._buffer = null;
			Parser.prototype._done = false;
			Parser.prototype._elements = null;
			Parser.prototype._elementsCurrent = 0;
			Parser.prototype._current = 0;
			Parser.prototype._next = 0;
			Parser.prototype._location = null;
			Parser.prototype._parseState = ElementType.Text;
			Parser.prototype._prevTagSep = '';
			Parser.prototype._tagStack = null;
			Parser.prototype.parseTagAttribs = function Parser$parseTagAttribs(elements) {
				var idxEnd = elements.length;
				var idx = 0;
				while (idx < idxEnd) {
					var element = elements[idx++];
					if (element.type == ElementType.Tag || element.type == ElementType.Script || element.type == ElementType.style)
						this.parseAttribs(element);
				}
				return (elements);
			};
			Parser.prototype.parseAttribs = function Parser$parseAttribs(element) {
				if (element.type != ElementType.Script && element.type != ElementType.Style && element.type != ElementType.Tag)
					return;
				var tagName = element.data.split(Parser._reWhitespace, 1)[0];
				var attribRaw = element.data.substring(tagName.length);
				if (attribRaw.length < 1)
					return;
				var match;
				Parser._reAttrib.lastIndex = 0;
				while (match = Parser._reAttrib.exec(attribRaw)) {
					if (element.attribs == undefined)
						element.attribs = {};
					if (typeof match[1] == "string" && match[1].length) {
						element.attribs[match[1]] = match[2];
					} else if (typeof match[3] == "string" && match[3].length) {
						element.attribs[match[3].toString()] = match[4].toString();
					} else if (typeof match[5] == "string" && match[5].length) {
						element.attribs[match[5]] = match[6];
					} else if (typeof match[7] == "string" && match[7].length) {
						element.attribs[match[7]] = match[7];
					}
				}
			};
			Parser.prototype.parseTagName = function Parser$parseTagName(data) {
				if (data == null || data == "")
					return ("");
				var match = Parser._reTagName.exec(data);
				if (!match)
					return ("");
				return ((match[1] ? "/" : "") + match[2]);
			};
			Parser.prototype.parseTags = function Parser$parseTags() {
				var bufferEnd = this._buffer.length - 1;
				while (Parser._reTags.test(this._buffer)) {
					this._next = Parser._reTags.lastIndex - 1;
					var tagSep = this._buffer.charAt(this._next);
					var rawData = this._buffer.substring(this._current, this._next);
					var element = {
						raw: rawData
						, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
						, type: this._parseState
					};
					var elementName = this.parseTagName(element.data);
					if (this._tagStack.length) {
						if (this._tagStack[this._tagStack.length - 1] == ElementType.Script) {
							if (elementName.toLowerCase() == "/script")
								this._tagStack.pop();
							else {
								if (element.raw.indexOf("!--") != 0) {
									element.type = ElementType.Text;
									if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
										var prevElement = this._elements[this._elements.length - 1];
										prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
										element.raw = element.data = "";
									}
								}
							}
						}
						else if (this._tagStack[this._tagStack.length - 1] == ElementType.Style) {
							if (elementName.toLowerCase() == "/style")
								this._tagStack.pop();
							else {
								if (element.raw.indexOf("!--") != 0) {
									element.type = ElementType.Text;
									if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
										var prevElement = this._elements[this._elements.length - 1];
										if (element.raw != "") {
											prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
											element.raw = element.data = "";
										} else {
											prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep;
										}
									} else {
										if (element.raw != "") {
											element.raw = element.data = element.raw;
										}
									}
								}
							}
						}
						else if (this._tagStack[this._tagStack.length - 1] == ElementType.Comment) {
							var rawLen = element.raw.length;
							if (element.raw.charAt(rawLen - 2) == "-" && element.raw.charAt(rawLen - 1) == "-" && tagSep == ">") {
								this._tagStack.pop();
								if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
									var prevElement = this._elements[this._elements.length - 1];
									prevElement.raw = prevElement.data = (prevElement.raw + element.raw).replace(Parser._reTrimComment, "");
									element.raw = element.data = "";
									element.type = ElementType.Text;
								}
								else
									element.type = ElementType.Comment;
							}
							else {
								element.type = ElementType.Comment;
								if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
									var prevElement = this._elements[this._elements.length - 1];
									prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
									element.raw = element.data = "";
									element.type = ElementType.Text;
								}
								else
									element.raw = element.data = element.raw + tagSep;
							}
						}
					}
					if (element.type == ElementType.Tag) {
						element.name = elementName;
						var elementNameCI = elementName.toLowerCase();
						if (element.raw.indexOf("!--") == 0) {
							element.type = ElementType.Comment;
							delete element["name"];
							var rawLen = element.raw.length;
							if (element.raw.charAt(rawLen - 1) == "-" && element.raw.charAt(rawLen - 2) == "-" && tagSep == ">")
								element.raw = element.data = element.raw.replace(Parser._reTrimComment, "");
							else {
								element.raw += tagSep;
								this._tagStack.push(ElementType.Comment);
							}
						}
						else if (element.raw.indexOf("!") == 0 || element.raw.indexOf("?") == 0) {
							element.type = ElementType.Directive;
						}
						else if (elementNameCI == "script") {
							element.type = ElementType.Script;
							if (element.data.charAt(element.data.length - 1) != "/")
								this._tagStack.push(ElementType.Script);
						}
						else if (elementNameCI == "/script")
							element.type = ElementType.Script;
						else if (elementNameCI == "style") {
							element.type = ElementType.Style;
							if (element.data.charAt(element.data.length - 1) != "/")
								this._tagStack.push(ElementType.Style);
						}
						else if (elementNameCI == "/style")
							element.type = ElementType.Style;
						if (element.name && element.name.charAt(0) == "/")
							element.data = element.name;
					}
					if (element.raw != "" || element.type != ElementType.Text) {
						if (this._options.includeLocation && !element.location) {
							element.location = this.getLocation(element.type == ElementType.Tag);
						}
						this.parseAttribs(element);
						this._elements.push(element);
						if (
							element.type != ElementType.Text
							&&
							element.type != ElementType.Comment
							&&
							element.type != ElementType.Directive
							&&
							element.data.charAt(element.data.length - 1) == "/"
						)
							this._elements.push({
								raw: "/" + element.name
								, data: "/" + element.name
								, name: "/" + element.name
								, type: element.type
							});
					}
					this._parseState = (tagSep == "<") ? ElementType.Tag : ElementType.Text;
					this._current = this._next + 1;
					this._prevTagSep = tagSep;
				}
				if (this._options.includeLocation) {
					this.getLocation();
					this._location.row += this._location.inBuffer;
					this._location.inBuffer = 0;
					this._location.charOffset = 0;
				}
				this._buffer = (this._current <= bufferEnd) ? this._buffer.substring(this._current) : "";
				this._current = 0;
				this.writeHandler();
			};
			Parser.prototype.getLocation = function Parser$getLocation(startTag) {
				var c,
					l = this._location,
					end = this._current - (startTag ? 1 : 0),
					chunk = startTag && l.charOffset == 0 && this._current == 0;
				for (; l.charOffset < end; l.charOffset++) {
					c = this._buffer.charAt(l.charOffset);
					if (c == '\n') {
						l.inBuffer++;
						l.col = 0;
					} else if (c != '\r') {
						l.col++;
					}
				}
				return {
					line: l.row + l.inBuffer + 1
					, col: l.col + (chunk ? 0 : 1)
				};
			};
			Parser.prototype.validateHandler = function Parser$validateHandler(handler) {
				if ((typeof handler) != "object")
					throw new Error("Handler is not an object");
				if ((typeof handler.reset) != "function")
					throw new Error("Handler method 'reset' is invalid");
				if ((typeof handler.done) != "function")
					throw new Error("Handler method 'done' is invalid");
				if ((typeof handler.writeTag) != "function")
					throw new Error("Handler method 'writeTag' is invalid");
				if ((typeof handler.writeText) != "function")
					throw new Error("Handler method 'writeText' is invalid");
				if ((typeof handler.writeComment) != "function")
					throw new Error("Handler method 'writeComment' is invalid");
				if ((typeof handler.writeDirective) != "function")
					throw new Error("Handler method 'writeDirective' is invalid");
			};
			Parser.prototype.writeHandler = function Parser$writeHandler(forceFlush) {
				forceFlush = !!forceFlush;
				if (this._tagStack.length && !forceFlush)
					return;
				while (this._elements.length) {
					var element = this._elements.shift();
					switch (element.type) {
						case ElementType.Comment:
							this._handler.writeComment(element);
							break;
						case ElementType.Directive:
							this._handler.writeDirective(element);
							break;
						case ElementType.Text:
							this._handler.writeText(element);
							break;
						default:
							this._handler.writeTag(element);
							break;
					}
				}
			};
			Parser.prototype.handleError = function Parser$handleError(error) {
				if ((typeof this._handler.error) == "function")
					this._handler.error(error);
				else
					throw error;
			};
			function RssHandler(callback) {
				RssHandler.super_.call(this, callback, { ignoreWhitespace: true, verbose: false, enforceEmptyTags: false });
			}
			inherits(RssHandler, DefaultHandler);
			RssHandler.prototype.done = function RssHandler$done() {
				var feed = {};
				var feedRoot;
				var found = DomUtils.getElementsByTagName(function (value) { return (value == "rss" || value == "feed"); }, this.dom, false);
				if (found.length) {
					feedRoot = found[0];
				}
				if (feedRoot) {
					if (feedRoot.name == "rss") {
						feed.type = "rss";
						feedRoot = feedRoot.children[0];
						feed.id = "";
						try {
							feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.description = DomUtils.getElementsByTagName("description", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.updated = new Date(DomUtils.getElementsByTagName("lastBuildDate", feedRoot.children, false)[0].children[0].data);
						} catch (ex) { }
						try {
							feed.author = DomUtils.getElementsByTagName("managingEditor", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						feed.items = [];
						DomUtils.getElementsByTagName("item", feedRoot.children).forEach(function (item, index, list) {
							var entry = {};
							try {
								entry.id = DomUtils.getElementsByTagName("guid", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.description = DomUtils.getElementsByTagName("description", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.pubDate = new Date(DomUtils.getElementsByTagName("pubDate", item.children, false)[0].children[0].data);
							} catch (ex) { }
							feed.items.push(entry);
						});
					} else {
						feed.type = "atom";
						try {
							feed.id = DomUtils.getElementsByTagName("id", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].attribs.href;
						} catch (ex) { }
						try {
							feed.description = DomUtils.getElementsByTagName("subtitle", feedRoot.children, false)[0].children[0].data;
						} catch (ex) { }
						try {
							feed.updated = new Date(DomUtils.getElementsByTagName("updated", feedRoot.children, false)[0].children[0].data);
						} catch (ex) { }
						try {
							feed.author = DomUtils.getElementsByTagName("email", feedRoot.children, true)[0].children[0].data;
						} catch (ex) { }
						feed.items = [];
						DomUtils.getElementsByTagName("entry", feedRoot.children).forEach(function (item, index, list) {
							var entry = {};
							try {
								entry.id = DomUtils.getElementsByTagName("id", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].attribs.href;
							} catch (ex) { }
							try {
								entry.description = DomUtils.getElementsByTagName("summary", item.children, false)[0].children[0].data;
							} catch (ex) { }
							try {
								entry.pubDate = new Date(DomUtils.getElementsByTagName("updated", item.children, false)[0].children[0].data);
							} catch (ex) { }
							feed.items.push(entry);
						});
					}
					this.dom = feed;
				}
				RssHandler.super_.prototype.done.call(this);
			};
			function DefaultHandler(callback, options) {
				this.reset();
				this._options = options ? options : {};
				if (this._options.ignoreWhitespace == undefined)
					this._options.ignoreWhitespace = false;
				if (this._options.verbose == undefined)
					this._options.verbose = true;
				if (this._options.enforceEmptyTags == undefined)
					this._options.enforceEmptyTags = true;
				if ((typeof callback) == "function")
					this._callback = callback;
			}
			DefaultHandler._emptyTags = {
				area: 1
				, base: 1
				, basefont: 1
				, br: 1
				, col: 1
				, frame: 1
				, hr: 1
				, img: 1
				, input: 1
				, isindex: 1
				, link: 1
				, meta: 1
				, param: 1
				, embed: 1
			};
			DefaultHandler.reWhitespace = /^\s*$/;
			DefaultHandler.prototype.dom = null;
			DefaultHandler.prototype.reset = function DefaultHandler$reset() {
				this.dom = [];
				this._done = false;
				this._tagStack = [];
				this._tagStack.last = function DefaultHandler$_tagStack$last() {
					return (this.length ? this[this.length - 1] : null);
				};
			};
			DefaultHandler.prototype.done = function DefaultHandler$done() {
				this._done = true;
				this.handleCallback(null);
			};
			DefaultHandler.prototype.writeTag = function DefaultHandler$writeTag(element) {
				this.handleElement(element);
			};
			DefaultHandler.prototype.writeText = function DefaultHandler$writeText(element) {
				if (this._options.ignoreWhitespace)
					if (DefaultHandler.reWhitespace.test(element.data))
						return;
				this.handleElement(element);
			};
			DefaultHandler.prototype.writeComment = function DefaultHandler$writeComment(element) {
				this.handleElement(element);
			};
			DefaultHandler.prototype.writeDirective = function DefaultHandler$writeDirective(element) {
				this.handleElement(element);
			};
			DefaultHandler.prototype.error = function DefaultHandler$error(error) {
				this.handleCallback(error);
			};
			DefaultHandler.prototype._options = null;
			DefaultHandler.prototype._callback = null;
			DefaultHandler.prototype._done = false;
			DefaultHandler.prototype._tagStack = null;
			DefaultHandler.prototype.handleCallback = function DefaultHandler$handleCallback(error) {
				if ((typeof this._callback) != "function")
					if (error)
						throw error;
					else
						return;
				this._callback(error, this.dom);
			};
			DefaultHandler.prototype.isEmptyTag = function (element) {
				var name = element.name.toLowerCase();
				if (name.charAt(0) == '/') {
					name = name.substring(1);
				}
				return this._options.enforceEmptyTags && !!DefaultHandler._emptyTags[name];
			};
			DefaultHandler.prototype.handleElement = function DefaultHandler$handleElement(element) {
				if (this._done)
					this.handleCallback(new Error("Writing to the handler after done() called is not allowed without a reset()"));
				if (!this._options.verbose) {
					delete element.raw;
					if (element.type == "tag" || element.type == "script" || element.type == "style")
						delete element.data;
				}
				if (!this._tagStack.last()) {
					if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
						if (element.name.charAt(0) != "/") {
							this.dom.push(element);
							if (!this.isEmptyTag(element)) {
								this._tagStack.push(element);
							}
						}
					}
					else
						this.dom.push(element);
				}
				else {
					if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
						if (element.name.charAt(0) == "/") {
							var baseName = element.name.substring(1);
							if (!this.isEmptyTag(element)) {
								var pos = this._tagStack.length - 1;
								while (pos > -1 && this._tagStack[pos--].name != baseName) { }
								if (pos > -1 || this._tagStack[0].name == baseName)
									while (pos < this._tagStack.length - 1)
										this._tagStack.pop();
							}
						}
						else {
							if (!this._tagStack.last().children)
								this._tagStack.last().children = [];
							this._tagStack.last().children.push(element);
							if (!this.isEmptyTag(element))
								this._tagStack.push(element);
						}
					}
					else {
						if (!this._tagStack.last().children)
							this._tagStack.last().children = [];
						this._tagStack.last().children.push(element);
					}
				}
			};
			var DomUtils = {
				testElement: function DomUtils$testElement(options, element) {
					if (!element) {
						return false;
					}
					for (var key in options) {
						if (key == "tag_name") {
							if (element.type != "tag" && element.type != "script" && element.type != "style") {
								return false;
							}
							if (!options["tag_name"](element.name)) {
								return false;
							}
						} else if (key == "tag_type") {
							if (!options["tag_type"](element.type)) {
								return false;
							}
						} else if (key == "tag_contains") {
							if (element.type != "text" && element.type != "comment" && element.type != "directive") {
								return false;
							}
							if (!options["tag_contains"](element.data)) {
								return false;
							}
						} else {
							if (!element.attribs || !options[key](element.attribs[key])) {
								return false;
							}
						}
					}
					return true;
				}
				, getElements: function DomUtils$getElements(options, currentElement, recurse, limit) {
					recurse = (recurse === undefined || recurse === null) || !!recurse;
					limit = isNaN(parseInt(limit)) ? -1 : parseInt(limit);
					if (!currentElement) {
						return ([]);
					}
					var found = [];
					var elementList;
					function getTest(checkVal) {
						return (function (value) { return (value == checkVal); });
					}
					for (var key in options) {
						if ((typeof options[key]) != "function") {
							options[key] = getTest(options[key]);
						}
					}
					if (DomUtils.testElement(options, currentElement)) {
						found.push(currentElement);
					}
					if (limit >= 0 && found.length >= limit) {
						return (found);
					}
					if (recurse && currentElement.children) {
						elementList = currentElement.children;
					} else if (currentElement instanceof Array) {
						elementList = currentElement;
					} else {
						return (found);
					}
					for (var i = 0; i < elementList.length; i++) {
						found = found.concat(DomUtils.getElements(options, elementList[i], recurse, limit));
						if (limit >= 0 && found.length >= limit) {
							break;
						}
					}
					return (found);
				}
				, getElementById: function DomUtils$getElementById(id, currentElement, recurse) {
					var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
					return (result.length ? result[0] : null);
				}
				, getElementsByTagName: function DomUtils$getElementsByTagName(name, currentElement, recurse, limit) {
					return (DomUtils.getElements({ tag_name: name }, currentElement, recurse, limit));
				}
				, getElementsByTagType: function DomUtils$getElementsByTagType(type, currentElement, recurse, limit) {
					return (DomUtils.getElements({ tag_type: type }, currentElement, recurse, limit));
				}
			};
			function inherits(ctor, superCtor) {
				var tempCtor = function () { };
				tempCtor.prototype = superCtor.prototype;
				ctor.super_ = superCtor;
				ctor.prototype = new tempCtor();
				ctor.prototype.constructor = ctor;
			}
			exports.Parser = Parser;
			exports.DefaultHandler = DefaultHandler;
			exports.RssHandler = RssHandler;
			exports.ElementType = ElementType;
			exports.DomUtils = DomUtils;
		})();
	});
	htmlparser.Parser;
	htmlparser.DefaultHandler;
	htmlparser.RssHandler;
	htmlparser.ElementType;
	htmlparser.DomUtils;

	var SoupType;
	(function (SoupType) {
		SoupType["Soup"] = "soup";
		SoupType["Tag"] = "tag";
		SoupType["Text"] = "text";
		SoupType["Comment"] = "comment";
		SoupType["Directive"] = "directive";
	})(SoupType || (SoupType = {}));

	class SoupStrainer {
		constructor(data) {
			this.name = data.name;
			this.attrs = data.attrs;
			this.string = data.string;
			this.filter = data.filter;
		}
		match(tag) {
			if (!this.matchItem(tag.name, this.name))
				return null;
			if (!this.matchAttrs(tag.attrs, this.attrs))
				return null;
			if (!this.matchString(tag, this.string))
				return null;
			if (!this.matchFilter(tag))
				return null;
			return tag;
		}
		matchItem(tagItem, item) {
			if (item == undefined || item == null)
				return true;
			if (Array.isArray(item)) {
				return item.some(v => v == tagItem);
			}
			if (item instanceof RegExp) {
				return item.test(tagItem);
			}
			return tagItem == item;
		}
		matchAttrs(tagAttrs, attrs) {
			var _a;
			if (attrs == undefined || attrs == null)
				return true;
			if (tagAttrs == undefined || tagAttrs == null)
				return false;
			let found = true;
			for (const key in attrs) {
				const arr = (_a = tagAttrs[key]) === null || _a === void 0 ? void 0 : _a.split(' ');
				if (arr == undefined || arr == null) {
					found = false;
					break;
				}
				if (!arr.some(v => this.matchItem(v, attrs[key]))) {
					found = false;
					break;
				}
			}
			return found;
		}
		matchString(tag, string) {
			if (string == undefined || string == null)
				return true;
			if (tag.type == SoupType.Tag) {
				if (tag.string) {
					return this.matchItem(tag.string.toString(), string);
				}
				else {
					return false;
				}
			}
			return this.matchItem(tag.toString(), string);
		}
		matchFilter(tag) {
			if (this.filter == undefined || this.filter == null)
				return true;
			return this.filter(tag);
		}
	}

	class SoupElement {
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

	class SoupComment extends SoupElement {
		constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
			super(parent, previousElement, nextElement);
			this.text = text;
			this.type = SoupType.Comment;
		}
	}

	class SoupString extends SoupElement {
		constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
			super(parent, previousElement, nextElement);
			this.text = text;
			this.type = SoupType.Text;
		}
	}
	SoupString.prototype.toString = function () {
		return this.text;
	};

	class SoupDoctypeString extends SoupString {
		constructor(text, parent = undefined, previousElement = undefined, nextElement = undefined) {
			super(text, parent, previousElement, nextElement);
			this.type = SoupType.Directive;
		}
	}
	SoupDoctypeString.prototype.toString = function () {
		return "<" + this.text + ">";
	};

	class SoupTag extends SoupElement {
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

	class TreeBuilder {
		constructor() {
			this.EMPTY_ELEMENT_TAGS = new Set([
				'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
				'basefont', 'bgsound', 'command', 'frame', 'image', 'isindex', 'nextid', 'spacer'
			]);
		}
		canBeEmptyElement(name) {
			return this.EMPTY_ELEMENT_TAGS.has(name);
		}
	}

	const ROOT_TAG_NAME = '[document]';
	class BeautifulSoup extends SoupTag {
		constructor(text, ignoreWhitespace = true) {
			super(ROOT_TAG_NAME, new TreeBuilder(), null);
			const handler = new htmlparser.DefaultHandler((error, dom) => {
				if (error) {
					console.log(error);
				}
			}, { verbose: false, ignoreWhitespace: ignoreWhitespace });
			const parser = new htmlparser.Parser(handler);
			parser.parseComplete(text);
			if (Array.isArray(handler.dom)) {
				this.build(handler.dom);
			}
			else {
				this.build([handler.dom]);
			}
			this.hidden = true;
			this.type = SoupType.Soup;
		}
	}

	return BeautifulSoup;

})();
