import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "$env/static/private";

// --- Pre-flight Checks & Initialization ---

// Ensure the API key is present before starting the server.
if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not defined in your .env file. Please create a .env file and add your key.",
  );
}

// Initialize the Google AI Client for p5.js code generation.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

// Define the exact sound files available in `static/audio` to ensure the LLM
// only requests files that actually exist.
const availableSounds = [
  "heavy-rain.mp3",
  "distant-thunder.mp3",
  "crackling-fireplace.mp3",
  "keyboard-typing.mp3",
  "forest.mp3",
  "wind.mp3",
  "office-ambience.mp3",
];

/**
 * This is the core API endpoint for generating a complete soundscape experience.
 * It orchestrates two AI calls:
 * 1. Pollinations.ai for a high-quality, stylized background image.
 * 2. Google Gemini for a dynamic, transparent p5.js animation overlay and a list of sounds.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return json({ error: "A valid prompt is required." }, { status: 400 });
    }

    console.log(`[API] Received prompt: "${prompt}"`);

    // --- 1. Generate and Fetch the Static Background Image (Pollinations.ai) ---
    const imageStyle =
      "lofi anime style, beautiful, aesthetic, ghibli inspired, pov";
    const fullImagePrompt = `${prompt}, ${imageStyle}`;
    const encodedImagePrompt = encodeURIComponent(
      fullImagePrompt.replace(/ /g, "_"),
    );
    const imageUrl = `https://pollinations.ai/p/${encodedImagePrompt}/?nologo=true`;

    console.log(`[API] Fetching Image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Pollinations.ai request failed with status: ${imageResponse.status}`,
      );
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
    console.log(`[API] Successfully fetched and encoded background image.`);

    // --- 2. Generate the Dynamic p5.js Overlay and Sound List (Gemini) ---
    const p5GenerationPrompt = `
            You are a creative p5.js developer specializing in beautiful, performant, atmospheric overlays.
            Your task is to interpret a user's prompt and respond with a JSON object containing a list of sounds and a string of p5.js code for a TRANSPARENT overlay.

            **CRITICAL CONSTRAINTS:**
            1.  Your entire response MUST be a single, valid JSON object. Do not include any explanatory text or markdown formatting.
            2.  The JSON object must have two keys: "sounds" (an array of 2-4 strings) and "p5Code" (a single string of JavaScript code).
            3.  You MUST choose sounds ONLY from this list: ${availableSounds.join(", ")}
            4.  The "p5Code" string MUST contain two functions: \`sketchSetup(p)\` and \`sketchDraw(p)\`.
            5.  The \`sketchDraw(p)\` function MUST start with \`p.clear()\` to ensure the background remains transparent. Do NOT use \`p.background()\`.
            6.  The code should ONLY generate foreground, atmospheric elements (e.g., rain, snow, dust motes, fireflies).
            7.  You MUST NOT call \`createCanvas(p)\`.

            **User's Prompt:** "${prompt}"

            **Example for "a quiet library on a snowy day":**
            {
                "sounds": ["crackling-fireplace.mp3", "heavy-rain.mp3"],
                "p5Code": "let snowflakes = []; function sketchSetup(p) { for (let i = 0; i < 200; i++) { snowflakes.push({x: p.random(p.width), y: p.random(p.height), speed: p.random(1, 3), radius: p.random(1, 3)}); } } function sketchDraw(p) { p.clear(); p.noStroke(); p.fill(255, 255, 255, 150); for (let flake of snowflakes) { p.ellipse(flake.x, flake.y, flake.radius, flake.radius); flake.y += flake.speed; if (flake.y > p.height) { flake.y = 0; flake.x = p.random(p.width); } } }"
            }
        `;

    console.log("[API] Generating p5.js overlay code with Gemini...");
    const geminiResult = await geminiModel.generateContent(p5GenerationPrompt);
    const geminiResponseText = geminiResult.response.text();

    const cleanedText = geminiResponseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const geminiData = JSON.parse(cleanedText);
    console.log(
      "[API] Successfully generated and parsed p5.js overlay and sounds.",
    );

    // --- 3. Combine and Respond ---
    const finalResponse = {
      imageBase64: imageBase64,
      sounds: geminiData.sounds,
      p5Code: geminiData.p5Code,
    };

    return json(finalResponse);
  } catch (error) {
    console.error("[API] An unexpected error occurred:", error);
    return json(
      {
        error: "An unexpected error occurred while generating the soundscape.",
      },
      { status: 500 },
    );
  }
};
