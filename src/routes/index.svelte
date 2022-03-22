<script>
	import { panzoom } from '$lib/panzoom.js';
	import { zoom } from '$lib/zoom.js';

	import Spot from '$lib/_components/Spot.svelte';

	let zoomable, container;
	let style = ''; // show styling applied
	let scale = {};
	let matrix = {};
	let origin;

	function handleZoom(e) {
		console.log({ detail: e.detail });
		scale = e.detail.scale;
		matrix = e.detail.matrix;
		style = zoomable.style.transform;
		origin = e.detail.origin;
	}
	let location = { x: 0, y: 0 };
	function handleMouseMove(e) {
		location = { x: e.clientX, y: e.clientY };
	}
	let count = 10;
	const grid = Array.from({ length: count }, (_, i) =>
		Array.from({ length: count }, (_, j) => ({ id: i * count + j }))
	);
</script>

<div
	class="container"
	use:zoom
	on:zoomed={handleZoom}
	on:mousemove={handleMouseMove}
	bind:this={container}
>
	<div class="zoomable flexbox" bind:this={zoomable} style="transform-origin: 0 0;">
		<div style="position: absolute; left: 10px" />
		<div>
			Scroll in me. <br />
			{location?.x}, {location?.y}<br />
			{origin?.x}, {origin?.y}
			Style: {style}
		</div>
		{#if container}
			<div class="grid">
				{#each grid as col, x}
					<div class="col">
						{#each col as square, y}
							<Spot
								left={(x * container.offsetWidth) / count}
								top={(y * container.offsetWidth) / count}
							/>
						{/each}
					</div>
				{/each}
			</div>
		{/if}

		<!-- 
		<div class="flexbox">
			{#if scale}
				<div class="flexitem">
					Scale:
					<ul>
						{#each Object.entries(scale) as [k, v]}
							<li>{k}: {v}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if matrix}
				<div class="flexitem">
					Matrix:
					<ul>
						{#each Object.entries(matrix) as [k, v]}
							<li>{k}: {v}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if origin}
				<div class="flexitem">
					origin:
					<ul>
						{#each Object.entries(origin) as [k, v]}
							<li>{k}: {v}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		 -->
	</div>
</div>

<style>
	.container {
		border: 3px solid red;
		height: 600px;
		overflow: hidden;
		touch-action: none;
	}
	.zoomable {
		border: 4px dashed blue;
		height: 100%;
		width: 100%;
		/* margin: 1em; */
		position: relative;
		transition: transform 0.3s;
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
</style>
