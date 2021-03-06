export default class Matrix {
	constructor({ container }) {
		this.container = container;
		this.vtm = this.createMatrix();

		this.x = 0;
		this.y = 0;

		this.captureScale = 1;
		this.stop = false;
	}

	clamp(scale, in_x, in_y, ratio) {
		let xx = (this.container.clientWidth - ratio.width) / 2;
		let yy = (this.container.clientHeight - ratio.height) / 2;

		let limit_max_right_formula = xx * scale + ratio.width * scale - this.container.clientWidth;

		let same_x = Math.min(this.vtm.e * 1.0, 0);
		let same_y = Math.min(this.vtm.f * 1.0, 0);

		let value1 = in_x > 0 ? same_x : -(xx * scale);
		let value2 = in_x > 0 ? same_x : -limit_max_right_formula;

		let limit_x_axis = this.vtm.e;
		limit_x_axis = Math.max(value2, this.vtm.e);
		limit_x_axis = Math.min(value1, limit_x_axis);

		let limit_max_bottom_formula = yy * scale + ratio.height * scale - this.container.clientHeight;
		let limit_max_top = in_y > 0 ? same_y : -(yy * scale);
		let limit_max_bottom = in_y > 0 ? same_y : -limit_max_bottom_formula;

		let limit_y_axis = this.vtm.f;
		limit_y_axis = Math.min(limit_max_top, limit_y_axis);
		limit_y_axis = Math.max(limit_y_axis, limit_max_bottom);

		this.vtm = this.createMatrix()
			.translate(limit_x_axis, limit_y_axis)
			.scale(Math.max(this.vtm.a, 1));
	}

	createMatrix() {
		/**
		 * https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix/DOMMatrix 
		 * 
		 * 6-element array of components in the form [a, b, c, d, e, f]
		 * which represent 2x3 matrices of the form:
		 * 
		 * [a c e] ( a [x,y,t] Vector )
		 * [b d f] ( another [x,y,t] Vector )
		 * 
		 * [
			Math.sin(angle) * scaleX,
			Math.cos(angle) * scaleX,
			-Math.sin(angle) * scaleY,
			Math.cos(angle) * scaleY,
			translateX,
			translateY
			]
		 * 
		 *	Deprecated: https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix 
		 */
		return new DOMMatrix();
	}

	move(x, y, in_x, in_y, ratio) {
		this.vtm = this.createMatrix()
			.translate(this.x - x, this.y - y)
			.scale(this.vtm.a);

		// this.clamp(this.vtm.a, in_x, in_y, ratio);
		return this.vtm;
	}

	/**
	 * Scale the vtm.
	 * @param {Number} xFactor - The amount to scale in the x direction.
	 * @param {Number} yFactor - The amount to scale in the y direction.
	 * @param {Point} origin - The origin point at which the scale should be centered.
	 */
	scale(xFactor, yFactor, origin, in_x, in_y, ratio, max, value, dir) {
		// dir == 1,zooming in
		// if ((value >= max || this.stop) && dir === 1) {
		// 	this.stop = true;
		// 	if (!this.deb) {
		// 		this.captureScale = this.vtm.a;
		// 		this.vtm = this.createMatrix()
		// 			.translate(origin.x, -origin.y)
		// 			.scale(max / this.captureScale)
		// 			.translate(-origin.x, origin.y)
		// 			.translate(this.vtm.e, this.vtm.f)
		// 			.scale(this.captureScale);

		// 		this.deb = true;
		// 	}
		// 	return this.vtm;
		// } else {
		// 	this.stop = false;
		// }

		this.vtm = this.createMatrix()
			.translate(origin.x, origin.y)
			.scale(xFactor, yFactor)
			.translate(-origin.x, -origin.y)
			.multiply(this.vtm);

		let pre_scale = Math.min(Math.max(1, this.vtm.a), max);

		// V V V V doesn't allow us to zoom into corners.. :/
		// this.clamp(pre_scale, in_x, in_y, ratio);

		return this.vtm;
	}
}
