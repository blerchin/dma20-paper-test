class Blobs {
	constructor(artists) {
		this.artists = artists;
		this.balls = [];
		this.numBalls = artists.length;
		this.viewRatio = 0.75;
		this.squeezeFactor = 0.3;
		this.animationDuration = 250;
		this.mouseBall = null;
		this.mouseCurrX = 0;
		this.mouseCurrY = 0;
		this.mouseTargetX = 0;
		this.mouseTargetY = 0;
		this.mouseRadiusMultiplier = 1.5;
		this.defaultEasing = 0.03;
		this.slowSimEasing = this.defaultEasing / 30;
		this.opacity = 0.8;
		this.hoverFadedOpacity = 0.2;
		this.hoverActiveOpacity = 1;
		this.isSlowSim = false;
		this.collapsed = false;
		this.isVertical = true;
	}

	B(idx) {
		return this.balls[idx];
	}

	calcRadius(idx) {
		const viewArea =
			paper.view.size.width * paper.view.size.height * this.viewRatio;
		let radius;
		if (this.collapsed && idx != 0) {
			let totalLength = this.isVertical ? paper.view.size.height:paper.view.size.width;
			radius = totalLength / (this.numBalls * 2);
		} else {
			radius = Math.sqrt(viewArea / this.numBalls / Math.PI);
			radius += Math.random() * (this.squeezeFactor * radius);
		}
		return radius;
	}

	setup() {
		const mouseBall = new Ball(
			this.calcRadius(0),
			new paper.Point(0, 0),
			new paper.Point(0, 0)
		);
		mouseBall.radius = this.calcRadius(0) * this.mouseRadiusMultiplier;
		mouseBall.path.opacity = 0;
		mouseBall.path.isMouse = true;
		mouseBall.path.isVertical = this.isVertical;
		mouseBall.setIdx(0);
		this.balls.push(mouseBall);

		for (let i = 0; i < this.numBalls; i++) {
			const position = paper.Point.random().multiply(paper.view.size);
			const force = new paper.Point({
				angle: 1 * Math.random(),
				length: Math.random() * 10,
			});
			const currBall = new Ball(this.calcRadius(i), position, force);
			currBall.path.opacity = this.opacity;
			currBall.shadowColor.alpha = this.opacity/2;
			currBall.path.artist = artists[i];
			currBall.setIdx(this.balls.length);
			currBall.path.verticalMode = this.isVertical;
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
		if (this.isSlowSim) {
			easeFactor = this.slowSimEasing;
		}
		const dx = this.mouseTargetX - this.mouseCurrX;
		this.mouseCurrX += dx * easeFactor;
		const dy = this.mouseTargetY - this.mouseCurrY;
		this.mouseCurrY += dy * easeFactor;

		// Move the hidden/mouse blob
		if (this.collapsed) {
			this.balls[0].point = new paper.Point(
				-this.balls[0].radius,
				-this.balls[0].radius
			);
		} else {
			this.balls[0].point = new paper.Point(this.mouseCurrX, this.mouseCurrY);
		}
	}

	onResize() {
		for (let i = 0; i < this.balls.length; i++) {
			this.balls[i].radius = this.calcRadius(i);
		}
		this.balls[0].radius = this.calcRadius(0) * this.mouseRadiusMultiplier;
	}

	onMouseMove(event) {
		const mousePos = event.point;

		this.mouseTargetX = mousePos.x;
		this.mouseTargetY = mousePos.y;

		// for (let i = 0; i < balls.length; i++) {
		//     for (let j = i + 1; j < balls.length; j++) {
		//         showIntersections(balls[j].path, balls[i].path)
		//     }
		// }
	}

	pathOnMouseEnter(event) {
		this.isSlowSim = true;

		const idx = event.target.idx;
		this.balls[idx].mouseEnterPt = event.point;

		for (let i = 1; i < this.balls.length; i++) {
			if (this.balls[i].path != event.target) {
				this.balls[i].path.tween({
						opacity: this.balls[i].path.opacity,
						shadowColor: this.balls[i].path.shadowColor,
					}, {
						opacity: this.hoverFadedOpacity,
						shadowColor: this.balls[i].shadowInactiveColor,
					},
					this.animationDuration
				);
			} else {
				this.balls[i].path.tween({
						opacity: this.balls[i].path.opacity,
						// shadowColor: this.balls[i].path.shadowColor,
					}, {
						opacity: this.hoverActiveOpacity,
						// shadowColor: this.balls[i].shadowColor,
					},
					this.animationDuration
				);
			}
		}
		setBGTitle(event.target.artist.name);
	}

	pathOnMouseLeave(event) {
		this.isSlowSim = false;

		const idx = event.target.idx;
		this.balls[idx].mouseLeavePt = event.point;

		// Add force on mouse leave
		// this.repulseBall(idx);

		for (let i = 1; i < this.balls.length; i++) {
			this.balls[i].path.tween({
					opacity: this.balls[i].path.opacity,
					shadowColor: this.balls[i].path.shadowColor,
				}, {
					opacity: this.opacity,
					shadowColor: this.balls[i].shadowInactiveColor
				},
				this.animationDuration
			);
		}

		resetBGTitle();
	}

	repulseBall(idx) {
		if (!this.collapsed) {
			const repulsionV = this.balls[idx].mouseEnterPt.subtract(
				this.balls[idx].mouseLeavePt
			);
			this.balls[idx].vector = this.balls[idx].vector.add(repulsionV.normalize());
			this.balls[idx].vector = this.balls[idx].vector.subtract(this.balls[idx].radius);
		}
	}

	pathOnClick(event) {
		this.collapsed = !this.collapsed;
		for (let i = 1; i < this.balls.length; i++) {
			this.balls[i].radius = this.calcRadius(i);
		}
	}

	onKeyDown(event) {
		for (let i = 1; i < this.balls.length; i++) {
			let curr = this.balls[i].path.blendMode;
			this.balls[i].path.blendMode = curr == 'normal' ? 'color-burn': 'normal';
		}
	}
}