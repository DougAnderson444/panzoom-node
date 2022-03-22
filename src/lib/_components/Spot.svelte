<script>
	let range = 9;
	export let left = ((1 << range) * Math.random()) | 10;
	export let top = ((1 << range) * Math.random()) | 10;

	let color = '#' + (((1 << 24) * Math.random()) | 0).toString(16);
</script>

<div style="top: {top}px; left: {left}px; --color: {color};">{left},{top}</div>

<style>
	div {
		--size: 20px;
		position: absolute;
		background-color: var(--color);
		width: var(--size);
		height: var(--size);
	}
</style>
