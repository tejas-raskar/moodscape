<script lang="ts">
    // We use a type-only import for the `p5` type. This is safe for SSR because
    // it's erased at compile time and doesn't result in a runtime import on the server.
    import type p5 from "p5";
    import { onMount, onDestroy } from "svelte";

    // Props that will be passed in from the parent component
    export let prompt: string;

    let canvasContainer: HTMLDivElement;
    let p5Instance: p5;

    // The sketch function defines the behavior of our p5 canvas.
    // It takes an instance of p5 as its argument.
    const sketch = (p: p5) => {
        p.setup = () => {
            p.createCanvas(p.windowWidth, p.windowHeight).parent(
                canvasContainer,
            );
            console.log("P5Canvas mounted with prompt:", prompt);
        };

        p.draw = () => {
            // This is our "Living Canvas" drawing loop.
            p.background(0); // Black background
            p.noStroke();
            p.fill(255, 50); // Semi-transparent white

            // Draw circles that follow the mouse for a simple interactive effect
            p.ellipse(p.mouseX, p.mouseY, 25, 25);
        };

        p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
    };

    // onMount only runs on the client-side. We make it async to use dynamic import.
    onMount(async () => {
        // Dynamically import the p5 library ONLY when the component mounts in the browser.
        // This prevents the server from trying to load this browser-specific library.
        const p5Constructor = (await import("p5")).default;

        // Now that we're safely in the browser and the library is loaded,
        // we can create the new p5 instance.
        p5Instance = new p5Constructor(sketch, canvasContainer);
    });

    onDestroy(() => {
        // It's important to remove the p5 instance on destroy to prevent memory leaks.
        if (p5Instance) {
            p5Instance.remove();
        }
    });
</script>

<!-- This div is the container where our p5.js canvas will be rendered. -->
<div bind:this={canvasContainer} class="w-full h-full fixed top-0 left-0 z-0" />

<style>
    /* Ensure the canvas container doesn't interfere with other elements, but is visible */
    div {
        /* We'll keep this as none for now, but might change it later for gestural input */
        pointer-events: none;
    }
</style>
