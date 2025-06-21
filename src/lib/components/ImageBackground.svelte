<script lang="ts">
    /**
     * The base64 encoded string of the background image received from the API.
     */
    export let imageBase64: string;
</script>

<div class="frame">
    <img
        src={`data:image/jpeg;base64,${imageBase64}`}
        alt="Generated soundscape background"
        class="image-content"
    />
</div>

<style>
    .frame {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        /* This padding creates the black "frame" around the image */
        padding: 2rem; /* Adjust padding as needed */
        box-sizing: border-box;
    }

    .image-content {
        width: 100%;
        height: 100%;
        object-fit: cover;
        /* This creates the rounded corners on the image itself */
        border-radius: 1rem; /* Adjust for more or less rounded corners */
    }
</style>
