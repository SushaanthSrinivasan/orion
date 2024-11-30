import BaseLLMProvider from "./base_llm_provider.js";
import Anthropic from "@anthropic-ai/sdk";

export default class AnthropicProvider extends BaseLLMProvider {
    constructor(modelName="claude-3-opus-20240229") {
        super();
        this.name = "Anthropic";

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        this.provider = new Anthropic({
            apiKey
        });
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("Anthropic API key not found");
        }

        const message = await this.provider.messages.create({
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            max_tokens: maxTokens,
            temperature,
        });

        return message.content[0].text;
    }
}
