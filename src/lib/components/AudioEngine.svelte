<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	/**
	 * An array of sound file names to be played.
	 * e.g., ['heavy-rain.mp3', 'distant-thunder.mp3']
	 */
	export let sounds: string[] = [];

	let audioContext: AudioContext | null = null;
	let sources: AudioBufferSourceNode[] = [];

	onMount(() => {
		// The Web Audio API requires user interaction to start. Since this component
		// is only mounted *after* the user submits the form, we are allowed to create the context.
		// We also check if the window object is available to prevent SSR errors.
		if (typeof window !== 'undefined') {
			audioContext = new window.AudioContext();

			sounds.forEach(async (soundFile) => {
				if (!audioContext) return;

				try {
					// Construct the full path to the audio file in the static directory
					const response = await fetch(`/audio/${soundFile}`);
					if (!response.ok) {
						throw new Error(`Sound file not found: ${soundFile}`);
					}
					const arrayBuffer = await response.arrayBuffer();
					const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

					const source = audioContext.createBufferSource();
					source.buffer = audioBuffer;
					source.loop = true;

					// The magic trick for non-repeating loops:
					// Give each sound a slightly different playback speed.
					// This will cause their loop points to drift apart over time.
					// A random value between 0.95 and 1.05 should be subtle enough.
					source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.1;

					source.connect(audioContext.destination);
					source.start();

					// Keep track of all our sources so we can stop them later.
					sources.push(source);
				} catch (error) {
					console.error(`Failed to load or play sound: ${soundFile}`, error);
				}
			});
		}
	});

	onDestroy(() => {
		// This is critical for cleanup.
		// Stop all playing sounds.
		sources.forEach((source) => {
			try {
				source.stop();
				source.disconnect();
			} catch (e) {
				// Ignore errors if the source is already stopped
			}
		});

		// Close the audio context to release system resources.
		if (audioContext && audioContext.state !== 'closed') {
			audioContext.close();
		}
	});
</script>

<!-- This component renders nothing to the DOM. It's a pure controller. -->
