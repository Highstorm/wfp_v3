declare module "firebase/ai" {
  import { FirebaseApp } from "firebase/app";

  export class GoogleAIBackend {
    constructor();
  }

  export interface AI {
    // AI instance interface
  }

  export interface ThinkingConfig {
    thinkingBudget?: number;
  }

  export interface GenerateContentConfig {
    thinkingConfig?: ThinkingConfig;
  }

  export interface GenerativeModel {
    generateContent(
      prompt: string,
      config?: GenerateContentConfig
    ): Promise<GenerateContentResponse>;
  }

  export interface GenerateContentResponse {
    response: {
      text(): string | null;
    };
  }

  export function getAI(
    app: FirebaseApp,
    options?: { backend: GoogleAIBackend }
  ): AI;

  export function getGenerativeModel(
    ai: AI,
    options?: { model: string }
  ): GenerativeModel;
}

