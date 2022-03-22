export function panzoom(container, params) {
	//config contaning node
	const target = container.firstElementChild;

	let width = target.offsetWidth;
	let height = target.offsetHeight;

	let visibleWidth = width;
	let visibleHeight = height;

	let pos = { x: 0, y: 0 };
	let zoom_target = { x: 0, y: 0 };
	let zoom_point = { x: 0, y: 0 };
	let scale = 1;
	let max_scale = params?.maxScale || 20;
	let zoomIntensity = params?.zoomIntensity || 0.1;

	// list of events
	container.addEventListener('wheel', handleScroll, true);

	function handleScroll(e) {
		e.preventDefault();
		target.style['cursor'] = 'zoom-in';
		setTimeout(() => (target.style['cursor'] = 'auto'), 100);

		zoom_point.x = e.pageX - container.offsetLeft;
		zoom_point.y = e.pageY - container.offsetTop;

		let delta = e.deltaY < 0 ? 1 : -1;
		// cap the delta to [-1,1] for cross browser consistency

		// determine the point on where the slide is zoomed in
		zoom_target.x = (zoom_point.x - pos.x) / scale;
		zoom_target.y = (zoom_point.y - pos.y) / scale;

		// apply zoom
		scale += delta * zoomIntensity * scale;
		scale = Math.max(1, Math.min(max_scale, scale));

		// calculate x and y based on zoom
		pos.x = -zoom_target.x * scale + zoom_point.x;
		pos.y = -zoom_target.y * scale + zoom_point.y;

		// Make sure the slide stays in its container area when zooming out
		if (pos.x > 0) pos.x = 0;
		if (pos.x + width * scale < width) pos.x = -width * (scale - 1);
		if (pos.y > 0) pos.y = 0;
		if (pos.y + height * scale < height) pos.y = -height * (scale - 1);

		let oString = 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(' + scale + ',' + scale + ')';
		target.style['transform'] = oString;
		target.style['transformOrigin'] = `0 0`;
	}
}
