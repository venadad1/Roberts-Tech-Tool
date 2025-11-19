export interface Character {
  id: string;
  name: string;
  imageData: string | null; // Base64 string without prefix for API, with prefix for display needs handling
  mimeType: string;
  isSelected: boolean;
}

export enum AspectRatioOption {
  Ratio_16_9 = "16:9",
  Ratio_9_16 = "9:16",
  Ratio_1_1 = "1:1",
  Ratio_4_3 = "4:3",
  Custom = "Custom"
}

export interface GenerationSettings {
  aspectRatio: AspectRatioOption;
  customAspectRatio?: string;
}

export interface PromptItem {
  id: string;
  text: string;
}

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeneratedImage {
  id: string;
  promptText: string;
  imageUrl: string; // Base64 data URI
  fileName: string;
  status: GenerationStatus;
  error?: string;
}
