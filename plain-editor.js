(function ($) {
	var LF = "\n",
		CR = "\r",
		TAB = "\t";

	var max = function () {
		var ret;
		for (var i = 0; i < arguments.length; i++) {
			if (ret == undefined || ret < arguments[i]) {
				ret = arguments[i];
			}
		}
		return ret;
	};

	var getSelection = function (obj) {
		var start = obj.selectionStart,
			end = obj.selectionEnd,
			value = obj.value;

		var sel = {
			start: start,
			end: end,
			value: value.substring(start, end)
		};

		sel.lineStart = value.lastIndexOf(LF, start) + 1;
		sel.lineEnd = value.indexOf(LF, end);
		if (sel.lineEnd == -1) {
			sel.lineEnd = value.length;
		}
		sel.lines = value.substring(sel.lineStart, sel.lineEnd).split(/(?:\r\n|\r|\n)/)
		return sel;
	};

	var updateSelection = function (editor, selection) {
		if (document.activeElement !== editor) {
			editor.focus(); // required for insertText command to work
		}
		editor.selectionStart = selection.start;
		editor.selectionEnd = selection.end;
		document.execCommand("insertText", false, selection.value);
		if (selection.value.length > 1) {
			editor.selectionStart = selection.start; // insertText resets selection
		}
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
					var sel = getSelection(editor);
					if (sel.lines.length == 1) {
						sel.value = TAB;
						updateSelection(editor, sel);
					} else {
						for (var i = 0; i < sel.lines.length; i++) {
							sel.lines[i] = TAB + sel.lines[i];
						}
						sel.value = sel.lines.join(LF);
						sel.start = sel.lineStart;
						sel.end = sel.lineEnd;
						updateSelection(editor, sel);
					}
					return false;
				}
				if (e.keyCode === 9 && e.shiftKey) {
					var sel = getSelection(editor);
					for (var i = 0; i < sel.lines.length; i++) {
						if (sel.lines[i].startsWith(TAB)) {
							sel.lines[i] = sel.lines[i].substr(1);
						} else if (sel.lines[i].startsWith(" ")) {
							sel.lines[i] = sel.lines[i].replace(/^ {1,4}/, "");
						}
					}
					sel.value = sel.lines.join(LF);
					sel.start = sel.lineStart;
					sel.end = sel.lineEnd;
					updateSelection(editor, sel);
					return false;
				}
			});
	};

}(jQuery, undefined));