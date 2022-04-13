// inspired by https://github.com/GoogleChromeLabs/pinch-zoom/blob/master/lib/pinch-zoom.ts

import PointerTracker from 'pointer-tracker';
import type { Pointer } from 'pointer-tracker'; // separate type out to own line
import './styles.css';

interface Point {
	clientX: number;
	clientY: number;
}

interface ChangeOptions {
	/**
	 * Fire a 'change' event if values are different to current values
	 */
	allowChangeEvent?: boolean;
}

interface ApplyChangeOpts extends ChangeOptions {
	panX?: number;
	panY?: number;
	scaleDiff?: number;
	originX?: number;
	originY?: number;
}

interface SetTransformOpts extends ChangeOptions {
	scale?: number;
	x?: number;
	y?: number;
}

type ScaleRelativeToValues = 'container' | 'content';

const minScaleAttr = 'min-scale';

export interface ScaleToOpts extends ChangeOptions {
	/** Transform origin. Can be a number, or string percent, eg "50%" */
	originX?: number | string;
	/** Transform origin. Can be a number, or string percent, eg "50%" */
	originY?: number | string;
	/** Should the transform origin be relative to the container, or content? */
	relativeTo?: ScaleRelativeToValues;
}

function getDistance(a: Point, b?: Point): number {
	if (!b) return 0;
	return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
}

function getMidpoint(a: Point, b?: Point): Point {
	if (!b) return a;

	return {
		clientX: (a.clientX + b.clientX) / 2,
		clientY: (a.clientY + b.clientY) / 2
	};
}

function getAbsoluteValue(value: string | number, max: number): number {
	if (typeof value === 'number') return value;

	if (value.trimRight().endsWith('%')) {
		return (max * parseFloat(value)) / 100;
	}
	return parseFloat(value);
}

function createMatrix(): DOMMatrix {
	return new DOMMatrix();
}

function createPoint(): DOMPoint {
	return new DOMPoint();
}

const MIN_SCALE = 0.01;

export default class PinchZoom {
	// The element that we'll transform.
	// Ideally this would be shadow DOM, but we don't have the browser
	// support yet.
	private _parentEl?: Element;
	// Current transform.
	private _transform: DOMMatrix = createMatrix();

	static get observedAttributes() {
		return [minScaleAttr];
	}

