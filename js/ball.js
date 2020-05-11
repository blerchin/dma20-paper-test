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
	this.mouseEnterPt;
	this.mouseLeavePt;
	this.idx;
	this.path = new paper.Path({
		fillColor: {
			gradient: {
				stops: ['#e3f994', '#574DC8'],
				radial: true
			},
			origin: this.point,
			destination: this.point + [this.radius, 0],
		},
		blendMode: 'normal',
		closed: true,
		strokeColor: new paper.Color('#e3f994'),
		strokeWidth: 2,
		shadowColor: new paper.Color('#edebee'),
		shadowBlur: 5,
		shadowOffset: new paper.Point(-6, -5),
	});

	for (var i = 0; i < this.numSegment; i++) {
		this.boundOffset.push(this.radius);
		this.boundOffsetBuff.push(this.radius);
		this.path.add(new paper.Point());
		this.sidePoints.push(new paper.Point({
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
		this.vector = this.vector.multiply(this.dampen);
		this.point = this.point.add(this.vector);
		this.updateShape();
	},

	setIdx: function (val) {
		this.idx = val;
		this.path.idx = val;
	},

	updateColor: function () {
		this.path.fillColor.origin = this.path.position;
		this.path.fillColor.destination = this.path.bounds.rightCenter;
		this.path.fillColor.radial = true;
	},

	checkBorders: function () {
		var size = paper.view.size;
		var pre = this.point.add(this.vector);

		var max = paper.Point.max(this.radius, this.point.add(this.vector));
		this.point = paper.Point.min(max, size.subtract(this.radius));
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
			var direc = (this.point.subtract(b.point)).normalize(overlap * 0.1);

			this.vector = this.vector.add(direc);
			b.vector = b.vector.subtract(direc);

			this.calcBounds(b);
			b.calcBounds(this);
			this.updateBounds();
			b.updateBounds();
		}
	},

	getBoundOffset: function (b) {
		var diff = this.point.subtract(b);
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
		return this.point.add(
			this.sidePoints[index].multiply(this.boundOffset[index])
		);
	},

	updateBounds: function () {
		for (var i = 0; i < this.numSegment; i++)
			this.boundOffset[i] = this.boundOffsetBuff[i];
	}
};