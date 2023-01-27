// inspired by https://github.com/GoogleChromeLabs/pinch-zoom/blob/master/lib/pinch-zoom.ts

import PointerTracker from 'pointer-tracker';
import type { Pointer } from 'pointer-tracker'; // separate type out to own line

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
	// initialize a new 16 element 3D array matrix
	return new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function createPoint(): DOMPoint {
	return new DOMPoint();
}

const MIN_SCALE = 0.01;

export default class PinchZoom {
	// The element that we'll transform.
	private _node: HTMLElement;
	// Ideally this would be shadow DOM, but we don't have the browser
	// support yet.
	private _parentEl?: HTMLElement;
	// Current transform.
	private _transform: DOMMatrix = createMatrix();

	private _pointerTracker: PointerTracker;

	private _handle: HTMLElement | null = null;

	static get observedAttributes() {
		return [minScaleAttr];
	}

	/**
	 * handle - an optional handle element to grab by
	 */
	constructor(
		node: HTMLElement,
		{ panAnywhere, handle }: { handle?: HTMLElement | null; panAnywhere?: boolean } = {}
	) {
		this._node = node;
		this._parentEl = this._node.parentElement || document.body;
		this._handle = handle;

		// Watch for children changes.
		// Note this won't fire for initial contents,
		// so _stageElChange is also called in connectedCallback.
		new MutationObserver(() => this._stageElChange()).observe(this._node, { childList: true });

		// Watch for pointers (nodes[i] as HTMLElement)
		this._pointerTracker = new PointerTracker(this._parentEl, {
			eventListenerOptions: {
				capture: false // catch the event before it goes to child in the DOM tree ?
			},
			start: (pointer, event) => {
				// ignore single pointers on input / editable elements
				if (
					this._pointerTracker.currentPointers.length === 0 &&
					(event.target instanceof HTMLInputElement || event.target.isContentEditable)
				) {
					return false;
				}

				if (this._pointerTracker.currentPointers.length === 2 || !this._parentEl)
					// We only want to track 2 pointers at most
					// there already exists 2 pointers, and now this would have been the 3rd pointer so let's stop here
					return false;

				// if a parent contains dataset data-no-pan, then don't pan
				if (event.target.closest('[data-no-pan]')) return false;

				if (this._pointerTracker.currentPointers.length > 1) {
					// there already exists two pointers, and now this is the third pointer
					return false;
				}

				// else, start the tracking of the pointer
				event.preventDefault();
				event.stopPropagation();
				return true;
			},
			move: (previousPointers, changedPointers, event) => {
				// tracking purposes only, no action
				if (this._pointerTracker.currentPointers.length === 0) return;

				// If it's a single pointer in a child, return unless panAnywhere or Handle is set
				if (
					!panAnywhere &&
					!this._handle &&
					this._pointerTracker.currentPointers.length === 1 &&
					!(event.target == this._parentEl || event.target == node)
				)
					return;

				// return if single pointer outide of an (optional) handle;
				// if this._handle is set, then we only want to pan if the event target is contained within the handle
				if (
					this._handle &&
					!this._handle?.contains(event.target as HTMLElement) &&
					this._pointerTracker.currentPointers.length == 1
				)
					return;

				// pan if single pointer on parent container or target node
				// zoom if double pointer anywhere
				event.preventDefault();
				event.stopPropagation(); // continue exclusive rights over the pointer from DOM tree
				this._onPointerMove(previousPointers, this._pointerTracker.currentPointers);
			},
			end: (pointer, event, cancelled) => {}
		});

		this._parentEl.addEventListener('wheel', (event) => this._onWheel(event));
	}

	destroy() {
		this._pointerTracker.stop();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === minScaleAttr) {
			if (this.scale < this.minScale) {
				this.setTransform({ scale: this.minScale });
			}
		}
	}

	get minScale(): number {
		const attrValue = this._node.getAttribute(minScaleAttr);
		if (!attrValue) return MIN_SCALE;

		const value = parseFloat(attrValue);
		if (Number.isFinite(value)) return Math.max(MIN_SCALE, value);

		return MIN_SCALE;
	}

	set minScale(value: number) {
		this._node.setAttribute(minScaleAttr, String(value));
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

		const relativeToEl = relativeTo === 'content' ? this._parentEl : this._node;

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
		const thisBounds = this._node.getBoundingClientRect();
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
		// Avoid scaling below minimum
		if (scale < this.minScale) {
			scale = this.minScale;
			return;
		}

		// Return if there's no change
		if (scale === this.scale && x === this.x && y === this.y) return;

		this._transform.e = x;
		this._transform.f = y;
		this._transform.d = this._transform.a = scale;

		// this._node.style.setProperty('--x', this.x + 'px');
		// this._node.style.setProperty('--y', this.y + 'px');
		// this._node.style.setProperty('--scale', this.scale + '');

		this._node.style.transform = `translate(${x}px,${y}px) scale(${scale})`;

		if (allowChangeEvent) {
			const event = new Event('change', { bubbles: true });
			this._node.dispatchEvent(event);
		}
	}

	/**
	 * Called when the direct children of this element change.
	 * Until we have have shadow dom support across the board, we
	 * require a single element to be the child of <pinch-zoom>, and
	 * that's the element we pan/scale.
	 */
	private _stageElChange() {
		this._parentEl = this._node.parentElement || document.body;

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
