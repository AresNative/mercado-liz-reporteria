import { MongoClient, MongoClientOptions } from "mongodb";
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
};
let client: MongoClient;
let clientPromise: Promise<MongoClient>;
if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}
client = new MongoClient(uri, options);
clientPromise = client.connect();
// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
