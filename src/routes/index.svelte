<script>
	import { panzoom } from '$lib/panzoom.js';
	import Spot from '$lib/_components/Spot.svelte';

	let zoomable, container;
	let style = ''; // show styling applied
	let scale = { value: 1 };
	let count = 10;
	let min = count;

	function handleZoom(e) {
		console.log('Zoomed.', { detail: e.detail });
		scale = e.detail.scale;
		style = zoomable.style.transform;
	}

	const grid = Array.from({ length: count }, (_, i) =>
		Array.from({ length: count }, (_, j) => ({ id: i * count + j }))
	);
</script>

<div>
	<h1>Pan and Zoom</h1>
	<p>Try out the mouse wheel scroll in the red box below</p>

	<h2>Inside</h2>
	<p>Inside the red box should pan and zoom</p>
</div>

<div class="container" bind:this={container}>
	<div class="menu">
		<div>
			Zoom Level: {scale.value}
		</div>

		<div>Style: {style}</div>
	</div>
	<div class="zoomable flexbox" bind:this={zoomable} use:panzoom on:zoomed={handleZoom}>
		{#if container}
			<div class="grid">
				{#each grid as col, x}
					<div class="col">
						{#each col as square, y}
							<Spot
								left={min + (x * container.offsetWidth) / count}
								top={min + (y * container.offsetWidth) / count}
							/>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		border: 3px solid red;
		height: 600px;
		width: 600px;
		margin: 3em;
		/* overflow: hidden;  its set by the directive :) */
		/* touch-action: none;  its set by the directive :) */
		/* position: relative; its set by the directive :) */
	}
	.zoomable {
		border: 4px dashed blue;
		height: 100%;
		width: 100%;
		/* margin: 1em; */
		/* position: relative; its set by the directive :) */
	}
	.flexbox {
		display: flex;
		flex-wrap: nowrap;
		align-content: stretch;
		justify-content: space-evenly;
		align-items: stretch;
	}
	.flexitem {
		margin: 1em;
		padding: 1em;
		background-color: lightgray;
	}
	.item {
		/* 		flex: 1; */
		border: 1px solid grey;
		height: 30px;
		width: 50px;
	}
	ul {
		padding: 1em;
	}

	.menu {
		position: absolute;
		top: 10px;
		left: 10px;
		margin: 0.1em;
		padding: 2em;
		z-index: 10;
		background-color: rgba(133, 198, 255, 0.801);
	}
</style>
