window.onload = function () {
	var canvas = document.getElementById('myCanvas');
	paper.setup(canvas);

	var blobs = new Blobs(artists);
	blobs.setup();

	var tool = new paper.Tool();
	tool.onMouseMove = (event) => blobs.onMouseMove(event);
	tool.onKeyDown = (event) => blobs.onKeyDown(event);

	paper.view.onFrame = (event) => blobs.onFrame(event);
	paper.view.onResize = (event) => blobs.onResize(event);
}

function setBGTitle(str) {
	var str = str.toUpperCase();
	str = str.replace(/\s/g, '<br>');
	var h1 = document.getElementById("bg-title");
	h1.innerHTML = str;
}

function resetBGTitle() {
	setBGTitle("NEARREST NEIGHBOR");
}