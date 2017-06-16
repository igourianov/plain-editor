(function ($) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t";

	var findAny = function (source, chars, start, increment) {
		while (start >= 0 && start < source.length) {
			for (var i = 0; i < chars.length; i++) {
				if (chars[i] === source[start]) {
					return start;
				}
			}
			start += increment;
		}
		return start;
	};

	var getSelectionLines = function (editor) {
		var start = editor.selectionStart,
			end = editor.selectionEnd,
			value = editor.value;

		start = findAny(value, [CR, LF], start, 1) + 1;
		end = findAny(value, [CR, LF], end, -1);
		var lines = value.substring(start, end).split(/(?:\r\n|\r|\n)/);
		lines.start = start;
		lines.end = end;
		return lines;
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
				var editor = e.target;
				if (e.keyCode === 13 && e.altKey) {
					$(editor).toggleClass("full-screen");
					return false;
				}
				if (e.keyCode === 9 && !e.shiftKey) {
					var lines = getSelectionLines(editor);
					if (lines.length == 1) {
						insertText(editor, TAB);
					} else {
						for (var i = 0; i < lines.length; i++) {
							lines[i] = TAB + lines[i];
						}
						var oldStart = editor.selectionStart + (oldStart !== lines.start ? 1 : 0),
							oldEnd = editor.selectionEnd + lines.length;
						editor.selectionStart = lines.start;
						editor.selectionEnd = lines.end;
						insertText(editor, lines.join(LF));
						editor.selectionStart = oldStart;
						editor.selectionEnd = oldEnd;
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