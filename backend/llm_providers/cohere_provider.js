import BaseLLMProvider from "./base_llm_provider.js";
import { CohereClient } from "cohere-ai";

export default class CohereProvider extends BaseLLMProvider {
    constructor(modelName="command") {
        super();
        this.name = "Cohere";

        const apiKey = process.env.COHERE_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        this.provider = new CohereClient({
            token: apiKey
        });
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("Cohere API key not found");
        }

        const response = await this.provider.generate({
            prompt,
            model: this.modelName,
            maxTokens,
            temperature,
        });

        return response.generations[0].text;
    }
}
