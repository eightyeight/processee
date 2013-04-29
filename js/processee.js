navigator.getUserMedia ||
	(navigator.getUserMedia = navigator.mozGetUserMedia ||
	navigator.webkitGetUserMedia || navigator.msGetUserMedia);

window.processee = {
	procedures: [],
	repeatedProcedures: [],
	setups: [],

	setup: function(fn) {
		window.processee.setups.push(fn);
	},

	once: function(fn) {
		window.processee.procedures.push({
			layer: 1,
			procedure: fn,
		});
	},

	everyFrame: function(fn) {
		window.processee.repeatedProcedures.push({
			layer: 1,
			procedure: fn,
		});
	},

	run: function() {
		if(window.processingInstance) window.processingInstance.exit();
		window.processee.procedures = [];
		window.processee.repeatedProcedures = [];
		window.processee.setups = [];
		$('#processing')[0].width = 0;

		eval(CoffeeScript.compile(window.cm.getValue()));

		var layerSort = function(a, b) { return a.layer - b.layer; };
		window.processee.procedures.sort(layerSort);
		window.processee.repeatedProcedures.sort(layerSort);

		if(window.processingInstance) window.processingInstance.exit();
		window.processingInstance = new Processing($('#processing')[0],
			window.processee.create());
	},
};

function rgb(r, g, b) {
	return {
		mode: 'rgb',
		red: r, green: g, blue: b, alpha: 255,
	};
}

function rgba(r, g, b, a) {
	return {
		mode: 'rgb',
		red: r, green: g, blue: b, alpha: a
	};
}

function gray(v) {
	return {
		mode: 'rgb',
		red: v, green: v, blue: v, alpha: 255,
	};
}

function hsv(h, s, v) {
	return {
		mode: 'hsv',
		red: h, green: s, blue: v, alpha: 255,
	};
}

function point(x, y) {
	return {
		x: x,
		y: y,
	};
}

function polar(r, theta) {
	return {
		x: r * Math.cos(theta),
		y: r * Math.sin(theta),
	};
}

function dim(w, h) {
	return {
		w: w,
		h: h,
	};
}

function sort(a) {
	a.sort();
	return a;
}

