import BaseLLMProvider from "./base_llm_provider.js";
import MistralClient from "@mistralai/mistralai";

export default class MistralProvider extends BaseLLMProvider {
    constructor(modelName="mistral-large-latest") {
        super();
        this.name = "Mistral";

        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        this.provider = new MistralClient(apiKey);
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("Mistral API key not found");
        }

        const chatResponse = await this.provider.chat({
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            temperature,
            maxTokens,
        });

        return chatResponse.choices[0].message.content;
    }
}
