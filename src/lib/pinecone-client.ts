import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { env } from "./config";
import { delay } from "./utils";

let pineconeClientInstance: PineconeClient | null = null;


async function fetchExistingIndexes(client: PineconeClient): Promise<string[]> {
  try {
    const response = await client.listIndexes();
    return response.indexes?.map(index => index.name) || [];
  } catch (error) {
    console.error("Failed to fetch existing indexes", error);
    throw new Error("Failed to fetch existing indexes");
  }
}

// Create pineconeIndex if it doesn't exist
async function createIndex(client: PineconeClient, indexName: string) {
  try {
    await client.createIndex({
      name: indexName,
      dimension: 1536,
      metric: "cosine",
      spec: null
    });
    
    console.log(
      `Waiting for ${env.INDEX_INIT_TIMEOUT} seconds for index initialization to complete...`
    );
    await delay(env.INDEX_INIT_TIMEOUT);
    console.log("Index created !!");
  } catch (error) {
    console.error("error ", error);
    throw new Error("Index creation failed");
  }
}

// Initialize index and ready to be accessed.
async function initPineconeClient() {
  try {
    const pineconeClient = new PineconeClient({
      apiKey: env.PINECONE_API_KEY,
    });
    const indexName = env.PINECONE_INDEX_NAME;

    const existingIndexes = await fetchExistingIndexes(pineconeClient);
    if (!existingIndexes.includes(indexName)) {
      await createIndex(pineconeClient, indexName); // Ensure createIndex call is awaited
    } else {
      console.log("Your index already exists. Nice!!");
    }

    return pineconeClient;
  } catch (error) {
    console.error("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}
export async function getPineconeClient() {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }

  return pineconeClientInstance;
}
