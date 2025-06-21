<script lang="ts">
    import P5Canvas from "$lib/components/P5Canvas.svelte";
    import AudioEngine from "$lib/components/AudioEngine.svelte";

    // --- State Management ---
    // We use a 'scene' variable to control what is currently displayed to the user.
    let scene: "input" | "loading" | "canvas" | "error" = "input";

    let prompt: string = "";
    let errorMessage: string = "";
    let soundscapeData: { sounds: string[]; colors: string[] } | null = null;

    // --- API Call ---
    async function handleSubmit() {
        if (!prompt.trim()) return;

        scene = "loading";
        errorMessage = "";

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred.");
            }

            soundscapeData = data;
            scene = "canvas";
        } catch (err: any) {
            console.error("Failed to generate soundscape:", err);
            errorMessage = err.message;
            scene = "error";
        }
    }

    // --- Reset Function ---
    // Allows the user to return to the initial input screen.
    function reset() {
        prompt = "";
        scene = "input";
        errorMessage = "";
        soundscapeData = null;
    }
</script>

<main
    class="h-screen w-screen bg-black text-white flex flex-col items-center justify-center font-serif p-4 overflow-hidden"
>
    {#if scene === "input"}
        <div
            class="text-center transition-opacity duration-1000 w-full animate-fade-in"
        >
            <h1 class="text-4xl md:text-5xl mb-12">
                Describe the world you want to hear.
            </h1>
            <form on:submit|preventDefault={handleSubmit}>
                <input
                    type="text"
                    bind:value={prompt}
                    class="w-full max-w-2xl bg-transparent border-b-2 border-gray-600 text-xl md:text-2xl text-center text-gray-200 focus:outline-none focus:border-white transition-colors duration-300 p-2"
                    placeholder="e.g., a fantasy battle in a dark forest"
                    autofocus
                />
            </form>
        </div>
    {:else if scene === "loading"}
        <div class="text-center animate-fade-in">
            <p class="text-2xl text-gray-400">Generating your world...</p>
        </div>
    {:else if scene === "canvas" && soundscapeData}
        <P5Canvas
            {prompt}
            colors={soundscapeData.colors}
            sounds={soundscapeData.sounds}
        />
        <AudioEngine sounds={soundscapeData.sounds} />
        <button
            on:click={reset}
            class="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md text-white font-sans py-2 px-4 rounded-lg hover:bg-white/20 transition-colors z-10"
        >
            Create New
        </button>
    {:else if scene === "error"}
        <div class="text-center animate-fade-in">
            <h2 class="text-3xl text-red-500 mb-4">An Error Occurred</h2>
            <p class="text-gray-400 mb-8">{errorMessage}</p>
            <button
                on:click={reset}
                class="bg-gray-700 text-white font-sans py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
                Try Again
            </button>
        </div>
    {/if}
</main>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fade-in 1.5s ease-in-out forwards;
    }
</style>
