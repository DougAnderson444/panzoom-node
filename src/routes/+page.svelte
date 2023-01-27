<script>
	// @ts-nocheck

	import { pzoom } from '$lib/pzoom';
	import { tweened } from 'svelte/motion';
	import { quintOut } from 'svelte/easing';
	import Spot from '$lib/_components/Spot.svelte';
	// import RangeSlider from 'svelte-range-slider-pips';

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

	const grid = Array.from({ length: count }, (_, i) =>
		Array.from({ length: count }, (_, j) => ({ id: i * count + j }))
	);

	const getCoords = (e) =>
		zoomable.style.transform.replace(/px/g, '').match(/[-+]?([0-9]*\.[0-9]+|[0-9]+)/g);

	export const goHome = () => {
		// use regex to extract x, y, and scale from the zoomable element translate(x px, y px) scale(scale) excluding the trailing 'px'
		const [x, y, s] = getCoords();

		// convert strings to numbers
		let view = tweened(
			{ x: +x, y: +y, s: +s },
			{
				duration: 750,
				easing: quintOut
			}
		);
		view.subscribe(async (v) => {
			zoomable.dispatchEvent(
				new CustomEvent('setTransform', {
					detail: {
						scale: v.s,
						x: v.x,
						y: v.y
					}
				})
			);
		});
		view.set({ x: 0, y: 0, s: 1 });
	};

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

<h2>Using Handle (can only pan by dragging on the word "Handle")</h2>

<div style="height:600px; width: 600px; margin: 1em; border: 4px solid salmon">
	<div use:pzoom={{ handle }}>
		<div
			style="box-shadow: 2px 2px 19px #e0e0e0;
		-o-box-shadow: 2px 2px 19px #e0e0e0;
		-webkit-box-shadow: 2px 2px 19px #e0e0e0;
		-moz-box-shadow: 2px 2px 19px #e0e0e0;
		-moz-border-radius: 8px;
		border-radius: 8px;
		background-color: rgba(250, 128, 114, 0.418);
		width: 100px;
		height: 100px;
		padding: 1em;
		left: 100px;
		top: 10px;"
		>
			Drag me by my handle:
			<span bind:this={handle}><b>Handle</b></span>
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
