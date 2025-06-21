<script lang="ts">
	import P5Canvas from '$lib/components/P5Canvas.svelte';

	let prompt: string = '';
	let submitted: boolean = false;

	function handleSubmit() {
		if (prompt.trim()) {
			console.log('User submitted prompt:', prompt);
			submitted = true;
			// In the next phase, we'll trigger the LLM call and canvas generation here.
		}
	}
</script>

<main class="h-screen w-screen bg-black text-white flex flex-col items-center justify-center font-serif p-4">
	{#if !submitted}
		<div class="text-center transition-opacity duration-1000 w-full">
			<h1 class="text-4xl md:text-5xl mb-12 animate-fade-in">Describe the world you want to hear.</h1>
			<form on:submit|preventDefault={handleSubmit}>
				<input
					type="text"
					bind:value={prompt}
					class="w-full max-w-2xl bg-transparent border-b-2 border-gray-600 text-xl md:text-2xl text-center text-gray-200 focus:outline-none focus:border-white transition-colors duration-300 p-2"
					placeholder="e.g., a calm rainy night in a cozy cyberpunk apartment"
					autofocus
				/>
			</form>
		</div>
	{:else}
		<!-- When submitted, we render the P5Canvas and pass the prompt to it -->
		<P5Canvas {prompt} />
		<!-- We can also add other UI elements on top of the canvas here if needed -->
	{/if}
</main>

<!-- A simple fade-in animation for the title -->
<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 2s ease-in-out forwards;
	}
</style>
