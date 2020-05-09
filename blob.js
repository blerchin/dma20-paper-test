// kynd.info 2014

var artists = [
	"Zeynep Abes",
	"Graham Akins",
	"Berfin Ataman",
	"Erin Cooney",
	"Clara Leivas",
	"Ben Lerchin",
	"Blaine O'Neill",
	"Miles Peyton",
	"Hirad Sab",
	"Dalena Tran",
	"Leming Z/C",
];

function Ball(r, p, v) {
	this.radius = r;
	this.point = p;
	this.vector = v;
	this.gravity = 9.8;
	this.dampen = 0.4;
	this.bounce = 0;
	this.maxVec = 15;
	this.numSegment = 16;
	this.boundOffset = [];
	this.boundOffsetBuff = [];
	this.sidePoints = [];
	this.path = new Path({
		fillColor: {
			gradient: {
				stops: ['white', '#333'],
				radial: true
			},
			origin: this.point,
			destination: this.point + [this.radius, 0],
		},
		blendMode: 'normal',
		strokeColor: '#000',
		strokeWidth: 0,
		closed: true
	});

	for (var i = 0; i < this.numSegment; i++) {
		this.boundOffset.push(this.radius);
		this.boundOffsetBuff.push(this.radius);
		this.path.add(new Point());
		this.sidePoints.push(new Point({
			angle: 360 / this.numSegment * i,
			length: 1
		}));
	}
}

Ball.prototype = {
	iterate: function () {
		this.checkBorders();
		if (this.vector.length > this.maxVec)
			this.vector.length = this.maxVec;
		this.vector.y += this.gravity;
		this.vector.x *= 0.99;
		this.vector *= this.dampen;
		this.point += this.vector;
		this.updateShape();
	},

	updateColor: function () {
		this.path.fillColor.origin = this.path.position;
		this.path.fillColor.destination = this.path.bounds.rightCenter;
		this.path.fillColor.radial = true;
	},

	checkBorders: function () {
		var size = view.size;
		var pre = this.point + this.vector;

		var max = Point.max(this.radius, this.point + this.vector);
		this.point = Point.min(max, size - this.radius);
	},

	updateShape: function () {
		var segments = this.path.segments;
		for (var i = 0; i < this.numSegment; i++)
			segments[i].point = this.getSidePoint(i);

		this.path.smooth();
		for (var i = 0; i < this.numSegment; i++) {
			if (this.boundOffset[i] < this.radius / 4)
				this.boundOffset[i] = this.radius / 4;
			var next = (i + 1) % this.numSegment;
			var prev = (i > 0) ? i - 1 : this.numSegment - 1;
			var offset = this.boundOffset[i];

			offset += (this.radius - offset) / 15;
			offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
			this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
		}
	},

	react: function (b) {
		var dist = this.point.getDistance(b.point);
		if (dist < this.radius + b.radius && dist != 0) {
			var overlap = this.radius + b.radius - dist;
			// overlap /= 10;
			var direc = (this.point - b.point).normalize(overlap * 0.1);
			this.vector += direc;
			b.vector -= direc;

			this.calcBounds(b);
			b.calcBounds(this);
			this.updateBounds();
			b.updateBounds();
		}
	},

	getBoundOffset: function (b) {
		var diff = this.point - b;
		var angle = (diff.angle + 180) % 360;
		return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
	},

	calcBounds: function (b) {
		for (var i = 0; i < this.numSegment; i++) {
			var tp = this.getSidePoint(i);
			var bLen = b.getBoundOffset(tp);
			var td = tp.getDistance(b.point) * 0.9;
			if (td < bLen) {
				this.boundOffsetBuff[i] -= (bLen - td) / 5;
			}
		}
	},

	getSidePoint: function (index) {
		return this.point + this.sidePoints[index] * this.boundOffset[index];
	},

	updateBounds: function () {
		for (var i = 0; i < this.numSegment; i++)
			this.boundOffset[i] = this.boundOffsetBuff[i];
	}
};

//--------------------- main ---------------------

var balls = [];
var numBalls = 11;
var x = 0;
var y = 0;
var defaultEasing = 0.02;
var targetX = 0;
var targetY = 0;
var forceFactor = 2;
var mouseBall;
var lasHover;
var opacity = 0.7;
var simInProgress = true;

function calcRadius() {
	var viewArea = view.size.width * view.size.height * 0.9;
	var radius = Math.sqrt((viewArea / numBalls) / Math.PI);
	radius = Math.random() * 20 + radius;
	return radius;
}

function setup() {
	mouseBall = new Ball(calcRadius(), new Point(0, 0), new Point(0, 0));
	balls.push(mouseBall);

	balls[0].radius = calcRadius() * forceFactor;
	balls[0].path.opacity = 0;
	balls[0].path.isMouse = true;

	for (var i = 0; i < numBalls; i++) {
		var position = Point.random() * view.size;
		var vector = new Point({
			angle: 1 * Math.random(),
			length: Math.random() * 10
		});
		var currBall = new Ball(calcRadius(), position, vector);
		currBall.path.opacity = opacity;
		currBall.path.artist = {
			idx: i,
			name: artists[i],
			dest: '#'
		};
		balls.push(currBall);
	}

	// balls[0].radius = calcRadius() * forceFactor;
	// balls[0].path.opacity = 0;
	// balls[0].path.isMouse = true;
}

function onFrame() {

	for (var i = 0; i < balls.length - 1; i++)
		for (var j = i + 1; j < balls.length; j++)
			balls[i].react(balls[j]);


	for (var i = 1, l = balls.length; i < l; i++) {
		balls[i].iterate();
		balls[i].updateColor();
	}

	balls[0].updateShape();



	// Mouse Easing
	var easeFactor = defaultEasing;
	if (!simInProgress) {
		easeFactor /= 10;
	}
	var dx = targetX - x;
	x += dx * easeFactor;
	var dy = targetY - y;
	y += dy * easeFactor;

	// Move the hidden/mouse blob 
	balls[0].point = new Point(x, y);
}

function onResize() {
	for (var i = 0, l = balls.length; i < l; i++) {
		balls[i].radius = calcRadius();
	}
	balls[0].radius = calcRadius() * forceFactor;
}

function onMouseMove(event) {
	var mousePos = event.point;

	targetX = mousePos.x;
	targetY = mousePos.y;

	project.activeLayer.selected = false;

	if (event.item && !event.item.isMouse) {
		simInProgress = false;
		for (var i = 1, l = balls.length; i < l; i++) {
			balls[i].path.opacity = 0;
		}
		lasHover = event.item;
		// event.item.selected = true;
		event.item.opacity = 1;
		var h1 = $("#bg-title").text(event.item.artist.name.toUpperCase());
		h1.html(h1.html().replace(/\s/g, '<br>'));
	} else {
		simInProgress = true;
		lasHover.opacity = opacity;
		for (var i = 1, l = balls.length; i < l; i++) {
			balls[i].path.opacity = opacity;
		}
		var h1 = $("#bg-title").text("NEAR REST \n NEIGHBOR");
		h1.html(h1.html().replace(/\n/g, '<br>'));
	}

	// for (var i = 0; i < balls.length; i++) {
	//     for (var j = i + 1; j < balls.length; j++) {
	//         showIntersections(balls[j].path, balls[i].path)
	//     }
	// }
}

function showIntersections(path1, path2) {
	var intersections = path1.getIntersections(path2);
	for (var i = 0; i < intersections.length; i++) {
		new Path.Circle({
			center: intersections[i].point,
			radius: 5,
			fillColor: '#009dec'
		}).removeOnMove();
	}
}

setup();