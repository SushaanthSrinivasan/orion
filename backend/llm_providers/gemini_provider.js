import BaseLLMProvider from "./base_llm_provider.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default class GeminiProvider extends BaseLLMProvider {
    constructor(modelName="gemini-1.5-flash-latest") {
        super();
        this.name = "Gemini";

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        const base_provider = new GoogleGenerativeAI(apiKey);
        this.provider = base_provider.getGenerativeModel({ model: modelName });
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("Gemini API key not found");
        }
        this.provider.generationConfig.temperature = temperature;
        this.provider.generationConfig.maxOutputTokens = maxTokens;

        const result = await this.provider.generateContent(prompt);
        const response = result.response;
        return response.text();
    }
}