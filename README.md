# HTML Node Zoom, available as a Svelte Directive

[Demo](https://douganderson444.github.io/panzoom-node/)

One dependency library. Use as vanilla JS or add this as a Svelte action directive to the node you want to zoom in on. Not just images... _any_ html elements.

- [x] Pinch
- [x] Pan
- [x] Zoom
- [x] Mobile
- [x] Ignore single pointer input and editable elements
- [x] Optional Pinch to Zoom over DOM tree children (`{ panAnywhere: true }`)
- [x] Optional Disable pan on select event targets via `data-no-pan` dataset
- [x] Optional Drag Handle
- [x] Optional Minimum Scale (`<div min-scale=1>`)

![Demo](./static/svelte-zoom-action.gif)

## As Svelte Action Directives

Svelte action directives are neat. They attach some javascript at the html level, it's a shortcut that saves a lot of repeated code.

[https://svelte.dev/docs#template-syntax-element-directives-use-action](https://svelte.dev/docs#template-syntax-element-directives-use-action)

## Demo

Demo code is in `src/index.svelte`

Repo Demo: [https://douganderson444.github.io/panzoom-node/](https://douganderson444.github.io/panzoom-node/)

REPL is [https://svelte.dev/repl/9a9571ea3590430690d3a0c809bb7eb3](https://svelte.dev/repl/9a9571ea3590430690d3a0c809bb7eb3)

## Use

```svelte
<script>
	import { pzoom } from '@douganderson444/panzoom-node';

	let zoomable;

	function handleScaleChg(e) {
		console.log('Scale is now: ', e.detail.scale);
	}

	function goHome(e) {
		// reset to x,y = 0,0 and scale = 1 on the zoomable element
		zoomable.dispatchEvent(new CustomEvent('home'));
	}
</script>

<div class="parent-container">
	Pinch/Zoom/Pan in this Parent Element. If you want to pan on DOM children too, set panAnywhere to
	true.

	<div bind:this={zoomable} use:pzoom={{ panAnywhere: true }} on:scale={handleScaleChg}>
		Scroll on me. Pan anywhere on child elements if panAnywhere is true.
		<div data-no-pan>Add data-no-pan if you want to click and disable panning on an element</div>
		<button on:click={goHome}>Go Home</button>
	</div>
</div>
```

## Vanilla JavaScript / other frameworks use

You could also use this in vanilla javascript, just pass the html node you wish to apply the panzoom to into the function:

```js
import { pzoom } from '@douganderson444/panzoom-node';

const element = document.createElement('p');
const node = document.createTextNode('This is new.');
element.appendChild(node);

// apply panzom to the node
pzoom(node);
```

## Zoom Container

The zoomable HTML node will be contained within the parent element as a container. If no container is set, it will use the parent element as the default container, using the `<body>` as the container if there's no parent element.
