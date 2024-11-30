import BaseLLMProvider from "./base_llm_provider.js";

export default class OllamaProvider extends BaseLLMProvider {
    constructor(modelName = "llama3.2") {
        super();
        this.name = "Ollama";

        const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        this.baseUrl = baseUrl;
        this.modelName = modelName;
    }

    async generateContent(prompt, temperature=0.7, maxTokens=8192) {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.modelName,
                    prompt,
                    stream: false,
                    temperature,
                    max_tokens: maxTokens,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error calling Ollama API:', error);
            throw error;
        }
    }
}
