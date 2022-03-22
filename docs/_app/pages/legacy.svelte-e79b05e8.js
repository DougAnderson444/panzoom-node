import { SvelteComponent, init, safe_not_equal, assign, element, claim_element, set_attributes, toggle_class, insert_hydration, listen, get_spread_update, noop, detach, run_all, onMount, exclude_internal_props, binding_callbacks, create_component, claim_component, mount_component, transition_in, transition_out, destroy_component } from "../chunks/vendor-dac9318e.js";
class Matrix {
  constructor(svg) {
    this.svg = svg || document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.vtm = this.createSVGMatrix();
    this.x = 0;
    this.y = 0;
    this.captureScale = 1;
  }
  clamp(scale, in_x, in_y, ratio) {
    let xx = (window.innerWidth - ratio.width) / 2;
    let yy = (window.innerHeight - ratio.height) / 2;
    let limit_max_right_formula = xx * scale + ratio.width * scale - window.innerWidth;
    let same_x = Math.min(this.vtm.e * 1, 0);
    let same_y = Math.min(this.vtm.f * 1, 0);
    let value1 = in_x > 0 ? same_x : -(xx * scale);
    let value2 = in_x > 0 ? same_x : -limit_max_right_formula;
    let limit_x_axis = this.vtm.e;
    limit_x_axis = Math.max(value2, this.vtm.e);
    limit_x_axis = Math.min(value1, limit_x_axis);
    let limit_max_bottom_formula = yy * scale + ratio.height * scale - window.innerHeight;
    let limit_max_top = in_y > 0 ? same_y : -(yy * scale);
    let limit_max_bottom = in_y > 0 ? same_y : -limit_max_bottom_formula;
    let limit_y_axis = this.vtm.f;
    limit_y_axis = Math.min(limit_max_top, limit_y_axis);
    limit_y_axis = Math.max(limit_y_axis, limit_max_bottom);
    this.vtm = this.createSVGMatrix().translate(limit_x_axis, limit_y_axis).scale(Math.max(this.vtm.a, 1));
  }
  createSVGMatrix() {
    return this.svg.createSVGMatrix();
  }
  move(x, y, in_x, in_y, ratio) {
    this.vtm = this.createSVGMatrix().translate(this.x - x, this.y - y).scale(this.vtm.a);
    this.clamp(this.vtm.a, in_x, in_y, ratio);
    return this.vtm;
  }
  scale(xFactor, yFactor, origin, in_x, in_y, ratio, max, value, dir) {
    if ((value >= max || this.stop) && dir === 1) {
      this.stop = true;
      if (!this.deb) {
        this.captureScale = this.vtm.a;
        this.vtm = this.createSVGMatrix().translate(origin.x, origin.y).scale(max / this.captureScale).translate(-origin.x, -origin.y).translate(this.vtm.e, this.vtm.f).scale(this.captureScale);
        this.deb = true;
      }
      return this.vtm;
    } else {
      this.stop = false;
    }
    this.vtm = this.createSVGMatrix().translate(origin.x, origin.y).scale(xFactor, yFactor).translate(-origin.x, -origin.y).multiply(this.vtm);
    let pre_scale = Math.min(Math.max(1, this.vtm.a), max);
    this.clamp(pre_scale, in_x, in_y, ratio);
    return this.vtm;
  }
}
class MultiTouchVelocity {
  constructor() {
    this.touchA = {
      clientX: 0,
      clientY: 0,
      t: 0,
      velocity: 1
    };
    this.touchB = {
      clientX: 0,
      clientY: 0,
      t: 0,
      velocity: 1
    };
  }
  down(touchA, touchB) {
    this.touchA = { clientX: touchA.clientX, clientY: touchA.clientY, t: Date.now(), velocity: 0 };
    this.touchB = { clientX: touchB.clientX, clientY: touchB.clientY, t: Date.now(), veloctiy: 0 };
  }
  calc(touch, ins) {
    var new_x = touch.clientX, new_y = touch.clientY, new_t = Date.now();
    var x_dist = new_x - ins.clientX, y_dist = new_y - ins.clientY, interval = new_t - ins.t;
    var velocity = Math.sqrt(x_dist * x_dist + y_dist * y_dist) / interval;
    ins.velocity = velocity;
    ins.clientX = new_x;
    ins.clientY = new_y;
    ins.t = new_t;
  }
  getVelocity(touchA, touchB) {
    this.calc(touchA, this.touchA);
    this.calc(touchB, this.touchB);
    return this.touchA.velocity + this.touchB.velocity;
  }
}
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio, ratio };
}
function getDistance(touchA, touchB) {
  return Math.hypot(touchA.pageX - touchB.pageX, touchA.pageY - touchB.pageY);
}
var index_svelte_svelte_type_style_lang = "";
function create_fragment$1(ctx) {
  let img_1;
  let mounted;
  let dispose;
  let img_1_levels = [{ alt: ctx[0] }, { class: "c-svelteZoom" }, ctx[8]];
  let img_1_data = {};
  for (let i = 0; i < img_1_levels.length; i += 1) {
    img_1_data = assign(img_1_data, img_1_levels[i]);
  }
  return {
    c() {
      img_1 = element("img");
      this.h();
    },
    l(nodes) {
      img_1 = claim_element(nodes, "IMG", { alt: true, class: true });
      this.h();
    },
    h() {
      set_attributes(img_1, img_1_data);
      toggle_class(img_1, "c-svelteZoom--contain", ctx[3]);
      toggle_class(img_1, "c-svelteZoom--no-contain", !ctx[3]);
      toggle_class(img_1, "c-svelteZoom--transition", ctx[1]);
      toggle_class(img_1, "c-svelteZoom--visible", ctx[3]);
      toggle_class(img_1, "c-svelteZoom--hidden", ctx[3] === null);
      toggle_class(img_1, "c-svelteZoom--willChange", ctx[4]);
      toggle_class(img_1, "svelte-17v58i", true);
    },
    m(target, anchor) {
      insert_hydration(target, img_1, anchor);
      ctx[11](img_1);
      if (!mounted) {
        dispose = [
          listen(img_1, "mousedown", ctx[6]),
          listen(img_1, "touchstart", ctx[7]),
          listen(img_1, "load", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      set_attributes(img_1, img_1_data = get_spread_update(img_1_levels, [
        dirty[0] & 1 && { alt: ctx2[0] },
        { class: "c-svelteZoom" },
        dirty[0] & 256 && ctx2[8]
      ]));
      toggle_class(img_1, "c-svelteZoom--contain", ctx2[3]);
      toggle_class(img_1, "c-svelteZoom--no-contain", !ctx2[3]);
      toggle_class(img_1, "c-svelteZoom--transition", ctx2[1]);
      toggle_class(img_1, "c-svelteZoom--visible", ctx2[3]);
      toggle_class(img_1, "c-svelteZoom--hidden", ctx2[3] === null);
      toggle_class(img_1, "c-svelteZoom--willChange", ctx2[4]);
      toggle_class(img_1, "svelte-17v58i", true);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(img_1);
      ctx[11](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { alt } = $$props;
  let smooth = true;
  let touchScreen = false;
  let xY = { initX: 0, initY: 0, newX: 0, newY: 0 };
  let ratio, img;
  let matrix;
  let contain = null;
  let willChange = true;
  let velocity = new MultiTouchVelocity();
  let lastTap = { time: 0, x: 0, y: 0 };
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
    max: 1
  };
  function fireDown(x, y) {
    xY.initX = x;
    xY.initY = y;
    matrix.x = matrix.vtm.e;
    matrix.y = matrix.vtm.f;
    $$invalidate(4, willChange = true);
  }
  function fireMove(x, y) {
    if (scale.scaling)
      return;
    let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;
    xY.newX = xY.initX - x;
    xY.newY = xY.initY - y;
    const mat = matrix.move(in_x >= 0 ? 0 : xY.newX, in_y >= 0 ? 0 : xY.newY, in_x, in_y, ratio);
    $$invalidate(2, img.style.transform = `matrix(${mat.a},${mat.b},${mat.c},${mat.d},${mat.e}, ${mat.f})`, img);
  }
  function fireUp() {
    matrix.x -= xY.newX;
    matrix.y -= xY.newY;
    scale.scaling = false;
    scale.lastHypo = 0;
    $$invalidate(1, smooth = true);
    $$invalidate(4, willChange = false);
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
    $$invalidate(1, smooth = false);
  }
  function fireTapScale(x, y) {
    let scaleVtm = matrix.vtm.a;
    let scale_value = scaleVtm > 1 ? scaleVtm - 1 : scale.max / 2.5;
    let scale_factor = scaleVtm > 1 ? -1 : 1;
    const xFactor = 1 + scale_value * scale_factor;
    const yFactor = xFactor * window.innerHeight / window.innerWidth;
    let in_x = (window.innerWidth - ratio.width * Math.max(xFactor * scaleVtm, 1)) / 2;
    let in_y = (window.innerHeight - ratio.height * Math.max(xFactor * scaleVtm, 1)) / 2;
    const origin = {
      x: in_x > 0 ? window.innerWidth / 2 : x,
      y: in_y > 0 ? window.innerHeight / 2 : y
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, scale_factor);
    scale.value = mat.d;
    $$invalidate(2, img.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.d})`, img);
  }
  function fireScaleMove(touchA, touchB, e) {
    const hypo = getDistance(touchA, touchB);
    let f = hypo / scale.lastHypo;
    f = f >= 1 ? 1 : -1;
    const ff = velocity.getVelocity(touchA, touchB) || 1;
    const xFactor = 1 + 0.1 * ff * f;
    const yFactor = xFactor * window.innerHeight / window.innerWidth;
    let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: in_x > 0 ? window.innerWidth / 2 : scale.originX,
      y: in_y > 0 ? window.innerHeight / 2 : scale.originY
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, f);
    $$invalidate(2, img.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.d})`, img);
    scale.value = mat.d;
    scale.lastHypo = hypo;
    scale.scaling = true;
  }
  function fireManualZoom(dir) {
    const xFactor = 1 + 0.2 * dir;
    const yFactor = xFactor * window.innerHeight / window.innerWidth;
    let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    $$invalidate(2, img.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.d})`, img);
    scale.value = mat.d;
  }
  const zoomIn = () => fireManualZoom(1);
  const zoomOut = () => fireManualZoom(-1);
  function onResize() {
    onLoad();
    fireDown(0, 0);
    fireMove(0, 0);
    fireUp();
  }
  function onWheel(e) {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const xFactor = 1 + 0.1 * dir;
    const yFactor = xFactor * window.innerHeight / window.innerWidth;
    let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: in_x > 0 ? window.innerWidth / 2 : e.pageX,
      y: in_y > 0 ? window.innerHeight / 2 : e.pageY
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    $$invalidate(2, img.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.d})`, img);
    scale.value = mat.d;
  }
  function onLoad() {
    const { naturalWidth, naturalHeight } = img;
    $$invalidate(3, contain = naturalWidth > window.innerWidth || naturalHeight > window.innerHeight);
    console.log("onLoad: ", { max: scale.max });
    scale.max = (naturalWidth > naturalHeight ? Math.max(naturalWidth / window.innerWidth, 1) : Math.max(naturalHeight / window.innerHeight, 1)) * 10;
    ratio = calculateAspectRatioFit(naturalWidth, naturalHeight, window.innerWidth, window.innerHeight);
    console.log("after onLoad: ", { max: scale.max });
  }
  onMount(() => {
    matrix = new Matrix();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  });
  function onTouchStart(e) {
    touchScreen = true;
    $$invalidate(4, willChange = true);
    const isMultiTouch = e.touches.length === 2;
    const [touchA, touchB] = e.touches;
    scale.scaling = isMultiTouch;
    $$invalidate(1, smooth = false);
    if (isMultiTouch) {
      fireScale(touchA, touchB);
      velocity.down(touchA, touchB);
    } else {
      const { pageX, pageY } = touchA;
      var now = new Date().getTime();
      if (now - lastTap.time < 250 && Math.hypot(lastTap.x - pageX, lastTap.y - pageY) <= 20) {
        $$invalidate(1, smooth = true);
        fireTapScale(pageX, pageY);
      } else {
        fireDown(pageX, pageY);
      }
      lastTap = { time: now, x: pageX, y: pageY };
    }
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
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
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
  }
  function onMouseDown({ clientX, clientY }) {
    if (touchScreen)
      return;
    fireDown(clientX, clientY);
    $$invalidate(1, smooth = false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
  function onMouseMove({ clientX, clientY }) {
    fireMove(clientX, clientY);
  }
  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    fireUp();
  }
  const mousedown = onMouseDown;
  const touchstart = onTouchStart;
  function img_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      img = $$value;
      $$invalidate(2, img);
    });
  }
  $$self.$$set = ($$new_props) => {
    $$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    if ("alt" in $$new_props)
      $$invalidate(0, alt = $$new_props.alt);
  };
  $$props = exclude_internal_props($$props);
  return [
    alt,
    smooth,
    img,
    contain,
    willChange,
    onLoad,
    mousedown,
    touchstart,
    $$props,
    zoomIn,
    zoomOut,
    img_1_binding
  ];
}
class Src extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment$1, safe_not_equal, { alt: 0, zoomIn: 9, zoomOut: 10 }, null, [-1, -1]);
  }
  get zoomIn() {
    return this.$$.ctx[9];
  }
  get zoomOut() {
    return this.$$.ctx[10];
  }
}
var legacy_svelte_svelte_type_style_lang = "";
function create_fragment(ctx) {
  let zoom;
  let current;
  zoom = new Src({
    props: {
      alt: "haha",
      src: "https://steamuserimages-a.akamaihd.net/ugc/940586530515504757/CDDE77CB810474E1C07B945E40AE4713141AFD76/"
    }
  });
  return {
    c() {
      create_component(zoom.$$.fragment);
    },
    l(nodes) {
      claim_component(zoom.$$.fragment, nodes);
    },
    m(target, anchor) {
      mount_component(zoom, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(zoom.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(zoom.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(zoom, detaching);
    }
  };
}
class Legacy extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, create_fragment, safe_not_equal, {});
  }
}
export { Legacy as default };
//# sourceMappingURL=legacy.svelte-e79b05e8.js.map
