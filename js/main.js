window.onload = function () {
	let canvas = document.getElementById('myCanvas');
	let tool = new paper.Tool();
	let blobs = new Blobs(artists);

	paper.setup(canvas);
	blobs.setup();

	// Using Arrow Functions for below to retain the scope of 'this'
	tool.onMouseMove = (event) => blobs.onMouseMove(event);
	tool.onKeyDown = (event) => blobs.onKeyDown(event);

	paper.view.onFrame = (event) => blobs.onFrame(event);
	paper.view.onResize = (event) => blobs.onResize(event);
};

function setBGTitle(val) {
	let str = val.toUpperCase();
	str = str.replace(/\s/g, '<br>');
	let h1 = document.getElementById("bg-title");
	h1.innerHTML = str;
}

function resetBGTitle() {
	setBGTitle("NEARREST NEIGHBOR");
}