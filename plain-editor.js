(function ($) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t",
		NEWLINE_REGEX = /(?:\r\n|\r|\n)/;

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
			start: start = findAny(value, [CR, LF], start, 1) + 1,
			end: end = findAny(value, [CR, LF], end, -1),
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
					selection = editor.value.substring(editor.selectionStart, editor.selectionEnd);

				if (e.keyCode === 13 && e.altKey) {
					$(editor).toggleClass("full-screen");
					return false;
				}

				if (e.keyCode === 9 && !e.shiftKey) {
					
					if (!selection.match(NEWLINE_REGEX)) {
						insertText(editor, TAB);
					} else {
						var context = getSelectionContext(editor);
						var start = editor.selectionStart,
							end = editor.selectionEnd;
						var newValue = context.value.replace(/^/mg, function(match, index) {
							if (index + context.start < start) {
								start++;
							}
							end++;
							return TAB;
						});
						editor.selectionStart = context.start;
						editor.selectionEnd = context.end;
						insertText(editor, newValue);
						editor.selectionStart = start;
						editor.selectionEnd = end;
					}
					return false;
				}
				/*if (e.keyCode === 9 && e.shiftKey) {
					var sel = getSelectionLines(editor);
					for (var i = 0; i < sel.lines.length; i++) {
						if (sel.lines[i].startsWith(TAB)) {
							sel.lines[i] = sel.lines[i].substr(1);
						} else if (sel.lines[i].startsWith(" ")) {
							sel.lines[i] = sel.lines[i].replace(/^ {1,4}/, "");
						}
					}
					editor.selectionStart = sel.start;
					editor.selectionEnd = sel.end;
					insertText(editor, sel.lines.join(LF));
					//editor.selectionStart = sel.start; // reset selection after insert
					return false;
				}*/
			});
	};

}(jQuery));