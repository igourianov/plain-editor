(function ($) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t",
		NEWLINE_REGEX = /(?:\r\n|\r|\n)/,
		KEY_SHIFT = 1,
		KEY_ALT = 2,
		KEY_CTRL = 4;

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
			start: start = findAny(value, [CR, LF], start, -1) + 1,
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
					keyCode = e.keyCode,
					keyMods = (+e.shiftKey * KEY_SHIFT) | (+e.altKey * KEY_ALT) | (+e.ctrlKey * KEY_CTRL);

				if (e.keyCode === 13 && keyMods === KEY_ALT) {
					$(editor).toggleClass("full-screen");
					return false;
				}

				if (keyCode === 9 && keyMods === 0) {
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

				if (keyCode === 9 && keyMods === KEY_SHIFT) {
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

				if (keyCode === 13 && keyMods === 0) {
					var context = getSelectionContext(editor);
					//console.log(context);
				}

			});
	};

}(jQuery));