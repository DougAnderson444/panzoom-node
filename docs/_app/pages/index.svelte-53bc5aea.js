import { SvelteComponent, init, safe_not_equal, element, claim_element, children, detach, set_style, attr, insert_hydration, noop, transition_in, space, claim_space, append_hydration, create_component, claim_component, mount_component, transition_out, destroy_component, check_outros, destroy_each, text, claim_text, action_destroyer, listen, set_data, run_all, group_outros, binding_callbacks } from "../chunks/vendor-15451ce5.js";
class Matrix {
  constructor({ container }) {
    this.container = container;
    this.vtm = this.createMatrix();
    this.x = 0;
    this.y = 0;
    this.captureScale = 1;
    this.stop = false;
  }
  clamp(scale2, in_x, in_y, ratio2) {
    let xx = (this.container.clientWidth - ratio2.width) / 2;
    let yy = (this.container.clientHeight - ratio2.height) / 2;
    let limit_max_right_formula = xx * scale2 + ratio2.width * scale2 - this.container.clientWidth;
    let same_x = Math.min(this.vtm.e * 1, 0);
    let same_y = Math.min(this.vtm.f * 1, 0);
    let value1 = in_x > 0 ? same_x : -(xx * scale2);
    let value2 = in_x > 0 ? same_x : -limit_max_right_formula;
    let limit_x_axis = this.vtm.e;
    limit_x_axis = Math.max(value2, this.vtm.e);
    limit_x_axis = Math.min(value1, limit_x_axis);
    let limit_max_bottom_formula = yy * scale2 + ratio2.height * scale2 - this.container.clientHeight;
    let limit_max_top = in_y > 0 ? same_y : -(yy * scale2);
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
const panzoom = (node, params = {}) => {
  let container = node.parentElement || document.body;
  container.style["touch-action"] = "none";
  container.style["user-select"] = "none";
  matrix = new Matrix({ container });
  onLoad();
  container.addEventListener("wheel", onWheel, { passive: false });
  container.addEventListener("mousedown", onMouseDown, { passive: false });
  container.addEventListener("touchstart", onTouchStart, { passive: false });
  container.addEventListener("dragstart", onDragStart, { passive: false });
  container.addEventListener("drag", onDragStart, { passive: false });
  window.addEventListener("resize", onResize);
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
    console.log("Move");
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
    const yFactor = xFactor * container.clientHeight / container.clientWidth;
    let in_x = (container.clientWidth - ratio.width * Math.max(xFactor * scaleVtm, 1)) / 2;
    let in_y = (container.clientHeight - ratio.height * Math.max(xFactor * scaleVtm, 1)) / 2;
    const origin = {
      x: x - container.clientWidth / 2 - container.offsetLeft,
      y: y - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, scale_factor);
    scale.value = mat.d;
    node.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
  }
  function fireScaleMove(touchA, touchB, e) {
    const hypo = getDistance(touchA, touchB);
    let f = hypo / scale.lastHypo;
    f = f >= 1 ? 1 : -1;
    const ff = velocity.getVelocity(touchA, touchB) || 1;
    const xFactor = 1 + 0.1 * ff * f;
    const yFactor = xFactor * container.clientHeight / container.clientWidth;
    let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
    const origin = {
      x: scale.originX - container.clientWidth / 2 - container.offsetLeft,
      y: scale.originY - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, f);
    node.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.a})`;
    scale.value = mat.d;
    scale.lastHypo = hypo;
    scale.scaling = true;
  }
  function onWheel(e) {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const xFactor = 1 + 0.1 * dir;
    const yFactor = xFactor * container.clientHeight / container.clientWidth;
    let in_x = (container.clientWidth - ratio.width * matrix.vtm.a) / 2;
    let in_y = (container.clientHeight - ratio.height * matrix.vtm.a) / 2;
    console.log({ container });
    const origin = {
      x: e.clientX - container.clientWidth / 2 - container.offsetLeft,
      y: e.clientY - container.clientHeight / 2 - container.offsetTop
    };
    const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    node.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.a})`;
    scale.value = mat.d;
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
    container.removeEventListener("touchmove", onTouchMove);
    container.removeEventListener("touchend", onTouchEnd);
    container.addEventListener("touchmove", onTouchMove);
    container.addEventListener("touchend", onTouchEnd);
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
    container.removeEventListener("touchmove", onTouchMove);
    container.removeEventListener("touchend", onTouchEnd);
    container.removeEventListener("touchcancel", onTouchEnd);
  }
  function onMouseDown({ clientX, clientY }) {
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
    destroy() {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("dragstart", onDragStart);
      container.addEventListener("drag", onDragStart);
      window.removeEventListener("resize", onResize);
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
  child_ctx[9] = list[i];
  child_ctx[11] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[12] = list[i];
  child_ctx[14] = i;
  return child_ctx;
}
function create_if_block(ctx) {
  let div;
  let current;
  let each_value = ctx[6];
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
      if (dirty & 82) {
        each_value = ctx2[6];
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
      left: ctx[4] + ctx[11] * ctx[1].offsetWidth / count,
      top: ctx[4] + ctx[14] * ctx[1].offsetWidth / count
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
      if (dirty & 2)
        spot_changes.left = ctx2[4] + ctx2[11] * ctx2[1].offsetWidth / count;
      if (dirty & 2)
        spot_changes.top = ctx2[4] + ctx2[14] * ctx2[1].offsetWidth / count;
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
  let each_value_1 = ctx[9];
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
      if (dirty & 18) {
        each_value_1 = ctx2[9];
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
  let div4;
  let div2;
  let div0;
  let t0;
  let t1_value = ctx[3].value + "";
  let t1;
  let t2;
  let div1;
  let t3;
  let t4;
  let t5;
  let div3;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[1] && create_if_block(ctx);
  return {
    c() {
      div4 = element("div");
      div2 = element("div");
      div0 = element("div");
      t0 = text("Zoom Level: ");
      t1 = text(t1_value);
      t2 = space();
      div1 = element("div");
      t3 = text("Style: ");
      t4 = text(ctx[2]);
      t5 = space();
      div3 = element("div");
      if (if_block)
        if_block.c();
      this.h();
    },
    l(nodes) {
      div4 = claim_element(nodes, "DIV", { class: true });
      var div4_nodes = children(div4);
      div2 = claim_element(div4_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      div0 = claim_element(div2_nodes, "DIV", {});
      var div0_nodes = children(div0);
      t0 = claim_text(div0_nodes, "Zoom Level: ");
      t1 = claim_text(div0_nodes, t1_value);
      div0_nodes.forEach(detach);
      t2 = claim_space(div2_nodes);
      div1 = claim_element(div2_nodes, "DIV", {});
      var div1_nodes = children(div1);
      t3 = claim_text(div1_nodes, "Style: ");
      t4 = claim_text(div1_nodes, ctx[2]);
      div1_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      t5 = claim_space(div4_nodes);
      div3 = claim_element(div4_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      if (if_block)
        if_block.l(div3_nodes);
      div3_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div2, "class", "menu svelte-1hqdfkj");
      attr(div3, "class", "zoomable flexbox svelte-1hqdfkj");
      attr(div4, "class", "container svelte-1hqdfkj");
    },
    m(target, anchor) {
      insert_hydration(target, div4, anchor);
      append_hydration(div4, div2);
      append_hydration(div2, div0);
      append_hydration(div0, t0);
      append_hydration(div0, t1);
      append_hydration(div2, t2);
      append_hydration(div2, div1);
      append_hydration(div1, t3);
      append_hydration(div1, t4);
      append_hydration(div4, t5);
      append_hydration(div4, div3);
      if (if_block)
        if_block.m(div3, null);
      ctx[7](div3);
      ctx[8](div4);
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(panzoom.call(null, div3)),
          listen(div3, "zoomed", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if ((!current || dirty & 8) && t1_value !== (t1_value = ctx2[3].value + ""))
        set_data(t1, t1_value);
      if (!current || dirty & 4)
        set_data(t4, ctx2[2]);
      if (ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div3, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div4);
      if (if_block)
        if_block.d();
      ctx[7](null);
      ctx[8](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
let count = 10;
function instance($$self, $$props, $$invalidate) {
  let zoomable, container;
  let style = "";
  let scale2 = { value: 1 };
  let min = count;
  function handleZoom(e) {
    console.log("Zoomed.", { detail: e.detail });
    $$invalidate(3, scale2 = e.detail.scale);
    $$invalidate(2, style = zoomable.style.transform);
  }
  const grid = Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_2, j) => ({ id: i * count + j })));
  function div3_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      zoomable = $$value;
      $$invalidate(0, zoomable);
    });
  }
  function div4_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      container = $$value;
      $$invalidate(1, container);
    });
  }
  return [
    zoomable,
    container,
    style,
    scale2,
    min,
    handleZoom,
    grid,
    div3_binding,
    div4_binding
  ];
}
class Routes extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
export { Routes as default };
//# sourceMappingURL=index.svelte-53bc5aea.js.map