	constructor(node: HTMLElement) {
		this.node = node;
		this._parentEl = this.node.parentElement || document.body;

		// Watch for children changes.
		// Note this won't fire for initial contents,
		// so _stageElChange is also called in connectedCallback.
		new MutationObserver(() => this._stageElChange()).observe(this.node, { childList: true });

		// Watch for pointers
		const pointerTracker: PointerTracker = new PointerTracker(this._parentEl, {
			eventListenerOptions: { capture: true }, // catch the event before it goes to child in the DOM tree
			start: (pointer, event) => {
				console.log('PanZoom Start', { pointer }, pointerTracker.currentPointers.length);
				// We only want to track 2 pointers at most
				// there already exists 2 pointers, and now this would have been the 3rd pointer so let's stop here
				if (pointerTracker.currentPointers.length === 2 || !this._parentEl) return false;

				event.preventDefault();

				if (pointerTracker.currentPointers.length === 1) {
					// there already exists one pointer, and now this is the second pointer
					// then it's a pinch zoom and can be from anywhere, incl if the pointer is over a DOM tree child
					// events on this element are captured (see eventListenerOptions above) so stopping prop means they don't go down the DOM tree
					event.stopPropagation(); // if it's a 2 touch move, we want exclusive rights over the pointer
					return true;
				}

				if (
					pointerTracker.currentPointers.length === 0 &&
					(event.target == this._parentEl || event.target == node)
				) {
					// if length == 0, then this is the first pointer tracked
					// it's for panning, but only on the parent or this node
					// so event.target has to be on this node or it's parent to pan everybody
					return true;
				}
				// else, the pointer event must have happened on a child node, where pan doesn't apply
			},
			move: (previousPointers) => {
				event.stopPropagation(); // continue exclusive rights over the pointer from DOM tree
				this._onPointerMove(previousPointers, pointerTracker.currentPointers);
			}
		});

		this._parentEl.addEventListener('wheel', (event) => this._onWheel(event));
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === minScaleAttr) {
			if (this.scale < this.minScale) {
				this.setTransform({ scale: this.minScale });
			}
		}
	}

	get minScale(): number {
		const attrValue = this.node.getAttribute(minScaleAttr);
		if (!attrValue) return MIN_SCALE;

		const value = parseFloat(attrValue);
		if (Number.isFinite(value)) return Math.max(MIN_SCALE, value);

		return MIN_SCALE;
	}

	set minScale(value: number) {
		this.node.setAttribute(minScaleAttr, String(value));
	}

	connectedCallback() {
		this._stageElChange();
	}

	get x() {
		return this._transform.e;
	}

	get y() {
		return this._transform.f;
	}

	get scale() {
		return this._transform.a;
	}

	/**
	 * Change the scale, adjusting x/y by a given transform origin.
	 */
	scaleTo(scale: number, opts: ScaleToOpts = {}) {
		let { originX = 0, originY = 0 } = opts;

		const { relativeTo = 'content', allowChangeEvent = false } = opts;

		const relativeToEl = relativeTo === 'content' ? this._parentEl : this.node;

		// No content element? Fall back to just setting scale
		if (!relativeToEl || !this._parentEl) {
			this.setTransform({ scale, allowChangeEvent });
			return;
		}

		const rect = relativeToEl.getBoundingClientRect();
		originX = getAbsoluteValue(originX, rect.width);
		originY = getAbsoluteValue(originY, rect.height);

		if (relativeTo === 'content') {
			originX += this.x;
			originY += this.y;
		} else {
			const currentRect = this._parentEl.getBoundingClientRect();
			originX -= currentRect.left;
			originY -= currentRect.top;
		}

		this._applyChange({
			allowChangeEvent,
			originX,
			originY,
			scaleDiff: scale / this.scale
		});
	}

	/**
	 * Update the stage with a given scale/x/y.
	 */
	setTransform(opts: SetTransformOpts = {}) {
		const { scale = this.scale, allowChangeEvent = false } = opts;

		let { x = this.x, y = this.y } = opts;

		// If we don't have an element to position, just set the value as given.
		// We'll check bounds later.
		if (!this._parentEl) {
			this._updateTransform(scale, x, y, allowChangeEvent);
			return;
		}

		// Get current layout
		const thisBounds = this.node.getBoundingClientRect();
		const parentElBounds = this._parentEl.getBoundingClientRect();

		// Not displayed. May be disconnected or display:none.
		// Just take the values, and we'll check bounds later.
		if (!thisBounds.width || !thisBounds.height) {
			this._updateTransform(scale, x, y, allowChangeEvent);
			return;
		}

		// Create points for _parentEl.
		let topLeft = createPoint();
		topLeft.x = parentElBounds.left - thisBounds.left;
		topLeft.y = parentElBounds.top - thisBounds.top;
		let bottomRight = createPoint();
		bottomRight.x = parentElBounds.width + topLeft.x;
		bottomRight.y = parentElBounds.height + topLeft.y;

		// Calculate the intended position of _parentEl.
		const matrix = createMatrix()
			.translate(x, y)
			.scale(scale)
			// Undo current transform
			.multiply(this._transform.inverse());

		topLeft = topLeft.matrixTransform(matrix);
		bottomRight = bottomRight.matrixTransform(matrix);

		// Ensure _parentEl can't move beyond out-of-bounds.
		// Correct for x
		// if (topLeft.x > thisBounds.width) {
		// 	x += thisBounds.width - topLeft.x;
		// } else if (bottomRight.x < 0) {
		// 	x += -bottomRight.x;
		// }

		// Correct for y
		// if (topLeft.y > thisBounds.height) {
		// 	y += thisBounds.height - topLeft.y;
		// } else if (bottomRight.y < 0) {
		// 	y += -bottomRight.y;
		// }

		this._updateTransform(scale, x, y, allowChangeEvent);
	}

	/**
	 * Update transform values without checking bounds. This is only called in setTransform.
	 */
	private _updateTransform(scale: number, x: number, y: number, allowChangeEvent: boolean) {
		// Avoid scaling to zero
		if (scale < this.minScale) return;

		// Return if there's no change
		if (scale === this.scale && x === this.x && y === this.y) return;

		this._transform.e = x;
		this._transform.f = y;
		this._transform.d = this._transform.a = scale;

		// this.node.style.setProperty('--x', this.x + 'px');
		// this.node.style.setProperty('--y', this.y + 'px');
		// this.node.style.setProperty('--scale', this.scale + '');

		this.node.style.transform = `translate(${x}px,${y}px) scale(${scale})`;

		if (allowChangeEvent) {
			const event = new Event('change', { bubbles: true });
			this.node.dispatchEvent(event);
		}
	}

	/**
	 * Called when the direct children of this element change.
	 * Until we have have shadow dom support across the board, we
	 * require a single element to be the child of <pinch-zoom>, and
	 * that's the element we pan/scale.
	 */
	private _stageElChange() {
		this._parentEl = this.node.parentElement || document.body;

		// Do a bounds check
		this.setTransform({ allowChangeEvent: true });
	}

	private _onWheel(event: WheelEvent) {
		if (!this._parentEl) return;
		// if (this._parentEl !== event.target) return;

		event.preventDefault();

		const currentRect = this._parentEl.getBoundingClientRect();
		let { deltaY } = event;
		const { ctrlKey, deltaMode } = event;

		if (deltaMode === 1) {
			// 1 is "lines", 0 is "pixels"
			// Firefox uses "lines" for some types of mouse
			deltaY *= 15;
		}

		// ctrlKey is true when pinch-zooming on a trackpad.
		const divisor = ctrlKey ? 200 : 600;
		const scaleDiff = 1 - deltaY / divisor;

		this._applyChange({
			scaleDiff,
			originX: event.pageX - this._parentEl.offsetLeft - this._parentEl.clientWidth / 2,
			originY: event.pageY - this._parentEl.offsetTop - this._parentEl.clientHeight / 2,
			allowChangeEvent: true
		});
	}

	private _onPointerMove(previousPointers: Pointer[], currentPointers: Pointer[]) {
		if (!this._parentEl) return;

		// Combine next points with previous points
		const currentRect = this._parentEl.getBoundingClientRect();

		// For calculating panning movement
		const prevMidpoint = getMidpoint(previousPointers[0], previousPointers[1]);
		const newMidpoint = getMidpoint(currentPointers[0], currentPointers[1]);

		// Midpoint within the element
		const originX = prevMidpoint.clientX - currentRect.left - currentRect.width / 2;
		const originY = prevMidpoint.clientY - currentRect.top - currentRect.height / 2;

		// Calculate the desired change in scale
		const prevDistance = getDistance(previousPointers[0], previousPointers[1]);
		const newDistance = getDistance(currentPointers[0], currentPointers[1]);
		const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

		this._applyChange({
			originX,
			originY,
			scaleDiff,
			panX: newMidpoint.clientX - prevMidpoint.clientX,
			panY: newMidpoint.clientY - prevMidpoint.clientY,
			allowChangeEvent: true
		});
	}

	/** Transform the view & fire a change event */
	private _applyChange(opts: ApplyChangeOpts = {}) {
		const {
			panX = 0,
			panY = 0,
			originX = 0,
			originY = 0,
			scaleDiff = 1,
			allowChangeEvent = false
		} = opts;

		const matrix = createMatrix()
			// Translate according to panning.
			.translate(panX, panY)
			// Scale about the origin.
			.translate(originX, originY)
			// Apply current translate
			// .translate(this.x, this.y) // moved to line below vvv
			.scale(scaleDiff)
			.translate(-originX, -originY)
			// Apply current transform.
			.multiply(this._transform);

		// Convert the transform into basic translate & scale.
		this.setTransform({
			allowChangeEvent,
			scale: matrix.a,
			x: matrix.e,
			y: matrix.f
		});
	}
}
