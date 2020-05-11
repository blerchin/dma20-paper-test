class Blobs {
	constructor(artists) {
		this.artists = artists;
		this.balls = [];
		this.numBalls = 11;
		this.x = 0;
		this.y = 0;
		this.defaultEasing = 0.03;
		this.targetX = 0;
		this.targetY = 0;
		this.forceFactor = 1.5;
		this.mouseBall = null;
		this.opacity = 0.8;
		this.simInProgress = true;
		this.collapsed = false;
		this.viewRatio = 0.9;
	}

	B(idx) {
		return this.balls[idx];
	}

	calcRadius(idx) {
		const viewArea =
			paper.view.size.width * paper.view.size.height * this.viewRatio;
		let radius;
		if (this.collapsed && idx != 0) {
			radius = paper.view.size.width / (this.numBalls * 2);
		} else {
			radius = Math.sqrt(viewArea / this.numBalls / Math.PI);
			radius = Math.random() * 20 + radius;
		}
		return radius;
	}

	setup() {
		const mouseBall = new Ball(
			this.calcRadius(0),
			new paper.Point(0, 0),
			new paper.Point(0, 0)
		);
		mouseBall.radius = this.calcRadius(0) * this.forceFactor;
		mouseBall.path.opacity = 0;
		mouseBall.path.isMouse = true;
		mouseBall.setIdx(0);
		this.balls.push(mouseBall);

		for (let i = 0; i < this.numBalls; i++) {
			const position = paper.Point.random().multiply(paper.view.size);
			const vector = new paper.Point({
				angle: 1 * Math.random(),
				length: Math.random() * 10,
			});
			const currBall = new Ball(this.calcRadius(i), position, vector);
			currBall.path.opacity = this.opacity;
			currBall.path.artist = artists[i];
			currBall.setIdx(this.balls.length);
			currBall.path.onMouseEnter = this.pathOnMouseEnter.bind(this);
			currBall.path.onMouseLeave = this.pathOnMouseLeave.bind(this);
			currBall.path.onClick = this.pathOnClick.bind(this);
			this.balls.push(currBall);
		}
	}

	onFrame() {
		for (let i = 0; i < this.balls.length - 1; i++)
			for (let j = i + 1; j < this.balls.length; j++)
				this.balls[i].react(this.balls[j]);

		for (let i = 1; i < this.balls.length; i++) {
			this.balls[i].iterate();
			this.balls[i].updateColor();
		}

		this.balls[0].updateShape();
		this.balls[0].updateColor();

		// Mouse Easing
		let easeFactor = this.defaultEasing;
		if (!this.simInProgress) {
			easeFactor /= 30;
		}
		const dx = this.targetX - this.x;
		this.x += dx * easeFactor;
		const dy = this.targetY - this.y;
		this.y += dy * easeFactor;

		// Move the hidden/mouse blob
		if (this.collapsed) {
			this.balls[0].point = new paper.Point(
				-this.balls[0].radius,
				-this.balls[0].radius
			);
		} else {
			this.balls[0].point = new paper.Point(this.x, this.y);
		}
	}

	onResize() {
		for (let i = 0; i < this.balls.length; i++) {
			this.balls[i].radius = this.calcRadius(i);
		}
		this.balls[0].radius = this.calcRadius(0) * this.forceFactor;
	}

	onMouseMove(event) {
		const mousePos = event.point;

		this.targetX = mousePos.x;
		this.targetY = mousePos.y;

		// for (let i = 0; i < balls.length; i++) {
		//     for (let j = i + 1; j < balls.length; j++) {
		//         showIntersections(balls[j].path, balls[i].path)
		//     }
		// }
	}

	pathOnMouseEnter(event) {
		this.simInProgress = false;

		const idx = event.target.idx;
		this.B(idx).mouseEnterPt = event.point;

		for (let i = 1; i < this.balls.length; i++) {
			if (this.balls[i].path != event.target) {
				this.balls[i].path.tween({
						opacity: this.balls[i].path.opacity,
					}, {
						opacity: 0.2,
					},
					250
				);
			} else {
				this.balls[i].path.tween({
						opacity: this.balls[i].path.opacity,
					}, {
						opacity: 1,
					},
					250
				);
			}
		}
		setBGTitle(event.target.artist.name);
	}
	repulseBall(idx) {
		if (!this.collapsed) {
			const repulsionV = this.B(idx).mouseEnterPt.subtract(
				this.B(idx).mouseLeavePt
			);
			this.B(idx).vector = this.B(idx).vector.add(repulsionV.normalize());
			this.B(idx).vector = this.B(idx).vector.subtract(this.B(idx).radius);
		}
	}

	pathOnMouseLeave(event) {
		this.simInProgress = true;

		const idx = event.target.idx;
		this.B(idx).mouseLeavePt = event.point;

		// Add force on mouse leave
		// this.repulseBall(idx);

		for (let i = 1; i < this.balls.length; i++) {
			this.balls[i].path.tween({
					opacity: this.balls[i].path.opacity,
				}, {
					opacity: this.opacity,
				},
				250
			);
		}

		resetBGTitle();
	}

	pathOnClick(event) {
		this.collapsed = !this.collapsed;
		for (let i = 1; i < this.balls.length; i++) {
			this.balls[i].radius = this.calcRadius(i);
		}
	}

	onKeyDown(event) {}
}