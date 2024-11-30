export default class BaseLLMProvider {
    constructor() {
        if (this.constructor === BaseLLMProvider) {
            throw new TypeError("Cannot construct BaseLLMProvider instances directly");
        }
        this.name = "BaseLLMProvider";
    }

    async generateContent(prompt) {
        throw new Error("Not implemented");
    }

    async setModelName(modelName) {
        this.modelName = modelName;
    }
}