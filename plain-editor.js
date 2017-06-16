(function ($) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t",
		NEWLINE_REGEX = /(?:\r\n|\r|\n)/,
		MOD_SHIFT = 1,
		MOD_ALT = 2,
		MOD_CTRL = 4,
		MOD_META = 8,
		KEY_ENTER = 13,
		KEY_TAB = 9,
		KEY_ESC = 27;

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

	var getSelectionContext = function (editor) {
		var start = editor.selectionStart,
			end = editor.selectionEnd,
			value = editor.value;
		return {
			start: start = findAny(value, [CR, LF], start - 1, -1) + 1,
			end: end = findAny(value, [CR, LF], end, 1),
			value: value.substring(start, end)
		};
	};

	var insertText = function (editor, text) {
		if (document.activeElement !== editor) {
			editor.focus(); // required for insertText command to work
		}
		document.execCommand("insertText", false, text);
	};

	$.fn.plainEditor = function () {
		return this.addClass("plain-editor")
			.on("keydown", function (e) {
				var editor = e.target,
					selectionStart = editor.selectionStart,
					selectionEnd = editor.selectionEnd,
					selection = editor.value.substring(selectionStart, selectionEnd),
					key = e.keyCode,
					mods = (+e.shiftKey * MOD_SHIFT) | (+e.altKey * MOD_ALT) | (+e.ctrlKey * MOD_CTRL) | (+e.metaKey * MOD_META);

				//toggle full screen mode
				if (key === KEY_ENTER && mods === MOD_ALT) {
					$(editor).toggleClass("full-screen");
					return false;
				}

				// maintain indentation on new lines
				if (key === KEY_ENTER && !mods) {
					var context = getSelectionContext(editor);
					var match = context.value.match(/^\s+/m);
					if (match) {
						insertText(editor, LF + match[0]);
						return false;
					}
				}

				// close full screen or exit focus (to compensate for Tab overridden action)
				if (key === KEY_ESC && !mods) {
					if ($(editor).is(".full-screen")) {
						$(editor).removeClass("full-screen");
					} else {
						editor.blur();
					}
				}

				// indent text
				if (key === KEY_TAB && !mods) {
					if (!selection.match(NEWLINE_REGEX)) {
						insertText(editor, TAB);
					} else {
						var context = getSelectionContext(editor);
						editor.selectionStart = context.start;
						editor.selectionEnd = context.end;
						insertText(editor, context.value.replace(/^/mg, function (match, index) {
							if (selectionStart > index + context.start) {
								selectionStart++;
							}
							selectionEnd++;
							return TAB;
						}));
						editor.selectionStart = selectionStart;
						editor.selectionEnd = selectionEnd;
					}
					return false;
				}

				// decrease indentation
				if (key === KEY_TAB && mods === MOD_SHIFT) {
					var context = getSelectionContext(editor);
					editor.selectionStart = context.start;
					editor.selectionEnd = context.end;
					insertText(editor, context.value.replace(/^(?:\t| {1,4})/mg, function (match, index) {
						if (selectionStart > index + context.start) {
							selectionStart -= match.length;
						}
						selectionEnd -= match.length;
						return "";
					}));
					editor.selectionStart = selectionStart;
					editor.selectionEnd = selectionEnd;
					return false;
				}

			});
	};

}(jQuery));