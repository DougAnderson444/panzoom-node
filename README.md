# Zoom as a svelte directive

Add this action directive to the parent container of the stuff you want to zoom in on. Not just images, any html elements.

![Demo](svelte-zoom-action.gif)

## Demo

Demo code is in `src/index.svelte`

REPL is [https://svelte.dev/repl/9a9571ea3590430690d3a0c809bb7eb3](https://svelte.dev/repl/9a9571ea3590430690d3a0c809bb7eb3)

## Use

```js
<script>
	import { panzoom } from '$lib/panzoom.js';
</script>

<div class="container" use:panzoom >
	<div class="zoomable">
		Scroll in me.
	</div>
</div>
```

## Options

TOOD.
