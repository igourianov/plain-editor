(function ($) {
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
		NBSP = "\u00A0";

	var bullets = ["\u2022", "\u25E6", "\u25A0", "\u25B8"];
	var bulletRegex = /^(\s*)(\u2022|\u25E6|\u25A0|\u25B8)?\s*/mg;

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

	var transformContext = function (editor, regex, replacer) {
		var selectionStart = editor.selectionStart,
			selectionEnd = editor.selectionEnd;
		var context = getSelectionContext(editor);
		var value = context.value.replace(regex, function (match) {
			var index = arguments[arguments.length - 2] + context.start;
			var ret = replacer.apply(this, arguments);
			var diff = ret.length - match.length;
			if (selectionStart > index) {
				selectionStart += diff;
			}
			if (selectionEnd <= index + match.length) {
				selectionEnd += diff;
			}
			return ret;
		});
		editor.selectionStart = context.start;
		editor.selectionEnd = context.end;
		insertText(editor, value);
		editor.selectionStart = selectionStart;
		editor.selectionEnd = selectionEnd;
	};

	$.fn.plainEditor = function () {
		return this.addClass("plain-editor")
			.on("keydown", function (e) {
				var editor = e.target,
					selection = editor.value.substring(editor.selectionStart, editor.selectionEnd),
					key = e.key,
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
					if (!selection.match(/(?:\r\n|\r|\n)/)) {
						insertText(editor, TAB);
					} else {
						transformContext(editor, /^/mg, function (match, index) { return TAB; });
					}
					return false;
				}

				// decrease indentation
				if (key === KEY_TAB && mods === MOD_SHIFT) {
					transformContext(editor, /^(?:\t| {1,4})/mg, function () { return ""; });
					return false;
				}

				// toggle bullet points
				if (key === "*" && mods === (MOD_CTRL | MOD_SHIFT)) {
					transformContext(editor, bulletRegex, function (match, indent, bullet, index) {
						bullet = bullets[bullets.indexOf(bullet) + 1];
						return indent + (bullet ? bullet + NBSP : "");
					});
					return false;
				}

			});
	};

}(jQuery));