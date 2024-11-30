import BaseLLMProvider from "./base_llm_provider.js";
import OpenAI from "openai";

export default class OpenAIProvider extends BaseLLMProvider {
    constructor(modelName="gpt-3.5-turbo") {
        super();
        this.name = "OpenAI";

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        this.provider = new OpenAI({
            apiKey
        });
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("OpenAI API key not found");
        }

        const completion = await this.provider.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
            temperature,
            max_tokens: maxTokens,
        });

        return completion.choices[0].message.content;
    }
}
