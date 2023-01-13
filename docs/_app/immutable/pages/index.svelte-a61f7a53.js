import { SvelteComponent, init, safe_not_equal, element, claim_element, children, detach, set_style, attr, insert_hydration, noop as noop$1, transition_in, space, claim_space, append_hydration, create_component, claim_component, mount_component, transition_out, destroy_component, check_outros, destroy_each, text, claim_text, listen, action_destroyer, set_data, is_function, run_all, group_outros, binding_callbacks } from "../chunks/index-14381ffc.js";
class Pointer {
  constructor(nativePointer) {
    this.id = -1;
    this.nativePointer = nativePointer;
    this.pageX = nativePointer.pageX;
    this.pageY = nativePointer.pageY;
    this.clientX = nativePointer.clientX;
    this.clientY = nativePointer.clientY;
    if (self.Touch && nativePointer instanceof Touch) {
      this.id = nativePointer.identifier;
    } else if (isPointerEvent(nativePointer)) {
      this.id = nativePointer.pointerId;
    }
  }
  getCoalesced() {
    if ("getCoalescedEvents" in this.nativePointer) {
      const events = this.nativePointer.getCoalescedEvents().map((p) => new Pointer(p));
      if (events.length > 0)
        return events;
    }
    return [this];
  }
}
const isPointerEvent = (event) => "pointerId" in event;
const isTouchEvent = (event) => "changedTouches" in event;
const noop = () => {
};
class PointerTracker {
  constructor(_element, { start = () => true, move = noop, end = noop, rawUpdates = false, avoidPointerEvents = false, eventListenerOptions = { capture: false, passive: false, once: false } } = {}) {
    this._element = _element;
    this.startPointers = [];
    this.currentPointers = [];
    this._excludeFromButtonsCheck = /* @__PURE__ */ new Set();
    this._pointerStart = (event) => {
      if (isPointerEvent(event) && event.buttons === 0) {
        this._excludeFromButtonsCheck.add(event.pointerId);
      } else if (!(event.buttons & 1)) {
        return;
      }
      const pointer = new Pointer(event);
      if (this.currentPointers.some((p) => p.id === pointer.id))
        return;
      if (!this._triggerPointerStart(pointer, event))
        return;
      if (isPointerEvent(event)) {
        const capturingElement = event.target && "setPointerCapture" in event.target ? event.target : this._element;
        capturingElement.setPointerCapture(event.pointerId);
        this._element.addEventListener(this._rawUpdates ? "pointerrawupdate" : "pointermove", this._move, this._eventListenerOptions);
        this._element.addEventListener("pointerup", this._pointerEnd, this._eventListenerOptions);
        this._element.addEventListener("pointercancel", this._pointerEnd, this._eventListenerOptions);
      } else {
        window.addEventListener("mousemove", this._move);
        window.addEventListener("mouseup", this._pointerEnd);
      }
    };
    this._touchStart = (event) => {
      for (const touch of Array.from(event.changedTouches)) {
        this._triggerPointerStart(new Pointer(touch), event);
      }
    };
    this._move = (event) => {
      if (!isTouchEvent(event) && (!isPointerEvent(event) || !this._excludeFromButtonsCheck.has(event.pointerId)) && event.buttons === 0) {
        this._pointerEnd(event);
        return;
      }
      const previousPointers = this.currentPointers.slice();
      const changedPointers = isTouchEvent(event) ? Array.from(event.changedTouches).map((t) => new Pointer(t)) : [new Pointer(event)];
      const trackedChangedPointers = [];
      for (const pointer of changedPointers) {
        const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
        if (index === -1)
          continue;
        trackedChangedPointers.push(pointer);
        this.currentPointers[index] = pointer;
      }
      if (trackedChangedPointers.length === 0)
        return;
      this._moveCallback(previousPointers, trackedChangedPointers, event);
    };
    this._triggerPointerEnd = (pointer, event) => {
      if (!isTouchEvent(event) && event.buttons & 1) {
        return false;
      }
      const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
      if (index === -1)
        return false;
      this.currentPointers.splice(index, 1);
      this.startPointers.splice(index, 1);
      this._excludeFromButtonsCheck.delete(pointer.id);
      const cancelled = !(event.type === "mouseup" || event.type === "touchend" || event.type === "pointerup");
      this._endCallback(pointer, event, cancelled);
      return true;
    };
    this._pointerEnd = (event) => {
      if (!this._triggerPointerEnd(new Pointer(event), event))
        return;
      if (isPointerEvent(event)) {
        if (this.currentPointers.length)
          return;
        this._element.removeEventListener(this._rawUpdates ? "pointerrawupdate" : "pointermove", this._move);
        this._element.removeEventListener("pointerup", this._pointerEnd);
        this._element.removeEventListener("pointercancel", this._pointerEnd);
      } else {
        window.removeEventListener("mousemove", this._move);
        window.removeEventListener("mouseup", this._pointerEnd);
      }
    };
    this._touchEnd = (event) => {
      for (const touch of Array.from(event.changedTouches)) {
        this._triggerPointerEnd(new Pointer(touch), event);
      }
    };
    this._startCallback = start;
    this._moveCallback = move;
    this._endCallback = end;
    this._rawUpdates = rawUpdates && "onpointerrawupdate" in window;
    this._eventListenerOptions = eventListenerOptions;
    if (self.PointerEvent && !avoidPointerEvents) {
      this._element.addEventListener("pointerdown", this._pointerStart, this._eventListenerOptions);
    } else {
      this._element.addEventListener("mousedown", this._pointerStart, this._eventListenerOptions);
      this._element.addEventListener("touchstart", this._touchStart, this._eventListenerOptions);
      this._element.addEventListener("touchmove", this._move, this._eventListenerOptions);
      this._element.addEventListener("touchend", this._touchEnd, this._eventListenerOptions);
      this._element.addEventListener("touchcancel", this._touchEnd, this._eventListenerOptions);
    }
  }
  stop() {
    this._element.removeEventListener("pointerdown", this._pointerStart);
    this._element.removeEventListener("mousedown", this._pointerStart);
    this._element.removeEventListener("touchstart", this._touchStart);
    this._element.removeEventListener("touchmove", this._move);
    this._element.removeEventListener("touchend", this._touchEnd);
    this._element.removeEventListener("touchcancel", this._touchEnd);
    this._element.removeEventListener(this._rawUpdates ? "pointerrawupdate" : "pointermove", this._move);
    this._element.removeEventListener("pointerup", this._pointerEnd);
    this._element.removeEventListener("pointercancel", this._pointerEnd);
    window.removeEventListener("mousemove", this._move);
    window.removeEventListener("mouseup", this._pointerEnd);
  }
  _triggerPointerStart(pointer, event) {
    if (!this._startCallback(pointer, event))
      return false;
    this.currentPointers.push(pointer);
    this.startPointers.push(pointer);
    return true;
  }
}
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
  return new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}
