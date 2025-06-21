<script lang="ts">
    import { gsap } from "gsap";
    import P5Canvas from "$lib/components/P5Canvas.svelte";
    import AudioEngine from "$lib/components/AudioEngine.svelte";
    import ImageBackground from "$lib/components/ImageBackground.svelte";

    // --- Component State ---
    let scene: "input" | "loading" | "canvas" | "error" = "input";
    let prompt: string = "";
    let errorMessage: string = "";
    let soundscapeData: {
        imageBase64: string;
        sounds: string[];
        p5Code: string;
    } | null = null;

    // --- Gesture State ---
    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    // --- Svelte/GSAP Transition Functions ---
    // These functions are used with the `in:` and `out:` directives to create
    // smooth, interruption-free animations between scenes.

    const fade = (node: HTMLElement, { duration = 0.5, delay = 0 }) => {
        const initialOpacity = getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            tick: (t: number) => {
                // t is a value from 0 to 1, eased by Svelte.
                node.style.opacity = (
                    parseFloat(initialOpacity) * t
                ).toString();
            },
        };
    };

    // --- Core Logic ---

    async function handleSubmit() {
        if (!prompt.trim()) return;

        scene = "loading";
        errorMessage = "";

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred.");
            }

            soundscapeData = data;
            scene = "canvas";
        } catch (err: any) {
            console.error("[handleSubmit] Failed to generate soundscape:", err);
            errorMessage = err.message;
            scene = "error";
        }
    }

    function reset() {
        prompt = "";
        soundscapeData = null;
        scene = "input";
        errorMessage = "";
    }

    function handlePressStart() {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            if (scene === "canvas") {
                console.log("Long press detected! Resetting scene.");
                reset();
            }
        }, 1000); // 1-second duration
    }

    function handlePressEnd() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }
</script>

<main
    class="h-screen w-screen bg-black text-white flex flex-col items-center justify-center font-serif p-4 overflow-hidden"
>
    {#if scene === "input"}
        <section
            class="w-full h-full flex flex-col items-center justify-center text-center"
            transition:fade={{ duration: 1 }}
        >
            <h1 class="text-4xl md:text-5xl mb-12">
                Describe the world you want to hear.
            </h1>
            <form on:submit|preventDefault={handleSubmit}>
                <input
                    type="text"
                    bind:value={prompt}
                    class="w-full max-w-2xl bg-transparent border-b-2 border-gray-600 text-xl md:text-2xl text-center text-gray-200 focus:outline-none focus:border-white transition-colors duration-300 p-2"
                    placeholder="e.g., a calm rainy night in a cozy cyberpunk apartment"
                    autofocus
                />
            </form>
        </section>
    {/if}

    {#if scene === "loading"}
        <section
            class="w-full h-full flex flex-col items-center justify-center text-center"
            transition:fade={{ duration: 0.5 }}
        >
            <p class="text-2xl text-gray-400">Generating your world...</p>
            <p class="text-sm text-gray-500 mt-4">
                This may take up to 30 seconds.
            </p>
        </section>
    {/if}

    {#if scene === "error"}
        <section
            class="w-full h-full flex flex-col items-center justify-center text-center"
            transition:fade={{ duration: 0.5 }}
        >
            <h2 class="text-3xl text-red-500 mb-4">An Error Occurred</h2>
            <p class="text-gray-400 mb-8">{errorMessage}</p>
            <button
                on:click={reset}
                class="bg-gray-700 text-white font-sans py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
                Try Again
            </button>
        </section>
    {/if}

    {#if scene === "canvas" && soundscapeData}
        <section
            class="w-full h-full absolute top-0 left-0 cursor-pointer"
            on:mousedown={handlePressStart}
            on:mouseup={handlePressEnd}
            on:mouseleave={handlePressEnd}
            on:touchstart|preventDefault={handlePressStart}
            on:touchend={handlePressEnd}
            role="button"
            tabindex="0"
            aria-label="Press and hold to create a new scene"
            transition:fade={{ duration: 1.5, delay: 0.5 }}
        >
            <ImageBackground imageBase64={soundscapeData.imageBase64} />
            <P5Canvas p5Code={soundscapeData.p5Code} />
            <AudioEngine sounds={soundscapeData.sounds} />
        </section>
    {/if}
</main>
