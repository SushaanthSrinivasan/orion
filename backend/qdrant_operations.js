import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// dotenv.config({ path: join(__dirname, "..", ".env") });

dotenv.config();

const collectionName = "webpage_data_orion";
const client = new QdrantClient({
	url: process.env.QDRANT_CLUSTER_URL,
	apiKey: process.env.QDRANT_API_KEY,
});

// export async function initQdrantDb() {
// 	client = new QdrantClient({
// 		url: process.env.QDRANT_CLUSTER_URL,
// 		apiKey: process.env.QDRANT_API_KEY,
// 	});
// 	return client;
// }

export async function chunkText(data) {
	try {
		// const data = await fs.readFile("pageText.txt", "utf8");
		// console.log("File contents:", data);
		const { chunkit } = await import("semantic-chunking");
		const chunkitOptions = {};
		const myChunks = await chunkit(data, chunkitOptions);
		// console.log(`Type of chunks: ${typeof myChunks}`);
		// console.log("Chunks:", JSON.stringify(myChunks, null, 2));
		// console.log("Chunks:", myChunks[9]);
		// console.log("Chunks:", myChunks.Chunks);
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

// Function to vectorize and store text chunks in Qdrant
export async function vectorizeAndStore(textChunksObj, url, baseURL) {
	const vectorSize = 384;
	console.log("Generating embeddings...");
	const embeddings = await getEmbeddings(textChunksObj);

	// Prepare points for Qdrant
	const points = Object.entries(textChunksObj).map(
		([index, text], arrayIndex) => ({
			id: uuidv4(),
			vector: embeddings[arrayIndex],
			payload: { text: text, url: url, baseURL: baseURL },
		})
	);

	// Store vectors in Qdrant
	console.log("Storing vectors in Qdrant...");
	await client.upsert(collectionName, {
		wait: true,
		points: points,
	});

	console.log("All chunks vectorized and stored successfully.");
}

// searching similar
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

// cheeck if website already indexed
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
			limit: 1, // We only need one result to confirm existence
			with_payload: true,
			with_vector: false, // We don't need the vector data
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

// export async function similaritySearch(query, numResults) {
// 	try {
// 		const searchResults = await similaritySearchFunc(query, numResults);
// 		console.log("Search Results:");
// 		searchResults.forEach((result, index) => {
// 			console.log(`${index + 1}. Score: ${result.score}`);
// 			console.log(`   Text: ${result.text}`);
// 			console.log(`   ID: ${result.id}`);
// 			console.log("---");
// 		});
// 	} catch (error) {
// 		console.error("Error in main function:", error);
// 	}
// }

// function calls

// const textChunks = await readFileAndChunk();

// vectorizeAndStore(textChunks)
// 	.then(() => console.log("Process completed."))
// 	.catch((error) => console.error("Error:", error));

// const query = "Who created this product?";
// similaritySearchFunc(query, 1);
