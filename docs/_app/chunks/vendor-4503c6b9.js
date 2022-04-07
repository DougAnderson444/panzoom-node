function noop() {
}
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
let is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function upper_bound(low, high, key, value) {
  while (low < high) {
    const mid = low + (high - low >> 1);
    if (key(mid) <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
function init_hydrate(target) {
  if (target.hydrate_init)
    return;
  target.hydrate_init = true;
  let children2 = target.childNodes;
  if (target.nodeName === "HEAD") {
    const myChildren = [];
    for (let i = 0; i < children2.length; i++) {
      const node = children2[i];
      if (node.claim_order !== void 0) {
        myChildren.push(node);
      }
    }
    children2 = myChildren;
  }
  const m = new Int32Array(children2.length + 1);
  const p = new Int32Array(children2.length);
  m[0] = -1;
  let longest = 0;
  for (let i = 0; i < children2.length; i++) {
    const current = children2[i].claim_order;
    const seqLen = (longest > 0 && children2[m[longest]].claim_order <= current ? longest + 1 : upper_bound(1, longest, (idx) => children2[m[idx]].claim_order, current)) - 1;
    p[i] = m[seqLen] + 1;
    const newLen = seqLen + 1;
    m[newLen] = i;
    longest = Math.max(newLen, longest);
  }
  const lis = [];
  const toMove = [];
  let last = children2.length - 1;
  for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
    lis.push(children2[cur - 1]);
    for (; last >= cur; last--) {
      toMove.push(children2[last]);
    }
    last--;
  }
  for (; last >= 0; last--) {
    toMove.push(children2[last]);
  }
  lis.reverse();
  toMove.sort((a, b) => a.claim_order - b.claim_order);
  for (let i = 0, j = 0; i < toMove.length; i++) {
    while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
      j++;
    }
    const anchor = j < lis.length ? lis[j] : null;
    target.insertBefore(toMove[i], anchor);
  }
}
function append_hydration(target, node) {
  if (is_hydrating) {
    init_hydrate(target);
    if (target.actual_end_child === void 0 || target.actual_end_child !== null && target.actual_end_child.parentElement !== target) {
      target.actual_end_child = target.firstChild;
    }
    while (target.actual_end_child !== null && target.actual_end_child.claim_order === void 0) {
      target.actual_end_child = target.actual_end_child.nextSibling;
    }
    if (node !== target.actual_end_child) {
      if (node.claim_order !== void 0 || node.parentNode !== target) {
        target.insertBefore(node, target.actual_end_child);
      }
    } else {
      target.actual_end_child = node.nextSibling;
    }
  } else if (node.parentNode !== target || node.nextSibling !== null) {
    target.appendChild(node);
  }
}
function insert_hydration(target, node, anchor) {
  if (is_hydrating && !anchor) {
    append_hydration(target, node);
  } else if (node.parentNode !== target || node.nextSibling != anchor) {
    target.insertBefore(node, anchor || null);
  }
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
  return function(event) {
    event.preventDefault();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function init_claim_info(nodes) {
  if (nodes.claim_info === void 0) {
    nodes.claim_info = { last_index: 0, total_claimed: 0 };
  }
}
function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
  init_claim_info(nodes);
  const resultNode = (() => {
    for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        }
        return node;
      }
    }
    for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        } else if (replacement === void 0) {
          nodes.claim_info.last_index--;
        }
        return node;
      }
    }
    return createNode();
  })();
  resultNode.claim_order = nodes.claim_info.total_claimed;
  nodes.claim_info.total_claimed += 1;
  return resultNode;
}
function claim_element_base(nodes, name, attributes, create_element) {
  return claim_node(nodes, (node) => node.nodeName === name, (node) => {
    const remove = [];
    for (let j = 0; j < node.attributes.length; j++) {
      const attribute = node.attributes[j];
      if (!attributes[attribute.name]) {
        remove.push(attribute.name);
      }
    }
    remove.forEach((v) => node.removeAttribute(v));
    return void 0;
  }, () => create_element(name));
}
function claim_element(nodes, name, attributes) {
  return claim_element_base(nodes, name, attributes, element);
}
function claim_text(nodes, data) {
  return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
    const dataStr = "" + data;
    if (node.data.startsWith(dataStr)) {
      if (node.data.length !== dataStr.length) {
        return node.splitText(dataStr.length);
      }
    } else {
      node.data = dataStr;
    }
  }, () => text(data), true);
}
function claim_space(nodes) {
  return claim_text(nodes, " ");
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  }
}
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
function get_spread_object(spread_props) {
  return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
}
function bind(component, name, callback) {
  const index2 = component.$$.props[name];
  if (index2 !== void 0) {
    component.$$.bound[index2] = callback;
    callback(component.$$.ctx[index2]);
  }
}
function create_component(block) {
  block && block.c();
}
function claim_component(block, parent_nodes) {
  block && block.l(parent_nodes);
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index2 = callbacks.indexOf(callback);
      if (index2 !== -1)
        callbacks.splice(index2, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = /* @__PURE__ */ new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update2(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update2, subscribe: subscribe2 };
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
function get_each_context$1(ctx, list, i) {
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
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
          const child_ctx = get_each_context$1(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
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
function create_each_block$1(ctx) {
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
function create_if_block$1(ctx) {
  let span;
  let span_style_value;
  let mounted;
  let dispose;
  let if_block = (ctx[6] === "label" || ctx[8] === "label") && create_if_block_1$1(ctx);
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
          if_block = create_if_block_1$1(ctx);
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
function create_if_block_1$1(ctx) {
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
function create_fragment$1(ctx) {
  let div;
  let t0;
  let t1;
  let if_block0 = (ctx[6] && ctx[7] !== false || ctx[7]) && create_if_block_9(ctx);
  let if_block1 = (ctx[6] && ctx[9] !== false || ctx[9]) && create_if_block_4$1(ctx);
  let if_block2 = (ctx[6] && ctx[8] !== false || ctx[8]) && create_if_block$1(ctx);
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
          if_block2 = create_if_block$1(ctx2);
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
    i: noop,
    o: noop,
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
function instance$1($$self, $$props, $$invalidate) {
  let pipStep;
  let pipCount;
  let pipVal;
  let isSelected;
  let inRange;
  let { range = false } = $$props;
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
      $$invalidate(22, range = $$props2.range);
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
        if (range === "min") {
          return values[0] > val;
        } else if (range === "max") {
          return values[0] < val;
        } else if (range) {
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
    range,
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
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {
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
function get_each_context(ctx, list, i) {
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
function create_each_block(ctx) {
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
function create_if_block_1(ctx) {
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
function create_if_block(ctx) {
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
function create_fragment(ctx) {
  let div;
  let t0;
  let t1;
  let current;
  let mounted;
  let dispose;
  let each_value = ctx[0];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  let if_block0 = ctx[2] && create_if_block_1(ctx);
  let if_block1 = ctx[11] && create_if_block(ctx);
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
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
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
          if_block0 = create_if_block_1(ctx2);
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
          if_block1 = create_if_block(ctx2);
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
function instance($$self, $$props, $$invalidate) {
  let percentOf;
  let clampValue;
  let alignValueToStep;
  let orientationStart;
  let orientationEnd;
  let $springPositions, $$unsubscribe_springPositions = noop, $$subscribe_springPositions = () => ($$unsubscribe_springPositions(), $$unsubscribe_springPositions = subscribe(springPositions, ($$value) => $$invalidate(29, $springPositions = $$value)), springPositions);
  $$self.$$.on_destroy.push(() => $$unsubscribe_springPositions());
  let { slider = void 0 } = $$props;
  let { range = false } = $$props;
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
    if (range === "min" || range === "max") {
      return values2.slice(0, 1);
    } else if (range) {
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
    if (range === true && values[0] === values[1]) {
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
    if (range) {
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
    if (range === "min") {
      return 0;
    } else {
      return values2[0];
    }
  }
  function rangeEnd(values2) {
    if (range === "max") {
      return 0;
    } else if (range === "min") {
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
      $$invalidate(2, range = $$props2.range);
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
    range,
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
    init(this, options, instance, create_fragment, safe_not_equal, {
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
export { RangeSlider, SvelteComponent, action_destroyer, add_flush_callback, afterUpdate, append_hydration, assign, attr, bind, binding_callbacks, check_outros, children, claim_component, claim_element, claim_space, claim_text, create_component, create_slot, destroy_component, destroy_each, detach, element, empty, get_all_dirty_from_scope, get_slot_changes, get_spread_object, get_spread_update, group_outros, init, insert_hydration, is_function, listen, mount_component, noop, onMount, run_all, safe_not_equal, setContext, set_data, set_style, space, text, tick, transition_in, transition_out, update_slot_base, writable };
//# sourceMappingURL=vendor-4503c6b9.js.map
