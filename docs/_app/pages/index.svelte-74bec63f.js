import { SvelteComponent, init, safe_not_equal, element, claim_element, children, detach, set_style, attr, insert_hydration, noop as noop$1, now, loop, toggle_class, listen, is_function, prevent_default, text, claim_text, append_hydration, set_data, run_all, empty, space, claim_space, destroy_each, create_component, claim_component, mount_component, transition_in, transition_out, destroy_component, group_outros, check_outros, createEventDispatcher, subscribe, binding_callbacks, add_flush_callback, action_destroyer, bind } from "../chunks/index-21dc824a.js";
import { writable } from "../chunks/index-eb09cf72.js";
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
        const index2 = this.currentPointers.findIndex((p) => p.id === pointer.id);
        if (index2 === -1)
          continue;
        trackedChangedPointers.push(pointer);
        this.currentPointers[index2] = pointer;
      }
      if (trackedChangedPointers.length === 0)
        return;
      this._moveCallback(previousPointers, trackedChangedPointers, event);
    };
    this._triggerPointerEnd = (pointer, event) => {
      if (!isTouchEvent(event) && event.buttons & 1) {
        return false;
      }
      const index2 = this.currentPointers.findIndex((p) => p.id === pointer.id);
      if (index2 === -1)
        return false;
      this.currentPointers.splice(index2, 1);
      this.startPointers.splice(index2, 1);
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
  return new DOMMatrix();
}
function createPoint() {
  return new DOMPoint();
}
const MIN_SCALE = 0.01;
class PinchZoom {
  constructor(node) {
    this._transform = createMatrix();
    this._node = node;
    this._parentEl = this._node.parentElement || document.body;
    new MutationObserver(() => this._stageElChange()).observe(this._node, { childList: true });
    this._pointerTracker = new PointerTracker(this._parentEl, {
      eventListenerOptions: { capture: true },
      start: (pointer, event) => {
        if (this._pointerTracker.currentPointers.length === 0 && (event.target instanceof HTMLInputElement || event.target.isContentEditable)) {
          return false;
        }
        if (this._pointerTracker.currentPointers.length === 2 || !this._parentEl)
          return false;
        event.preventDefault();
        if (this._pointerTracker.currentPointers.length === 1) {
          event.stopPropagation();
          return true;
        }
        if (this._pointerTracker.currentPointers.length === 0) {
          return true;
        }
      },
      move: (previousPointers, changedPointers, event) => {
        if (this._pointerTracker.currentPointers.length === 0)
          return;
        if (this._pointerTracker.currentPointers.length === 1 && !(event.target == this._parentEl || event.target == node))
          return;
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
function create_fragment$3(ctx) {
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
function instance$3($$self, $$props, $$invalidate) {
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
    init(this, options, instance$3, create_fragment$3, safe_not_equal, { left: 0, top: 1 });
  }
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number" || is_date(current_value)) {
    const delta = target_value - current_value;
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
    const spring2 = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring2 - damper) * ctx.inv_mass;
    const d = (velocity + acceleration) * ctx.dt;
    if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
      return target_value;
    } else {
      ctx.settled = false;
      return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
    }
  } else if (Array.isArray(current_value)) {
    return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
  } else if (typeof current_value === "object") {
    const next_value = {};
    for (const k in current_value) {
      next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
    }
    return next_value;
  } else {
    throw new Error(`Cannot spring ${typeof current_value} values`);
  }
}
function spring(value, opts = {}) {
  const store = writable(value);
  const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
  let last_time;
  let task;
  let current_token;
  let last_value = value;
  let target_value = value;
  let inv_mass = 1;
  let inv_mass_recovery_rate = 0;
  let cancel_task = false;
  function set(new_value, opts2 = {}) {
    target_value = new_value;
    const token = current_token = {};
    if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
      cancel_task = true;
      last_time = now();
      last_value = new_value;
      store.set(value = target_value);
      return Promise.resolve();
    } else if (opts2.soft) {
      const rate = opts2.soft === true ? 0.5 : +opts2.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0;
    }
    if (!task) {
      last_time = now();
      cancel_task = false;
      task = loop((now2) => {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        const ctx = {
          inv_mass,
          opts: spring2,
          settled: true,
          dt: (now2 - last_time) * 60 / 1e3
        };
        const next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now2;
        last_value = value;
        store.set(value = next_value);
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    return new Promise((fulfil) => {
      task.promise.then(() => {
        if (token === current_token)
          fulfil();
      });
    });
  }
  const spring2 = {
    set,
    update: (fn, opts2) => set(fn(target_value, value), opts2),
    subscribe: store.subscribe,
    stiffness,
    damping,
    precision
  };
  return spring2;
}
var RangePips_svelte_svelte_type_style_lang = "";
function get_each_context$2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[28] = list[i];
  child_ctx[30] = i;
  return child_ctx;
}
function create_if_block_9(ctx) {
  let span;
  let span_style_value;
  let mounted;
  let dispose;
  let if_block = (ctx[6] === "label" || ctx[7] === "label") && create_if_block_10(ctx);
  return {
    c() {
      span = element("span");
      if (if_block)
        if_block.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true, style: true });
      var span_nodes = children(span);
      if (if_block)
        if_block.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pip first");
      attr(span, "style", span_style_value = ctx[14] + ": 0%;");
      toggle_class(span, "selected", ctx[18](ctx[0]));
      toggle_class(span, "in-range", ctx[17](ctx[0]));
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block)
        if_block.m(span, null);
      if (!mounted) {
        dispose = [
          listen(span, "click", function() {
            if (is_function(ctx[21](ctx[0])))
              ctx[21](ctx[0]).apply(this, arguments);
          }),
          listen(span, "touchend", prevent_default(function() {
            if (is_function(ctx[21](ctx[0])))
              ctx[21](ctx[0]).apply(this, arguments);
          }))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (ctx[6] === "label" || ctx[7] === "label") {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_10(ctx);
          if_block.c();
          if_block.m(span, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 16384 && span_style_value !== (span_style_value = ctx[14] + ": 0%;")) {
        attr(span, "style", span_style_value);
      }
      if (dirty & 262145) {
        toggle_class(span, "selected", ctx[18](ctx[0]));
      }
      if (dirty & 131073) {
        toggle_class(span, "in-range", ctx[17](ctx[0]));
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_10(ctx) {
  let span;
  let t_value = ctx[12](ctx[16](ctx[0]), 0, 0) + "";
  let t;
  let if_block0 = ctx[10] && create_if_block_12(ctx);
  let if_block1 = ctx[11] && create_if_block_11(ctx);
  return {
    c() {
      span = element("span");
      if (if_block0)
        if_block0.c();
      t = text(t_value);
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      if (if_block0)
        if_block0.l(span_nodes);
      t = claim_text(span_nodes, t_value);
      if (if_block1)
        if_block1.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block0)
        if_block0.m(span, null);
      append_hydration(span, t);
      if (if_block1)
        if_block1.m(span, null);
    },
    p(ctx2, dirty) {
      if (ctx2[10]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_12(ctx2);
          if_block0.c();
          if_block0.m(span, t);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 69633 && t_value !== (t_value = ctx2[12](ctx2[16](ctx2[0]), 0, 0) + ""))
        set_data(t, t_value);
      if (ctx2[11]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_11(ctx2);
          if_block1.c();
          if_block1.m(span, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_12(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[10]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[10]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-prefix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 1024)
        set_data(t, ctx2[10]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block_11(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[11]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[11]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-suffix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 2048)
        set_data(t, ctx2[11]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block_4$1(ctx) {
  let each_1_anchor;
  let each_value = Array(ctx[20] + 1);
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    l(nodes) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].l(nodes);
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert_hydration(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 4120131) {
        each_value = Array(ctx2[20] + 1);
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$2(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_if_block_5(ctx) {
  let span;
  let t;
  let span_style_value;
  let mounted;
  let dispose;
  let if_block = (ctx[6] === "label" || ctx[9] === "label") && create_if_block_6(ctx);
  return {
    c() {
      span = element("span");
      if (if_block)
        if_block.c();
      t = space();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true, style: true });
      var span_nodes = children(span);
      if (if_block)
        if_block.l(span_nodes);
      t = claim_space(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pip");
      attr(span, "style", span_style_value = ctx[14] + ": " + ctx[15](ctx[19](ctx[30])) + "%;");
      toggle_class(span, "selected", ctx[18](ctx[19](ctx[30])));
      toggle_class(span, "in-range", ctx[17](ctx[19](ctx[30])));
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block)
        if_block.m(span, null);
      append_hydration(span, t);
      if (!mounted) {
        dispose = [
          listen(span, "click", function() {
            if (is_function(ctx[21](ctx[19](ctx[30]))))
              ctx[21](ctx[19](ctx[30])).apply(this, arguments);
          }),
          listen(span, "touchend", prevent_default(function() {
            if (is_function(ctx[21](ctx[19](ctx[30]))))
              ctx[21](ctx[19](ctx[30])).apply(this, arguments);
          }))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (ctx[6] === "label" || ctx[9] === "label") {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_6(ctx);
          if_block.c();
          if_block.m(span, t);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 573440 && span_style_value !== (span_style_value = ctx[14] + ": " + ctx[15](ctx[19](ctx[30])) + "%;")) {
        attr(span, "style", span_style_value);
      }
      if (dirty & 786432) {
        toggle_class(span, "selected", ctx[18](ctx[19](ctx[30])));
      }
      if (dirty & 655360) {
        toggle_class(span, "in-range", ctx[17](ctx[19](ctx[30])));
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_6(ctx) {
  let span;
  let t_value = ctx[12](ctx[19](ctx[30]), ctx[30], ctx[15](ctx[19](ctx[30]))) + "";
  let t;
  let if_block0 = ctx[10] && create_if_block_8(ctx);
  let if_block1 = ctx[11] && create_if_block_7(ctx);
  return {
    c() {
      span = element("span");
      if (if_block0)
        if_block0.c();
      t = text(t_value);
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      if (if_block0)
        if_block0.l(span_nodes);
      t = claim_text(span_nodes, t_value);
      if (if_block1)
        if_block1.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block0)
        if_block0.m(span, null);
      append_hydration(span, t);
      if (if_block1)
        if_block1.m(span, null);
    },
    p(ctx2, dirty) {
      if (ctx2[10]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_8(ctx2);
          if_block0.c();
          if_block0.m(span, t);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 561152 && t_value !== (t_value = ctx2[12](ctx2[19](ctx2[30]), ctx2[30], ctx2[15](ctx2[19](ctx2[30]))) + ""))
        set_data(t, t_value);
      if (ctx2[11]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_7(ctx2);
          if_block1.c();
          if_block1.m(span, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_8(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[10]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[10]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-prefix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 1024)
        set_data(t, ctx2[10]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block_7(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[11]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[11]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-suffix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 2048)
        set_data(t, ctx2[11]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_each_block$2(ctx) {
  let show_if = ctx[19](ctx[30]) !== ctx[0] && ctx[19](ctx[30]) !== ctx[1];
  let if_block_anchor;
  let if_block = show_if && create_if_block_5(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    l(nodes) {
      if (if_block)
        if_block.l(nodes);
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert_hydration(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 524291)
        show_if = ctx2[19](ctx2[30]) !== ctx2[0] && ctx2[19](ctx2[30]) !== ctx2[1];
      if (show_if) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_5(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block$2(ctx) {
  let span;
  let span_style_value;
  let mounted;
  let dispose;
  let if_block = (ctx[6] === "label" || ctx[8] === "label") && create_if_block_1$2(ctx);
  return {
    c() {
      span = element("span");
      if (if_block)
        if_block.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true, style: true });
      var span_nodes = children(span);
      if (if_block)
        if_block.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pip last");
      attr(span, "style", span_style_value = ctx[14] + ": 100%;");
      toggle_class(span, "selected", ctx[18](ctx[1]));
      toggle_class(span, "in-range", ctx[17](ctx[1]));
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block)
        if_block.m(span, null);
      if (!mounted) {
        dispose = [
          listen(span, "click", function() {
            if (is_function(ctx[21](ctx[1])))
              ctx[21](ctx[1]).apply(this, arguments);
          }),
          listen(span, "touchend", prevent_default(function() {
            if (is_function(ctx[21](ctx[1])))
              ctx[21](ctx[1]).apply(this, arguments);
          }))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (ctx[6] === "label" || ctx[8] === "label") {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_1$2(ctx);
          if_block.c();
          if_block.m(span, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 16384 && span_style_value !== (span_style_value = ctx[14] + ": 100%;")) {
        attr(span, "style", span_style_value);
      }
      if (dirty & 262146) {
        toggle_class(span, "selected", ctx[18](ctx[1]));
      }
      if (dirty & 131074) {
        toggle_class(span, "in-range", ctx[17](ctx[1]));
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1$2(ctx) {
  let span;
  let t_value = ctx[12](ctx[16](ctx[1]), ctx[20], 100) + "";
  let t;
  let if_block0 = ctx[10] && create_if_block_3$1(ctx);
  let if_block1 = ctx[11] && create_if_block_2$1(ctx);
  return {
    c() {
      span = element("span");
      if (if_block0)
        if_block0.c();
      t = text(t_value);
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      if (if_block0)
        if_block0.l(span_nodes);
      t = claim_text(span_nodes, t_value);
      if (if_block1)
        if_block1.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block0)
        if_block0.m(span, null);
      append_hydration(span, t);
      if (if_block1)
        if_block1.m(span, null);
    },
    p(ctx2, dirty) {
      if (ctx2[10]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_3$1(ctx2);
          if_block0.c();
          if_block0.m(span, t);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 1118210 && t_value !== (t_value = ctx2[12](ctx2[16](ctx2[1]), ctx2[20], 100) + ""))
        set_data(t, t_value);
      if (ctx2[11]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_2$1(ctx2);
          if_block1.c();
          if_block1.m(span, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_3$1(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[10]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[10]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-prefix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 1024)
        set_data(t, ctx2[10]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block_2$1(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[11]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[11]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "pipVal-suffix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 2048)
        set_data(t, ctx2[11]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_fragment$2(ctx) {
  let div;
  let t0;
  let t1;
  let if_block0 = (ctx[6] && ctx[7] !== false || ctx[7]) && create_if_block_9(ctx);
  let if_block1 = (ctx[6] && ctx[9] !== false || ctx[9]) && create_if_block_4$1(ctx);
  let if_block2 = (ctx[6] && ctx[8] !== false || ctx[8]) && create_if_block$2(ctx);
  return {
    c() {
      div = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      if (if_block1)
        if_block1.c();
      t1 = space();
      if (if_block2)
        if_block2.c();
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      var div_nodes = children(div);
      if (if_block0)
        if_block0.l(div_nodes);
      t0 = claim_space(div_nodes);
      if (if_block1)
        if_block1.l(div_nodes);
      t1 = claim_space(div_nodes);
      if (if_block2)
        if_block2.l(div_nodes);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", "rangePips");
      toggle_class(div, "disabled", ctx[5]);
      toggle_class(div, "hoverable", ctx[4]);
      toggle_class(div, "vertical", ctx[2]);
      toggle_class(div, "reversed", ctx[3]);
      toggle_class(div, "focus", ctx[13]);
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      if (if_block0)
        if_block0.m(div, null);
      append_hydration(div, t0);
      if (if_block1)
        if_block1.m(div, null);
      append_hydration(div, t1);
      if (if_block2)
        if_block2.m(div, null);
    },
    p(ctx2, [dirty]) {
      if (ctx2[6] && ctx2[7] !== false || ctx2[7]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_9(ctx2);
          if_block0.c();
          if_block0.m(div, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (ctx2[6] && ctx2[9] !== false || ctx2[9]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_4$1(ctx2);
          if_block1.c();
          if_block1.m(div, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (ctx2[6] && ctx2[8] !== false || ctx2[8]) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block$2(ctx2);
          if_block2.c();
          if_block2.m(div, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (dirty & 32) {
        toggle_class(div, "disabled", ctx2[5]);
      }
      if (dirty & 16) {
        toggle_class(div, "hoverable", ctx2[4]);
      }
      if (dirty & 4) {
        toggle_class(div, "vertical", ctx2[2]);
      }
      if (dirty & 8) {
        toggle_class(div, "reversed", ctx2[3]);
      }
      if (dirty & 8192) {
        toggle_class(div, "focus", ctx2[13]);
      }
    },
    i: noop$1,
    o: noop$1,
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let pipStep;
  let pipCount;
  let pipVal;
  let isSelected;
  let inRange;
  let { range: range2 = false } = $$props;
  let { min = 0 } = $$props;
  let { max = 100 } = $$props;
  let { step = 1 } = $$props;
  let { values = [(max + min) / 2] } = $$props;
  let { vertical = false } = $$props;
  let { reversed = false } = $$props;
  let { hoverable = true } = $$props;
  let { disabled = false } = $$props;
  let { pipstep = void 0 } = $$props;
  let { all = true } = $$props;
  let { first = void 0 } = $$props;
  let { last = void 0 } = $$props;
  let { rest = void 0 } = $$props;
  let { prefix = "" } = $$props;
  let { suffix = "" } = $$props;
  let { formatter = (v, i) => v } = $$props;
  let { focus = void 0 } = $$props;
  let { orientationStart = void 0 } = $$props;
  let { percentOf = void 0 } = $$props;
  let { moveHandle = void 0 } = $$props;
  let { fixFloat = void 0 } = $$props;
  function labelClick(val) {
    if (!disabled) {
      moveHandle(void 0, val);
    }
  }
  $$self.$$set = ($$props2) => {
    if ("range" in $$props2)
      $$invalidate(22, range2 = $$props2.range);
    if ("min" in $$props2)
      $$invalidate(0, min = $$props2.min);
    if ("max" in $$props2)
      $$invalidate(1, max = $$props2.max);
    if ("step" in $$props2)
      $$invalidate(23, step = $$props2.step);
    if ("values" in $$props2)
      $$invalidate(24, values = $$props2.values);
    if ("vertical" in $$props2)
      $$invalidate(2, vertical = $$props2.vertical);
    if ("reversed" in $$props2)
      $$invalidate(3, reversed = $$props2.reversed);
    if ("hoverable" in $$props2)
      $$invalidate(4, hoverable = $$props2.hoverable);
    if ("disabled" in $$props2)
      $$invalidate(5, disabled = $$props2.disabled);
    if ("pipstep" in $$props2)
      $$invalidate(25, pipstep = $$props2.pipstep);
    if ("all" in $$props2)
      $$invalidate(6, all = $$props2.all);
    if ("first" in $$props2)
      $$invalidate(7, first = $$props2.first);
    if ("last" in $$props2)
      $$invalidate(8, last = $$props2.last);
    if ("rest" in $$props2)
      $$invalidate(9, rest = $$props2.rest);
    if ("prefix" in $$props2)
      $$invalidate(10, prefix = $$props2.prefix);
    if ("suffix" in $$props2)
      $$invalidate(11, suffix = $$props2.suffix);
    if ("formatter" in $$props2)
      $$invalidate(12, formatter = $$props2.formatter);
    if ("focus" in $$props2)
      $$invalidate(13, focus = $$props2.focus);
    if ("orientationStart" in $$props2)
      $$invalidate(14, orientationStart = $$props2.orientationStart);
    if ("percentOf" in $$props2)
      $$invalidate(15, percentOf = $$props2.percentOf);
    if ("moveHandle" in $$props2)
      $$invalidate(26, moveHandle = $$props2.moveHandle);
    if ("fixFloat" in $$props2)
      $$invalidate(16, fixFloat = $$props2.fixFloat);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 41943047) {
      $$invalidate(27, pipStep = pipstep || ((max - min) / step >= (vertical ? 50 : 100) ? (max - min) / (vertical ? 10 : 20) : 1));
    }
    if ($$self.$$.dirty & 142606339) {
      $$invalidate(20, pipCount = parseInt((max - min) / (step * pipStep), 10));
    }
    if ($$self.$$.dirty & 142671873) {
      $$invalidate(19, pipVal = function(val) {
        return fixFloat(min + val * step * pipStep);
      });
    }
    if ($$self.$$.dirty & 16842752) {
      $$invalidate(18, isSelected = function(val) {
        return values.some((v) => fixFloat(v) === fixFloat(val));
      });
    }
    if ($$self.$$.dirty & 20971520) {
      $$invalidate(17, inRange = function(val) {
        if (range2 === "min") {
          return values[0] > val;
        } else if (range2 === "max") {
          return values[0] < val;
        } else if (range2) {
          return values[0] < val && values[1] > val;
        }
      });
    }
  };
  return [
    min,
    max,
    vertical,
    reversed,
    hoverable,
    disabled,
    all,
    first,
    last,
    rest,
    prefix,
    suffix,
    formatter,
    focus,
    orientationStart,
    percentOf,
    fixFloat,
    inRange,
    isSelected,
    pipVal,
    pipCount,
    labelClick,
    range2,
    step,
    values,
    pipstep,
    moveHandle,
    pipStep
  ];
}
class RangePips extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      range: 22,
      min: 0,
      max: 1,
      step: 23,
      values: 24,
      vertical: 2,
      reversed: 3,
      hoverable: 4,
      disabled: 5,
      pipstep: 25,
      all: 6,
      first: 7,
      last: 8,
      rest: 9,
      prefix: 10,
      suffix: 11,
      formatter: 12,
      focus: 13,
      orientationStart: 14,
      percentOf: 15,
      moveHandle: 26,
      fixFloat: 16
    });
  }
}
var RangeSlider_svelte_svelte_type_style_lang = "";
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[64] = list[i];
  child_ctx[66] = i;
  return child_ctx;
}
function create_if_block_2(ctx) {
  let span;
  let t_value = ctx[21](ctx[64], ctx[66], ctx[23](ctx[64])) + "";
  let t;
  let if_block0 = ctx[18] && create_if_block_4(ctx);
  let if_block1 = ctx[19] && create_if_block_3(ctx);
  return {
    c() {
      span = element("span");
      if (if_block0)
        if_block0.c();
      t = text(t_value);
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      if (if_block0)
        if_block0.l(span_nodes);
      t = claim_text(span_nodes, t_value);
      if (if_block1)
        if_block1.l(span_nodes);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "rangeFloat");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      if (if_block0)
        if_block0.m(span, null);
      append_hydration(span, t);
      if (if_block1)
        if_block1.m(span, null);
    },
    p(ctx2, dirty) {
      if (ctx2[18]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_4(ctx2);
          if_block0.c();
          if_block0.m(span, t);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & 10485761 && t_value !== (t_value = ctx2[21](ctx2[64], ctx2[66], ctx2[23](ctx2[64])) + ""))
        set_data(t, t_value);
      if (ctx2[19]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_3(ctx2);
          if_block1.c();
          if_block1.m(span, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_4(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[18]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[18]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "rangeFloat-prefix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 262144)
        set_data(t, ctx2[18]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block_3(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(ctx[19]);
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true });
      var span_nodes = children(span);
      t = claim_text(span_nodes, ctx[19]);
      span_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "rangeFloat-suffix");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
      append_hydration(span, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 524288)
        set_data(t, ctx2[19]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_each_block$1(ctx) {
  let span1;
  let span0;
  let t;
  let span1_data_handle_value;
  let span1_style_value;
  let span1_aria_valuemin_value;
  let span1_aria_valuemax_value;
  let span1_aria_valuenow_value;
  let span1_aria_valuetext_value;
  let span1_aria_orientation_value;
  let span1_tabindex_value;
  let mounted;
  let dispose;
  let if_block = ctx[7] && create_if_block_2(ctx);
  return {
    c() {
      span1 = element("span");
      span0 = element("span");
      t = space();
      if (if_block)
        if_block.c();
      this.h();
    },
    l(nodes) {
      span1 = claim_element(nodes, "SPAN", {
        role: true,
        class: true,
        "data-handle": true,
        style: true,
        "aria-valuemin": true,
        "aria-valuemax": true,
        "aria-valuenow": true,
        "aria-valuetext": true,
        "aria-orientation": true,
        "aria-disabled": true,
        disabled: true,
        tabindex: true
      });
      var span1_nodes = children(span1);
      span0 = claim_element(span1_nodes, "SPAN", { class: true });
      children(span0).forEach(detach);
      t = claim_space(span1_nodes);
      if (if_block)
        if_block.l(span1_nodes);
      span1_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(span0, "class", "rangeNub");
      attr(span1, "role", "slider");
      attr(span1, "class", "rangeHandle");
      attr(span1, "data-handle", span1_data_handle_value = ctx[66]);
      attr(span1, "style", span1_style_value = ctx[28] + ": " + ctx[29][ctx[66]] + "%; z-index: " + (ctx[26] === ctx[66] ? 3 : 2) + ";");
      attr(span1, "aria-valuemin", span1_aria_valuemin_value = ctx[2] === true && ctx[66] === 1 ? ctx[0][0] : ctx[3]);
      attr(span1, "aria-valuemax", span1_aria_valuemax_value = ctx[2] === true && ctx[66] === 0 ? ctx[0][1] : ctx[4]);
      attr(span1, "aria-valuenow", span1_aria_valuenow_value = ctx[64]);
      attr(span1, "aria-valuetext", span1_aria_valuetext_value = "" + (ctx[18] + ctx[21](ctx[64], ctx[66], ctx[23](ctx[64])) + ctx[19]));
      attr(span1, "aria-orientation", span1_aria_orientation_value = ctx[6] ? "vertical" : "horizontal");
      attr(span1, "aria-disabled", ctx[10]);
      attr(span1, "disabled", ctx[10]);
      attr(span1, "tabindex", span1_tabindex_value = ctx[10] ? -1 : 0);
      toggle_class(span1, "active", ctx[24] && ctx[26] === ctx[66]);
      toggle_class(span1, "press", ctx[25] && ctx[26] === ctx[66]);
    },
    m(target, anchor) {
      insert_hydration(target, span1, anchor);
      append_hydration(span1, span0);
      append_hydration(span1, t);
      if (if_block)
        if_block.m(span1, null);
      if (!mounted) {
        dispose = [
          listen(span1, "blur", ctx[34]),
          listen(span1, "focus", ctx[35]),
          listen(span1, "keydown", ctx[36])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[7]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_2(ctx2);
          if_block.c();
          if_block.m(span1, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty[0] & 872415232 && span1_style_value !== (span1_style_value = ctx2[28] + ": " + ctx2[29][ctx2[66]] + "%; z-index: " + (ctx2[26] === ctx2[66] ? 3 : 2) + ";")) {
        attr(span1, "style", span1_style_value);
      }
      if (dirty[0] & 13 && span1_aria_valuemin_value !== (span1_aria_valuemin_value = ctx2[2] === true && ctx2[66] === 1 ? ctx2[0][0] : ctx2[3])) {
        attr(span1, "aria-valuemin", span1_aria_valuemin_value);
      }
      if (dirty[0] & 21 && span1_aria_valuemax_value !== (span1_aria_valuemax_value = ctx2[2] === true && ctx2[66] === 0 ? ctx2[0][1] : ctx2[4])) {
        attr(span1, "aria-valuemax", span1_aria_valuemax_value);
      }
      if (dirty[0] & 1 && span1_aria_valuenow_value !== (span1_aria_valuenow_value = ctx2[64])) {
        attr(span1, "aria-valuenow", span1_aria_valuenow_value);
      }
      if (dirty[0] & 11272193 && span1_aria_valuetext_value !== (span1_aria_valuetext_value = "" + (ctx2[18] + ctx2[21](ctx2[64], ctx2[66], ctx2[23](ctx2[64])) + ctx2[19]))) {
        attr(span1, "aria-valuetext", span1_aria_valuetext_value);
      }
      if (dirty[0] & 64 && span1_aria_orientation_value !== (span1_aria_orientation_value = ctx2[6] ? "vertical" : "horizontal")) {
        attr(span1, "aria-orientation", span1_aria_orientation_value);
      }
      if (dirty[0] & 1024) {
        attr(span1, "aria-disabled", ctx2[10]);
      }
      if (dirty[0] & 1024) {
        attr(span1, "disabled", ctx2[10]);
      }
      if (dirty[0] & 1024 && span1_tabindex_value !== (span1_tabindex_value = ctx2[10] ? -1 : 0)) {
        attr(span1, "tabindex", span1_tabindex_value);
      }
      if (dirty[0] & 83886080) {
        toggle_class(span1, "active", ctx2[24] && ctx2[26] === ctx2[66]);
      }
      if (dirty[0] & 100663296) {
        toggle_class(span1, "press", ctx2[25] && ctx2[26] === ctx2[66]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(span1);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1$1(ctx) {
  let span;
  let span_style_value;
  return {
    c() {
      span = element("span");
      this.h();
    },
    l(nodes) {
      span = claim_element(nodes, "SPAN", { class: true, style: true });
      children(span).forEach(detach);
      this.h();
    },
    h() {
      attr(span, "class", "rangeBar");
      attr(span, "style", span_style_value = ctx[28] + ": " + ctx[32](ctx[29]) + "%; " + ctx[27] + ": " + ctx[33](ctx[29]) + "%;");
    },
    m(target, anchor) {
      insert_hydration(target, span, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 939524096 && span_style_value !== (span_style_value = ctx2[28] + ": " + ctx2[32](ctx2[29]) + "%; " + ctx2[27] + ": " + ctx2[33](ctx2[29]) + "%;")) {
        attr(span, "style", span_style_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block$1(ctx) {
  let rangepips;
  let current;
  rangepips = new RangePips({
    props: {
      values: ctx[0],
      min: ctx[3],
      max: ctx[4],
      step: ctx[5],
      range: ctx[2],
      vertical: ctx[6],
      reversed: ctx[8],
      orientationStart: ctx[28],
      hoverable: ctx[9],
      disabled: ctx[10],
      all: ctx[13],
      first: ctx[14],
      last: ctx[15],
      rest: ctx[16],
      pipstep: ctx[12],
      prefix: ctx[18],
      suffix: ctx[19],
      formatter: ctx[20],
      focus: ctx[24],
      percentOf: ctx[23],
      moveHandle: ctx[31],
      fixFloat: ctx[30]
    }
  });
  return {
    c() {
      create_component(rangepips.$$.fragment);
    },
    l(nodes) {
      claim_component(rangepips.$$.fragment, nodes);
    },
    m(target, anchor) {
      mount_component(rangepips, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const rangepips_changes = {};
      if (dirty[0] & 1)
        rangepips_changes.values = ctx2[0];
      if (dirty[0] & 8)
        rangepips_changes.min = ctx2[3];
      if (dirty[0] & 16)
        rangepips_changes.max = ctx2[4];
      if (dirty[0] & 32)
        rangepips_changes.step = ctx2[5];
      if (dirty[0] & 4)
        rangepips_changes.range = ctx2[2];
      if (dirty[0] & 64)
        rangepips_changes.vertical = ctx2[6];
      if (dirty[0] & 256)
        rangepips_changes.reversed = ctx2[8];
      if (dirty[0] & 268435456)
        rangepips_changes.orientationStart = ctx2[28];
      if (dirty[0] & 512)
        rangepips_changes.hoverable = ctx2[9];
      if (dirty[0] & 1024)
        rangepips_changes.disabled = ctx2[10];
      if (dirty[0] & 8192)
        rangepips_changes.all = ctx2[13];
      if (dirty[0] & 16384)
        rangepips_changes.first = ctx2[14];
      if (dirty[0] & 32768)
        rangepips_changes.last = ctx2[15];
      if (dirty[0] & 65536)
        rangepips_changes.rest = ctx2[16];
      if (dirty[0] & 4096)
        rangepips_changes.pipstep = ctx2[12];
      if (dirty[0] & 262144)
        rangepips_changes.prefix = ctx2[18];
      if (dirty[0] & 524288)
        rangepips_changes.suffix = ctx2[19];
      if (dirty[0] & 1048576)
        rangepips_changes.formatter = ctx2[20];
      if (dirty[0] & 16777216)
        rangepips_changes.focus = ctx2[24];
      if (dirty[0] & 8388608)
        rangepips_changes.percentOf = ctx2[23];
      rangepips.$set(rangepips_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(rangepips.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(rangepips.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(rangepips, detaching);
    }
  };
}
function create_fragment$1(ctx) {
  let div;
  let t0;
  let t1;
  let current;
  let mounted;
  let dispose;
  let each_value = ctx[0];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  }
  let if_block0 = ctx[2] && create_if_block_1$1(ctx);
  let if_block1 = ctx[11] && create_if_block$1(ctx);
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      if (if_block0)
        if_block0.c();
      t1 = space();
      if (if_block1)
        if_block1.c();
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { id: true, class: true });
      var div_nodes = children(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].l(div_nodes);
      }
      t0 = claim_space(div_nodes);
      if (if_block0)
        if_block0.l(div_nodes);
      t1 = claim_space(div_nodes);
      if (if_block1)
        if_block1.l(div_nodes);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div, "id", ctx[17]);
      attr(div, "class", "rangeSlider");
      toggle_class(div, "range", ctx[2]);
      toggle_class(div, "disabled", ctx[10]);
      toggle_class(div, "hoverable", ctx[9]);
      toggle_class(div, "vertical", ctx[6]);
      toggle_class(div, "reversed", ctx[8]);
      toggle_class(div, "focus", ctx[24]);
      toggle_class(div, "min", ctx[2] === "min");
      toggle_class(div, "max", ctx[2] === "max");
      toggle_class(div, "pips", ctx[11]);
      toggle_class(div, "pip-labels", ctx[13] === "label" || ctx[14] === "label" || ctx[15] === "label" || ctx[16] === "label");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
      append_hydration(div, t0);
      if (if_block0)
        if_block0.m(div, null);
      append_hydration(div, t1);
      if (if_block1)
        if_block1.m(div, null);
      ctx[50](div);
      current = true;
      if (!mounted) {
        dispose = [
          listen(window, "mousedown", ctx[39]),
          listen(window, "touchstart", ctx[39]),
          listen(window, "mousemove", ctx[40]),
          listen(window, "touchmove", ctx[40]),
          listen(window, "mouseup", ctx[41]),
          listen(window, "touchend", ctx[42]),
          listen(window, "keydown", ctx[43]),
          listen(div, "mousedown", ctx[37]),
          listen(div, "mouseup", ctx[38]),
          listen(div, "touchstart", prevent_default(ctx[37])),
          listen(div, "touchend", prevent_default(ctx[38]))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 934020317 | dirty[1] & 56) {
        each_value = ctx2[0];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, t0);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (ctx2[2]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_1$1(ctx2);
          if_block0.c();
          if_block0.m(div, t1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (ctx2[11]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty[0] & 2048) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block$1(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(div, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (!current || dirty[0] & 131072) {
        attr(div, "id", ctx2[17]);
      }
      if (dirty[0] & 4) {
        toggle_class(div, "range", ctx2[2]);
      }
      if (dirty[0] & 1024) {
        toggle_class(div, "disabled", ctx2[10]);
      }
      if (dirty[0] & 512) {
        toggle_class(div, "hoverable", ctx2[9]);
      }
      if (dirty[0] & 64) {
        toggle_class(div, "vertical", ctx2[6]);
      }
      if (dirty[0] & 256) {
        toggle_class(div, "reversed", ctx2[8]);
      }
      if (dirty[0] & 16777216) {
        toggle_class(div, "focus", ctx2[24]);
      }
      if (dirty[0] & 4) {
        toggle_class(div, "min", ctx2[2] === "min");
      }
      if (dirty[0] & 4) {
        toggle_class(div, "max", ctx2[2] === "max");
      }
      if (dirty[0] & 2048) {
        toggle_class(div, "pips", ctx2[11]);
      }
      if (dirty[0] & 122880) {
        toggle_class(div, "pip-labels", ctx2[13] === "label" || ctx2[14] === "label" || ctx2[15] === "label" || ctx2[16] === "label");
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      ctx[50](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function index(el) {
  if (!el)
    return -1;
  var i = 0;
  while (el = el.previousElementSibling) {
    i++;
  }
  return i;
}
function normalisedClient(e) {
  if (e.type.includes("touch")) {
    return e.touches[0];
  } else {
    return e;
  }
}
function instance$1($$self, $$props, $$invalidate) {
  let percentOf;
  let clampValue;
  let alignValueToStep;
  let orientationStart;
  let orientationEnd;
  let $springPositions, $$unsubscribe_springPositions = noop$1, $$subscribe_springPositions = () => ($$unsubscribe_springPositions(), $$unsubscribe_springPositions = subscribe(springPositions, ($$value) => $$invalidate(29, $springPositions = $$value)), springPositions);
  $$self.$$.on_destroy.push(() => $$unsubscribe_springPositions());
  let { slider = void 0 } = $$props;
  let { range: range2 = false } = $$props;
  let { pushy = false } = $$props;
  let { min = 0 } = $$props;
  let { max = 100 } = $$props;
  let { step = 1 } = $$props;
  let { values = [(max + min) / 2] } = $$props;
  let { vertical = false } = $$props;
  let { float = false } = $$props;
  let { reversed = false } = $$props;
  let { hoverable = true } = $$props;
  let { disabled = false } = $$props;
  let { pips = false } = $$props;
  let { pipstep = void 0 } = $$props;
  let { all = void 0 } = $$props;
  let { first = void 0 } = $$props;
  let { last = void 0 } = $$props;
  let { rest = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { prefix = "" } = $$props;
  let { suffix = "" } = $$props;
  let { formatter = (v, i, p) => v } = $$props;
  let { handleFormatter = formatter } = $$props;
  let { precision = 2 } = $$props;
  let { springValues = { stiffness: 0.15, damping: 0.4 } } = $$props;
  const dispatch = createEventDispatcher();
  let valueLength = 0;
  let focus = false;
  let handleActivated = false;
  let handlePressed = false;
  let keyboardActive = false;
  let activeHandle = values.length - 1;
  let startValue;
  let previousValue;
  let springPositions;
  const fixFloat = (v) => parseFloat(v.toFixed(precision));
  function targetIsHandle(el) {
    const handles = slider.querySelectorAll(".handle");
    const isHandle = Array.prototype.includes.call(handles, el);
    const isChild = Array.prototype.some.call(handles, (e) => e.contains(el));
    return isHandle || isChild;
  }
  function trimRange(values2) {
    if (range2 === "min" || range2 === "max") {
      return values2.slice(0, 1);
    } else if (range2) {
      return values2.slice(0, 2);
    } else {
      return values2;
    }
  }
  function getSliderDimensions() {
    return slider.getBoundingClientRect();
  }
  function getClosestHandle(clientPos) {
    const dims = getSliderDimensions();
    let handlePos = 0;
    let handlePercent = 0;
    let handleVal = 0;
    if (vertical) {
      handlePos = clientPos.clientY - dims.top;
      handlePercent = handlePos / dims.height * 100;
      handlePercent = reversed ? handlePercent : 100 - handlePercent;
    } else {
      handlePos = clientPos.clientX - dims.left;
      handlePercent = handlePos / dims.width * 100;
      handlePercent = reversed ? 100 - handlePercent : handlePercent;
    }
    handleVal = (max - min) / 100 * handlePercent + min;
    let closest;
    if (range2 === true && values[0] === values[1]) {
      if (handleVal > values[1]) {
        return 1;
      } else {
        return 0;
      }
    } else {
      closest = values.indexOf([...values].sort((a, b) => Math.abs(handleVal - a) - Math.abs(handleVal - b))[0]);
    }
    return closest;
  }
  function handleInteract(clientPos) {
    const dims = getSliderDimensions();
    let handlePos = 0;
    let handlePercent = 0;
    let handleVal = 0;
    if (vertical) {
      handlePos = clientPos.clientY - dims.top;
      handlePercent = handlePos / dims.height * 100;
      handlePercent = reversed ? handlePercent : 100 - handlePercent;
    } else {
      handlePos = clientPos.clientX - dims.left;
      handlePercent = handlePos / dims.width * 100;
      handlePercent = reversed ? 100 - handlePercent : handlePercent;
    }
    handleVal = (max - min) / 100 * handlePercent + min;
    moveHandle(activeHandle, handleVal);
  }
  function moveHandle(index2, value) {
    value = alignValueToStep(value);
    if (typeof index2 === "undefined") {
      index2 = activeHandle;
    }
    if (range2) {
      if (index2 === 0 && value > values[1]) {
        if (pushy) {
          $$invalidate(0, values[1] = value, values);
        } else {
          value = values[1];
        }
      } else if (index2 === 1 && value < values[0]) {
        if (pushy) {
          $$invalidate(0, values[0] = value, values);
        } else {
          value = values[0];
        }
      }
    }
    if (values[index2] !== value) {
      $$invalidate(0, values[index2] = value, values);
    }
    if (previousValue !== value) {
      eChange();
      previousValue = value;
    }
    return value;
  }
  function rangeStart(values2) {
    if (range2 === "min") {
      return 0;
    } else {
      return values2[0];
    }
  }
  function rangeEnd(values2) {
    if (range2 === "max") {
      return 0;
    } else if (range2 === "min") {
      return 100 - values2[0];
    } else {
      return 100 - values2[1];
    }
  }
  function sliderBlurHandle(e) {
    if (keyboardActive) {
      $$invalidate(24, focus = false);
      handleActivated = false;
      $$invalidate(25, handlePressed = false);
    }
  }
  function sliderFocusHandle(e) {
    if (!disabled) {
      $$invalidate(26, activeHandle = index(e.target));
      $$invalidate(24, focus = true);
    }
  }
  function sliderKeydown(e) {
    if (!disabled) {
      const handle = index(e.target);
      let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
      let prevent = false;
      switch (e.key) {
        case "PageDown":
          jump *= 10;
        case "ArrowRight":
        case "ArrowUp":
          moveHandle(handle, values[handle] + jump);
          prevent = true;
          break;
        case "PageUp":
          jump *= 10;
        case "ArrowLeft":
        case "ArrowDown":
          moveHandle(handle, values[handle] - jump);
          prevent = true;
          break;
        case "Home":
          moveHandle(handle, min);
          prevent = true;
          break;
        case "End":
          moveHandle(handle, max);
          prevent = true;
          break;
      }
      if (prevent) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
  function sliderInteractStart(e) {
    if (!disabled) {
      const el = e.target;
      const clientPos = normalisedClient(e);
      $$invalidate(24, focus = true);
      handleActivated = true;
      $$invalidate(25, handlePressed = true);
      $$invalidate(26, activeHandle = getClosestHandle(clientPos));
      startValue = previousValue = alignValueToStep(values[activeHandle]);
      eStart();
      if (e.type === "touchstart" && !el.matches(".pipVal")) {
        handleInteract(clientPos);
      }
    }
  }
  function sliderInteractEnd(e) {
    if (e.type === "touchend") {
      eStop();
    }
    $$invalidate(25, handlePressed = false);
  }
  function bodyInteractStart(e) {
    keyboardActive = false;
    if (focus && e.target !== slider && !slider.contains(e.target)) {
      $$invalidate(24, focus = false);
    }
  }
  function bodyInteract(e) {
    if (!disabled) {
      if (handleActivated) {
        handleInteract(normalisedClient(e));
      }
    }
  }
  function bodyMouseUp(e) {
    if (!disabled) {
      const el = e.target;
      if (handleActivated) {
        if (el === slider || slider.contains(el)) {
          $$invalidate(24, focus = true);
          if (!targetIsHandle(el) && !el.matches(".pipVal")) {
            handleInteract(normalisedClient(e));
          }
        }
        eStop();
      }
    }
    handleActivated = false;
    $$invalidate(25, handlePressed = false);
  }
  function bodyTouchEnd(e) {
    handleActivated = false;
    $$invalidate(25, handlePressed = false);
  }
  function bodyKeyDown(e) {
    if (!disabled) {
      if (e.target === slider || slider.contains(e.target)) {
        keyboardActive = true;
      }
    }
  }
  function eStart() {
    !disabled && dispatch("start", {
      activeHandle,
      value: startValue,
      values: values.map((v) => alignValueToStep(v))
    });
  }
  function eStop() {
    !disabled && dispatch("stop", {
      activeHandle,
      startValue,
      value: values[activeHandle],
      values: values.map((v) => alignValueToStep(v))
    });
  }
  function eChange() {
    !disabled && dispatch("change", {
      activeHandle,
      startValue,
      previousValue: typeof previousValue === "undefined" ? startValue : previousValue,
      value: values[activeHandle],
      values: values.map((v) => alignValueToStep(v))
    });
  }
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      slider = $$value;
      $$invalidate(1, slider);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("slider" in $$props2)
      $$invalidate(1, slider = $$props2.slider);
    if ("range" in $$props2)
      $$invalidate(2, range2 = $$props2.range);
    if ("pushy" in $$props2)
      $$invalidate(44, pushy = $$props2.pushy);
    if ("min" in $$props2)
      $$invalidate(3, min = $$props2.min);
    if ("max" in $$props2)
      $$invalidate(4, max = $$props2.max);
    if ("step" in $$props2)
      $$invalidate(5, step = $$props2.step);
    if ("values" in $$props2)
      $$invalidate(0, values = $$props2.values);
    if ("vertical" in $$props2)
      $$invalidate(6, vertical = $$props2.vertical);
    if ("float" in $$props2)
      $$invalidate(7, float = $$props2.float);
    if ("reversed" in $$props2)
      $$invalidate(8, reversed = $$props2.reversed);
    if ("hoverable" in $$props2)
      $$invalidate(9, hoverable = $$props2.hoverable);
    if ("disabled" in $$props2)
      $$invalidate(10, disabled = $$props2.disabled);
    if ("pips" in $$props2)
      $$invalidate(11, pips = $$props2.pips);
    if ("pipstep" in $$props2)
      $$invalidate(12, pipstep = $$props2.pipstep);
    if ("all" in $$props2)
      $$invalidate(13, all = $$props2.all);
    if ("first" in $$props2)
      $$invalidate(14, first = $$props2.first);
    if ("last" in $$props2)
      $$invalidate(15, last = $$props2.last);
    if ("rest" in $$props2)
      $$invalidate(16, rest = $$props2.rest);
    if ("id" in $$props2)
      $$invalidate(17, id = $$props2.id);
    if ("prefix" in $$props2)
      $$invalidate(18, prefix = $$props2.prefix);
    if ("suffix" in $$props2)
      $$invalidate(19, suffix = $$props2.suffix);
    if ("formatter" in $$props2)
      $$invalidate(20, formatter = $$props2.formatter);
    if ("handleFormatter" in $$props2)
      $$invalidate(21, handleFormatter = $$props2.handleFormatter);
    if ("precision" in $$props2)
      $$invalidate(45, precision = $$props2.precision);
    if ("springValues" in $$props2)
      $$invalidate(46, springValues = $$props2.springValues);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & 24) {
      $$invalidate(49, clampValue = function(val) {
        return val <= min ? min : val >= max ? max : val;
      });
    }
    if ($$self.$$.dirty[0] & 56 | $$self.$$.dirty[1] & 262144) {
      $$invalidate(48, alignValueToStep = function(val) {
        if (val <= min) {
          return fixFloat(min);
        } else if (val >= max) {
          return fixFloat(max);
        }
        let remainder = (val - min) % step;
        let aligned = val - remainder;
        if (Math.abs(remainder) * 2 >= step) {
          aligned += remainder > 0 ? step : -step;
        }
        aligned = clampValue(aligned);
        return fixFloat(aligned);
      });
    }
    if ($$self.$$.dirty[0] & 24) {
      $$invalidate(23, percentOf = function(val) {
        let perc = (val - min) / (max - min) * 100;
        if (isNaN(perc) || perc <= 0) {
          return 0;
        } else if (perc >= 100) {
          return 100;
        } else {
          return fixFloat(perc);
        }
      });
    }
    if ($$self.$$.dirty[0] & 12582937 | $$self.$$.dirty[1] & 229376) {
      {
        if (!Array.isArray(values)) {
          $$invalidate(0, values = [(max + min) / 2]);
          console.error("'values' prop should be an Array (https://github.com/simeydotme/svelte-range-slider-pips#slider-props)");
        }
        $$invalidate(0, values = trimRange(values.map((v) => alignValueToStep(v))));
        if (valueLength !== values.length) {
          $$subscribe_springPositions($$invalidate(22, springPositions = spring(values.map((v) => percentOf(v)), springValues)));
        } else {
          springPositions.set(values.map((v) => percentOf(v)));
        }
        $$invalidate(47, valueLength = values.length);
      }
    }
    if ($$self.$$.dirty[0] & 320) {
      $$invalidate(28, orientationStart = vertical ? reversed ? "top" : "bottom" : reversed ? "right" : "left");
    }
    if ($$self.$$.dirty[0] & 320) {
      $$invalidate(27, orientationEnd = vertical ? reversed ? "bottom" : "top" : reversed ? "left" : "right");
    }
  };
  return [
    values,
    slider,
    range2,
    min,
    max,
    step,
    vertical,
    float,
    reversed,
    hoverable,
    disabled,
    pips,
    pipstep,
    all,
    first,
    last,
    rest,
    id,
    prefix,
    suffix,
    formatter,
    handleFormatter,
    springPositions,
    percentOf,
    focus,
    handlePressed,
    activeHandle,
    orientationEnd,
    orientationStart,
    $springPositions,
    fixFloat,
    moveHandle,
    rangeStart,
    rangeEnd,
    sliderBlurHandle,
    sliderFocusHandle,
    sliderKeydown,
    sliderInteractStart,
    sliderInteractEnd,
    bodyInteractStart,
    bodyInteract,
    bodyMouseUp,
    bodyTouchEnd,
    bodyKeyDown,
    pushy,
    precision,
    springValues,
    valueLength,
    alignValueToStep,
    clampValue,
    div_binding
  ];
}
class RangeSlider extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {
      slider: 1,
      range: 2,
      pushy: 44,
      min: 3,
      max: 4,
      step: 5,
      values: 0,
      vertical: 6,
      float: 7,
      reversed: 8,
      hoverable: 9,
      disabled: 10,
      pips: 11,
      pipstep: 12,
      all: 13,
      first: 14,
      last: 15,
      rest: 16,
      id: 17,
      prefix: 18,
      suffix: 19,
      formatter: 20,
      handleFormatter: 21,
      precision: 45,
      springValues: 46
    }, null, [-1, -1, -1]);
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
//# sourceMappingURL=index.svelte-74bec63f.js.map
