import BaseLLMProvider from "./base_llm_provider.js";
import { Groq } from "groq-sdk";

export default class GroqProvider extends BaseLLMProvider {
    constructor(modelName="mixtral-8x7b-32768") {
        super();
        this.name = "Groq";

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            this.provider = null;
            return;
        }

        this.provider = new Groq({
            apiKey
        });
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        if (!this.provider) {
            throw new Error("Groq API key not found");
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
