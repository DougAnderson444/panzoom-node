import Matrix from './matrix';
import MultiTouchVelocity from './velocity';
import { calculateAspectRatioFit, getDistance } from './other';

let smooth = true;
let touchScreen = false;
let xY = {
	initX: 0,
	initY: 0,
	newX: 0,
	newY: 0
};
let ratio, target;
let matrix;
let contain = null;
let willChange = true;
let velocity = new MultiTouchVelocity();
let lastTap = {
	time: 0,
	x: 0,
	y: 0
};
let scale = {
	scaling: false,
	x1: 0,
	x2: 0,
	y1: 0,
	y2: 0,
	lastHypo: 0,
	originX: 0,
	originY: 0,
	value: 1,
	max: 20
};

export const zoomIn = () => fireManualZoom(1);
export const zoomOut = () => fireManualZoom(-1);

// Svelte action directive
// see https://svelte.dev/docs#template-syntax-element-directives-use-action
export const zoom = (container, params = {}) => {
	// ensure touch action defaults are disabled
	container.style['touch-action'] = 'none';
	container.style['user-select'] = 'none';

	let target = container.firstElementChild;

	matrix = new Matrix({ container });

	onLoad();

	// container listeners
	container.addEventListener('wheel', onWheel, { passive: false });
	container.addEventListener('mousedown', onMouseDown, { passive: false });
	container.addEventListener('touchstart', onTouchStart, { passive: false });
	container.addEventListener('dragstart', onDragStart, { passive: false });
	container.addEventListener('drag', onDragStart, { passive: false });

	// window listeners
	window.addEventListener('resize', onResize);

	function onDragStart(e) {
		console.log('Removing drag listener');
		//cancel the natural drag listener
		return false;
	}

	function onLoad() {
		const { offsetWidth, offsetHeight } = target;
		contain = offsetWidth > container.clientWidth || offsetHeight > container.clientHeight;

		ratio = calculateAspectRatioFit(
			offsetWidth,
			offsetHeight,
			container.clientWidth,
			container.clientHeight
		);
	}

	function onResize() {
		onLoad();
		fireDown(0, 0);
		fireMove(0, 0);
		fireUp();
	}

	function fireDown(x, y) {
		xY.initX = x;
		xY.initY = y;
		matrix.x = matrix.vtm.e;
		matrix.y = matrix.vtm.f;

		willChange = true;
	}

	function fireMove(x, y) {
		if (scale.scaling) return;
		let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
		let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
		xY.newX = xY.initX - x;
		xY.newY = xY.initY - y;
		const mat = matrix.move(xY.newX, xY.newY, in_x, in_y, ratio); // rm clamp
		console.log('Move');
		target.style.transform = `matrix(${mat.a},${mat.b},${mat.c},${mat.d},${mat.e}, ${mat.f})`;
	}

	function fireUp() {
		matrix.x -= xY.newX;
		matrix.y -= xY.newY;
		scale.scaling = false;
		scale.lastHypo = 0;
		smooth = true;
		willChange = false;
	}

	function fireScale(touchA, touchB) {
		const xTouch = [Math.min(touchA.pageX, touchB.pageX), Math.max(touchA.pageX, touchB.pageX)];
		const yTouch = [Math.min(touchA.pageY, touchB.pageY), Math.max(touchA.pageY, touchB.pageY)];
		const W = xTouch[1] - xTouch[0];
		const centerX = W / 2 + xTouch[0];
		const H = yTouch[1] - yTouch[0];
		const centerY = H / 2 + yTouch[0];
		scale.originX = centerX;
		scale.originY = centerY;
		scale.lastHypo = Math.trunc(getDistance(touchA, touchB));
		smooth = false;
	}

	function fireTapScale(x, y) {
		let scaleVtm = matrix.vtm.a;
		let scale_value = scaleVtm > 1 ? scaleVtm - 1 : scale.max / 2.5;
		let scale_factor = scaleVtm > 1 ? -1 : 1;
		const xFactor = 1 + scale_value * scale_factor;
		const yFactor = (xFactor * container.clientHeight) / container.clientWidth;
		let in_x = (container.clientWidth - ratio.width * Math.max(xFactor * scaleVtm, 1)) / 2;
		let in_y = (container.clientHeight - ratio.height * Math.max(xFactor * scaleVtm, 1)) / 2;

		const origin = {
			x: x - container.clientWidth / 2 - container.offsetLeft,
			y: y - container.clientHeight / 2 - container.offsetTop
		};

		const mat = matrix.scale(
			xFactor,
			yFactor,
			origin,
			in_x,
			in_y,
			ratio,
			scale.max,
			scale.value * xFactor,
			scale_factor
		);
		scale.value = mat.d;
		target.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
	}

	function fireScaleMove(touchA, touchB, e) {
		const hypo = getDistance(touchA, touchB);
		let f = hypo / scale.lastHypo;
		f = f >= 1 ? 1 : -1;
		const ff = velocity.getVelocity(touchA, touchB) || 1;
		const xFactor = 1 + 0.1 * ff * f;
		const yFactor = (xFactor * container.clientHeight) / container.clientWidth;
		let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
		let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;

		const origin = {
			x: scale.originX - container.clientWidth / 2 - container.offsetLeft,
			y: scale.originY - container.clientHeight / 2 - container.offsetTop
		};

		const mat = matrix.scale(
			xFactor,
			yFactor,
			origin,
			in_x,
			in_y,
			ratio,
			scale.max,
			scale.value * xFactor,
			f
		);

		target.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
		scale.value = mat.d;
		scale.lastHypo = hypo;
		scale.scaling = true;
	}

	function fireManualZoom(dir) {
		const xFactor = 1 + 0.2 * dir;
		const yFactor = (xFactor * container.clientHeight) / container.clientWidth;
		let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
		let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
		const origin = {
			x: container.clientWidth / 2,
			y: container.clientHeight / 2
		};

		const mat = matrix.scale(
			xFactor,
			yFactor,
			origin,
			in_x,
			in_y,
			ratio,
			scale.max,
			scale.value * xFactor,
			dir
		);
		target.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.a})`;
		scale.value = mat.d;
	}

	function onWheel(e) {
		e.preventDefault();
		const dir = e.deltaY < 0 ? 1 : -1;

		const xFactor = 1 + 0.1 * dir;
		const yFactor = (xFactor * container.clientHeight) / container.clientWidth;

		let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
		let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;

		// The mouse coordinates.
		// the translate-origin is the middle of the container, so we need to alk back from (center, center)
		// plus any position relative/absolute offset it may have
		console.log({ container });

		const origin = {
			x: e.clientX - container.clientWidth / 2 - container.offsetLeft,
			y: e.clientY - container.clientHeight / 2 - container.offsetTop
		};

		const mat = matrix.scale(
			xFactor,
			yFactor,
			origin,
			in_x,
			in_y,
			ratio,
			scale.max,
			scale.value * xFactor,
			dir
		);

		target.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.a})`;

		scale.value = mat.d;

		container.dispatchEvent(
			new CustomEvent('zoomed', {
				detail: { style: target.style, scale, matrix, origin }
			})
		);
	}

	function onTouchStart(e) {
		touchScreen = true;
		willChange = true;
		const isMultiTouch = e.touches.length === 2;
		const [touchA, touchB] = e.touches;
		scale.scaling = isMultiTouch;
		smooth = false;
		if (isMultiTouch) {
			fireScale(touchA, touchB);
			velocity.down(touchA, touchB);
		} else {
			const { pageX, pageY } = touchA;
			var now = new Date().getTime();
			if (now - lastTap.time < 250 && Math.hypot(lastTap.x - pageX, lastTap.y - pageY) <= 20) {
				smooth = true;
				fireTapScale(pageX, pageY);
			} else {
				fireDown(pageX, pageY);
			}
			lastTap = {
				time: now,
				x: pageX,
				y: pageY
			};
		}
		container.removeEventListener('touchmove', onTouchMove);
		container.removeEventListener('touchend', onTouchEnd);
		container.addEventListener('touchmove', onTouchMove);
		container.addEventListener('touchend', onTouchEnd);
	}

	function onTouchMove(e) {
		if (scale.scaling) {
			const [touchA, touchB] = e.touches;
			fireScaleMove(touchA, touchB);
		} else {
			fireMove(e.touches[0].pageX, e.touches[0].pageY);
		}
	}

	function onTouchEnd(e) {
		fireUp();
		container.removeEventListener('touchmove', onTouchMove);
		container.removeEventListener('touchend', onTouchEnd);
		container.removeEventListener('touchcancel', onTouchEnd);
	}

	function onMouseDown({ clientX, clientY }) {
		if (touchScreen) return;
		fireDown(clientX, clientY);
		smooth = false;
		container.addEventListener('mousemove', onMouseMove);
		container.addEventListener('mouseup', onMouseUp);
	}

	function onMouseMove({ clientX, clientY }) {
		fireMove(clientX, clientY);
	}

	function onMouseUp() {
		container.removeEventListener('mousemove', onMouseMove);
		fireUp();
	}

	return {
		destroy() {
			// container listeners
			container.removeEventListener('wheel', onWheel);
			container.removeEventListener('mousedown', onMouseDown);
			container.removeEventListener('touchstart', onTouchStart);
			container.removeEventListener('dragstart', onDragStart);
			container.addEventListener('drag', onDragStart);

			// window listeners
			window.removeEventListener('resize', onResize);
		}
	};
};
