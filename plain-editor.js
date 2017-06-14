(function($) {

	$.fn.plainEditor = function() {
		return this.addClass("plain-editor")
			.on("keydown", function(e) {
				if (e.keyCode === 13 && e.altKey) {
					$(this).toggleClass("full-screen");
				}
			});
	};

}(jQuery));
