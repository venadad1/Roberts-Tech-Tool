import { GoogleGenAI, Modality } from "@google/genai";
import { Character, GenerationSettings } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in process.env");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImageFromPrompt = async (
  prompt: string,
  characters: Character[],
  settings: GenerationSettings
): Promise<string> => {
  const ai = getClient();

  // Filter selected characters that have image data
  const activeCharacters = characters.filter(c => c.isSelected && c.imageData);

  const parts: any[] = [];

  // 1. Add Character References
  let characterContext = "";
  if (activeCharacters.length > 0) {
    characterContext = "Here are the reference characters for this generation:\n";
    
    activeCharacters.forEach((char, index) => {
      // Add the image part
      parts.push({
        inlineData: {
          data: char.imageData!,
          mimeType: char.mimeType,
        },
      });
      // Map the image index to the character name in the prompt context
      // Note: In Gemini 2.5 Flash Image, providing images first then text referencing them is effective.
      characterContext += `[Reference Image ${index + 1}] is named "${char.name}". `;
    });
    characterContext += "\nMaintain strict consistency with these reference characters' facial features and clothing styles.\n";
  }

  // 2. Handle Aspect Ratio
  let ratioInstruction = "";
  if (settings.aspectRatio !== "Custom") {
    ratioInstruction = `Generate the image with an aspect ratio of ${settings.aspectRatio}.`;
  } else if (settings.customAspectRatio) {
    ratioInstruction = `Generate the image with an aspect ratio of ${settings.customAspectRatio}.`;
  }

  // 3. Construct Final Prompt
  const finalPrompt = `
    ${characterContext}
    
    SCENE DESCRIPTION:
    ${prompt}
    
    STYLE & TECHNICAL:
    ${ratioInstruction}
    High quality, 4K resolution, detailed, distinct visual style.
  `;

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.[0];

    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
