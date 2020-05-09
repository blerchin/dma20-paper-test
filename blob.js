// kynd.info 2014

function Ball(r, p, v) {
	this.radius = r;
	this.point = p;
	this.vector = v;
	this.gravity = 9.8;
	this.dampen = 0.4;
	this.bounce = 0;
	this.maxVec = 15;
	this.numSegment = Math.floor(r / 3);
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
		if (dist < this.radius + b.radius && Math.abs(dist) > 10) {
			var overlap = this.radius + b.radius - dist;
			overlap /= 10;
			var direc = (this.point - b.point).normalize(overlap * 0.5);
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
var numBalls = 12;
var area = view.size.width * view.size.height * 0.5;
var radius = Math.sqrt((area / numBalls - 1) / Math.PI);
radius = Math.random() * 20 + radius;

for (var i = 0; i < numBalls; i++) {
	var position = Point.random() * view.size;
	var vector = new Point({
		angle: 1 * Math.random(),
		length: Math.random() * 10
	});
	balls.push(new Ball(radius, position, vector));
}

balls[0].radius = radius *2;
balls[0].path.opacity = 0;


function onMouseMove(event) {
	mousePos = event.point;
	var y = -(mousePos.y - view.size.height / 2);
	var x = (mousePos.x - view.size.width / 2);
	var angle = Math.atan(y / x);
	var uy = Math.sin(angle);
	var ux = Math.cos(angle);

	balls[0].point = mousePos;
}

function onFrame() {
	for (var i = 0; i < balls.length - 1; i++) {
		for (var j = i + 1; j < balls.length; j++) {
			if (i == j)
				continue;
			balls[i].react(balls[j]);
		}
	}
	for (var i = 1, l = balls.length; i < l; i++) {
		balls[i].iterate();
		balls[i].updateColor();
	}

	balls[0].updateShape();
}

function onResize() {
	for (var i = 0, l = balls.length; i < l; i++) {
		area = view.size.width * view.size.height * 0.5;
		radius = Math.sqrt((area / numBalls - 1) / Math.PI);
		radius = Math.random() * 20 + radius;
		balls[i].radius = radius;
	}
	balls[0].radius = radius *2;
}