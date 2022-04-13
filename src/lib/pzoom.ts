import pinchZoom from './pinchZoom';

export const pzoom = (node, params = {}) => {
	let container = node.parentElement || document.body;

	// ensure touch and select action defaults are disable
	container.style['touch-action'] = 'none';
	container.style['user-select'] = 'none';
	container.style['overflow'] = 'hidden';
	container.style['position'] = 'relative';

	node.style['touch-action'] = 'none';
	node.style['user-select'] = 'none';
	node.style['position'] = 'absolute';

	// node.style['transform'] = 'translate(var(--x), var(--y)) scale(var(--scale))';
	// node.style['transform-origin'] = '0 0';
	// node.style['will-change'] = 'transform';

	new pinchZoom(node as HTMLElement);
};
