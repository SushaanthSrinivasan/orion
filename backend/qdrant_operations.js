import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const collectionName = "webpage_data_orion";
const client = new QdrantClient({
	url: process.env.QDRANT_CLUSTER_URL,
	apiKey: process.env.QDRANT_API_KEY,
});

export async function chunkText(data) {
	try {
		const { chunkit } = await import("semantic-chunking");
		const chunkitOptions = {};
		const myChunks = await chunkit(data, chunkitOptions);

		return myChunks;
	} catch (err) {
		console.error("Error reading file:", err);
	}
}

export async function getEmbeddings(texts) {
	const embedder = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2"
	);
	const textArray = Array.isArray(texts) ? texts : Object.values(texts);
	const embeddings = await Promise.all(
		textArray.map(async (text) => {
			const result = await embedder(text, { pooling: "mean", normalize: true });
			return Array.from(result.data);
		})
	);
	return embeddings;
}

export async function vectorizeAndStore(textChunksObj, url, baseURL) {
	const vectorSize = 384;
	console.log("Generating embeddings...");
	const embeddings = await getEmbeddings(textChunksObj);

	const points = Object.entries(textChunksObj).map(
		([index, text], arrayIndex) => ({
			id: uuidv4(),
			vector: embeddings[arrayIndex],
			payload: { text: text, url: url, baseURL: baseURL },
		})
	);

	console.log("Storing vectors in Qdrant...");
	await client.upsert(collectionName, {
		wait: true,
		points: points,
	});

	console.log("All chunks vectorized and stored successfully.");
}

export async function similaritySearch(query, topK = 5, baseURL) {
	try {
		console.log("Generating embedding for query...");
		const queryEmbedding = await getEmbeddings([query]);

		if (queryEmbedding.length === 0) {
			throw new Error("Failed to generate embedding for query");
		}

		console.log(`similarity func baseURL: ${baseURL}`);

		console.log("Performing search...");
		const searchResult = await client.search(collectionName, {
			vector: queryEmbedding[0],
			limit: topK,
			with_payload: true,
			filter: {
				must: [
					{
						key: "baseURL",
						match: {
							value: baseURL,
						},
					},
				],
			},
		});

		console.log(`Found ${searchResult.length} results`);

		searchResult.map((result) =>
			console.log(`URL: ${result.payload.url}\nText: ${result.payload.text}\n`)
		);

		return searchResult.map((result) => ({
			score: result.score,
			text: result.payload.text,
			url: result.payload.url,
			baseURL: result.payload.baseURL,
			id: result.id,
		}));
	} catch (error) {
		console.error("Error in similarity search:", error);
		throw error;
	}
}

export async function checkEntriesExist(attribute, attributeValue) {
	try {
		console.log(
			`Checking for entries with ${attribute} = ${attributeValue} in collection: ${collectionName}`
		);

		const searchResult = await client.scroll(collectionName, {
			filter: {
				must: [
					{
						key: attribute,
						match: { value: attributeValue },
					},
				],
			},
			limit: 1,
			with_payload: true,
			with_vector: false,
		});

		const exists = searchResult.points.length > 0;

		if (exists) {
			console.log(`Found entries with ${attribute} = ${attributeValue}`);
		} else {
			console.log(`No entries found with ${attribute} = ${attributeValue}`);
		}

		return exists;
	} catch (error) {
		console.error("Error checking attribute value:", error);
		throw error;
	}
}
