import { PointerTracker, SvelteComponent, init, safe_not_equal, element, claim_element, children, detach, set_style, attr, insert_hydration, noop, create_component, claim_component, mount_component, add_flush_callback, transition_in, transition_out, destroy_component, space, claim_space, append_hydration, check_outros, destroy_each, text, claim_text, action_destroyer, listen, set_data, run_all, RangeSlider, binding_callbacks, bind, group_outros } from "../chunks/vendor-284fb475.js";
var styles = "";
const minScaleAttr = "min-scale";
function getDistance(a, b) {
  if (!b)
    return 0;
  return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
}
function getMidpoint(a, b) {
  if (!b)
    return a;
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
  };
}
function getAbsoluteValue(value, max) {
  if (typeof value === "number")
    return value;
  if (value.trimRight().endsWith("%")) {
    return max * parseFloat(value) / 100;
  }
  return parseFloat(value);
}
function createMatrix() {
  return new DOMMatrix();
}
function createPoint() {
  return new DOMPoint();
}
const MIN_SCALE = 0.01;
class PinchZoom {
  constructor(node) {
    this._transform = createMatrix();
    this.node = node;
    this._parentEl = this.node.parentElement || document.body;
    new MutationObserver(() => this._stageElChange()).observe(this.node, { childList: true });
    const pointerTracker = new PointerTracker(this._parentEl, {
      eventListenerOptions: { capture: true },
      start: (pointer, event2) => {
        console.log("PanZoom Start", { pointer }, pointerTracker.currentPointers.length);
        if (pointerTracker.currentPointers.length === 2 || !this._parentEl) {
          return false;
        } else {
          event2.preventDefault();
          event2.stopPropagation();
          return true;
        }
      },
      move: (previousPointers) => {
        event.stopPropagation();
        this._onPointerMove(previousPointers, pointerTracker.currentPointers);
      }
    });
    this._parentEl.addEventListener("wheel", (event2) => this._onWheel(event2));
  }
  static get observedAttributes() {
    return [minScaleAttr];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === minScaleAttr) {
      if (this.scale < this.minScale) {
        this.setTransform({ scale: this.minScale });
      }
    }
  }
  get minScale() {
    const attrValue = this.node.getAttribute(minScaleAttr);
    if (!attrValue)
      return MIN_SCALE;
    const value = parseFloat(attrValue);
    if (Number.isFinite(value))
      return Math.max(MIN_SCALE, value);
    return MIN_SCALE;
  }
  set minScale(value) {
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
  scaleTo(scale, opts = {}) {
    let { originX = 0, originY = 0 } = opts;
    const { relativeTo = "content", allowChangeEvent = false } = opts;
    const relativeToEl = relativeTo === "content" ? this._parentEl : this.node;
    if (!relativeToEl || !this._parentEl) {
      this.setTransform({ scale, allowChangeEvent });
      return;
    }
    const rect = relativeToEl.getBoundingClientRect();
    originX = getAbsoluteValue(originX, rect.width);
    originY = getAbsoluteValue(originY, rect.height);
    if (relativeTo === "content") {
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
  setTransform(opts = {}) {
    const { scale = this.scale, allowChangeEvent = false } = opts;
    let { x = this.x, y = this.y } = opts;
    if (!this._parentEl) {
      this._updateTransform(scale, x, y, allowChangeEvent);
      return;
    }
    const thisBounds = this.node.getBoundingClientRect();
    const parentElBounds = this._parentEl.getBoundingClientRect();
    if (!thisBounds.width || !thisBounds.height) {
      this._updateTransform(scale, x, y, allowChangeEvent);
      return;
    }
    let topLeft = createPoint();
    topLeft.x = parentElBounds.left - thisBounds.left;
    topLeft.y = parentElBounds.top - thisBounds.top;
    let bottomRight = createPoint();
    bottomRight.x = parentElBounds.width + topLeft.x;
    bottomRight.y = parentElBounds.height + topLeft.y;
    const matrix = createMatrix().translate(x, y).scale(scale).multiply(this._transform.inverse());
    topLeft = topLeft.matrixTransform(matrix);
    bottomRight = bottomRight.matrixTransform(matrix);
    this._updateTransform(scale, x, y, allowChangeEvent);
  }
  _updateTransform(scale, x, y, allowChangeEvent) {
    if (scale < this.minScale)
      return;
    if (scale === this.scale && x === this.x && y === this.y)
      return;
    this._transform.e = x;
    this._transform.f = y;
    this._transform.d = this._transform.a = scale;
    this.node.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    if (allowChangeEvent) {
      const event2 = new Event("change", { bubbles: true });
      this.node.dispatchEvent(event2);
    }
  }
  _stageElChange() {
    this._parentEl = this.node.parentElement || document.body;
    this.setTransform({ allowChangeEvent: true });
  }
  _onWheel(event2) {
    if (!this._parentEl)
      return;
    event2.preventDefault();
    this._parentEl.getBoundingClientRect();
    let { deltaY } = event2;
    const { ctrlKey, deltaMode } = event2;
    if (deltaMode === 1) {
      deltaY *= 15;
    }
    const divisor = ctrlKey ? 200 : 600;
    const scaleDiff = 1 - deltaY / divisor;
    this._applyChange({
      scaleDiff,
      originX: event2.pageX - this._parentEl.offsetLeft - this._parentEl.clientWidth / 2,
      originY: event2.pageY - this._parentEl.offsetTop - this._parentEl.clientHeight / 2,
      allowChangeEvent: true
    });
  }
  _onPointerMove(previousPointers, currentPointers) {
    if (!this._parentEl)
      return;
    const currentRect = this._parentEl.getBoundingClientRect();
    const prevMidpoint = getMidpoint(previousPointers[0], previousPointers[1]);
    const newMidpoint = getMidpoint(currentPointers[0], currentPointers[1]);
    const originX = prevMidpoint.clientX - currentRect.left - currentRect.width / 2;
    const originY = prevMidpoint.clientY - currentRect.top - currentRect.height / 2;
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
  _applyChange(opts = {}) {
    const {
      panX = 0,
      panY = 0,
      originX = 0,
      originY = 0,
      scaleDiff = 1,
      allowChangeEvent = false
    } = opts;
    const matrix = createMatrix().translate(panX, panY).translate(originX, originY).scale(scaleDiff).translate(-originX, -originY).multiply(this._transform);
    this.setTransform({
      allowChangeEvent,
      scale: matrix.a,
      x: matrix.e,
      y: matrix.f
    });
  }
}
const pzoom = (node, params = {}) => {
  let container = node.parentElement || document.body;
  container.style["touch-action"] = "none";
  container.style["user-select"] = "none";
  container.style["overflow"] = "hidden";
  container.style["position"] = "relative";
  node.style["touch-action"] = "none";
  node.style["user-select"] = "none";
  node.style["position"] = "absolute";
  new PinchZoom(node);
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
          action_destroyer(pzoom.call(null, div4)),
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
//# sourceMappingURL=index.svelte-4d37f6c7.js.map