window.processee.create = function() {
	return function(p) {
		p.__defineSetter__("canvasSize", function(s) {
			p.size(s.w || s.width || 100,
			       s.h || s.height || 100);
			window.positionOutput();
		});

		p.__defineSetter__("canvasBackground", function(c) {
			p.background(c.red, c.green, c.blue, c.alpha);
		});

		p.drawLine = function(x1, y1, x2, y2) {
			if(typeof x1 == 'object') {
				p.line(x1.from.x,
				       x1.from.y,
				       x1.to.x,
				       x1.to.y);
			} else {
				p.line(x1, y1, x2, y2);
			}
		};

		p.drawLinesBetween = function(points) {
			if(points.length < 2) {
				console.log('@drawLinesBetween needs at least 2 points!');
				return;
			}
			for(var i = 1; i < points.length; i++) {
				var p0 = points[i-1];
				var p1 = points[i];
				p.line(p0.x, p0.y, p1.x, p1.y);
			}
		};

		p.drawTriangle = function(x1, y1, x2, y2, x3, y3) {
			if(typeof x1 == 'object') {
				p.triangle(x1.a.x || x1.a.posX || 0,
				           x1.a.y || x1.a.posY || 0,
				           x1.b.x || x1.b.posX || 0,
				           x1.b.y || x1.b.posY || 0,
				           x1.c.x || x1.c.posX || 0,
				           x1.c.y || x1.c.posY || 0);
			} else {
				p.triangle(x1, y1, x2, y2, x3, y3);
			}
		};

		p.drawRect = function(x, y, w, h) {
			if(typeof x == 'object') {
				p.rect(x.x || x.posX || 0,
				       x.y || x.posY || 0,
				       x.w || x.width,
				       x.h || x.height);
			} else {
				p.rect(x, y, w, h);
			}
		};

		p.drawSquare = function(x, y, s) {
			if(typeof x == 'object') {
				p.rect(x.x || x.posX || 0,
				       x.y || x.posY || 0,
				       x.s || x.size || 0,
				       x.s || x.size || 0);
			} else {
				p.rect(x, y, s, s);
			}
		};

		p.drawEllipse = function(x, y, w, h) {
			if(typeof x == 'object') {
				p.ellipse(x.x || x.posX,
				          x.y || x.posY || 0,
				          x.w || x.width || 0,
				          x.h || x.height);
			} else {
				p.ellipse(x, y, w, h);
			}
		};

		p.drawCircle = function(x, y, r) {
			if(typeof x == 'object') {
				p.ellipse(x.x || x.posX || 0,
				          x.y || x.posY || 0,
				          x.r || x.radius,
				          x.r || x.radius);
			} else {
				p.ellipse(x, y, r, r);
			}
		};

		p.__getImage = function(i) {
			if(typeof i == "string") {
				return p.__imageData[i];
			} else {
				return i;
			}
		};

		p.drawImage = function(file, x, y) {
			file = p.__getImage(file);
			if(file !== undefined) {
				if(x === undefined) {
					x = 0;
					y = 0;
				}
				if(typeof x == 'object') {
					y = x.y || x.yPos;
					x = x.x || x.xPos;
				}
				$('#processing')[0].getContext('2d').putImageData(file, x, y);
			} else {
				console.log('Image file "' + file + '" has not been loaded.');
			}
		};

		p.sizeOf = function(file) {
			var img = p.__getImage(file);
			if(img !== undefined) {
				return {
					width: img.width,
					height: img.height,
				};
			}
		};

		p.makeNewImage = function(name, w, h) {
			if(typeof w == 'string') {
				var file = w;
				var img = p.__getImage(file);
				if(img !== undefined) {
					var nimg = $('#processee-internal-canvas')[0].getContext('2d').createImageData(img.width, img.height);
					nimg.data.set(img.data);
				} else {
					console.log('Image file "' + file + '" has not been loaded.');
					return;
				}
			} else {
				if(typeof w == 'object') {
					h = w.height || w.h;
					w = w.width || w.w;
				}
				var nimg = $('#processee-internal-canvas')[0].getContext('2d').createImageData(w, h);
			}
			if(name !== undefined) {
				p.__imageData[name] = nimg;
			}
			return nimg;
		};

		function getPixelFromArray(p, a, i) {
			p.red = a[i];
			p.green = a[i+1];
			p.blue = a[i+2];
			p.alpha = a[i+3];
		};

		function setArrayFromPixel(a, i, p) {
			a[i] = p.red;
			a[i+1] = p.green;
			a[i+2] = p.blue;
			a[i+3] = p.alpha;
		};

		p.getImagePixel = function(file, x, y) {
			var img = p.__getImage(file);
			if(img !== undefined) {
				if(typeof x == 'object') {
					y = x.y;
					x = x.x;
				}
				var i = x*4 + y*4*img.width;
				if(i >= img.data.length) {
					console.log("Pixel", x, y, "is out of bounds!");
					return;
				}
				var pixel = {};
				getPixelFromArray(pixel, img.data, i);
				return pixel;
			} else {
				console.log('Image file "' + file + '" has not been loaded.');
			}
		};

		p.setImagePixel = function(file, pixel) {
			var img = p.__getImage(file);
			if(img !== undefined) {
				var i = pixel.x*4 + pixel.y*4*img.width;
				setArrayFromPixel(img.data, i, pixel);
			} else {
				console.log('Image file "' + file + '" has not been loaded.');
			}
		};

		p.forEachPixelOf = function(file, fn) {
			var stored = typeof file == "string";
			var img = p.__getImage(file);
			if(img !== undefined) {
				var tempData = $('#processee-internal-canvas')[0].getContext('2d').createImageData(img.width, img.height);
				var x = 0, y = 0;
				var pixel = {};
				for(var i = 0; i < img.data.length; i+=4) {
					getPixelFromArray(pixel, img.data, i);
					pixel.x = x;
					pixel.y = y;
					pixel.file = file;
					var result = fn.call(p, pixel);
					setArrayFromPixel(tempData.data, i, result);
					if(++x == img.width) {
						x = 0;
						y++;
					}
				}
				if(stored) {
					p.__imageData[file] = tempData;
				}
				return tempData;
			} else {
				console.log('Image file "' + file + '" has not been loaded.');
			}
		};

		p.forEachNeighborOf = function(pixel, fn) {
			var x = pixel.x,
			    y = pixel.y;
			var img = p.__getImage(pixel.file);
			if(!img) {
				console.log("Pixel is not part of an image.");
				return;
			}
			var len = img.width * img.height * 4;
			var tmp = {};
			tmp.file = pixel.file;
			for(var dx = -1; dx < 2; dx++) {
				for(var dy = -1; dy < 2; dy++) {
					var di = (x+dx)*4 + (y+dy)*4*img.width;
					if(di < 0 || di > len) {
						continue;
					}
					getPixelFromArray(tmp, img.data, di);
					tmp.x = x+dx;
					tmp.y = y+dy;
					fn.call(p, tmp);
				}
			}
		};

		p.convolveWith = function(mat, scale) {
			if(typeof mat == 'object' && !mat.length) {
				scale = mat.scale;
				mat = mat.matrix || mat.mat;
			}
			if(scale === undefined) {
				scale = 1;
			}
			var diam = Math.sqrt(mat.length);
			if(parseFloat(diam) != parseInt(diam)) {
				console.log('Matrix', mat, 'is not square!');
				return;
			}
			return function(pixel) {
				var sumR = 0, sumG = 0, sumB = 0, i = 0;
				p.forEachNeighborOf(pixel, function(pix) {
					sumR += pix.red * mat[i] * scale;
					sumG += pix.green * mat[i] * scale;
					sumB += pix.blue * mat[i] * scale;
					i++;
				});
				return rgb(sumR, sumG, sumB);
			}
		};

		p.__defineSetter__('fillColor', function(c) {
			if(c === null) {
				c = rgba(0, 0, 0, 0);
			}
			if(!c.mode) {
				console.log('Cannot set fill without a color mode. Given:', c);
				return;
			}
			p.__stack[p.__stack.length-1].mode = c.mode == 'hsv' ? p.HSV : p.RGB;
			p.__stack[p.__stack.length-1].fill = {red: c.red, green: c.green, blue: c.blue, alpha: c.alpha};
			p.__stackSet();
		});
		p.__defineGetter__('fillColor', function() {
			return p.__stack[p.__stack.length-1].fill;
		});

		p.__defineSetter__('transparency', function(t) {
			if(t === null) {
				t = 0;
			}
			p.__stack[p.__stack.length-1].transparency = t;
			p.__stackSet();
		});
		p.__defineGetter__('transparency', function() {
			return p.__stack[p.__stack.length-1].transparency;
		});

		p.__defineSetter__('strokeColor', function(c) {
			if(c === null) {
				c = rgba(0, 0, 0, 0);
			}
			if(!c.mode) {
				console.log('Cannot set stroke without a color mode. Given:', c);
				return;
			}
			p.__stack[p.__stack.length-1].stroke = {red: c.red, green: c.green, blue: c.blue, alpha: c.alpha};
			p.__stackSet();
		});
		p.__defineGetter__('strokeColor', function() {
			return p.__stack[p.__stack.length-1].stroke;
		});

		p.__defineSetter__('origin', function(o) {
			var c = p.__stack[p.__stack.length-1].origin;
			p.translate(-c.x, -c.y);
			p.__stack[p.__stack.length-1].origin = {
				x: (o.x || o.posX || 0),
				y: (o.y || o.posY || 0)
			};
			p.translate(o.x || o.posX || 0, o.y || o.posY || 0);
			p.__stackSet();
		});
		p.__defineGetter__('origin', function() {
			return p.__stack[p.__stack.length-1].origin;
		});

		p.__defineSetter__('rotation', function(r) {
			var c = p.__stack[p.__stack.length-1];
			p.rotate(-c.rotation);
			p.__stack[p.__stack.length-1].rotation = r;
			p.rotate(r);
			p.__stackSet();
		});
		p.__defineGetter__('rotation', function() {
			return p.__stack[p.__stack.length-1].rotation;
		});

		p.__stack = [];
		p.__stackSet = function() {
			var c = p.__stack[p.__stack.length-1];
			p.colorMode(c.mode);
			p.fill(c.fill.red, c.fill.green, c.fill.blue, c.fill.alpha);
			p.stroke(c.stroke.red, c.stroke.green, c.stroke.blue, c.stroke.alpha);
			$('#processing')[0].getContext('2d').globalAlpha = 1 - c.transparency;
		};
		p.__stackPush = function() {
			var c = p.__stack[p.__stack.length-1];
			p.__stack.push({
				mode: c.mode,
				fill: c.fill,
				stroke: c.stroke,
				origin: {x: 0, y: 0},
				rotation: 0,
				transparency: c.transparency,
			});
		};
		p.__stackPop = function() {
			var o = p.__stack.pop();
			p.translate(-o.origin.x, -o.origin.y);
			p.rotate(-o.rotation);
			if(p.__stack.length) {
				p.__stackSet();
			}
		};

		p.reset = function() {
			while(p.__stack.length) {
				p.__stackPop();
			}
			p.__stack = [{
				mode: p.RGB,
				fill: gray(255),
				stroke: gray(0),
				origin: { x: 0, y: 0 },
				rotation: 0,
				transparency: 0,
			}];
			p.__stackSet();
		};

		p.__images = [];
		p.webcamImageName = "webcam";
		p.webcam = false;
		p.__imageData = {};

		p.loadImage = function(file) {
			p.__images.push(file);
		};

		$('#processee-image-loader').load(function() {
			var img = $('#processee-image-loader');
			var file = img.attr('src');
			if(file == '') {
				return;
			}
			var width = img.width(), height = img.height();
			var canvas = $('#processee-internal-canvas')[0];
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img[0], 0, 0);
			var data = ctx.getImageData(0, 0, width, height);
			p.__imageData[file] = data;
			p.__loadImages();
		});

		p.__loadNextImage = function(file) {
			$('#processee-image-loader')
				.attr('src', file);
		};

		p.__loadImages = function() {
			if(!p.__images.length) {
				$('#processee-image-loader').attr('src', '');
				p.__onSetup();
			} else {
				p.__loadNextImage(p.__images.pop());
			}
		};

		p.do = function(fn) {
			p.__stackPush();
			fn.call(p);
			p.__stackPop();
		};

		p.at = function(pos, fn) {
			p.__stackPush();
			p.origin = {
				x: pos.x || pos.posX || 0,
				y: pos.y || pos.posY || 0
			};
			p.__stackPush();
			fn.call(p);
			p.__stackPop();
			p.__stackPop();
		};

		p.rotatedBy = function(angle, fn) {
			p.__stackPush();
			p.rotation = angle;
			p.__stackPush();
			fn.call(p);
			p.__stackPop();
			p.__stackPop();
		};

		p.__webcamCapture = function() {
			$('.webcam').toggle(true);
			var video = $('#webcam');
			var canvas = $('#processee-internal-canvas')[0];
			canvas.width = video[0].clientWidth;
			canvas.height = video[0].clientHeight;
			var context = canvas.getContext('2d');
			context.drawImage(video[0], 0, 0, canvas.width, canvas.height);
			p.__imageData[p.webcamImageName] = context.getImageData(0, 0, canvas.width, canvas.height);
			$('.webcam').toggle(false);
		};

		p.setup = function() {
			// Set some Processing defaults that are sane.
			p.rectMode(p.CENTER);
			// Call every setup function.
			var setups = window.processee.setups;
			for(var i = 0; i < setups.length; i++) {
				setups[i].call(p);
			}

			// Try to get the webcam if we need it, and after that's done load the images.
			if(p.webcam) {
				var video = $('#webcam');
				var error = function() {};
				var success = function(stream) {
					if(window.webkitURL) {
						window.processee.webcamSource = window.webkitURL.createObjectURL(stream);
					} else {
						window.processee.webcamSource = stream;
					}
					video[0].src = window.processee.webcamSource;
					video[0].autoplay = true;
					video[0].addEventListener("canplay", function () {
						p.__loadImages();
					});
				};

				if(!window.processee.webcamSource) {
					navigator.getUserMedia({
						video: true,
					}, success, error);
				} else {
					p.__loadImages();
				}
			} else {
				p.__loadImages(); // Calls __onSetup eventually
			}
		};

		p.__onSetup = function() {
			// Capture the webcam if we need to.
			if(p.webcam) {
				p.__webcamCapture();
			}
			// Perform the do-once drawing routines.
			var procedures = window.processee.procedures;
			for(var i = 0; i < procedures.length; i++) {
				p.reset();
				procedures[i].procedure.call(p);
			}
		};

		p.draw = function() {
			var procedures = window.processee.repeatedProcedures;
			if(!procedures.length) {
				return;
			}
			// Capture the webcam if we need to.
			if(p.webcam) {
				p.__webcamCapture();
			}
			// Perform the every-frame drawing routines.
			for(var i = 0; i < procedures.length; i++) {
				p.reset();
				procedures[i].procedure.call(p);
			}
		};
	}
};

