import { SvelteComponent, init, safe_not_equal, element, claim_element, children, detach, set_style, attr, insert_hydration, noop, create_component, claim_component, mount_component, add_flush_callback, transition_in, transition_out, destroy_component, space, claim_space, append_hydration, check_outros, destroy_each, text, claim_text, action_destroyer, listen, set_data, is_function, run_all, RangeSlider, binding_callbacks, bind, group_outros } from "../chunks/vendor-4503c6b9.js";
class Matrix {
  constructor({ container }) {
    this.container = container;
    this.vtm = this.createMatrix();
    this.x = 0;
    this.y = 0;
    this.captureScale = 1;
    this.stop = false;
  }
  clamp(scale, in_x, in_y, ratio2) {
    let xx = (this.container.clientWidth - ratio2.width) / 2;
    let yy = (this.container.clientHeight - ratio2.height) / 2;
    let limit_max_right_formula = xx * scale + ratio2.width * scale - this.container.clientWidth;
    let same_x = Math.min(this.vtm.e * 1, 0);
    let same_y = Math.min(this.vtm.f * 1, 0);
    let value1 = in_x > 0 ? same_x : -(xx * scale);
    let value2 = in_x > 0 ? same_x : -limit_max_right_formula;
    let limit_x_axis = this.vtm.e;
    limit_x_axis = Math.max(value2, this.vtm.e);
    limit_x_axis = Math.min(value1, limit_x_axis);
    let limit_max_bottom_formula = yy * scale + ratio2.height * scale - this.container.clientHeight;
    let limit_max_top = in_y > 0 ? same_y : -(yy * scale);
    let limit_max_bottom = in_y > 0 ? same_y : -limit_max_bottom_formula;
    let limit_y_axis = this.vtm.f;
    limit_y_axis = Math.min(limit_max_top, limit_y_axis);
    limit_y_axis = Math.max(limit_y_axis, limit_max_bottom);
    this.vtm = this.createMatrix().translate(limit_x_axis, limit_y_axis).scale(Math.max(this.vtm.a, 1));
  }
  createMatrix() {
    return new DOMMatrix();
  }
  move(x, y, in_x, in_y, ratio2) {
    this.vtm = this.createMatrix().translate(this.x - x, this.y - y).scale(this.vtm.a);
    return this.vtm;
  }
  scale(xFactor, yFactor, origin, in_x, in_y, ratio2, max, value, dir) {
    this.vtm = this.createMatrix().translate(origin.x, origin.y).scale(xFactor, yFactor).translate(-origin.x, -origin.y).multiply(this.vtm);
    Math.min(Math.max(1, this.vtm.a), max);
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
    var velocity2 = Math.sqrt(x_dist * x_dist + y_dist * y_dist) / interval;
    ins.velocity = velocity2;
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
  var ratio2 = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio2, height: srcHeight * ratio2, ratio: ratio2 };
}
function getDistance(touchA, touchB) {
  return Math.hypot(touchA.pageX - touchB.pageX, touchA.pageY - touchB.pageY);
}
let touchScreen = false;
let xY = {
  initX: 0,
  initY: 0,
  newX: 0,
  newY: 0
};
let ratio;
let matrix;
let velocity = new MultiTouchVelocity();
let lastTap = {
  time: 0,
  x: 0,
  y: 0
};
const panzoom = (node, params = {}) => {
  var _a;
  let scale = {
    scaling: false,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
    lastHypo: 0,
    originX: 0,
    originY: 0,
    value: ((_a = params == null ? void 0 : params.scale) == null ? void 0 : _a.value) || 1,
    max: 20
  };
  let container = node.parentElement || document.body;
  container.style["touch-action"] = "none";
  container.style["user-select"] = "none";
  container.style["overflow"] = "hidden";
  container.style["position"] = "relative";
  node.style["touch-action"] = "none";
  node.style["user-select"] = "none";
  node.style["position"] = "absolute";
  node.style["height"] = "100%";
  node.style["width"] = "100%";
  matrix = new Matrix({ container });
  onLoad();
  node.addEventListener("dragstart", onDragStart, { passive: false });
  node.addEventListener("drag", onDragStart, { passive: false });
  container.addEventListener("mousedown", onMouseDown, { passive: false });
  container.addEventListener("touchstart", onTouchStart, { passive: false });
  container.addEventListener("wheel", onWheel, { passive: false });
  container.addEventListener("dragstart", onDragStart, { passive: false });
  container.addEventListener("drag", onDragStart, { passive: false });
  window.addEventListener("resize", onResize);
  const observer = new MutationObserver((mutationsList, observer2) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes") {
        let m;
        const re = /(\w+)\(([^)]*)\)/g;
        while (m = re.exec(node.style["transform"])) {
          if (m[1] == "scale" && parseFloat(m[2]).toFixed(2) != scale.value.toFixed(2)) {
            scale.value = m[2];
          }
        }
      }
    }
  });
  observer.observe(node, { attributes: true, childList: false, subtree: false });
  function onDragStart(e) {
    console.log("Removing drag listener");
    return false;
  }
  function onLoad() {
    const { offsetWidth, offsetHeight } = node;
    ratio = calculateAspectRatioFit(offsetWidth, offsetHeight, container.clientWidth, container.clientHeight);
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
  }
  function fireMove(x, y) {
    if (scale.scaling)
      return;
    let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
    xY.newX = xY.initX - x;
    xY.newY = xY.initY - y;
    const mat = matrix.move(xY.newX, xY.newY, in_x, in_y, ratio);
    node.style.transform = `matrix(${mat.a},${mat.b},${mat.c},${mat.d},${mat.e}, ${mat.f})`;
  }
  function fireUp() {
    matrix.x -= xY.newX;
    matrix.y -= xY.newY;
    scale.scaling = false;
    scale.lastHypo = 0;
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
  }
  function fireTapScale(x, y) {
    let scaleVtm = matrix.vtm.a;
    let scale_value = scaleVtm > 1 ? scaleVtm - 1 : scale.max / 2.5;
    let scale_factor = scaleVtm > 1 ? -1 : 1;
    const xFactor = 1 + scale_value * scale_factor;
    const yFactor = xFactor;
    let in_x = (container.clientWidth - ratio.width * Math.max(xFactor * scaleVtm, 1)) / 2;
    let in_y = (container.clientHeight - ratio.height * Math.max(xFactor * scaleVtm, 1)) / 2;
    const origin = {
      x: x - container.clientWidth / 2 - container.offsetLeft,
      y: y - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, scale_factor);
    scale.value = mat.d;
    node.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
    node.dispatchEvent(new CustomEvent("zoomed", {
      detail: { scale, matrix, origin }
    }));
  }
  function fireScaleMove(touchA, touchB, e) {
    const hypo = getDistance(touchA, touchB);
    let f = hypo / scale.lastHypo;
    f = f >= 1 ? 1 : -1;
    const ff = velocity.getVelocity(touchA, touchB) || 1;
    const xFactor = 1 + 0.1 * ff * f;
    const yFactor = xFactor;
    let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: scale.originX - container.clientWidth / 2 - container.offsetLeft,
      y: scale.originY - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, f);
    scale.value = mat.d;
    scale.lastHypo = hypo;
    scale.scaling = true;
    node.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
    node.dispatchEvent(new CustomEvent("zoomed", {
      detail: { style: node.style, scale, matrix, origin }
    }));
  }
  function onWheel(e) {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const xFactor = 1 + 0.1 * dir;
    const yFactor = xFactor;
    let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: e.pageX - container.clientWidth / 2 - container.offsetLeft,
      y: e.pageY - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    scale.value = mat.d;
    node.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.a})`;
    node.dispatchEvent(new CustomEvent("zoomed", {
      detail: { style: node.style, scale, matrix, origin }
    }));
  }
  function onTouchStart(e) {
    touchScreen = true;
    const isMultiTouch = e.touches.length === 2;
    const [touchA, touchB] = e.touches;
    scale.scaling = isMultiTouch;
    if (isMultiTouch) {
      fireScale(touchA, touchB);
      velocity.down(touchA, touchB);
    } else {
      const { pageX, pageY } = touchA;
      var now = new Date().getTime();
      if (now - lastTap.time < 250 && Math.hypot(lastTap.x - pageX, lastTap.y - pageY) <= 20) {
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
    node.removeEventListener("touchmove", onTouchMove);
    node.removeEventListener("touchend", onTouchEnd);
    node.addEventListener("touchmove", onTouchMove);
    node.addEventListener("touchend", onTouchEnd);
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
    node.removeEventListener("touchmove", onTouchMove);
    node.removeEventListener("touchend", onTouchEnd);
    node.removeEventListener("touchcancel", onTouchEnd);
  }
  function onMouseDown(e) {
    if (container !== e.target && node !== e.target) {
      return;
    }
    const { clientX, clientY } = e;
    if (touchScreen)
      return;
    fireDown(clientX, clientY);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseup", onMouseUp);
  }
  function onMouseMove({ clientX, clientY }) {
    fireMove(clientX, clientY);
  }
  function onMouseUp() {
    container.removeEventListener("mousemove", onMouseMove);
    fireUp();
  }
  return {
    update(params2) {
      console.log("Directive updated params", { params: params2 });
    },
    destroy() {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("mousedown", onMouseDown);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("dragstart", onDragStart);
      node.addEventListener("drag", onDragStart);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    }
  };
};
var Spot_svelte_svelte_type_style_lang = "";
function create_fragment$1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { style: true, class: true });
      var div_nodes = children(div);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      set_style(div, "top", ctx[1] + "px");
      set_style(div, "left", ctx[0] + "px");
      set_style(div, "--color", ctx[2]);
      attr(div, "class", "svelte-m6n0ej");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
    },
    p(ctx2, [dirty]) {
      if (dirty & 2) {
        set_style(div, "top", ctx2[1] + "px");
      }
      if (dirty & 1) {
        set_style(div, "left", ctx2[0] + "px");
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
let range = 9;
function instance$1($$self, $$props, $$invalidate) {
  let { left = (1 << range) * Math.random() | 10 } = $$props;
  let { top = (1 << range) * Math.random() | 10 } = $$props;
  let color = "#" + ((1 << 24) * Math.random() | 4095).toString(16);
  $$self.$$set = ($$props2) => {
    if ("left" in $$props2)
      $$invalidate(0, left = $$props2.left);
    if ("top" in $$props2)
      $$invalidate(1, top = $$props2.top);
  };
  return [left, top, color];
}
class Spot extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, { left: 0, top: 1 });
  }
}
var index_svelte_svelte_type_style_lang = "";
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[12] = list[i];
  child_ctx[14] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  child_ctx[17] = i;
  return child_ctx;
}
function create_if_block_1(ctx) {
  var _a;
  let div;
  let rangeslider;
  let updating_values;
  let current;
  function rangeslider_values_binding(value) {
    ctx[8](value);
  }
  let rangeslider_props = {
    pips: true,
    min: 0.5,
    step: 0.5,
    max: ((_a = ctx[4]) == null ? void 0 : _a.max) || 20,
    float: true
  };
  if (ctx[0] !== void 0) {
    rangeslider_props.values = ctx[0];
  }
  rangeslider = new RangeSlider({ props: rangeslider_props });
  binding_callbacks.push(() => bind(rangeslider, "values", rangeslider_values_binding));
  return {
    c() {
      div = element("div");
      create_component(rangeslider.$$.fragment);
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", {});
      var div_nodes = children(div);
      claim_component(rangeslider.$$.fragment, div_nodes);
      div_nodes.forEach(detach);
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      mount_component(rangeslider, div, null);
      current = true;
    },
    p(ctx2, dirty) {
      var _a2;
      const rangeslider_changes = {};
      if (dirty & 16)
        rangeslider_changes.max = ((_a2 = ctx2[4]) == null ? void 0 : _a2.max) || 20;
      if (!updating_values && dirty & 1) {
        updating_values = true;
        rangeslider_changes.values = ctx2[0];
        add_flush_callback(() => updating_values = false);
      }
      rangeslider.$set(rangeslider_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(rangeslider.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(rangeslider.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(rangeslider);
    }
  };
}
function create_if_block(ctx) {
  let div;
  let current;
  let each_value = ctx[7];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      var div_nodes = children(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].l(div_nodes);
      }
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", "grid");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (dirty & 164) {
        each_value = ctx2[7];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div, null);
          }
        }
        group_outros();
        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_1(ctx) {
  let spot;
  let current;
  spot = new Spot({
    props: {
      left: ctx[5] + ctx[14] * ctx[2].offsetWidth / count,
      top: ctx[5] + ctx[17] * ctx[2].offsetWidth / count
    }
  });
  return {
    c() {
      create_component(spot.$$.fragment);
    },
    l(nodes) {
      claim_component(spot.$$.fragment, nodes);
    },
    m(target, anchor) {
      mount_component(spot, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const spot_changes = {};
      if (dirty & 4)
        spot_changes.left = ctx2[5] + ctx2[14] * ctx2[2].offsetWidth / count;
      if (dirty & 4)
        spot_changes.top = ctx2[5] + ctx2[17] * ctx2[2].offsetWidth / count;
      spot.$set(spot_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(spot.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spot.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(spot, detaching);
    }
  };
}
function create_each_block(ctx) {
  let div;
  let t;
  let current;
  let each_value_1 = ctx[12];
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t = space();
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      var div_nodes = children(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].l(div_nodes);
      }
      t = claim_space(div_nodes);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", "col");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
      append_hydration(div, t);
      current = true;
    },
    p(ctx2, dirty) {
      if (dirty & 36) {
        each_value_1 = ctx2[12];
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1(ctx2, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block_1(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div, t);
          }
        }
        group_outros();
        for (i = each_value_1.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value_1.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_fragment(ctx) {
  let div0;
  let h1;
  let t0;
  let t1;
  let p0;
  let t2;
  let t3;
  let h2;
  let t4;
  let t5;
  let p1;
  let t6;
  let t7;
  let div5;
  let div3;
  let div1;
  let t8;
  let t9_value = ctx[4].value.toFixed(5) + "";
  let t9;
  let t10;
  let t11_value = JSON.stringify(ctx[0]) + "";
  let t11;
  let t12;
  let t13;
  let div2;
  let t14;
  let t15;
  let t16;
  let div4;
  let panzoom_action;
  let current;
  let mounted;
  let dispose;
  let if_block0 = ctx[0] && create_if_block_1(ctx);
  let if_block1 = ctx[2] && create_if_block(ctx);
  return {
    c() {
      div0 = element("div");
      h1 = element("h1");
      t0 = text("Pan and Zoom");
      t1 = space();
      p0 = element("p");
      t2 = text("Try out the mouse wheel scroll in the red box below");
      t3 = space();
      h2 = element("h2");
      t4 = text("Inside");
      t5 = space();
      p1 = element("p");
      t6 = text("Inside the red box should pan and zoom");
      t7 = space();
      div5 = element("div");
      div3 = element("div");
      div1 = element("div");
      t8 = text("Zoom Level: ");
      t9 = text(t9_value);
      t10 = text(" || ");
      t11 = text(t11_value);
      t12 = space();
      if (if_block0)
        if_block0.c();
      t13 = space();
      div2 = element("div");
      t14 = text("Style: ");
      t15 = text(ctx[3]);
      t16 = space();
      div4 = element("div");
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      div0 = claim_element(nodes, "DIV", {});
      var div0_nodes = children(div0);
      h1 = claim_element(div0_nodes, "H1", {});
      var h1_nodes = children(h1);
      t0 = claim_text(h1_nodes, "Pan and Zoom");
      h1_nodes.forEach(detach);
      t1 = claim_space(div0_nodes);
      p0 = claim_element(div0_nodes, "P", {});
      var p0_nodes = children(p0);
      t2 = claim_text(p0_nodes, "Try out the mouse wheel scroll in the red box below");
      p0_nodes.forEach(detach);
      t3 = claim_space(div0_nodes);
      h2 = claim_element(div0_nodes, "H2", {});
      var h2_nodes = children(h2);
      t4 = claim_text(h2_nodes, "Inside");
      h2_nodes.forEach(detach);
      t5 = claim_space(div0_nodes);
      p1 = claim_element(div0_nodes, "P", {});
      var p1_nodes = children(p1);
      t6 = claim_text(p1_nodes, "Inside the red box should pan and zoom");
      p1_nodes.forEach(detach);
      div0_nodes.forEach(detach);
      t7 = claim_space(nodes);
      div5 = claim_element(nodes, "DIV", { class: true });
      var div5_nodes = children(div5);
      div3 = claim_element(div5_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      div1 = claim_element(div3_nodes, "DIV", {});
      var div1_nodes = children(div1);
      t8 = claim_text(div1_nodes, "Zoom Level: ");
      t9 = claim_text(div1_nodes, t9_value);
      t10 = claim_text(div1_nodes, " || ");
      t11 = claim_text(div1_nodes, t11_value);
      t12 = claim_space(div1_nodes);
      if (if_block0)
        if_block0.l(div1_nodes);
      div1_nodes.forEach(detach);
      t13 = claim_space(div3_nodes);
      div2 = claim_element(div3_nodes, "DIV", {});
      var div2_nodes = children(div2);
      t14 = claim_text(div2_nodes, "Style: ");
      t15 = claim_text(div2_nodes, ctx[3]);
      div2_nodes.forEach(detach);
      div3_nodes.forEach(detach);
      t16 = claim_space(div5_nodes);
      div4 = claim_element(div5_nodes, "DIV", { class: true });
      var div4_nodes = children(div4);
      if (if_block1)
        if_block1.l(div4_nodes);
      div4_nodes.forEach(detach);
      div5_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div3, "class", "menu svelte-1teec0a");
      attr(div4, "class", "zoomable flexbox svelte-1teec0a");
      attr(div5, "class", "container svelte-1teec0a");
    },
    m(target, anchor) {
      insert_hydration(target, div0, anchor);
      append_hydration(div0, h1);
      append_hydration(h1, t0);
      append_hydration(div0, t1);
      append_hydration(div0, p0);
      append_hydration(p0, t2);
      append_hydration(div0, t3);
      append_hydration(div0, h2);
      append_hydration(h2, t4);
      append_hydration(div0, t5);
      append_hydration(div0, p1);
      append_hydration(p1, t6);
      insert_hydration(target, t7, anchor);
      insert_hydration(target, div5, anchor);
      append_hydration(div5, div3);
      append_hydration(div3, div1);
      append_hydration(div1, t8);
      append_hydration(div1, t9);
      append_hydration(div1, t10);
      append_hydration(div1, t11);
      append_hydration(div1, t12);
      if (if_block0)
        if_block0.m(div1, null);
      append_hydration(div3, t13);
      append_hydration(div3, div2);
      append_hydration(div2, t14);
      append_hydration(div2, t15);
      append_hydration(div5, t16);
      append_hydration(div5, div4);
      if (if_block1)
        if_block1.m(div4, null);
      ctx[9](div4);
      ctx[10](div5);
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(panzoom_action = panzoom.call(null, div4, { scale: ctx[4] })),
          listen(div4, "zoomed", ctx[6])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if ((!current || dirty & 16) && t9_value !== (t9_value = ctx2[4].value.toFixed(5) + ""))
        set_data(t9, t9_value);
      if ((!current || dirty & 1) && t11_value !== (t11_value = JSON.stringify(ctx2[0]) + ""))
        set_data(t11, t11_value);
      if (ctx2[0]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & 1) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_1(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(div1, null);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (!current || dirty & 8)
        set_data(t15, ctx2[3]);
      if (ctx2[2]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & 4) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(div4, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (panzoom_action && is_function(panzoom_action.update) && dirty & 16)
        panzoom_action.update.call(null, { scale: ctx2[4] });
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block0);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div0);
      if (detaching)
        detach(t7);
      if (detaching)
        detach(div5);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      ctx[9](null);
      ctx[10](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
let count = 10;
function instance($$self, $$props, $$invalidate) {
  let zoomable, container;
  let style = "";
  let scale = { value: 1 };
  let min = count;
  let manualZoom = [1];
  function handleZoom(e) {
    console.log("Zoomed.", { detail: e.detail });
    $$invalidate(4, scale = e.detail.scale);
    $$invalidate(3, style = zoomable.style.transform);
  }
  const grid = Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_2, j) => ({ id: i * count + j })));
  function setZoom(val) {
    console.log("Zoom to ", val, zoomable == null ? void 0 : zoomable.style["transform"]);
    if (!zoomable)
      return;
    if (!(zoomable == null ? void 0 : zoomable.style)) {
      console.log("Setting Zoom to scale only");
      $$invalidate(1, zoomable.style["transform"] = `scale(${val})`, zoomable);
      return;
    }
    let m;
    let s = "";
    const re = /(\w+)\(([^)]*)\)/g;
    while (m = re.exec(zoomable == null ? void 0 : zoomable.style["transform"])) {
      console.log({ m });
      if (m[1] == "matrix") {
        let piece = m[2].split(", ");
        console.log({ piece });
        s = `translate(${piece[4]}px, ${piece[5]}px) scale(${val})`;
        console.log("matrixed", { s });
        $$invalidate(1, zoomable.style["transform"] = s, zoomable);
        return;
      } else if (m[1] == "scale") {
        s += ` scale(${val})`;
      } else {
        s += m[0];
      }
    }
    console.log({ s });
    $$invalidate(1, zoomable.style["transform"] = s, zoomable);
  }
  function rangeslider_values_binding(value) {
    manualZoom = value;
    $$invalidate(0, manualZoom);
  }
  function div4_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      zoomable = $$value;
      $$invalidate(1, zoomable);
    });
  }
  function div5_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      container = $$value;
      $$invalidate(2, container);
    });
  }
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1) {
      if (manualZoom) {
        console.log({ manualZoom });
        setZoom(manualZoom);
      }
    }
  };
  return [
    manualZoom,
    zoomable,
    container,
    style,
    scale,
    min,
    handleZoom,
    grid,
    rangeslider_values_binding,
    div4_binding,
    div5_binding
  ];
}
class Routes extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
export { Routes as default };
//# sourceMappingURL=index.svelte-1b1e9322.js.map
