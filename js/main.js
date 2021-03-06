window.setExampleByHash = function() {
	if(location.hash != '') {
		var text = $('#ex-'+location.hash.substring(1)).text().substring(1);
		if(text) {
			window.cm.setValue(text);
		}
		window.processee.init().run(window.cm.getValue());
	}
};
window.addEventListener("hashchange", window.setExampleByHash, false);

function hideAbout() {
	$('.about').toggle(false);
};
function showAbout() {
	$('.about').toggle(true);
};
function toggleAbout() {
	$('.about').toggle();
}

function saveSketch() {
	var blob = new Blob([window.cm.getValue()], {
		type: "text/plain;charset=utf-8;",
	});
	saveAs(blob, "sketch.coffee");
}

function saveOutput() {
	$('#processing')[0].toBlob(function(blob) {
		saveAs(blob, "sketch.png");
	});
}

$(document).ready(function() {
	window.cm = CodeMirror.fromTextArea($('#codemirror')[0], {
		mode: 'processee',
		theme: 'processee-light',
		lineNumbers: true,
		extraKeys: {
			'Ctrl-Enter': function() {
				window.processee.init().run(window.cm.getValue());
			},
			'Tab': function() {
				window.cm.replaceSelection("  ");
				window.cm.setCursor(window.cm.getCursor());
			},
		},
	});

	var canvas = $('#processing');

	window.positionOutput = function() {
		var output = $('#output');
		$('#output').css({
			left: $(window).width() * 2/3 - canvas.width()/2,
			top: ($(window).height()/3 > canvas.height()/2)
				? $(window).height() * 1/3 - canvas.height()/2
				: $(window).height() * 1/2 - canvas.height()/2,
		});
	};

	var resize = function() {
		window.cm.setSize(null, $(window).height());
		window.cm.refresh();
		window.positionOutput();
	};
	$(window).resize(resize);
	resize();

	var pageToCanvas = function(e, t) {
		var o = canvas.offset();
		return {
			x: e.pageX - o.left,
			y: e.pageY - o.top,
			type: t,
		};
	};

	canvas.mousedown(function(e) {
		if(window.processingInstance)
			window.processingInstance.__mouseEvent(pageToCanvas(e, 'click'));
	});
	canvas.mousemove(function(e) {
		if(window.processingInstance)
			window.processingInstance.__mouseEvent(pageToCanvas(e, 'move'));
	});

	$('div.example').each(function(i, e) {
		e = $(e);
		var contents = e.html().split('\n');
		var title = contents[1].substr(2);
		var desc = contents[2].substr(2);
		$('.about ul').append('<li><a href="#' + e.attr('id').substr(3) + '">' +
			title + '</a> ' +
			desc + '</li>')
	});

	$('.about').toggle();
	$('.about a').click(hideAbout);

	$('.webcam').toggle(false);

	window.setExampleByHash();
});

