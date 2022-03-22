<script>
	import { panzoom } from '$lib/panzoom.js';
	let name = 'world';
</script>

<div class="container" use:panzoom>
	<div class="zoomable">
		Scroll in me.
		<hr />
		{#each Array.from(Array.from({ length: 43 }, (element, i) => ({ id: i }))) as item}
			<div class="item">
				{item.id}
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		border: 3px solid red;
		height: 100%;
		overflow: hidden;
		touch-action: none;
	}
	.zoomable {
		border: 4px dashed blue;
		height: 150px;
		width: 90%;
		margin: 1em;
		display: flex;
		flex-wrap: wrap;
		align-content: stretch;
		justify-content: space-evenly;
		align-items: center;
	}
	.item {
		/* 		flex: 1; */
		border: 1px solid grey;
		height: 30px;
		width: 50px;
	}
</style>
