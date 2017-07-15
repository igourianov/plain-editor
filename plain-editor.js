(function ($, document) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t",
		MOD_SHIFT = 1,
		MOD_ALT = 2,
		MOD_CTRL = 4,
		MOD_META = 8,
		KEY_ENTER = "Enter",
		KEY_TAB = "Tab",
		KEY_ESC = "Escape",
		NBSP = "\u00A0",
		toolbar,
		uid = 0,
		bullets = ["\u2022", "\u25E6", "\u25A0", "\u25B8"],
		blockElements = ["DIV", "P", "LI", "UL", "OL", "BLOCKQUOTE", "ARTICLE", "SECTION", "H1", "H2", "H3", "H4", "H6", "H6", "BR"],
		indentRegex = new RegExp("^([^\\S\\r\\n]*)(?:(" + bullets.map(function (x) { return "\\u" + x.charCodeAt(0).toString(16); }).join("|") + ")|(\\d{1,2})(\\)|\\.))?[^\\S\\r\\n]*", "mg");

	var findAny = function (source, chars, index, increment) {
		while (index >= 0 && index < source.length) {
			for (var i = 0; i < chars.length; i++) {
				if (chars[i] === source[index]) {
					return index;
				}
			}
			index += increment;
		}
		return index;
	};

	var getSelectionContext = function (textarea) {
		var start = textarea.selectionStart,
			end = textarea.selectionEnd,
			value = textarea.value;
		return {
			start: start = findAny(value, [CR, LF], start - 1, -1) + 1,
			end: end = findAny(value, [CR, LF], end, 1),
			value: value.substring(start, end)
		};
	};

	var insertText = function (textarea, text) {
		if (document.activeElement !== textarea) {
			textarea.focus(); // required for insertText command to work
		}
		document.execCommand("insertText", false, text);
	};

	var transformContext = function (textarea, regex, replacer) {
		var selectionStart = textarea.selectionStart,
			selectionEnd = textarea.selectionEnd;
		var context = getSelectionContext(textarea);
		var value = context.value.replace(regex, function (match) {
			var index = arguments[arguments.length - 2] + context.start;
			var ret = replacer.apply ? replacer.apply(this, arguments) : replacer;
			var diff = ret.length - match.length;
			if (selectionStart > index) {
				selectionStart += diff;
			}
			if (selectionEnd > index) {
				selectionEnd += diff;
			}
			return ret;
		});
		textarea.selectionStart = context.start;
		textarea.selectionEnd = context.end;
		insertText(textarea, value);
		textarea.selectionStart = selectionStart;
		textarea.selectionEnd = selectionEnd;
	};

	var getWrapper = function (textarea) {
		return textarea.parentNode.parentNode;
	};

	var getTextarea = function (wrapper) {
		return wrapper.firstChild.firstChild;
	};

	var debounce = function (func, timeout, selector) {
		var handle = {};
		return function () {
			var scope = this,
				args = arguments,
				key = selector && selector.apply(scope, args) || "";
			if (handle[key]) {
				clearTimeout(handle[key]);
			}
			handle[key] = setTimeout(function () {
				handle[key] = null;
				func.apply(scope, args);
			}, timeout);
		};
	};

	var behaviors = [{
		// toggle full screen mode
		key: KEY_ENTER,
		mod: MOD_ALT,
		type: "full-screen",
		action: function (textarea) {
			var wrapper = $(getWrapper(textarea));
			if (wrapper.not(".full-screen")) {
				wrapper.children(".placeholder")
					.css({
						height: textarea.offsetHeight + "px",
						width: textarea.offsetWidth + "px"
					});
			}
			wrapper.toggleClass("full-screen")
			return false;
		}
	}, {
		// close full screen or exit focus (to compensate for Tab overridden action)
		key: KEY_ESC,
		action: function (textarea) {
			if ($(getWrapper(textarea)).is(".full-screen")) {
				$(getWrapper(textarea)).removeClass("full-screen");
			} else {
				textarea.blur();
			}
		}
	}, {
		// indent text
		key: KEY_TAB,
		type: "indent",
		action: function (textarea) {
			var selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
			if (!selection.match(/(?:\r\n|\r|\n)/)) {
				insertText(textarea, TAB);
			} else {
				transformContext(textarea, /^/mg, TAB);
			}
			return false;
		}
	}, {
		// decrease indentation
		key: KEY_TAB,
		mod: MOD_SHIFT,
		type: "unindent",
		action: function (textarea) {
			transformContext(textarea, /^(?:\t| {1,4})/mg, "");
			return false;
		}
	}, {
		// toggle bullet points
		key: "*",
		mod: MOD_CTRL | MOD_SHIFT,
		type: "bullets",
		action: function (textarea) {
			transformContext(textarea, indentRegex, function (match, indent, bullet, digit, separator, index) {
				bullet = bullets[bullets.indexOf(bullet) + 1];
				return indent + (bullet ? bullet + NBSP : "");
			});
			return false;
		}
	}, {
		// toggle ordered list
		key: "&",
		mod: MOD_CTRL | MOD_SHIFT,
		type: "ordered-list",
		action: function (textarea) {
			var counter = 0,
				toggle;
			transformContext(textarea, indentRegex, function (match, indent, bullet, digit, separator, index) {
				if (toggle === undefined) {
					toggle = !digit;
				}
				if (toggle) {
					return indent + (++counter) + "." + NBSP;
				}
				return indent;
			});
			return false;
		}
	}, {
		// maintain indentation on new lines
		key: KEY_ENTER,
		action: function (textarea) {
			indentRegex.lastIndex = 0;
			var context = getSelectionContext(textarea),
				match = indentRegex.exec(context.value),
				indent;
			if (match[3] !== undefined) {
				indent = match[1] + (++match[3]) + match[4] + NBSP;
			} else if (match[2] !== undefined) {
				indent = match[1] + match[2] + NBSP;
			} else if (match[1]) {
				indent = match[1];
			}
			if (indent) {
				insertText(textarea, LF + indent);
				return false;
			}
		}
	}, {
		key: KEY_ENTER,
		mod: MOD_CTRL,
		action: function (textarea) {
			$(textarea).closest("form").submit();
		}
	}];

	var htmlToText = function (node, buffer, listFlags, blockEmpty) {
		var name = node.nodeName,
			type = node.nodeType;

		if (type === 3) {
			buffer.push(node.nodeValue);
			return !!node.nodeValue.trim();
		}
		if (type !== 1) {
			return false;
		}
		if (!blockEmpty && blockElements.indexOf(name) > -1) {
			buffer.push(LF);
			blockEmpty = true;
		}
		if (name === "OL" || name === "UL") {
			listFlags = {
				level: listFlags.level + 1,
				counter: 0,
				ordered: name === "OL"
			};
		} else if (name === "LI") {
			var bullet = listFlags.ordered ? (++listFlags.counter) + "." : bullets[(listFlags.level - 1) % bullets.length];
			buffer.push(new Array(listFlags.level + 1).join("\t") + bullet + NBSP);
		}
		for (var i = 0; i < node.childNodes.length; i++) {
			blockEmpty = !htmlToText(node.childNodes[i], buffer, listFlags, blockEmpty) && blockEmpty;
		}
		if (name === "P" && !blockEmpty) {
			buffer.push(LF);
		}
		return !blockEmpty;
	};

	var pasteHtml = function (textarea, html) {
		var buffer = [],
			node = document.createElement("div");
		node.innerHTML = html;
		// remove empty text nodes left after DIV dropped the HTML and BODY tags on parsing
		for (var i = node.childNodes.length - 1; i >= 0; i--) {
			var child = node.childNodes[i];
			if (child.nodeType !== 1) {
				node.removeChild(child);
			}
		}
		htmlToText(node, buffer, { level: 0, counter: 0 }, true);
		insertText(textarea, buffer.join(""));
	};

	var getToolbar = function () {
		if (!toolbar) {
			toolbar = $("<div class='toolbar' tabIndex=0 />").on("click", "> *", function (e) {
				var textarea = this.parentNode.previousSibling;
				behaviors.filter(function (b) {
					return b.type === this.className;
				}, this).forEach(function (b) {
					b.action(textarea);
				});
			});
			behaviors.filter(function (b) {
				return !!b.type;
			}).forEach(function (b) {
				$("<div/>").addClass(b.type).appendTo(toolbar);
			})
		}
		return toolbar;
	};

	$.fn.plainEditor = function () {
		return this
			.on("keydown", function (e) {
				var textarea = e.target,
					key = e.key,
					mod = (+e.shiftKey * MOD_SHIFT) | (+e.altKey * MOD_ALT) | (+e.ctrlKey * MOD_CTRL) | (+e.metaKey * MOD_META);
				for (var i = 0; i < behaviors.length; i++) {
					var behavior = behaviors[i];
					if (behavior.key === key && (behavior.mod || 0) === mod) {
						return behavior.action(textarea);
					}
				}
			})
			.on("paste", function (e) {
				var items = e.originalEvent.clipboardData.items;
				for (var i = 0; i < items.length; i++) {
					if (items[i].kind === "string" && items[i].type === "text/html") {
						items[i].getAsString(function (str) {
							pasteHtml(e.target, str);
						});
						return false;
					}
				}
			})
			.each(function () {
				$("<div class='plain-editor'><div class='floater'/><div class='placeholder'/></div>")
					.attr("id", this.id || ("plain-editor" + (++uid)))
					.addClass(this.className)
					.insertAfter(this)
					.children(".floater").append(this);
			})
			.attr({ id: null, "class": null })
			.closest(".plain-editor")
			.on("focusin focusout", debounce(function (e) {
				if (e.type == "focusout") {
					$(this).removeClass("focus");
				} else if (e.target === getTextarea(this)) {
					getToolbar().insertAfter(getTextarea(this));
					var self = this;
					setTimeout(function () {
						$(self).addClass("focus");
					}, 10);
				}
			}, 100, function (e) {
				return this.id;
			}));
	};

}(jQuery, document));