function createPoint() {
  return new DOMPoint();
}
const MIN_SCALE = 0.01;
class PinchZoom {
  constructor(node, { panAnywhere, handle } = {}) {
    this._transform = createMatrix();
    this._handle = null;
    this._node = node;
    this._parentEl = this._node.parentElement || document.body;
    this._handle = handle;
    new MutationObserver(() => this._stageElChange()).observe(this._node, { childList: true });
    this._pointerTracker = new PointerTracker(this._parentEl, {
      eventListenerOptions: {
        capture: false
      },
      start: (pointer, event) => {
        if (this._pointerTracker.currentPointers.length === 0 && (event.target instanceof HTMLInputElement || event.target.isContentEditable)) {
          return false;
        }
        if (this._pointerTracker.currentPointers.length === 2 || !this._parentEl)
          return false;
        if (event.target.closest("[data-no-pan]"))
          return false;
        if (this._pointerTracker.currentPointers.length === 1) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        if (this._pointerTracker.currentPointers.length === 0) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        return false;
      },
      move: (previousPointers, changedPointers, event) => {
        if (this._pointerTracker.currentPointers.length === 0)
          return;
        if (!panAnywhere && this._pointerTracker.currentPointers.length === 1 && !(event.target == this._parentEl || event.target == node))
          return;
        event.preventDefault();
        event.stopPropagation();
        this._onPointerMove(previousPointers, this._pointerTracker.currentPointers);
      },
      end: (pointer, event, cancelled) => {
      }
    });
    this._parentEl.addEventListener("wheel", (event) => this._onWheel(event));
  }
  static get observedAttributes() {
    return [minScaleAttr];
  }
  destroy() {
    this._pointerTracker.stop();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === minScaleAttr) {
      if (this.scale < this.minScale) {
        this.setTransform({ scale: this.minScale });
      }
    }
  }
  get minScale() {
    const attrValue = this._node.getAttribute(minScaleAttr);
    if (!attrValue)
      return MIN_SCALE;
    const value = parseFloat(attrValue);
    if (Number.isFinite(value))
      return Math.max(MIN_SCALE, value);
    return MIN_SCALE;
  }
  set minScale(value) {
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
  scaleTo(scale, opts = {}) {
    let { originX = 0, originY = 0 } = opts;
    const { relativeTo = "content", allowChangeEvent = false } = opts;
    const relativeToEl = relativeTo === "content" ? this._parentEl : this._node;
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
    const thisBounds = this._node.getBoundingClientRect();
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
    this._node.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    if (allowChangeEvent) {
      const event = new Event("change", { bubbles: true });
      this._node.dispatchEvent(event);
    }
  }
  _stageElChange() {
    this._parentEl = this._node.parentElement || document.body;
    this.setTransform({ allowChangeEvent: true });
  }
  _onWheel(event) {
    if (!this._parentEl)
      return;
    event.preventDefault();
    this._parentEl.getBoundingClientRect();
    let { deltaY } = event;
    const { ctrlKey, deltaMode } = event;
    if (deltaMode === 1) {
      deltaY *= 15;
    }
    const divisor = ctrlKey ? 200 : 600;
    const scaleDiff = 1 - deltaY / divisor;
    this._applyChange({
      scaleDiff,
      originX: event.pageX - this._parentEl.offsetLeft - this._parentEl.clientWidth / 2,
      originY: event.pageY - this._parentEl.offsetTop - this._parentEl.clientHeight / 2,
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
const pzoom = (node, params) => {
  console.log({ params });
  let container = node.parentElement || document.body;
  container.style["touch-action"] = "none";
  container.style["user-select"] = "none";
  container.style["overflow"] = "hidden";
  container.style["position"] = "relative";
  node.style["touch-action"] = "none";
  node.style["user-select"] = "none";
  node.style["position"] = "absolute";
  node.style.width = "100%";
  node.style.height = "100%";
  let zoomer = new PinchZoom(node, {
    handle: params == null ? void 0 : params.handle,
    panAnywhere: params == null ? void 0 : params.panAnywhere
  });
  node.addEventListener("home", handleScaleToHome);
  node.addEventListener("scaleTo", handleScaleTo);
  node.addEventListener("change", handleScaleChange);
  node.addEventListener("setTransform", handleSetTransform);
  function handleScaleTo(val) {
    zoomer.scaleTo(val, { allowChangeEvent: true });
  }
  function handleScaleToHome(e) {
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
    node.dispatchEvent(new CustomEvent("scale", {
      detail: { scale }
    }));
  }
  return {
    update(params2) {
      zoomer.destroy();
      zoomer = new PinchZoom(node, {
        handle: params2 == null ? void 0 : params2.handle,
        panAnywhere: params2 == null ? void 0 : params2.panAnywhere
      });
    },
    destroy() {
      zoomer.destroy();
      node.removeEventListener("home", handleScaleToHome);
      node.removeEventListener("change", handleScaleChange);
      node.removeEventListener("scaleTo", handleScaleTo);
      node.removeEventListener("setTransform", handleSetTransform);
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
    i: noop$1,
    o: noop$1,
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
var RangePips_svelte_svelte_type_style_lang = "";
var RangeSlider_svelte_svelte_type_style_lang = "";
var index_svelte_svelte_type_style_lang = "";
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[13] = list[i];
  child_ctx[15] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[16] = list[i];
  child_ctx[18] = i;
  return child_ctx;
}
function create_if_block(ctx) {
  let div;
  let current;
  let each_value = ctx[5];
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
      if (dirty & 52) {
        each_value = ctx2[5];
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
      left: ctx[4] + ctx[15] * ctx[2].offsetWidth / count,
      top: ctx[4] + ctx[18] * ctx[2].offsetWidth / count
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
        spot_changes.left = ctx2[4] + ctx2[15] * ctx2[2].offsetWidth / count;
      if (dirty & 4)
        spot_changes.top = ctx2[4] + ctx2[18] * ctx2[2].offsetWidth / count;
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
  let each_value_1 = ctx[13];
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
      if (dirty & 20) {
        each_value_1 = ctx2[13];
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
  let h20;
  let t4;
  let t5;
  let p1;
  let t6;
  let t7;
  let div4;
  let div2;
  let div1;
  let button;
  let t8;
  let t9;
  let br;
  let t10;
  let t11;
  let t12;
  let div3;
  let t13;
  let h21;
  let t14;
  let t15;
  let div7;
  let div6;
  let div5;
  let t16;
  let span;
  let t17;
  let pzoom_action_1;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[2] && create_if_block(ctx);
  return {
    c() {
      div0 = element("div");
      h1 = element("h1");
      t0 = text("Pan and Zoom");
      t1 = space();
      p0 = element("p");
      t2 = text("Try out the mouse wheel scroll in the red box below");
      t3 = space();
      h20 = element("h2");
      t4 = text("Inside");
      t5 = space();
      p1 = element("p");
      t6 = text("Inside the red box should pan and zoom");
      t7 = space();
      div4 = element("div");
      div2 = element("div");
      div1 = element("div");
      button = element("button");
      t8 = text("Reset Zoom");
      t9 = space();
      br = element("br");
      t10 = text("Zoom Level: ");
      t11 = text(ctx[1]);
      t12 = space();
      div3 = element("div");
      if (if_block)
        if_block.c();
      t13 = space();
      h21 = element("h2");
      t14 = text("Using Handle (WIP)");
      t15 = space();
      div7 = element("div");
      div6 = element("div");
      div5 = element("div");
      t16 = text("Drag me by my handle:\n			");
      span = element("span");
      t17 = text("Handle");
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
      h20 = claim_element(div0_nodes, "H2", {});
      var h20_nodes = children(h20);
      t4 = claim_text(h20_nodes, "Inside");
      h20_nodes.forEach(detach);
      t5 = claim_space(div0_nodes);
      p1 = claim_element(div0_nodes, "P", {});
      var p1_nodes = children(p1);
      t6 = claim_text(p1_nodes, "Inside the red box should pan and zoom");
      p1_nodes.forEach(detach);
      div0_nodes.forEach(detach);
      t7 = claim_space(nodes);
      div4 = claim_element(nodes, "DIV", { class: true });
      var div4_nodes = children(div4);
      div2 = claim_element(div4_nodes, "DIV", { class: true });
      var div2_nodes = children(div2);
      div1 = claim_element(div2_nodes, "DIV", {});
      var div1_nodes = children(div1);
      button = claim_element(div1_nodes, "BUTTON", {});
      var button_nodes = children(button);
      t8 = claim_text(button_nodes, "Reset Zoom");
      button_nodes.forEach(detach);
      t9 = claim_space(div1_nodes);
      br = claim_element(div1_nodes, "BR", {});
      t10 = claim_text(div1_nodes, "Zoom Level: ");
      t11 = claim_text(div1_nodes, ctx[1]);
      div1_nodes.forEach(detach);
      div2_nodes.forEach(detach);
      t12 = claim_space(div4_nodes);
      div3 = claim_element(div4_nodes, "DIV", { class: true });
      var div3_nodes = children(div3);
      if (if_block)
        if_block.l(div3_nodes);
      div3_nodes.forEach(detach);
      div4_nodes.forEach(detach);
      t13 = claim_space(nodes);
      h21 = claim_element(nodes, "H2", {});
      var h21_nodes = children(h21);
      t14 = claim_text(h21_nodes, "Using Handle (WIP)");
      h21_nodes.forEach(detach);
      t15 = claim_space(nodes);
      div7 = claim_element(nodes, "DIV", { style: true });
      var div7_nodes = children(div7);
      div6 = claim_element(div7_nodes, "DIV", { style: true });
      var div6_nodes = children(div6);
      div5 = claim_element(div6_nodes, "DIV", { style: true });
      var div5_nodes = children(div5);
      t16 = claim_text(div5_nodes, "Drag me by my handle:\n			");
      span = claim_element(div5_nodes, "SPAN", {});
      var span_nodes = children(span);
      t17 = claim_text(span_nodes, "Handle");
      span_nodes.forEach(detach);
      div5_nodes.forEach(detach);
      div6_nodes.forEach(detach);
      div7_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div2, "class", "menu svelte-244pp5");
      attr(div3, "class", "zoomable flexbox svelte-244pp5");
      attr(div4, "class", "container svelte-244pp5");
      set_style(div5, "box-shadow", "2px 2px 19px #e0e0e0");
      set_style(div5, "-o-box-shadow", "2px 2px 19px #e0e0e0");
      set_style(div5, "-webkit-box-shadow", "2px 2px 19px #e0e0e0");
      set_style(div5, "-moz-box-shadow", "2px 2px 19px #e0e0e0");
      set_style(div5, "-moz-border-radius", "8px");
      set_style(div5, "border-radius", "8px");
      set_style(div5, "background-color", "rgba(250, 128, 114, 0.418)");
      set_style(div5, "width", "200px");
      set_style(div5, "height", "200px");
      set_style(div5, "padding", "1em");
      set_style(div5, "left", "100px");
      set_style(div5, "top", "10px");
      set_style(div6, "height", "600px");
      set_style(div6, "width", "600px");
      set_style(div6, "border", "1px solid salmon");
      set_style(div7, "height", "600px");
    },
    m(target, anchor) {
      insert_hydration(target, div0, anchor);
      append_hydration(div0, h1);
      append_hydration(h1, t0);
      append_hydration(div0, t1);
      append_hydration(div0, p0);
      append_hydration(p0, t2);
      append_hydration(div0, t3);
      append_hydration(div0, h20);
      append_hydration(h20, t4);
      append_hydration(div0, t5);
      append_hydration(div0, p1);
      append_hydration(p1, t6);
      insert_hydration(target, t7, anchor);
      insert_hydration(target, div4, anchor);
      append_hydration(div4, div2);
      append_hydration(div2, div1);
      append_hydration(div1, button);
      append_hydration(button, t8);
      append_hydration(div1, t9);
      append_hydration(div1, br);
      append_hydration(div1, t10);
      append_hydration(div1, t11);
      append_hydration(div4, t12);
      append_hydration(div4, div3);
      if (if_block)
        if_block.m(div3, null);
      ctx[8](div3);
      ctx[9](div4);
      insert_hydration(target, t13, anchor);
      insert_hydration(target, h21, anchor);
      append_hydration(h21, t14);
      insert_hydration(target, t15, anchor);
      insert_hydration(target, div7, anchor);
      append_hydration(div7, div6);
      append_hydration(div6, div5);
      append_hydration(div5, t16);
      append_hydration(div5, span);
      append_hydration(span, t17);
      ctx[10](span);
      current = true;
      if (!mounted) {
        dispose = [
          listen(button, "click", ctx[6]),
          action_destroyer(pzoom.call(null, div3, { panAnywhere: true })),
          listen(div3, "scale", ctx[7]),
          action_destroyer(pzoom_action_1 = pzoom.call(null, div5, { handle: ctx[3] }))
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & 2)
        set_data(t11, ctx2[1]);
      if (ctx2[2]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 4) {
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
      if (pzoom_action_1 && is_function(pzoom_action_1.update) && dirty & 8)
        pzoom_action_1.update.call(null, { handle: ctx2[3] });
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
        detach(div0);
      if (detaching)
        detach(t7);
      if (detaching)
        detach(div4);
      if (if_block)
        if_block.d();
      ctx[8](null);
      ctx[9](null);
      if (detaching)
        detach(t13);
      if (detaching)
        detach(h21);
      if (detaching)
        detach(t15);
      if (detaching)
        detach(div7);
      ctx[10](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
let count = 10;
function instance($$self, $$props, $$invalidate) {
  let zoomable, container;
  let handle;
  let scale = 1;
  let min = count;
  const grid = Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_2, j) => ({ id: i * count + j })));
  function goHome(e) {
    zoomable.dispatchEvent(new CustomEvent("home"));
  }
  const handleScaleChg = (e) => {
    $$invalidate(1, scale = e.detail.scale);
    console.log("scale changed", scale);
  };
  function div3_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      zoomable = $$value;
      $$invalidate(0, zoomable);
    });
  }
  function div4_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      container = $$value;
      $$invalidate(2, container);
    });
  }
  function span_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      handle = $$value;
      $$invalidate(3, handle);
    });
  }
  $$self.$$.update = () => {
    var _a;
    if ($$self.$$.dirty & 2)
      ;
    if ($$self.$$.dirty & 1) {
      if ((_a = zoomable == null ? void 0 : zoomable.style) == null ? void 0 : _a.transform)
        console.log({ zoomable: zoomable.style.transform });
    }
  };
  return [
    zoomable,
    scale,
    container,
    handle,
    min,
    grid,
    goHome,
    handleScaleChg,
    div3_binding,
    div4_binding,
    span_binding
  ];
}
class Routes extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
export { Routes as default };
//# sourceMappingURL=index.svelte-a61f7a53.js.map
