class Ball {
	constructor(r, p, v) {
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
		this.mouseEnterPt = null;
		this.mouseLeavePt = null;
		this.idx = null;
		this.path = new paper.Path({
			fillColor: {
				gradient: {
					stops: ['#e3f994', '#574DC8'],
					radial: true,
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

		for (let i = 0; i < this.numSegment; i++) {
			this.boundOffset.push(this.radius);
			this.boundOffsetBuff.push(this.radius);
			this.path.add(new paper.Point());
			this.sidePoints.push(new paper.Point({
				angle: (360 / this.numSegment) * i,
				length: 1,
			}));
		}
	}

	iterate() {
		this.checkBorders();
		if (this.vector.length > this.maxVec) this.vector.length = this.maxVec;
		this.vector.y += this.gravity;
		this.vector.x *= 0.99;
		this.vector = this.vector.multiply(this.dampen);
		this.point = this.point.add(this.vector);
		this.updateShape();
	}

	setIdx(val) {
		this.idx = val;
		this.path.idx = val;
	}

	updateColor() {
		this.path.fillColor.origin = this.path.position;
		this.path.fillColor.destination = this.path.bounds.rightCenter;
		this.path.fillColor.radial = true;
	}

	checkBorders() {
		const size = paper.view.size;
		const pre = this.point.add(this.vector);

		const max = paper.Point.max(this.radius, this.point.add(this.vector));
		this.point = paper.Point.min(max, size.subtract(this.radius));
	}

	updateShape() {
		const segments = this.path.segments;
		for (let i = 0; i < this.numSegment; i++)
			segments[i].point = this.getSidePoint(i);

		this.path.smooth();
		for (let i = 0; i < this.numSegment; i++) {
			if (this.boundOffset[i] < this.radius / 4)
				this.boundOffset[i] = this.radius / 4;
			const next = (i + 1) % this.numSegment;
			const prev = i > 0 ? i - 1 : this.numSegment - 1;
			let offset = this.boundOffset[i];

			offset += (this.radius - offset) / 15;
			offset +=
				((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
			this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
		}
	}

	react(b) {
		const dist = this.point.getDistance(b.point);
		if (dist < this.radius + b.radius && dist != 0) {
			const overlap = this.radius + b.radius - dist;
			// overlap /= 10;
			const direc = this.point.subtract(b.point).normalize(overlap * 0.1);

			this.vector = this.vector.add(direc);
			b.vector = b.vector.subtract(direc);

			this.calcBounds(b);
			b.calcBounds(this);
			this.updateBounds();
			b.updateBounds();
		}
	}

	getBoundOffset(b) {
		const diff = this.point.subtract(b);
		const angle = (diff.angle + 180) % 360;
		return this
			.boundOffset[Math.floor((angle / 360) * this.boundOffset.length)];
	}

	calcBounds(b) {
		for (let i = 0; i < this.numSegment; i++) {
			const tp = this.getSidePoint(i);
			const bLen = b.getBoundOffset(tp);
			const td = tp.getDistance(b.point) * 0.9;
			if (td < bLen) {
				this.boundOffsetBuff[i] -= (bLen - td) / 5;
			}
		}
	}

	getSidePoint(index) {
		return this.point.add(
			this.sidePoints[index].multiply(this.boundOffset[index]));
	}

	updateBounds() {
		for (let i = 0; i < this.numSegment; i++)
			this.boundOffset[i] = this.boundOffsetBuff[i];
	}
}