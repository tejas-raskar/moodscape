import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "$env/static/private";

// --- Safety Check for API Key ---
if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
  throw new Error(
    "GEMINI_API_KEY is not defined in your .env file. Please create a .env file and add your key.",
  );
}

// --- Initialize the Google AI Client ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

// --- Define the available sound assets ---
// This is the most important part for ensuring reliability.
// The LLM will be instructed to ONLY choose from this list.
const availableSounds = [
  "heavy-rain.mp3",
  "distant-thunder.mp3",
  "crackling-fireplace.mp3",
  "keyboard-typing.mp3",
  "forest.mp3",
  "wind.mp3",
  "office-ambience.mp3",
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return json({ error: "A valid prompt is required." }, { status: 400 });
    }

    console.log(`[API] Received prompt: "${prompt}"`);

    // --- Construct the detailed prompt for the LLM ---
    const generationPrompt = `
            You are an expert soundscape and color palette designer for a generative art application.
            Your task is to interpret a user's prompt and respond with a JSON object that contains a list of sounds and a color palette.

            **Constraints:**
            1.  You MUST choose between 2 and 4 sounds from the following list of available audio files. Do NOT invent new filenames.
                Available sounds: ${availableSounds.join(", ")}
            2.  You MUST provide exactly 3 colors in hexadecimal format (e.g., "#RRGGBB"). The first color is the main background, the second is for primary elements, and the third is for accent elements.
            3.  Your entire response MUST be a single, valid JSON object and nothing else. Do not include any explanatory text, markdown formatting, or anything outside of the JSON structure.

            **User's Prompt:** "${prompt}"

            **Example Response for "a calm rainy night in a cozy cyberpunk apartment":**
            {
                "sounds": ["heavy-rain.mp3", "distant-thunder.mp3", "soft-synth-music.mp3"],
                "colors": ["#0d1b2a", "#415a77", "#ffbe0b"]
            }

            Now, generate the JSON for the user's prompt.
        `;

    // --- Call the Gemini API ---
    console.log("[API] Generating content with Gemini...");
    const result = await model.generateContent(generationPrompt);
    const response = result.response;
    const responseText = response.text();

    console.log("[API] Received response from Gemini:", responseText);

    // --- Clean and Parse the JSON response ---
    // Sometimes the model wraps the JSON in markdown, so we clean it up.
    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsedJson = JSON.parse(cleanedText);
      // A more robust solution would use a schema validation library like Zod here,
      // but for a hackathon, direct parsing is acceptable.
      return json(parsedJson);
    } catch (e) {
      console.error("[API] Failed to parse JSON response from Gemini:", e);
      return json(
        {
          error:
            "The AI returned an invalid response. Please try a different prompt.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[API] An unexpected error occurred:", error);
    return json(
      { error: "There was an error processing your request." },
      { status: 500 },
    );
  }
};
