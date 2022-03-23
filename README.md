# Zoom as a Svelte Directive

Add this action directive to the parent container of the stuff you want to zoom in on. Not just images, any html elements.

![Demo](svelte-zoom-action.gif)

## Action Directives

They attach some javascript at the html level, it's a shortcut that saves a lot of repeated code.

[https://svelte.dev/docs#template-syntax-element-directives-use-action](https://svelte.dev/docs#template-syntax-element-directives-use-action)

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
