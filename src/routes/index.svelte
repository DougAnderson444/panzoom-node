<script>
	import { panzoom } from '$lib/panzoom.js';
	import { pzoom } from '$lib/pzoom';
	import Spot from '$lib/_components/Spot.svelte';
	import RangeSlider from 'svelte-range-slider-pips';

	let zoomable, container;

	let handle;
	let scale = 1;
	let count = 10;
	let min = count;
	let values;
	$: if (scale) {
		values = [scale]; // match the directive scale level
	}

	$: if (zoomable?.style?.transform) console.log({ zoomable: zoomable.style.transform });

	function handleRangeChg(e) {
		zoomable.dispatchEvent(new CustomEvent('scaleTo', { detail: { scale: values[0] } }));
	}

	const grid = Array.from({ length: count }, (_, i) =>
		Array.from({ length: count }, (_, j) => ({ id: i * count + j }))
	);

	function goHome(e) {
		// dispatch custom event to zoomable element
		zoomable.dispatchEvent(new CustomEvent('home'));
	}
	const handleScaleChg = (e) => {
		scale = e.detail.scale;
		console.log('scale changed', scale);
	};
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
			<button on:click={goHome}>Reset Zoom</button>
			<br />Zoom Level: {scale}
			<!-- {#if values?.length}
				<div data-no-pan>
					<RangeSlider
						pips
						min={0.1}
						step={0.1}
						max={scale?.max || 20}
						float
						bind:values
						on:change={handleRangeChg}
					/>
				</div>
			{/if} -->
		</div>
	</div>
	<div
		class="zoomable flexbox"
		bind:this={zoomable}
		use:pzoom={{ panAnywhere: true }}
		on:scale={handleScaleChg}
	>
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

<h2>Using Handle (WIP)</h2>

<div style="height:600px">
	<div style="height:600px; width: 600px; border: 1px solid salmon">
		<div
			style="box-shadow: 2px 2px 19px #e0e0e0;
		-o-box-shadow: 2px 2px 19px #e0e0e0;
		-webkit-box-shadow: 2px 2px 19px #e0e0e0;
		-moz-box-shadow: 2px 2px 19px #e0e0e0;
		-moz-border-radius: 8px;
		border-radius: 8px;
		background-color: rgba(250, 128, 114, 0.418);
		width: 200px;
		height: 200px;
		padding: 1em;
		left: 100px;
		top: 10px;"
			use:pzoom={{ handle }}
		>
			Drag me by my handle:
			<span bind:this={handle}>Handle</span>
		</div>
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
		height: 50%;
		width: 50%;
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
		width: 400px;
		margin: 0.1em;
		padding: 2em;
		z-index: 10;
		background-color: rgba(133, 198, 255, 0.801);
	}
</style>
