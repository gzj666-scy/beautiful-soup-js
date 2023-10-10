
(function () {

	function runningInNode() {
		return (
			(typeof require) == "function"
			&&
			(typeof exports) == "object"
			&&
			(typeof module) == "object"
			&&
			(typeof __filename) == "string"
			&&
			(typeof __dirname) == "string"
		);
	}

	var globalObject = runningInNode() ? global : window;

	if (!runningInNode()) {
		if (!globalObject.Tautologistics)
			globalObject.Tautologistics = {};
		else if (globalObject.Tautologistics.NodeHtmlParser)
			return; 
		globalObject.Tautologistics.NodeHtmlParser = exports;
	}


	var ElementType = {
		Text: "text" 
		, Directive: "directive" 
		, Comment: "comment" 
		, Script: "script" 
		, Style: "style" 
		, Tag: "tag" 
	}

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
	}

	Parser.prototype.parseChunk = function Parser$parseChunk(data) {
		if (this._done)
			this.handleError(new Error("Attempted to parse chunk after parsing already done"));
		this._buffer += data; 
		this.parseTags();
	}

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
	}

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
	}

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
	}

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
	}

	Parser.prototype.parseTagName = function Parser$parseTagName(data) {
		if (data == null || data == "")
			return ("");
		var match = Parser._reTagName.exec(data);
		if (!match)
			return ("");
		return ((match[1] ? "/" : "") + match[2]);
	}

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
	}

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
	}

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
	}

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
	}

	Parser.prototype.handleError = function Parser$handleError(error) {
		if ((typeof this._handler.error) == "function")
			this._handler.error(error);
		else
			throw error;
	}

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
	}


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
	}
	DefaultHandler.reWhitespace = /^\s*$/;

	DefaultHandler.prototype.dom = null; 
	DefaultHandler.prototype.reset = function DefaultHandler$reset() {
		this.dom = [];
		this._done = false;
		this._tagStack = [];
		this._tagStack.last = function DefaultHandler$_tagStack$last() {
			return (this.length ? this[this.length - 1] : null);
		}
	}
	DefaultHandler.prototype.done = function DefaultHandler$done() {
		this._done = true;
		this.handleCallback(null);
	}
	DefaultHandler.prototype.writeTag = function DefaultHandler$writeTag(element) {
		this.handleElement(element);
	}
	DefaultHandler.prototype.writeText = function DefaultHandler$writeText(element) {
		if (this._options.ignoreWhitespace)
			if (DefaultHandler.reWhitespace.test(element.data))
				return;
		this.handleElement(element);
	}
	DefaultHandler.prototype.writeComment = function DefaultHandler$writeComment(element) {
		this.handleElement(element);
	}
	DefaultHandler.prototype.writeDirective = function DefaultHandler$writeDirective(element) {
		this.handleElement(element);
	}
	DefaultHandler.prototype.error = function DefaultHandler$error(error) {
		this.handleCallback(error);
	}

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
	}

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
	}

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
	}

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
