<script>
	import { panzoom } from '$lib/panzoom.js';
	import { pzoom } from '$lib/pzoom';
	import Spot from '$lib/_components/Spot.svelte';
	import RangeSlider from 'svelte-range-slider-pips';

	let zoomable, container;

	let handle;

	let style = ''; // show styling applied
	let scale = { value: 1 };
	let count = 10;
	let min = count;
	let manualZoom = [1];
	// $: if (scale?.value) manualZoom = [scale.value]; // match the directive scale level
	$: if (manualZoom) {
		console.log({ manualZoom });
		setZoom(manualZoom);
	}

	function handleZoom(e) {
		console.log('Zoomed.', { detail: e.detail });
		scale = e.detail.scale;
		style = zoomable.style.transform;
	}

	const grid = Array.from({ length: count }, (_, i) =>
		Array.from({ length: count }, (_, j) => ({ id: i * count + j }))
	);

	// manual zoom
	function setZoom(val) {
		console.log('Zoom to ', val, zoomable?.style['transform']);
		if (!zoomable) return;
		if (!zoomable?.style) {
			console.log('Setting Zoom to scale only');
			zoomable.style['transform'] = `scale(${val})`;
			return;
		}
		let m;
		let s = '';

		const re = /(\w+)\(([^)]*)\)/g;
		while ((m = re.exec(zoomable?.style['transform']))) {
			console.log({ m });

			if (m[1] == 'matrix') {
				let piece = m[2].split(', ');
				console.log({ piece });
				s = `translate(${piece[4]}px, ${piece[5]}px) scale(${val})`;
				console.log('matrixed', { s });
				zoomable.style['transform'] = s;
				return;
			} else if (m[1] == 'scale') {
				s += ` scale(${val})`;
			} else {
				s += m[0];
			}
		}
		console.log({ s });
		zoomable.style['transform'] = s;
	}
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
			Zoom Level: {scale.value.toFixed(5)} || {JSON.stringify(manualZoom)}
			{#if manualZoom}
				<div>
					<RangeSlider
						pips
						min={0.5}
						step={0.5}
						max={scale?.max || 20}
						float
						bind:values={manualZoom}
					/>
				</div>
			{/if}
		</div>

		<div>Style: {style}</div>
	</div>
	<div
		class="zoomable flexbox"
		bind:this={zoomable}
		use:pzoom={{ panAnywhere: true }}
		on:zoomed={handleZoom}
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
