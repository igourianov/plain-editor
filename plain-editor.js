(function ($) {
	var n = "\n",
		r = "\r",
		t = "\t";

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
			value = obj.value,
			sel = value.substring(start, end);

		// single line selection
		if (sel.indexOf(n) === -1) {
			return {
				multiline: false,
				start: start,
				end: end,
				value: sel
			};
		}

		// multiline selection
		start = value.lastIndexOf(n, start) + 1;
		end = value.indexOf(n, end);
		end = end === -1 ? value.length : end;
		return {
			multiline: true,
			start: start,
			end: end,
			value: value.substring(start, end).split(/(?:\r\n|\r|\n)/)
		};
	};

	var updateSelection = function (editor, selection) {
		if (document.activeElement !== editor) {
			editor.focus(); // required for insertText command to work
		}
		if (selection.multiline) {
			editor.selectionStart = selection.start;
			editor.selectionEnd = selection.end;
			document.execCommand("insertText", false, selection.value.join("\n"));
			editor.selectionStart = selection.start; // insertText resets selection
		} else {
			document.execCommand("insertText", false, selection.value);
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
				if (e.keyCode === 9) {
					var sel = getSelection(editor);
					if (!sel.multiline) {
						sel.value = t;
						updateSelection(editor, sel);
					} else if (!e.shiftKey) {
						for (var i = 0; i < sel.value.length; i++) {
							sel.value[i] = t + sel.value[i];
						}
						updateSelection(editor, sel);
					} else {
						for (var i = 0; i < sel.value.length; i++) {
							if (sel.value[i].startsWith(t)) {
								sel.value[i] = sel.value[i].substr(1);
							} else if (sel.value[i].startsWith(" ")) {
								sel.value[i] = sel.value[i].replace(/^ {1,4}/, "");
							}
						}
						updateSelection(editor, sel);
					}
					return false;
				}
			});
	};

}(jQuery, undefined));