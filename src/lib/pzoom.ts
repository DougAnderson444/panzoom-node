import pinchZoom from './pinchZoom';

export const pzoom = (node, params) => {
	console.log({ params });
	let container = node.parentElement || document.body;

	// ensure touch and select action defaults are disable
	container.style['touch-action'] = 'none';
	container.style['user-select'] = 'none';
	container.style['overflow'] = 'hidden';
	container.style['position'] = 'relative';

	node.style['touch-action'] = 'none';
	node.style['user-select'] = 'none';
	node.style['position'] = 'absolute';
	node.style.width = '100%'; // makes the transfrom origin the same
	node.style.height = '100%'; // otherwise the origin will be off, and I dont know yet how to correct for that

	// node.style['transform'] = 'translate(var(--x), var(--y)) scale(var(--scale))';
	// node.style['transform-origin'] = '0 0';
	// node.style['will-change'] = 'transform';

	let zoomer = new pinchZoom(node as HTMLElement, {
		handle: params?.handle,
		panAnywhere: params?.panAnywhere
	});

	// listen on node HTMLElement
	node.addEventListener('home', handleScaleToHome);
	node.addEventListener('scaleTo', handleScaleTo);
	node.addEventListener('change', handleScaleChange);
	node.addEventListener('setTransform', handleSetTransform);

	function handleScaleTo(val) {
		zoomer.scaleTo(val, { allowChangeEvent: true });
	}

	function handleScaleToHome(e) {
		// zoomer.scaleTo(1, { allowChangeEvent: true });
		zoomer.setTransform({ x: 0, y: 0, scale: 1, allowChangeEvent: true });
	}

	function handleSetTransform(e) {
		zoomer.setTransform({
			x: e.detail.x || 0,
			y: e.detail.y || 0,
			scale: e.detail.scale || 1,
			allowChangeEvent: true
		});
	}

	function handleScaleChange(e) {
		const scale = e.target.style.transform.match(/scale\((\d+\.?\d*)\)/)[1];
		node.dispatchEvent(
			new CustomEvent('scale', {
				detail: { scale }
			})
		);
	}

	return {
		update(params) {
			// the value of `bar` has changed
			zoomer.destroy(); // old one
			zoomer = new pinchZoom(node as HTMLElement, {
				handle: params?.handle,
				panAnywhere: params?.panAnywhere
			});
		},

		destroy() {
			// the node has been removed from the DOM
			zoomer.destroy();
			// remove scaleTo event listener
			node.removeEventListener('home', handleScaleToHome);
			// remove scale event listener
			node.removeEventListener('change', handleScaleChange);
			// remove scaleTo event listener
			node.removeEventListener('scaleTo', handleScaleTo);
			// remove setTransform event listener
			node.removeEventListener('setTransform', handleSetTransform);
		}
	};
};
